import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { Bloom, EffectComposer, N8AO, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { facadeUniform } from '@/lib/facade-material'
import { heroFocus } from '@/lib/heroes'
import type { CityData } from '@/lib/types'
import { Buildings } from './Buildings'
import { Ground } from './Ground'
import { Heroes } from './Heroes'
import { Trees } from './Trees'

export type CitySceneControls = {
  autoOrbit: boolean
  /** 0..1 环绕进度；render 模式由外部时钟驱动 */
  orbit: number
  push: number
  driven: boolean
  /** 0 白模，1 贴面完全长出 */
  facadeReveal: number
  /** 0 刚落到城市上方，1 收到定稿机位。俯角不变。 */
  arrive: number
}

type Props = {
  data: CityData
  controls: CitySceneControls
  interactive: boolean
}

function shadowMapSize() {
  const n = Number(new URLSearchParams(window.location.search).get('shadow') ?? 4096)
  if (!Number.isFinite(n)) return 4096
  return Math.min(4096, Math.max(512, Math.round(n)))
}

function SkyDome() {
  const ref = useRef<THREE.Mesh>(null)
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        vertexShader: `
          varying vec3 vPos;
          void main() {
            vPos = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vPos;
          void main() {
            float h = normalize(vPos).y;
            vec3 haze = vec3(0.835, 0.878, 0.918);
            vec3 warm = vec3(0.97, 0.90, 0.78);
            vec3 sky = vec3(0.53, 0.72, 0.88);
            vec3 top = vec3(0.36, 0.58, 0.84);
            float warmBand = smoothstep(0.0, 0.06, h) * (1.0 - smoothstep(0.06, 0.2, h));
            vec3 col = mix(haze, warm, warmBand);
            col = mix(col, sky, smoothstep(0.02, 0.42, h));
            col = mix(col, top, smoothstep(0.38, 1.0, h));
            gl_FragColor = vec4(col, 1.0);
          }
        `,
      }),
    [],
  )
  useFrame(({ camera }) => {
    if (ref.current) ref.current.position.copy(camera.position)
  })
  return (
    <mesh ref={ref} frustumCulled={false} renderOrder={-1}>
      <sphereGeometry args={[9000, 32, 18]} />
      <primitive object={mat} attach="material" />
    </mesh>
  )
}

function placeCamera(
  cam: THREE.PerspectiveCamera,
  focus: THREE.Vector3,
  orbit: number,
  push: number,
  cityId: string,
  arrive: number,
) {
  // 与东京参考截图相同的斜俯视：水平距离约 3.2km、离地约 980m，俯角约 17°（画面观感为斜 3/4 向下）。
  // 高度与距离一起收到 75%，俯角不变，建筑更大；推进时继续等比靠近。绝不抬头。
  // arrive 只放大同一俯角下的距离，用来做减速俯冲。
  const pitchTan = 940 / 3168
  const settled = Math.min(1, Math.max(0, arrive))
  const settle = 0.75 + (1 - settled) * 0.5
  const scale = (settle / 0.75) * (0.75 - push * 0.1)
  const horiz = 3168 * scale
  const lookY = 50
  // 上海对准陆家嘴地标，并从黄浦西岸看过去，东方明珠在塔楼前方。
  // 东京对准市中心，方位与参考截图一致（东南斜俯视）。
  const shanghai = cityId === 'shanghai-lujiazui'
  const lookX = shanghai ? focus.x : 0
  const lookZ = shanghai ? focus.z : 0
  const bearing0 = shanghai ? -2.35 : 0.7
  const ang = bearing0 + orbit * 1.15
  cam.position.set(lookX + Math.sin(ang) * horiz, lookY + horiz * pitchTan, lookZ + Math.cos(ang) * horiz)
  cam.lookAt(lookX, lookY, lookZ)
  cam.updateMatrixWorld()
}

function SceneContent({ data, controls, interactive }: Props) {
  const cam = useRef<THREE.PerspectiveCamera>(null)
  const light = useRef<THREE.DirectionalLight>(null)
  const orbitLive = useRef(0.15)
  const pushLive = useRef(0)
  const { gl } = useThree()
  const focus = heroFocus(data.id, data.center.lng, data.center.lat)

  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping
    gl.toneMappingExposure = 1.16
    gl.shadowMap.enabled = true
    gl.shadowMap.type = THREE.PCFSoftShadowMap
  }, [gl])

  useFrame((_, dt) => {
    if (!cam.current || !light.current) return
    let orbit = controls.orbit
    let push = controls.push
    if (!controls.driven && controls.autoOrbit) {
      orbitLive.current = (orbitLive.current + dt * 0.045) % 1
      pushLive.current = Math.min(1, pushLive.current + dt * 0.03)
      orbit = orbitLive.current
      push = pushLive.current
    }
    facadeUniform.value = controls.facadeReveal
    placeCamera(cam.current, focus, orbit, push, data.id, controls.arrive)
    const look = new THREE.Vector3(focus.x, 80, focus.z)
    const sun = new THREE.Vector3(0.72, 1.35, 0.28).normalize()
    light.current.position.copy(look).addScaledVector(sun, 1600)
    light.current.target.position.copy(look)
    light.current.target.updateMatrixWorld()
    const sh = light.current.shadow.camera
    const span = 1600
    sh.left = -span
    sh.right = span
    sh.top = span
    sh.bottom = -span
    sh.near = 400
    sh.far = 3200
    sh.updateProjectionMatrix()
  })

  return (
    <>
      <SkyDome />
      <color attach="background" args={['#d5e0ea']} />
      <fog attach="fog" args={['#d5e0ea', 3800, 9200]} />
      <PerspectiveCamera ref={cam} makeDefault fov={42} near={2} far={14000} position={[1600, 780, 1600]} />
      {interactive && !controls.driven && (
        <OrbitControls
          enablePan={false}
          target={[focus.x, 50, focus.z]}
          minDistance={900}
          maxDistance={4000}
          maxPolarAngle={Math.PI / 2.15}
        />
      )}
      <ambientLight intensity={0.42} color="#fff3e4" />
      <hemisphereLight args={['#d5e7f8', '#6f8f62', 0.34]} />
      <directionalLight
        ref={light}
        color="#ffe2b0"
        intensity={2.7}
        castShadow
        shadow-mapSize={[shadowMapSize(), shadowMapSize()]}
        shadow-bias={-0.00025}
        shadow-normalBias={0.04}
      />
      <directionalLight position={[-800, 300, -400]} intensity={0.16} color="#d7e4f2" />
      <Ground data={data} />
      <Trees data={data} />
      <Buildings data={data} />
      <Heroes data={data} />
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <N8AO aoRadius={12} intensity={1.15} distanceFalloff={0.6} halfRes />
        <Bloom luminanceThreshold={0.86} luminanceSmoothing={0.28} intensity={0.32} mipmapBlur radius={0.45} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </>
  )
}

export function CityScene(props: Props) {
  return (
    <Canvas
      shadows
      dpr={1}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: true }}
      style={{ width: '100%', height: '100%' }}
    >
      <SceneContent {...props} />
    </Canvas>
  )
}

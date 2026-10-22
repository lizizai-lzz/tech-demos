import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { Bloom, EffectComposer, N8AO, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { facadeUniform } from '@/lib/facade-material'
import { heroFocus } from '@/lib/heroes'
import type { CityData } from '@/lib/types'
import { cesiumIonToken } from '@/lib/photoreal-tiles'
import { orbitPose, type LocalPose } from '@/lib/view-pose'
import { Buildings } from './Buildings'
import { Ground } from './Ground'
import { Heroes } from './Heroes'
import { PhotorealTiles } from './PhotorealTiles'
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
  /** 下降段和地图共用的机位。有值时不再用环绕公式。 */
  matched: LocalPose | null
}

type TileStatus = {
  visible: boolean
  credits: string[]
  failed: boolean
}

type Props = {
  data: CityData
  controls: CitySceneControls
  interactive: boolean
  /** 为真时隐藏程序化建筑、树和地面，改看流式实景。 */
  photoreal?: boolean
  onPhotorealStatus?: (status: TileStatus) => void
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

function applyPose(cam: THREE.PerspectiveCamera, pose: LocalPose) {
  cam.position.set(pose.x, pose.y, pose.z)
  cam.lookAt(pose.lookX, pose.lookY, pose.lookZ)
  if (Math.abs(cam.fov - pose.fov) > 0.05) {
    cam.fov = pose.fov
    cam.updateProjectionMatrix()
  }
  cam.updateMatrixWorld()
}

function SceneContent({ data, controls, interactive, photoreal = false, onPhotorealStatus }: Props) {
  const cam = useRef<THREE.PerspectiveCamera>(null)
  const light = useRef<THREE.DirectionalLight>(null)
  const orbitLive = useRef(0)
  const pushLive = useRef(0)
  const { gl } = useThree()
  const focus = heroFocus(data.id, data.center.lng, data.center.lat)
  const token = photoreal ? cesiumIonToken() : ''

  useEffect(() => {
    window.__cityReady = data.id
    orbitLive.current = 0
    pushLive.current = 0
  }, [data.id])

  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping
    gl.toneMappingExposure = photoreal ? 1 : 1.16
    gl.shadowMap.enabled = !photoreal
    gl.shadowMap.type = THREE.PCFSoftShadowMap
  }, [gl, photoreal])

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
    if (controls.matched) applyPose(cam.current, controls.matched)
    else applyPose(cam.current, orbitPose(data.id, orbit, push, controls.arrive, focus))
    const alt = Math.max(30, cam.current.position.y)
    const near = photoreal ? Math.min(20, Math.max(0.4, alt / 400)) : 2
    const far = photoreal ? Math.max(80000, alt * 30) : 14000
    if (cam.current.near !== near || cam.current.far !== far) {
      cam.current.near = near
      cam.current.far = far
      cam.current.updateProjectionMatrix()
    }
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
      {!photoreal && <fog attach="fog" args={['#d5e0ea', 3800, 9200]} />}
      <PerspectiveCamera ref={cam} makeDefault fov={42} near={2} far={photoreal ? 800000 : 14000} position={[1600, 780, 1600]} />
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
        castShadow={!photoreal}
        shadow-mapSize={[shadowMapSize(), shadowMapSize()]}
        shadow-bias={-0.00025}
        shadow-normalBias={0.04}
      />
      <directionalLight position={[-800, 300, -400]} intensity={0.16} color="#d7e4f2" />
      {photoreal && token ? (
        <PhotorealTiles
          token={token}
          lng={data.center.lng}
          lat={data.center.lat}
          onStatus={onPhotorealStatus ?? (() => {})}
        />
      ) : (
        <>
          <Ground data={data} />
          <Trees data={data} />
          <Buildings data={data} />
          <Heroes data={data} />
        </>
      )}
      {!photoreal && (
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <N8AO aoRadius={12} intensity={1.15} distanceFalloff={0.6} halfRes />
          <Bloom luminanceThreshold={0.86} luminanceSmoothing={0.28} intensity={0.32} mipmapBlur radius={0.45} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
      )}
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

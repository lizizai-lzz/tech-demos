import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { EffectComposer, N8AO, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { heroFocus } from '@/lib/heroes'
import type { CityData } from '@/lib/types'
import { Buildings } from './Buildings'
import { Ground } from './Ground'
import { Heroes } from './Heroes'
import { Trees } from './Trees'
import { Water } from './Water'

export type CitySceneControls = {
  autoOrbit: boolean
  /** 0..1 环绕进度；render 模式由外部时钟驱动 */
  orbit: number
  push: number
  driven: boolean
}

type Props = {
  data: CityData
  controls: CitySceneControls
  interactive: boolean
}

function placeCamera(
  cam: THREE.PerspectiveCamera,
  focus: THREE.Vector3,
  orbit: number,
  push: number,
  cityId: string,
) {
  // 与东京参考截图相同的斜俯视：水平距离约 3.2km、离地约 980m，俯角约 17°（画面观感为斜 3/4 向下）。
  // 高度与距离一起收到 75%，俯角不变，建筑更大；推进时继续等比靠近。绝不抬头。
  const pitchTan = 940 / 3168
  const scale = 0.75 - push * 0.1
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
    gl.toneMappingExposure = 1.38
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
    placeCamera(cam.current, focus, orbit, push, data.id)
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
      <color attach="background" args={['#efeae3']} />
      <fog attach="fog" args={['#efeae3', 2800, 5400]} />
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
      <ambientLight intensity={0.38} />
      <hemisphereLight args={['#fffaf4', '#c4beb6', 0.22]} />
      <directionalLight
        ref={light}
        intensity={2.45}
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-bias={-0.00025}
        shadow-normalBias={0.04}
      />
      <directionalLight position={[-800, 300, -400]} intensity={0.22} color="#d7e4f2" />
      <Ground data={data} />
      <Water data={data} />
      <Trees data={data} />
      <Buildings data={data} />
      <Heroes data={data} />
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <N8AO aoRadius={12} intensity={1.25} distanceFalloff={0.6} halfRes />
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

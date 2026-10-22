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
) {
  const ang = -Math.PI / 2 + (orbit - 0.5) * 0.55
  const radius = 2100 - push * 220
  const y = 42 + push * 28
  cam.position.set(focus.x + Math.sin(ang) * radius, y, focus.z + Math.cos(ang) * radius)
  cam.lookAt(focus.x, 110, focus.z)
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
    gl.toneMappingExposure = 1.04
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
    placeCamera(cam.current, focus, orbit, push)
    const look = new THREE.Vector3(focus.x, 80, focus.z)
    const sun = new THREE.Vector3(0.72, 1.35, 0.28).normalize()
    light.current.position.copy(look).addScaledVector(sun, 1600)
    light.current.target.position.copy(look)
    light.current.target.updateMatrixWorld()
    const sh = light.current.shadow.camera
    const span = 620
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
      <fog attach="fog" args={['#efeae3', 2600, 6200]} />
      <PerspectiveCamera ref={cam} makeDefault fov={28} near={1} far={14000} position={[800, 80, 800]} />
      {interactive && !controls.driven && (
        <OrbitControls
          enablePan={false}
          target={[focus.x, 140, focus.z]}
          minDistance={280}
          maxDistance={2200}
          maxPolarAngle={Math.PI / 2.05}
        />
      )}
      <ambientLight intensity={0.22} />
      <hemisphereLight args={['#f4f1ea', '#8d8680', 0.28]} />
      <directionalLight
        ref={light}
        intensity={2.85}
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
        <N8AO aoRadius={22} intensity={5.6} distanceFalloff={0.45} halfRes />
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

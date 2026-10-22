import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { EffectComposer, N8AO, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { CityData } from '@/lib/types'
import { Buildings } from './Buildings'
import { Ground } from './Ground'
import { Trees } from './Trees'
import { Water } from './Water'

export type DioramaControls = {
  autoOrbit: boolean
  orbitSpeed: number
}

type Props = {
  data: CityData
  controls: DioramaControls
  recording: boolean
}

function SceneContent({ data, controls, recording }: Props) {
  const cam = useRef<THREE.PerspectiveCamera>(null)
  const orbit = useRef(0)
  const push = useRef(0)
  const { gl } = useThree()

  const maxH = useMemo(
    () => Math.max(80, ...data.buildings.map((b) => b.height)),
    [data.buildings],
  )

  const half = data.extentM / 2
  const fogNear = data.extentM * 0.28
  const fogFar = data.extentM * 0.95

  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping
    gl.toneMappingExposure = 1.1
    gl.shadowMap.enabled = true
    gl.shadowMap.type = THREE.PCFSoftShadowMap
  }, [gl])

  useFrame((_, dt) => {
    if (!cam.current) return
    if (controls.autoOrbit || recording) {
      orbit.current += dt * controls.orbitSpeed
      push.current = Math.min(1, push.current + dt * 0.035)
      const baseR = data.extentM * (0.38 - push.current * 0.06)
      const y = data.extentM * (0.11 + push.current * 0.03)
      cam.current.position.x = Math.sin(orbit.current) * baseR
      cam.current.position.z = Math.cos(orbit.current) * baseR
      cam.current.position.y = y
      cam.current.lookAt(0, maxH * 0.08, 0)
    }
  })

  return (
    <>
      <color attach="background" args={['#f7f7f5']} />
      <fog attach="fog" args={['#f4f4f2', fogNear, fogFar]} />
      <PerspectiveCamera
        ref={cam}
        makeDefault
        position={[data.extentM * 0.32, data.extentM * 0.14, data.extentM * 0.32]}
        fov={42}
        near={2}
        far={data.extentM * 4}
      />
      {!recording && (
        <OrbitControls
          enablePan={false}
          minDistance={data.extentM * 0.15}
          maxDistance={data.extentM * 1.2}
          maxPolarAngle={Math.PI / 2.12}
          target={[0, maxH * 0.06, 0]}
        />
      )}
      <ambientLight intensity={0.45} />
      <hemisphereLight args={['#ffffff', '#e6e8e6', 0.4]} />
      <directionalLight
        position={[half, data.extentM * 0.9, half * 0.6]}
        intensity={1.7}
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-camera-left={-half * 1.4}
        shadow-camera-right={half * 1.4}
        shadow-camera-top={half * 1.4}
        shadow-camera-bottom={-half * 1.4}
        shadow-camera-near={20}
        shadow-camera-far={data.extentM * 2}
        shadow-bias={-0.00012}
        shadow-normalBias={0.02}
      />
      <Environment preset="city" environmentIntensity={0.16} />

      <Ground data={data} />
      <Water data={data} />
      <Trees data={data} />
      <Buildings data={data} />

      <EffectComposer multisampling={4}>
        <N8AO aoRadius={18} intensity={4.8} distanceFalloff={0.6} halfRes={false} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </>
  )
}

export type CitySceneControls = DioramaControls

export function DioramaScene(props: Props) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      style={{ width: '100%', height: '100%' }}
    >
      <SceneContent {...props} />
    </Canvas>
  )
}

export { DioramaScene as CityScene }

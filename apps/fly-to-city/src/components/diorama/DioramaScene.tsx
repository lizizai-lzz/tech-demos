import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  ContactShadows,
  Environment,
  OrbitControls,
  PerspectiveCamera,
} from '@react-three/drei'
import { EffectComposer, N8AO, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { CityData } from '@/lib/types'
import { Buildings } from './Buildings'
import { TerrainBlock } from './TerrainBlock'
import { Trees } from './Trees'
import { Water } from './Water'

export type DioramaControls = {
  sectionPos: number
  sectionAxis: 'x' | 'z'
  clipEnabled: boolean
  buildingsOnlyClip: boolean
  autoOrbit: boolean
  autoSection: boolean
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
  const { gl } = useThree()

  useEffect(() => {
    gl.localClippingEnabled = true
    gl.toneMapping = THREE.ACESFilmicToneMapping
    gl.toneMappingExposure = 1.05
    gl.shadowMap.enabled = true
    gl.shadowMap.type = THREE.PCFSoftShadowMap
  }, [gl])

  const clipPlane = useMemo(() => {
    if (controls.sectionAxis === 'x') {
      return new THREE.Plane(new THREE.Vector3(1, 0, 0), -controls.sectionPos)
    }
    return new THREE.Plane(new THREE.Vector3(0, 0, 1), -controls.sectionPos)
  }, [controls.sectionAxis, controls.sectionPos])

  useFrame((_, dt) => {
    if (!cam.current) return
    if (controls.autoOrbit || recording) {
      orbit.current += dt * controls.orbitSpeed
      const r = data.extentM * 0.95
      const y = data.extentM * 0.42
      cam.current.position.x = Math.sin(orbit.current) * r
      cam.current.position.z = Math.cos(orbit.current) * r
      cam.current.position.y = y
      cam.current.lookAt(0, 0, 0)
    }
  })

  const half = data.extentM / 2
  const capSize = data.extentM * 1.05
  const capRot =
    controls.sectionAxis === 'x' ? [0, Math.PI / 2, 0] : [0, 0, 0]
  const capPos =
    controls.sectionAxis === 'x'
      ? [controls.sectionPos, 40, 0]
      : [0, 40, controls.sectionPos]

  return (
    <>
      <color attach="background" args={['#f7f7f5']} />
      <fog attach="fog" args={['#f7f7f5', data.extentM * 1.2, data.extentM * 2.5]} />
      <PerspectiveCamera
        ref={cam}
        makeDefault
        position={[data.extentM * 0.75, data.extentM * 0.45, data.extentM * 0.75]}
        fov={38}
        near={1}
        far={data.extentM * 8}
      />
      {!recording && (
        <OrbitControls
          enablePan={false}
          minDistance={data.extentM * 0.35}
          maxDistance={data.extentM * 2}
          maxPolarAngle={Math.PI / 2.1}
          target={[0, 0, 0]}
        />
      )}
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[data.extentM, data.extentM * 1.4, data.extentM * 0.6]}
        intensity={1.35}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-half}
        shadow-camera-right={half}
        shadow-camera-top={half}
        shadow-camera-bottom={-half}
        shadow-camera-near={10}
        shadow-camera-far={data.extentM * 3}
        shadow-bias={-0.0002}
      />
      <Environment preset="city" environmentIntensity={0.25} />
      <TerrainBlock data={data} wallDepth={42} />
      <Water data={data} />
      <Trees data={data} />
      <Buildings
        data={data}
        clipPlane={clipPlane}
        clipEnabled={controls.clipEnabled}
        buildingsOnlyClip={controls.buildingsOnlyClip}
      />
      {controls.clipEnabled && (
        <mesh position={capPos as [number, number, number]} rotation={capRot as [number, number, number]}>
          <planeGeometry args={[capSize, 120]} />
          <meshStandardMaterial
            color="#e85d2a"
            roughness={0.4}
            metalness={0.12}
            side={THREE.DoubleSide}
            clippingPlanes={[]}
            stencilWrite
            stencilFunc={THREE.NotEqualStencilFunc}
            stencilRef={1}
          />
        </mesh>
      )}
      <ContactShadows
        position={[0, 0.02, 0]}
        opacity={0.35}
        scale={data.extentM * 1.4}
        blur={2.4}
        far={data.extentM}
      />
      <EffectComposer multisampling={4}>
        <N8AO aoRadius={6} intensity={2.8} distanceFalloff={0.8} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </>
  )
}

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

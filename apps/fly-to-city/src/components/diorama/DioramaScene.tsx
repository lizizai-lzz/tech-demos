import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { EffectComposer, N8AO, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { CityData } from '@/lib/types'
import { clipPlaneFromAxis } from '@/lib/stencil-clipping'
import { Buildings, buildingClipGeometries } from './Buildings'
import { ClipCaps } from './ClipCaps'
import { TerrainBlock, terrainClipGeometries } from './TerrainBlock'
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
  const push = useRef(0)
  const { gl } = useThree()

  const maxH = useMemo(
    () => Math.max(80, ...data.buildings.map((b) => b.height)),
    [data.buildings],
  )

  const clipPlane = useMemo(
    () => clipPlaneFromAxis(controls.sectionAxis, controls.sectionPos),
    [controls.sectionAxis, controls.sectionPos],
  )

  const buildingGeos = useMemo(() => buildingClipGeometries(data), [data])
  const terrainGeos = useMemo(() => terrainClipGeometries(data), [data])

  const capGeometries = useMemo(() => {
    if (!controls.clipEnabled) return []
    if (controls.buildingsOnlyClip) return buildingGeos
    return [...buildingGeos, ...terrainGeos]
  }, [controls.clipEnabled, controls.buildingsOnlyClip, buildingGeos, terrainGeos])

  useEffect(() => {
    gl.localClippingEnabled = true
    gl.toneMapping = THREE.ACESFilmicToneMapping
    gl.toneMappingExposure = 1.12
    gl.shadowMap.enabled = true
    gl.shadowMap.type = THREE.PCFSoftShadowMap
    gl.autoClearStencil = true
  }, [gl])

  const half = data.extentM / 2

  useFrame((_, dt) => {
    if (!cam.current) return
    if (controls.autoOrbit || recording) {
      orbit.current += dt * controls.orbitSpeed
      push.current = Math.min(1, push.current + dt * 0.04)
      const baseR = data.extentM * (0.62 - push.current * 0.08)
      const y = data.extentM * (0.2 + push.current * 0.04)
      cam.current.position.x = Math.sin(orbit.current) * baseR
      cam.current.position.z = Math.cos(orbit.current) * baseR
      cam.current.position.y = y
      cam.current.lookAt(0, maxH * 0.12, 0)
    }
  })

  const terrainClip = controls.clipEnabled && !controls.buildingsOnlyClip

  return (
    <>
      <color attach="background" args={['#f9f9f7']} />
      <fog attach="fog" args={['#f9f9f7', data.extentM * 2, data.extentM * 3.2]} />
      <PerspectiveCamera
        ref={cam}
        makeDefault
        position={[data.extentM * 0.55, data.extentM * 0.22, data.extentM * 0.55]}
        fov={32}
        near={2}
        far={data.extentM * 8}
      />
      {!recording && (
        <OrbitControls
          enablePan={false}
          minDistance={data.extentM * 0.28}
          maxDistance={data.extentM * 1.6}
          maxPolarAngle={Math.PI / 2.15}
          target={[0, maxH * 0.1, 0]}
        />
      )}
      <ambientLight intensity={0.42} />
      <hemisphereLight args={['#ffffff', '#e8ebe8', 0.35]} />
      <directionalLight
        position={[half * 0.8, data.extentM * 1.1, half * 0.5]}
        intensity={1.65}
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-camera-left={-half}
        shadow-camera-right={half}
        shadow-camera-top={half}
        shadow-camera-bottom={-half}
        shadow-camera-near={20}
        shadow-camera-far={data.extentM * 2.5}
        shadow-bias={-0.00015}
        shadow-normalBias={0.02}
      />
      <Environment preset="city" environmentIntensity={0.18} />

      <TerrainBlock
        data={data}
        clipPlane={terrainClip ? clipPlane : null}
        clipEnabled={terrainClip}
      />
      <Water data={data} />
      <Trees data={data} />
      <Buildings
        data={data}
        clipPlane={clipPlane}
        clipEnabled={controls.clipEnabled}
      />

      <ClipCaps
        geometries={capGeometries}
        plane={clipPlane}
        enabled={controls.clipEnabled}
        extentM={data.extentM}
        maxHeight={maxH}
        strataCap={!controls.buildingsOnlyClip}
      />

      <EffectComposer multisampling={4}>
        <N8AO aoRadius={14} intensity={4.2} distanceFalloff={0.65} halfRes={false} />
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
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
        stencil: true,
      }}
      style={{ width: '100%', height: '100%' }}
    >
      <SceneContent {...props} />
    </Canvas>
  )
}

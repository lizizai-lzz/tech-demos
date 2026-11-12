import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import * as THREE from 'three'
import { useSimulation, type CameraPreset } from '@/context/SimulationContext'
import { stageCards } from '@/data/simulation'
import {
  HOLOGRAM_BEAM_TARGETS,
  agentAnchors,
  stageCardWorldPositions,
} from '@/lib/hologramPoints'
import { DataBeams } from '@/components/scene/DataBeams'
import { GridFloor } from '@/components/scene/GridFloor'
import { HologramVideo } from '@/components/scene/HologramVideo'
import { OrbitalLayer } from '@/components/scene/OrbitalLayer'
import { StageDeck } from '@/components/scene/StageDeck'

/** 默认视角必须同时框住卫星 / 阶段卡 / 直立全息设备三层 */
const CAMERA_PRESETS: Record<
  CameraPreset,
  { position: [number, number, number]; target: [number, number, number] }
> = {
  default: { position: [0.25, 2.55, 7.2], target: [0.35, 1.05, 0.08] },
  hologram: { position: [0.3, 2.0, 5.5], target: [0.35, 0.95, 0.1] },
  orbit: { position: [-4.8, 3.2, 6.8], target: [0.4, 1.8, 0] },
}

export function SceneRoot() {
  const { cameraPreset } = useSimulation()
  const agents = useMemo(() => agentAnchors(), [])
  const cardPositions = useMemo(() => stageCardWorldPositions(), [])

  const beamLinks = useMemo(() => {
    return stageCards.map((_card, i) => ({
      agent: agents[i]?.position ?? new THREE.Vector3(0, 4.2, 0),
      card: cardPositions[i] ?? new THREE.Vector3(0, 2.5, 0),
      target: HOLOGRAM_BEAM_TARGETS[i] ?? HOLOGRAM_BEAM_TARGETS[0]!,
    }))
  }, [agents, cardPositions])

  return (
    <>
      <color attach="background" args={['#040608']} />
      <fog attach="fog" args={['#040608', 12, 28]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[2, 6, 4]} intensity={0.45} color="#e2e8f0" />
      <pointLight position={[0, 3, 2]} intensity={0.35} color="#bae6fd" />

      <CameraRig preset={cameraPreset} />

      <GridFloor />
      <HologramVideo />
      <StageDeck cards={stageCards} positions={cardPositions} />
      <DataBeams links={beamLinks} />
      <OrbitalLayer agents={agents} />

      <EffectComposer multisampling={0}>
        <Bloom
          luminanceThreshold={0.42}
          luminanceSmoothing={0.75}
          intensity={1.65}
          mipmapBlur
        />
      </EffectComposer>
    </>
  )
}

function CameraRig({ preset }: { preset: CameraPreset }) {
  const target = useRef(new THREE.Vector3(...CAMERA_PRESETS.default.target))
  const desired = useRef(new THREE.Vector3(...CAMERA_PRESETS.default.position))

  useFrame(({ camera, clock }) => {
    const cfg = CAMERA_PRESETS[preset]
    desired.current.set(...cfg.position)
    target.current.set(...cfg.target)

    const t = clock.elapsedTime * 0.08
    const ox = Math.sin(t) * 0.12
    const oy = Math.cos(t * 0.65) * 0.05

    camera.position.lerp(
      new THREE.Vector3(
        desired.current.x + ox,
        desired.current.y + oy,
        desired.current.z,
      ),
      0.035,
    )
    camera.lookAt(target.current.x + ox * 0.2, target.current.y, target.current.z)
  })

  return null
}

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import * as THREE from 'three'
import { useSimulation, type CameraPreset } from '@/context/SimulationContext'
import { stageCards } from '@/data/simulation'
import {
  HOLOGRAM_BEAM_TARGETS,
  agentAnchors,
  makeHologramGeometry,
  stageCardWorldPositions,
} from '@/lib/hologramPoints'
import { DataBeams } from '@/components/scene/DataBeams'
import { GridFloor } from '@/components/scene/GridFloor'
import { HologramParticles } from '@/components/scene/HologramParticles'
import { OrbitalLayer } from '@/components/scene/OrbitalLayer'
import { StageDeck } from '@/components/scene/StageDeck'

/** 默认视角必须同时框住卫星 / 阶段卡 / 直立全息设备三层 */
const CAMERA_PRESETS: Record<
  CameraPreset,
  { position: [number, number, number]; target: [number, number, number] }
> = {
  default: { position: [0.2, 3.05, 8.8], target: [0.5, 2.05, 0] },
  hologram: { position: [1.8, 2.35, 6.2], target: [1.2, 1.35, 0] },
  orbit: { position: [-5.5, 3.8, 7.5], target: [0.3, 2.3, 0] },
}

export function SceneRoot() {
  const { cameraPreset } = useSimulation()
  const hologramGeo = useMemo(() => makeHologramGeometry(9000), [])
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
      <HologramParticles geometry={hologramGeo} />
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

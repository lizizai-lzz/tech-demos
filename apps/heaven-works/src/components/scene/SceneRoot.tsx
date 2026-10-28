import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import * as THREE from 'three'
import { useSimulation, type CameraPreset } from '@/context/SimulationContext'
import { stageCards } from '@/data/simulation'
import {
  agentAnchors,
  makeHologramGeometry,
  stageCardWorldPositions,
} from '@/lib/hologramPoints'
import { DataBeams } from '@/components/scene/DataBeams'
import { GridFloor } from '@/components/scene/GridFloor'
import { HologramParticles } from '@/components/scene/HologramParticles'
import { OrbitalLayer } from '@/components/scene/OrbitalLayer'
import { StageDeck } from '@/components/scene/StageDeck'

const CAMERA_PRESETS: Record<
  CameraPreset,
  { position: [number, number, number]; target: [number, number, number] }
> = {
  default: { position: [0, 2.8, 6.2], target: [0.4, 1.2, 0] },
  hologram: { position: [1.2, 1.4, 3.2], target: [1.5, 0.8, 0] },
  orbit: { position: [-4.5, 4.2, 5.5], target: [0, 1.5, 0] },
}

export function SceneRoot() {
  const { cameraPreset } = useSimulation()
  const hologramGeo = useMemo(() => makeHologramGeometry(11000), [])
  const agents = useMemo(() => agentAnchors(), [])
  const cardPositions = useMemo(() => stageCardWorldPositions(), [])

  const beamLinks = useMemo(() => {
    return stageCards.map((card, i) => ({
      agent: agents[i]?.position ?? new THREE.Vector3(0, 3.5, 0),
      card: cardPositions[i] ?? new THREE.Vector3(0, 2, 0),
      target: new THREE.Vector3(...card.beamTarget),
    }))
  }, [agents, cardPositions])

  return (
    <>
      <color attach="background" args={['#030508']} />
      <fog attach="fog" args={['#030508', 8, 22]} />
      <ambientLight intensity={0.25} />
      <pointLight position={[0, 4, 2]} intensity={1.2} color="#22d3ee" />
      <pointLight position={[-3, 1, 3]} intensity={0.5} color="#e879f9" />

      <CameraRig preset={cameraPreset} />

      <GridFloor />
      <HologramParticles geometry={hologramGeo} />
      <StageDeck cards={stageCards} positions={cardPositions} />
      <OrbitalLayer agents={agents} />
      <DataBeams links={beamLinks} />

      <EffectComposer multisampling={0}>
        <Bloom
          luminanceThreshold={0.15}
          luminanceSmoothing={0.85}
          intensity={1.35}
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

    const t = clock.elapsedTime * 0.12
    const ox = Math.sin(t) * 0.18
    const oy = Math.cos(t * 0.7) * 0.08

    camera.position.lerp(
      new THREE.Vector3(
        desired.current.x + ox,
        desired.current.y + oy,
        desired.current.z,
      ),
      0.04,
    )
    camera.lookAt(target.current.x + ox * 0.3, target.current.y, target.current.z)
  })

  return null
}

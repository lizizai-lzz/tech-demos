import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { StageCard } from '@/data/simulation'
import type { Vector3 } from 'three'
import { createStageCardTexture } from '@/lib/cardTexture'

type Props = {
  cards: StageCard[]
  positions: Vector3[]
}

export function StageDeck({ cards, positions }: Props) {
  return (
    <group rotation={[-0.08, 0, 0]}>
      <mesh position={[0, 2.42, -0.12]}>
        <boxGeometry args={[7.4, 0.05, 0.55]} />
        <meshStandardMaterial
          color="#1e293b"
          metalness={0.55}
          roughness={0.45}
          emissive="#0f172a"
          emissiveIntensity={0.2}
        />
      </mesh>
      {cards.map((card, i) => (
        <StageCardMesh
          key={card.id}
          card={card}
          position={positions[i] ?? positions[0]!}
        />
      ))}
    </group>
  )
}

function StageCardMesh({
  card,
  position,
}: {
  card: StageCard
  position: Vector3
}) {
  const ref = useRef<THREE.Group>(null)
  const map = useMemo(
    () => createStageCardTexture(card.labelZh, card.labelEn, card.ok, card.progress),
    [card.labelZh, card.labelEn, card.ok, card.progress],
  )

  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.position.y = position.y + Math.sin(clock.elapsedTime * 0.8 + position.x) * 0.012
  })

  return (
    <group ref={ref} position={[position.x, position.y, position.z]}>
      <mesh>
        <boxGeometry args={[0.72, 0.42, 0.04]} />
        <meshStandardMaterial
          map={map}
          color="#ffffff"
          metalness={0.15}
          roughness={0.85}
          emissive="#ffffff"
          emissiveIntensity={0.04}
        />
      </mesh>
    </group>
  )
}

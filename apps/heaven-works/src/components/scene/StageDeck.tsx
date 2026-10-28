import { useRef } from 'react'
import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { StageCard } from '@/data/simulation'
import type { Vector3 } from 'three'

type Props = {
  cards: StageCard[]
  positions: Vector3[]
}

export function StageDeck({ cards, positions }: Props) {
  return (
    <group>
      <mesh position={[0, 1.85, -0.2]} rotation={[-0.15, 0, 0]}>
        <boxGeometry args={[7.2, 0.08, 1.4]} />
        <meshStandardMaterial
          color="#0a1520"
          metalness={0.6}
          roughness={0.35}
          emissive="#0e7490"
          emissiveIntensity={0.15}
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
  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.position.y = position.y + Math.sin(clock.elapsedTime + position.x) * 0.015
  })

  return (
    <group ref={ref} position={[position.x, position.y, position.z]}>
      <mesh rotation={[-0.12, 0, 0]}>
        <boxGeometry args={[0.62, 0.38, 0.06]} />
        <meshStandardMaterial
          color="#111827"
          emissive={card.ok ? '#065f46' : '#701a75'}
          emissiveIntensity={0.55}
          metalness={0.4}
          roughness={0.5}
        />
      </mesh>
      <Html
        center
        distanceFactor={8}
        transform
        sprite
        position={[0, 0, 0.06]}
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
          fontSize: '6px',
          color: '#a5f3fc',
          textAlign: 'center',
          width: '70px',
          lineHeight: 1.2,
          textShadow: '0 0 6px #22d3ee',
        }}
      >
        <div>{card.labelZh}</div>
        <div style={{ color: card.ok ? '#4ade80' : '#facc15' }}>
          {card.ok ? 'OK' : `${Math.round(card.progress)}%`}
        </div>
      </Html>
    </group>
  )
}

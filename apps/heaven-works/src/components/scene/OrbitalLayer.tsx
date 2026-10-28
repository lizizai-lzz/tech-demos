import * as THREE from 'three'
import { useRef } from 'react'
import { Line } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import type { AgentAnchor } from '@/lib/hologramPoints'

type Props = {
  agents: AgentAnchor[]
}

const HUB: [number, number, number] = [0, 3.55, -0.3]

export function OrbitalLayer({ agents }: Props) {
  const hubRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (hubRef.current) {
      hubRef.current.rotation.y = clock.elapsedTime * 0.08
    }
  })

  return (
    <group>
      <group ref={hubRef} position={HUB}>
        <mesh>
          <boxGeometry args={[0.55, 0.28, 0.55]} />
          <meshStandardMaterial
            color="#1e293b"
            metalness={0.85}
            roughness={0.25}
            emissive="#0891b2"
            emissiveIntensity={0.35}
          />
        </mesh>
        <mesh position={[0, 0, 0.42]}>
          <boxGeometry args={[1.6, 0.04, 0.35]} />
          <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, -0.42]}>
          <boxGeometry args={[1.6, 0.04, 0.35]} />
          <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.22, 0]}>
          <coneGeometry args={[0.18, 0.35, 4]} />
          <meshStandardMaterial
            color="#22d3ee"
            emissive="#22d3ee"
            emissiveIntensity={0.6}
            metalness={0.5}
            roughness={0.2}
          />
        </mesh>
      </group>

      {agents.map((agent, i) => (
        <AgentNode key={agent.id} agent={agent} index={i} />
      ))}
    </group>
  )
}

function AgentNode({ agent, index }: { agent: AgentAnchor; index: number }) {
  const ref = useRef<THREE.Mesh>(null)
  const active = index === 3

  useFrame(({ clock }) => {
    if (!ref.current) return
    const s = 1 + (active ? Math.sin(clock.elapsedTime * 4) * 0.08 : 0)
    ref.current.scale.setScalar(s)
  })

  return (
    <group>
      <Line
        points={[HUB, agent.position.toArray()]}
        color="#64748b"
        lineWidth={1}
        transparent
        opacity={0.45}
      />
      <mesh ref={ref} position={agent.position.toArray()}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshStandardMaterial
          color={active ? '#e879f9' : '#22d3ee'}
          emissive={active ? '#e879f9' : '#0891b2'}
          emissiveIntensity={active ? 1.2 : 0.65}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>
    </group>
  )
}

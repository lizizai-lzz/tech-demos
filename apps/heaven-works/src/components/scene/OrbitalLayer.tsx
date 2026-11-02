import { useRef } from 'react'
import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { HUB_POSITION, type AgentAnchor } from '@/lib/hologramPoints'
import { FiberBeam } from '@/components/scene/FiberBeam'

type Props = {
  agents: AgentAnchor[]
}

export function OrbitalLayer({ agents }: Props) {
  const hubRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (hubRef.current) {
      hubRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.06) * 0.12
    }
  })

  return (
    <group>
      {agents.map((agent, i) => (
        <FiberBeam
          key={`beam-${agent.id}`}
          from={HUB_POSITION}
          to={agent.position}
          color={i === 3 ? '#f9a8d4' : '#f8fafc'}
          radius={i === 3 ? 0.052 : 0.036}
          phase={i * 0.9}
        />
      ))}

      <group ref={hubRef} position={HUB_POSITION.toArray()}>
        <MasterSatellite />
      </group>

      {agents.map((agent, i) => (
        <AgentNode key={agent.id} agent={agent} index={i} />
      ))}
    </group>
  )
}

function MasterSatellite() {
  return (
    <group>
      <mesh>
        <boxGeometry args={[0.42, 0.22, 0.38]} />
        <meshStandardMaterial
          color="#cbd5e1"
          metalness={0.92}
          roughness={0.18}
          emissive="#334155"
          emissiveIntensity={0.08}
        />
      </mesh>
      <mesh position={[0.95, 0, 0]}>
        <boxGeometry args={[1.35, 0.035, 0.55]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.22} />
      </mesh>
      <mesh position={[-0.95, 0, 0]}>
        <boxGeometry args={[1.35, 0.035, 0.55]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.22} />
      </mesh>
      <mesh position={[0, 0.18, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.14, 0.18, 0.08, 16]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.15} />
      </mesh>
      <mesh position={[0, 0.32, 0.12]}>
        <cylinderGeometry args={[0.02, 0.02, 0.35, 8]} />
        <meshStandardMaterial color="#f8fafc" emissive="#f8fafc" emissiveIntensity={0.3} />
      </mesh>
    </group>
  )
}

function AgentNode({ agent, index }: { agent: AgentAnchor; index: number }) {
  const groupRef = useRef<THREE.Group>(null)
  const active = index === 3

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    groupRef.current.position.y =
      agent.position.y + Math.sin(clock.elapsedTime * 0.9 + index) * 0.025
  })

  return (
    <group ref={groupRef} position={agent.position.toArray()}>
      <AgentHardware kind={agent.kind} active={active} />
      <Text
        position={[0, -0.22, 0]}
        fontSize={0.085}
        color={active ? '#fda4af' : '#cbd5e1'}
        anchorX="center"
        anchorY="top"
        outlineWidth={0.007}
        outlineColor="#020617"
      >
        {agent.id} {agent.code.replace('_', ' ')}
      </Text>
    </group>
  )
}

function AgentHardware({
  kind,
  active,
}: {
  kind: AgentAnchor['kind']
  active: boolean
}) {
  const emissive = active ? '#fb7185' : '#64748b'
  const emissiveIntensity = active ? 0.85 : 0.25

  if (kind === 'drone') {
    return (
      <group rotation={[0, Math.PI / 4, 0]}>
        <mesh>
          <boxGeometry args={[0.18, 0.04, 0.18]} />
          <meshStandardMaterial
            color="#94a3b8"
            metalness={0.7}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
        {(
          [
            [-0.12, 0.06, -0.12],
            [0.12, 0.06, -0.12],
            [-0.12, 0.06, 0.12],
            [0.12, 0.06, 0.12],
          ] as [number, number, number][]
        ).map((p, i) => (
          <mesh key={i} position={p}>
            <boxGeometry args={[0.06, 0.01, 0.02]} />
            <meshStandardMaterial color="#e2e8f0" emissive="#fff" emissiveIntensity={0.2} />
          </mesh>
        ))}
      </group>
    )
  }

  if (kind === 'camera') {
    return (
      <group>
        <mesh>
          <boxGeometry args={[0.16, 0.1, 0.12]} />
          <meshStandardMaterial
            color="#64748b"
            metalness={0.75}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
        <mesh position={[0, 0, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.06, 0.08, 12]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} />
        </mesh>
      </group>
    )
  }

  if (kind === 'sensor') {
    return (
      <group>
        <mesh>
          <octahedronGeometry args={[0.1, 0]} />
          <meshStandardMaterial
            color="#cbd5e1"
            flatShading
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.14, 0.008, 8, 24]} />
          <meshBasicMaterial color="#94a3b8" transparent opacity={0.7} />
        </mesh>
      </group>
    )
  }

  return (
    <group>
      <mesh>
        <boxGeometry args={[0.12, 0.12, 0.12]} />
        <meshStandardMaterial
          color="#94a3b8"
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      <mesh position={[0.22, 0, 0]}>
        <boxGeometry args={[0.28, 0.02, 0.1]} />
        <meshStandardMaterial color="#64748b" metalness={0.8} />
      </mesh>
    </group>
  )
}

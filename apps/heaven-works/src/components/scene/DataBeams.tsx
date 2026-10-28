import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { FiberBeam } from '@/components/scene/FiberBeam'

export type BeamLink = {
  agent: THREE.Vector3
  card: THREE.Vector3
  target: THREE.Vector3
}

type Props = {
  links: BeamLink[]
}

export function DataBeams({ links }: Props) {
  return (
    <group>
      {links.slice(0, 6).map((link, i) => (
        <group key={i}>
          <FiberBeam
            from={link.agent}
            to={link.card}
            color="#e2e8f0"
            radius={0.022}
            phase={i * 0.5}
          />
          <DottedDownBeam from={link.card} to={link.target} phase={i * 0.4} />
        </group>
      ))}
    </group>
  )
}

function DottedDownBeam({
  from,
  to,
  phase,
}: {
  from: THREE.Vector3
  to: THREE.Vector3
  phase: number
}) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const count = 14

  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1)
      dummy.position.lerpVectors(from, to, t)
      dummy.position.y += Math.sin(clock.elapsedTime * 2 + phase + i * 0.3) * 0.015
      dummy.scale.setScalar(0.025 + (i % 3) * 0.008)
      dummy.updateMatrix()
      ref.current.setMatrixAt(i, dummy.matrix)
    }
    ref.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial
        color="#f8fafc"
        transparent
        opacity={0.55}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </instancedMesh>
  )
}

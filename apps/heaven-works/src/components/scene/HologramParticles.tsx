import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { BufferGeometry } from 'three'

type Props = {
  geometry: BufferGeometry
}

export function HologramParticles({ geometry }: Props) {
  const ref = useRef<THREE.Points>(null)

  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.rotation.y = Math.sin(clock.elapsedTime * 0.05) * 0.02
  })

  return (
    <points ref={ref} geometry={geometry} position={[0, 0, 0]}>
      <pointsMaterial
        size={0.028}
        vertexColors
        transparent
        opacity={0.88}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  )
}

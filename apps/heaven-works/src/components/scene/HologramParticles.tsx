import { useMemo, useRef } from 'react'
import { Line } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  buildDeviceLineLoops,
  makeDeviceGeometry,
  makeMistGeometry,
  HOLOGRAM_GROUP_TILT_Y,
} from '@/lib/hologramPoints'

export function HologramParticles() {
  const groupRef = useRef<THREE.Group>(null)
  const deviceGeo = useMemo(() => makeDeviceGeometry(), [])
  const mistGeo = useMemo(() => makeMistGeometry(), [])
  const lineLoops = useMemo(() => buildDeviceLineLoops(), [])

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y =
      HOLOGRAM_GROUP_TILT_Y + Math.sin(clock.elapsedTime * 0.035) * 0.008
  })

  return (
    <group ref={groupRef}>
      <points geometry={deviceGeo}>
        <pointsMaterial
          size={0.032}
          vertexColors
          transparent
          opacity={0.92}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>

      {lineLoops.map((loop, i) => (
        <Line
          key={i}
          points={loop.points}
          color={loop.color}
          lineWidth={1.5}
          transparent
          opacity={0.95}
        />
      ))}

      <points geometry={mistGeo} position={[0, 0, 0]}>
        <pointsMaterial
          size={0.018}
          vertexColors
          transparent
          opacity={0.45}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
    </group>
  )
}

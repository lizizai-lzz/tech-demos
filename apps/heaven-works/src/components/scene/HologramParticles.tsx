import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { makeDeviceGeometry, makeMistGeometry, HOLOGRAM_GROUP_TILT_Y } from '@/lib/hologramPoints'
import { useMemo } from 'react'

export function HologramParticles() {
  const groupRef = useRef<THREE.Group>(null)
  const deviceGeo = useMemo(() => makeDeviceGeometry(), [])
  const mistGeo = useMemo(() => makeMistGeometry(), [])

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y =
      HOLOGRAM_GROUP_TILT_Y + Math.sin(clock.elapsedTime * 0.04) * 0.015
  })

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <points geometry={deviceGeo}>
        <pointsMaterial
          size={0.034}
          vertexColors
          transparent
          opacity={0.94}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
      <points geometry={mistGeo}>
        <pointsMaterial
          size={0.022}
          vertexColors
          transparent
          opacity={0.55}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
    </group>
  )
}

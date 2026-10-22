import { useMemo } from 'react'
import * as THREE from 'three'
import type { CityData } from '@/lib/types'

function ringToShape(ring: [number, number][]) {
  const shape = new THREE.Shape()
  if (ring.length < 3) return shape
  shape.moveTo(ring[0][0], ring[0][1])
  for (let i = 1; i < ring.length; i++) shape.lineTo(ring[i][0], ring[i][1])
  shape.closePath()
  return shape
}

export function Water({ data }: { data: CityData }) {
  const meshes = useMemo(() => {
    return data.water.map((w) => {
      const shape = ringToShape(w.ring)
      const geo = new THREE.ShapeGeometry(shape)
      geo.rotateX(-Math.PI / 2)
      return geo
    })
  }, [data.water])

  if (meshes.length === 0) return null

  return (
    <group>
      {meshes.map((geo, i) => (
        <mesh key={data.water[i].id} geometry={geo} position={[0, 0.55, 0]} receiveShadow>
          <meshStandardMaterial
            color="#7ec8e8"
            emissive="#4aa8d0"
            emissiveIntensity={0.08}
            roughness={0.18}
            metalness={0.22}
            transparent
            opacity={0.88}
          />
        </mesh>
      ))}
    </group>
  )
}

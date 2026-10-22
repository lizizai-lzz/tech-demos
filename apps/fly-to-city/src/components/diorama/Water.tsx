import { useMemo } from 'react'
import * as THREE from 'three'
import { waterRingsXZ } from '@/lib/water-mask'
import type { CityData, Vec2 } from '@/lib/types'

function xzToShape(ring: Vec2[]) {
  const shape = new THREE.Shape()
  shape.moveTo(ring[0][0], -ring[0][1])
  for (let i = 1; i < ring.length; i++) shape.lineTo(ring[i][0], -ring[i][1])
  shape.closePath()
  return shape
}

const waterMat = new THREE.MeshStandardMaterial({
  color: '#bfe0f0',
  roughness: 0.55,
  metalness: 0.02,
})

export function Water({ data }: { data: CityData }) {
  const meshes = useMemo(() => {
    return waterRingsXZ(data).map((ring) => {
      const geo = new THREE.ShapeGeometry(xzToShape(ring))
      geo.rotateX(-Math.PI / 2)
      return geo
    })
  }, [data])

  return (
    <group>
      {meshes.map((geo, i) => (
        <mesh key={i} geometry={geo} position={[0, 9, 0]} receiveShadow material={waterMat} />
      ))}
    </group>
  )
}

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

const waterMat = new THREE.MeshStandardMaterial({
  color: '#1490d0',
  roughness: 0.18,
  metalness: 0.08,
  emissive: '#1d6f9c',
  emissiveIntensity: 0.12,
})

export function Water({ data }: { data: CityData }) {
  const meshes = useMemo(() => {
    return data.water.map((w) => {
      const geo = new THREE.ShapeGeometry(ringToShape(w.ring))
      geo.rotateX(-Math.PI / 2)
      return geo
    })
  }, [data.water])

  const river = useMemo(() => {
    if (data.id !== 'shanghai-lujiazui') return null
    const shape = new THREE.Shape()
    shape.moveTo(-1900, -2200)
    shape.lineTo(-280, -2000)
    shape.lineTo(-120, 2400)
    shape.lineTo(-1750, 2600)
    shape.closePath()
    const geo = new THREE.ShapeGeometry(shape)
    geo.rotateX(-Math.PI / 2)
    return geo
  }, [data])

  return (
    <group>
      {river && (
        <mesh geometry={river} position={[0, 8, 0]} receiveShadow material={waterMat} />
      )}
      {meshes.map((geo, i) => (
        <mesh key={data.water[i].id} geometry={geo} position={[0, 6, 0]} receiveShadow material={waterMat} />
      ))}
    </group>
  )
}

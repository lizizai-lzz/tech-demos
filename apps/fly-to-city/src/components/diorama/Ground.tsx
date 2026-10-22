import { useMemo } from 'react'
import * as THREE from 'three'
import type { CityData } from '@/lib/types'

export function Ground({ data }: { data: CityData }) {
  const size = 14000
  const patch = useMemo(() => {
    const { gridSize, extentM, terrainHeights, minTerrain, maxTerrain } = data
    const geo = new THREE.PlaneGeometry(extentM, extentM, Math.min(48, gridSize - 1), Math.min(48, gridSize - 1))
    geo.rotateX(-Math.PI / 2)
    const pos = geo.attributes.position as THREE.BufferAttribute
    const range = Math.max(8, maxTerrain - minTerrain)
    const stride = gridSize / (Math.min(48, gridSize - 1) + 1)
    for (let i = 0; i < pos.count; i++) {
      const cols = Math.min(48, gridSize - 1) + 1
      const ix = Math.min(gridSize - 1, Math.floor((i % cols) * stride))
      const iz = Math.min(gridSize - 1, Math.floor(Math.floor(i / cols) * stride))
      const h = terrainHeights[iz * gridSize + ix] ?? minTerrain
      pos.setY(i, ((h - minTerrain) / range) * 8)
    }
    pos.needsUpdate = true
    geo.computeVertexNormals()
    return geo
  }, [data])

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="#8f8a82" roughness={0.96} metalness={0} />
      </mesh>
      <mesh geometry={patch} receiveShadow>
        <meshStandardMaterial color="#9a948c" roughness={0.94} />
      </mesh>
    </group>
  )
}

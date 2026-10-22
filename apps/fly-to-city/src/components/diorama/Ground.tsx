import { useMemo } from 'react'
import * as THREE from 'three'
import type { CityData } from '@/lib/types'

/** 超大地面 + 中心区域轻微起伏，边缘由雾隐藏 */
export function Ground({ data }: { data: CityData }) {
  const size = Math.max(data.extentM * 3, 12000)

  const centerPatch = useMemo(() => {
    const { gridSize, extentM, terrainHeights, minTerrain, maxTerrain } = data
    const geo = new THREE.PlaneGeometry(extentM, extentM, gridSize - 1, gridSize - 1)
    geo.rotateX(-Math.PI / 2)
    const pos = geo.attributes.position as THREE.BufferAttribute
    const range = Math.max(8, maxTerrain - minTerrain)
    for (let i = 0; i < pos.count; i++) {
      const ix = i % gridSize
      const iz = Math.floor(i / gridSize)
      const h = terrainHeights[iz * gridSize + ix] ?? minTerrain
      pos.setY(i, ((h - minTerrain) / range) * 6)
    }
    pos.needsUpdate = true
    geo.computeVertexNormals()
    return geo
  }, [data])

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[size, size, 1, 1]} />
        <meshStandardMaterial color="#e4e4e0" roughness={0.94} metalness={0.02} />
      </mesh>
      <mesh geometry={centerPatch} receiveShadow castShadow>
        <meshStandardMaterial color="#e8e8e4" roughness={0.9} metalness={0.02} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.12, 0]} receiveShadow>
        <planeGeometry args={[extentM(data), extentM(data), 32, 32]} />
        <meshBasicMaterial color="#efefec" wireframe transparent opacity={0.06} />
      </mesh>
    </group>
  )
}

function extentM(data: CityData) {
  return data.extentM
}

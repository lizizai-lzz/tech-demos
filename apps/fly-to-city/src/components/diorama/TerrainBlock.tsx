import { useMemo } from 'react'
import * as THREE from 'three'
import type { CityData } from '@/lib/types'

type Props = {
  data: CityData
  wallDepth: number
}

const WALL_COLORS = ['#c4a574', '#b8956a', '#9a8f7a', '#7a7d82'] as const

export function TerrainBlock({ data, wallDepth }: Props) {
  const topGeometry = useMemo(() => {
    const { gridSize, extentM, terrainHeights, minTerrain, maxTerrain } = data
    const geo = new THREE.PlaneGeometry(extentM, extentM, gridSize - 1, gridSize - 1)
    geo.rotateX(-Math.PI / 2)
    const pos = geo.attributes.position as THREE.BufferAttribute
    const range = Math.max(8, maxTerrain - minTerrain)
    for (let i = 0; i < pos.count; i++) {
      const ix = i % gridSize
      const iz = Math.floor(i / gridSize)
      const h = terrainHeights[iz * gridSize + ix] ?? minTerrain
      const norm = (h - minTerrain) / range
      pos.setY(i, norm * 12)
    }
    pos.needsUpdate = true
    geo.computeVertexNormals()
    return geo
  }, [data])

  const half = data.extentM / 2
  const wallH = wallDepth

  return (
    <group>
      <mesh geometry={topGeometry} receiveShadow castShadow>
        <meshStandardMaterial color="#ececec" roughness={0.92} metalness={0.02} />
      </mesh>
      <Wall
        position={[0, -wallH / 2, -half]}
        size={[data.extentM, wallH, 2]}
        color={WALL_COLORS[0]}
      />
      <Wall
        position={[0, -wallH / 2, half]}
        size={[data.extentM, wallH, 2]}
        color={WALL_COLORS[1]}
      />
      <Wall
        position={[-half, -wallH / 2, 0]}
        size={[2, wallH, data.extentM]}
        color={WALL_COLORS[2]}
      />
      <Wall
        position={[half, -wallH / 2, 0]}
        size={[2, wallH, data.extentM]}
        color={WALL_COLORS[3]}
      />
      <mesh position={[0, -wallH - 1, 0]} receiveShadow>
        <boxGeometry args={[data.extentM + 8, 2, data.extentM + 8]} />
        <meshStandardMaterial color="#d8e4ec" roughness={0.95} />
      </mesh>
    </group>
  )
}

function Wall({
  position,
  size,
  color,
}: {
  position: [number, number, number]
  size: [number, number, number]
  color: string
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.88} />
    </mesh>
  )
}

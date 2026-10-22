import { useEffect, useMemo, useState } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { bakeGroundCanvas, GROUND_SPAN_M, peekGround } from '@/lib/bake-ground'
import type { CityData } from '@/lib/types'

const LAND = '#e6e1d8'

function sampleHeight(data: CityData, x: number, z: number) {
  const { gridSize, extentM, terrainHeights, minTerrain, maxTerrain } = data
  const half = extentM / 2
  if (x < -half || x > half || z < -half || z > half) return 0
  const fx = x / extentM + 0.5
  // 地形网格 gy=0 在北侧，对应 z 为负
  const fy = z / extentM + 0.5
  const gx = Math.min(gridSize - 1, Math.max(0, Math.round(fx * (gridSize - 1))))
  const gy = Math.min(gridSize - 1, Math.max(0, Math.round(fy * (gridSize - 1))))
  const h = terrainHeights[gy * gridSize + gx] ?? minTerrain
  const range = Math.max(8, maxTerrain - minTerrain)
  return ((h - minTerrain) / range) * 8
}

export function Ground({ data }: { data: CityData }) {
  const { gl } = useThree()
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(() =>
    peekGround(data.center.lng, data.center.lat),
  )

  useEffect(() => {
    const ready = peekGround(data.center.lng, data.center.lat)
    if (ready) {
      setCanvas(ready)
      return
    }
    let dead = false
    bakeGroundCanvas(data.center.lng, data.center.lat)
      .then((next) => {
        if (!dead) setCanvas(next)
      })
      .catch((err) => {
        console.error('地面地图烘焙失败', err)
      })
    return () => {
      dead = true
    }
  }, [data.center.lng, data.center.lat])

  const geo = useMemo(() => {
    const seg = 64
    const g = new THREE.PlaneGeometry(GROUND_SPAN_M, GROUND_SPAN_M, seg, seg)
    const pos = g.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      // 旋转前：+Y 在旋转后变成北（-Z）
      pos.setZ(i, sampleHeight(data, x, -y))
    }
    g.rotateX(-Math.PI / 2)
    pos.needsUpdate = true
    g.computeVertexNormals()
    return g
  }, [data])

  const tex = useMemo(() => {
    if (!canvas) return null
    const t = new THREE.CanvasTexture(canvas)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = gl.capabilities.getMaxAnisotropy()
    t.needsUpdate = true
    return t
  }, [canvas, gl])

  useEffect(() => {
    return () => {
      tex?.dispose()
    }
  }, [tex])

  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial
        map={tex ?? undefined}
        color={tex ? '#ffffff' : LAND}
        roughness={0.94}
        metalness={0}
      />
    </mesh>
  )
}

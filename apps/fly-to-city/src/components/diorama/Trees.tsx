import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { bakeGroundCanvas, GROUND_SPAN_M } from '@/lib/bake-ground'
import { onWater, waterRingsXZ } from '@/lib/water-mask'
import type { CityData, Vec2 } from '@/lib/types'

type TreePoint = [number, number, number]

const GREENS = [new THREE.Color('#1f7a3a'), new THREE.Color('#3ea85a'), new THREE.Color('#67c36e')]

function spiralTrees(rings: Vec2[][]): TreePoint[] {
  const extra: TreePoint[] = []
  let s = 42
  for (let i = 0; i < 700; i++) {
    s = (s * 16807 + 11) % 2147483647
    const a = i * 2.399963
    const r = 40 + (s % 1200)
    const x = Math.cos(a) * r
    const z = Math.sin(a) * r * 0.92
    if (Math.hypot(x, z) < 24) continue
    if (onWater(x, z, rings)) continue
    extra.push([x, z, 1])
  }
  return extra
}

function isGreen(r: number, g: number, b: number) {
  return g > 78 && g > r + 16 && g > b + 8
}

/** 从烘焙好地面的绿色像素取树，公园里密、贴着马路的边上再加一排。 */
function sampleTrees(canvas: HTMLCanvasElement, rings: Vec2[][]): TreePoint[] {
  const S = 440
  const scratch = document.createElement('canvas')
  scratch.width = S
  scratch.height = S
  const ctx = scratch.getContext('2d', { willReadFrequently: true })
  if (!ctx) return []
  ctx.drawImage(canvas, 0, 0, S, S)
  const img = ctx.getImageData(0, 0, S, S).data
  const at = (x: number, y: number) => {
    const i = (y * S + x) * 4
    return [img[i], img[i + 1], img[i + 2]] as const
  }
  const pts: TreePoint[] = []
  const step = 2
  for (let y = 1; y < S - 1; y += step) {
    for (let x = 1; x < S - 1; x += step) {
      const [r, g, b] = at(x, y)
      if (!isGreen(r, g, b)) continue
      const wx = (x / S - 0.5) * GROUND_SPAN_M
      const wz = (y / S - 0.5) * GROUND_SPAN_M
      if (onWater(wx, wz, rings)) continue
      const [r2, g2, b2] = at(Math.min(S - 1, x + step), y)
      const edge = !isGreen(r2, g2, b2)
      if (!edge && ((x + y) / step) % 3 !== 0) continue
      pts.push([wx, wz, edge ? 1 : 0])
    }
  }
  if (pts.length > 3400) {
    const stride = Math.ceil(pts.length / 3400)
    return pts.filter((_, i) => i % stride === 0)
  }
  return pts
}

export function Trees({ data }: { data: CityData }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const rings = useMemo(() => waterRingsXZ(data), [data])
  const [points, setPoints] = useState<TreePoint[]>(() => {
    const kept = data.trees
      .filter(([x, z]) => !onWater(x, z, rings))
      .map(([x, z]) => [x, z, 0] as TreePoint)
    return [...kept, ...spiralTrees(rings)]
  })

  useEffect(() => {
    let dead = false
    const kept = data.trees
      .filter(([x, z]) => !onWater(x, z, rings))
      .map(([x, z]) => [x, z, 0] as TreePoint)
    setPoints([...kept, ...spiralTrees(rings)])
    bakeGroundCanvas(data.center.lng, data.center.lat)
      .then((canvas) => {
        if (dead) return
        const sampled = sampleTrees(canvas, rings)
        if (sampled.length > 80) setPoints([...kept, ...sampled].slice(0, 3800))
      })
      .catch(() => {
        /* 地面没烘出来时保留螺旋树 */
      })
    return () => {
      dead = true
    }
  }, [data, rings])

  const dummy = useMemo(() => new THREE.Object3D(), [])

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    points.forEach(([x, z, kind], i) => {
      const park = kind < 0.5
      // 机位在七百米外，按真实树冠只会是一两个像素，所以放大到能读出来的游戏尺度。
      const s = park ? 16 + (i % 4) * 3.2 : 8 + (i % 3) * 1.6
      dummy.position.set(x, s * 0.45, z)
      dummy.scale.set(s * 1.15, s * 0.8, s)
      dummy.rotation.set(0, (i % 7) * 0.4, 0)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
      mesh.setColorAt(i, GREENS[i % GREENS.length])
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [points, dummy])

  if (points.length === 0) return null

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, points.length]} receiveShadow>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial color="#ffffff" roughness={0.72} />
    </instancedMesh>
  )
}

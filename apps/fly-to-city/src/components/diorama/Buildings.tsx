import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { CityData } from '@/lib/types'
import { createWhiteMaterial } from '@/lib/materials'

function ringToShape(ring: [number, number][]) {
  const shape = new THREE.Shape()
  if (ring.length < 3) return shape
  shape.moveTo(ring[0][0], -ring[0][1])
  for (let i = 1; i < ring.length; i++) shape.lineTo(ring[i][0], -ring[i][1])
  shape.closePath()
  return shape
}

export function Buildings({ data }: { data: CityData }) {
  const group = useRef<THREE.Group>(null)

  const shells = useMemo(() => {
    const mat = createWhiteMaterial()
    const chunk: THREE.BufferGeometry[] = []
    const meshes: THREE.Mesh[] = []
    const flush = () => {
      if (!chunk.length) return
      const merged = mergeGeometries(chunk, false)
      chunk.forEach((g) => g.dispose())
      chunk.length = 0
      if (!merged) return
      const mesh = new THREE.Mesh(merged, mat)
      mesh.castShadow = true
      mesh.receiveShadow = true
      meshes.push(mesh)
    }
    for (const b of data.buildings) {
      if (b.ring.length < 3) continue
      const shape = ringToShape(b.ring)
      const geo = new THREE.ExtrudeGeometry(shape, { depth: b.height, bevelEnabled: false })
      geo.rotateX(-Math.PI / 2)
      chunk.push(geo)
      if (chunk.length >= 350) flush()
    }
    flush()
    return meshes
  }, [data])

  useLayoutEffect(() => {
    const g = group.current
    if (!g) return
    g.clear()
    for (const m of shells) g.add(m)
    window.__cityReady = data.id
  }, [shells, data.id])

  return <group ref={group} />
}

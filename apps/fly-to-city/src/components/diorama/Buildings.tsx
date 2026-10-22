import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { facadeStyleForHeight, getFacadeMaterial, setFacadeAttrs } from '@/lib/facade-material'
import type { CityData } from '@/lib/types'

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
    const mat = getFacadeMaterial()
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
      const floors = b.levels > 0 ? b.levels : Math.max(1, Math.round(b.height / 3.5))
      setFacadeAttrs(geo, floors, facadeStyleForHeight(b.height, b.facade))
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
    return () => {
      for (const m of shells) m.geometry.dispose()
    }
  }, [shells, data.id])

  return <group ref={group} />
}

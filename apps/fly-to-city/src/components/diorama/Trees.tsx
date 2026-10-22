import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { CityData } from '@/lib/types'

export function Trees({ data }: { data: CityData }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const points = useMemo(() => {
    const extra: [number, number][] = []
    let s = 42
    for (let i = 0; i < 2200; i++) {
      s = (s * 16807 + 11) % 2147483647
      const a = i * 2.399963
      const r = 40 + (s % 1800)
      const x = Math.cos(a) * r
      const z = Math.sin(a) * r * 0.92
      if (Math.hypot(x, z) < 30) continue
      extra.push([x, z])
    }
    return [...data.trees, ...extra]
  }, [data.trees])

  const dummy = useMemo(() => new THREE.Object3D(), [])

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    points.forEach(([x, z], i) => {
      const s = 7.5 + (i % 8) * 1.15
      dummy.position.set(x, s * 0.55, z)
      dummy.scale.set(s * 1.25, s * 0.9, s * 1.15)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [points, dummy])

  if (points.length === 0) return null

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, points.length]} castShadow receiveShadow>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial color="#7fbf78" roughness={0.84} flatShading />
    </instancedMesh>
  )
}

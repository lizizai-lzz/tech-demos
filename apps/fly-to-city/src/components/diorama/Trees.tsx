import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { onWater, waterRingsXZ } from '@/lib/water-mask'
import type { CityData } from '@/lib/types'

export function Trees({ data }: { data: CityData }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const points = useMemo(() => {
    const rings = waterRingsXZ(data)
    const extra: [number, number][] = []
    let s = 42
    for (let i = 0; i < 1600; i++) {
      s = (s * 16807 + 11) % 2147483647
      const a = i * 2.399963
      const r = 30 + (s % 1400)
      const x = Math.cos(a) * r
      const z = Math.sin(a) * r * 0.92
      if (Math.hypot(x, z) < 24) continue
      if (onWater(x, z, rings)) continue
      extra.push([x, z])
    }
    const kept = data.trees.filter(([x, z]) => !onWater(x, z, rings))
    return [...kept, ...extra]
  }, [data])

  const dummy = useMemo(() => new THREE.Object3D(), [])

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    points.forEach(([x, z], i) => {
      const s = 4.8 + (i % 4) * 0.65
      dummy.position.set(x, s * 0.5, z)
      dummy.scale.set(s * 1.1, s * 0.85, s)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [points, dummy])

  if (points.length === 0) return null

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, points.length]} castShadow receiveShadow>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial color="#8fce96" roughness={0.8} flatShading />
    </instancedMesh>
  )
}

import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { CityData } from '@/lib/types'

export function Trees({ data }: { data: CityData }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const count = data.trees.length
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh || count === 0) return
    let i = 0
    for (const [x, z] of data.trees) {
      const s = 3.8 + (i % 9) * 0.55
      dummy.position.set(x, s * 0.55, z)
      dummy.scale.set(s * 1.15, s * 0.95, s * 1.1)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
      i++
    }
    mesh.instanceMatrix.needsUpdate = true
  }, [data.trees, count, dummy])

  if (count === 0) return null

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} castShadow receiveShadow>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial color="#a8ddb0" roughness={0.82} metalness={0} flatShading />
    </instancedMesh>
  )
}

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
      const scale = 2.2 + (i % 7) * 0.35
      dummy.position.set(x, scale * 0.45, z)
      dummy.scale.setScalar(scale)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
      i++
    }
    mesh.instanceMatrix.needsUpdate = true
  }, [data.trees, count, dummy])

  if (count === 0) return null

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} castShadow receiveShadow>
      <sphereGeometry args={[1, 10, 10]} />
      <meshStandardMaterial color="#9fd4a0" roughness={0.85} metalness={0} />
    </instancedMesh>
  )
}

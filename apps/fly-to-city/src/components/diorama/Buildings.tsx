import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { CityData } from '@/lib/types'

function ringToShape(ring: [number, number][]) {
  const shape = new THREE.Shape()
  if (ring.length < 3) return shape
  shape.moveTo(ring[0][0], ring[0][1])
  for (let i = 1; i < ring.length; i++) shape.lineTo(ring[i][0], ring[i][1])
  shape.closePath()
  return shape
}

export function Buildings({ data }: { data: CityData }) {
  const group = useRef<THREE.Group>(null)

  const shells = useMemo(() => {
    const shellMeshes: THREE.Mesh[] = []
    const shellMat = new THREE.MeshStandardMaterial({
      color: '#f8f6f2',
      roughness: 0.52,
      metalness: 0.04,
    })

    for (const b of data.buildings) {
      if (b.ring.length < 3) continue
      const shape = ringToShape(b.ring)
      const geo = new THREE.ExtrudeGeometry(shape, { depth: b.height, bevelEnabled: false })
      geo.rotateX(-Math.PI / 2)
      const shell = new THREE.Mesh(geo, shellMat.clone())
      shell.castShadow = true
      shell.receiveShadow = true
      shellMeshes.push(shell)
    }
    return shellMeshes
  }, [data])

  useLayoutEffect(() => {
    const g = group.current
    if (!g) return
    g.clear()
    for (const m of shells) g.add(m)
  }, [shells])

  return <group ref={group} />
}

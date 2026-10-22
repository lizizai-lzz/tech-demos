import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { CityData } from '@/lib/types'

export const FLOOR_H = 3.5

type Props = {
  data: CityData
  clipPlane: THREE.Plane
  clipEnabled: boolean
}

function ringToShape(ring: [number, number][]) {
  const shape = new THREE.Shape()
  if (ring.length < 3) return shape
  shape.moveTo(ring[0][0], ring[0][1])
  for (let i = 1; i < ring.length; i++) shape.lineTo(ring[i][0], ring[i][1])
  shape.closePath()
  return shape
}

export function buildingClipGeometries(data: CityData): THREE.BufferGeometry[] {
  const shells: THREE.BufferGeometry[] = []
  for (const b of data.buildings) {
    if (b.ring.length < 3) continue
    const shape = ringToShape(b.ring)
    const geo = new THREE.ExtrudeGeometry(shape, { depth: b.height, bevelEnabled: false })
    geo.rotateX(-Math.PI / 2)
    shells.push(geo)
  }
  if (shells.length === 0) return []
  const merged = mergeGeometries(shells, false)
  return merged ? [merged] : shells
}

export function Buildings({ data, clipPlane, clipEnabled }: Props) {
  const group = useRef<THREE.Group>(null)

  const { shells, floors } = useMemo(() => {
    const shellMeshes: THREE.Mesh[] = []
    const floorMeshes: THREE.Mesh[] = []
    const clip = clipEnabled ? [clipPlane] : []

    const shellMat = new THREE.MeshStandardMaterial({
      color: '#f8f6f2',
      roughness: 0.52,
      metalness: 0.04,
      clippingPlanes: clip,
      clipShadows: true,
    })

    const floorMat = new THREE.MeshStandardMaterial({
      color: '#ddd9d4',
      roughness: 0.65,
      clippingPlanes: clip,
      clipShadows: true,
    })

    for (const b of data.buildings) {
      if (b.ring.length < 3) continue
      const shape = ringToShape(b.ring)
      const geo = new THREE.ExtrudeGeometry(shape, { depth: b.height, bevelEnabled: false })
      geo.rotateX(-Math.PI / 2)
      const shell = new THREE.Mesh(geo, shellMat.clone())
      shell.castShadow = true
      shell.receiveShadow = true
      shell.renderOrder = 2
      shellMeshes.push(shell)

      const levels = Math.max(1, Math.floor(b.height / FLOOR_H))
      for (let lv = 1; lv < levels; lv++) {
        const y = lv * FLOOR_H
        const fGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.15, bevelEnabled: false })
        fGeo.rotateX(-Math.PI / 2)
        fGeo.translate(0, y, 0)
        const floor = new THREE.Mesh(fGeo, floorMat.clone())
        floor.receiveShadow = true
        floor.renderOrder = 2
        floorMeshes.push(floor)
      }
    }

    return { shells: shellMeshes, floors: floorMeshes }
  }, [data, clipPlane, clipEnabled])

  useLayoutEffect(() => {
    const g = group.current
    if (!g) return
    g.clear()
    for (const m of shells) g.add(m)
    for (const m of floors) g.add(m)
  }, [shells, floors])

  useLayoutEffect(() => {
    const clip = clipEnabled ? [clipPlane] : []
    for (const m of [...shells, ...floors]) {
      const mat = m.material as THREE.MeshStandardMaterial
      mat.clippingPlanes = clip
      mat.needsUpdate = true
    }
  }, [clipEnabled, clipPlane, shells, floors])

  return <group ref={group} />
}

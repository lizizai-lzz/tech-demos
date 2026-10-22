import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { CityData } from '@/lib/types'

const FLOOR_H = 3.5

type Props = {
  data: CityData
  clipPlane: THREE.Plane
  clipEnabled: boolean
  buildingsOnlyClip: boolean
}

function ringToShape(ring: [number, number][]) {
  const shape = new THREE.Shape()
  if (ring.length < 3) return shape
  shape.moveTo(ring[0][0], ring[0][1])
  for (let i = 1; i < ring.length; i++) shape.lineTo(ring[i][0], ring[i][1])
  shape.closePath()
  return shape
}

export function Buildings({ data, clipPlane, clipEnabled, buildingsOnlyClip }: Props) {
  const group = useRef<THREE.Group>(null)

  const { shells, floors } = useMemo(() => {
    const shells: THREE.Mesh[] = []
    const floors: THREE.Mesh[] = []
    const shellMat = new THREE.MeshStandardMaterial({
      color: '#fafafa',
      roughness: 0.55,
      metalness: 0.05,
      clippingPlanes: clipEnabled ? [clipPlane] : [],
      clipShadows: true,
      side: THREE.DoubleSide,
    })

    const floorMat = new THREE.MeshStandardMaterial({
      color: '#e8e8e8',
      roughness: 0.7,
      clippingPlanes: clipEnabled ? [clipPlane] : [],
      clipShadows: true,
    })

    for (const b of data.buildings) {
      if (b.ring.length < 3) continue
      const shape = ringToShape(b.ring)
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: b.height,
        bevelEnabled: false,
      })
      geo.rotateX(-Math.PI / 2)
      geo.translate(0, 0, 0)
      const shell = new THREE.Mesh(geo, shellMat.clone())
      shell.castShadow = true
      shell.receiveShadow = true
      shells.push(shell)

      const levels = Math.max(1, Math.floor(b.height / FLOOR_H))
      for (let lv = 1; lv < levels; lv++) {
        const y = lv * FLOOR_H
        const fGeo = new THREE.ExtrudeGeometry(shape, {
          depth: 0.12,
          bevelEnabled: false,
        })
        fGeo.rotateX(-Math.PI / 2)
        fGeo.translate(0, y, 0)
        const floor = new THREE.Mesh(fGeo, floorMat.clone())
        floor.castShadow = false
        floor.receiveShadow = true
        floors.push(floor)
      }

    }

    return { shells, floors }
  }, [data, clipPlane, clipEnabled])

  useLayoutEffect(() => {
    const g = group.current
    if (!g) return
    g.clear()
    for (const m of shells) g.add(m)
    for (const m of floors) g.add(m)
  }, [shells, floors])

  useLayoutEffect(() => {
    const planes = clipEnabled ? [clipPlane] : []
    const all = [...shells, ...floors]
    for (const m of all) {
      const mat = m.material as THREE.MeshStandardMaterial
      mat.clippingPlanes = buildingsOnlyClip ? planes : planes
      mat.needsUpdate = true
    }
  }, [clipEnabled, clipPlane, buildingsOnlyClip, shells, floors])

  return <group ref={group} />
}

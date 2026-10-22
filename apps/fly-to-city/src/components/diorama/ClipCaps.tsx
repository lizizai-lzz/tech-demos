import { useEffect, useMemo, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import {
  capPlaneMesh,
  createCapMaterial,
  createStencilGroup,
} from '@/lib/stencil-clipping'

type Props = {
  geometries: THREE.BufferGeometry[]
  plane: THREE.Plane
  enabled: boolean
  extentM: number
  maxHeight: number
  strataCap?: boolean
}

export function ClipCaps({
  geometries,
  plane,
  enabled,
  extentM,
  maxHeight,
  strataCap = false,
}: Props) {
  const group = useRef<THREE.Group>(null)
  const capRef = useRef<THREE.Mesh>(null)
  const { gl } = useThree()

  const capMat = useMemo(() => createCapMaterial(3.5, strataCap), [strataCap])

  const stencilGroups = useMemo(() => {
    if (!enabled) return []
    return geometries.map((g) => createStencilGroup(g.clone(), plane, 1))
  }, [geometries, plane, enabled])

  const capMesh = useMemo(() => {
    if (!enabled) return null
    return capPlaneMesh(plane, extentM, maxHeight, capMat, 2)
  }, [plane, extentM, maxHeight, capMat, enabled])

  useEffect(() => {
    gl.autoClearStencil = true
  }, [gl])

  useEffect(() => {
    const g = group.current
    if (!g) return
    g.clear()
    for (const sg of stencilGroups) g.add(sg)
    if (capMesh) {
      capRef.current = capMesh
      g.add(capMesh)
    }
  }, [stencilGroups, capMesh])

  if (!enabled) return null
  return <group ref={group} />
}

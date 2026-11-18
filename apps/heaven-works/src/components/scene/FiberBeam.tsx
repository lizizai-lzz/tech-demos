import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

type Props = {
  from: THREE.Vector3
  to: THREE.Vector3
  color?: string
  radius?: number
  phase?: number
}

/** 粗弧形光绳 — 参考图白色/粉色纤维束 */
export function FiberBeam({
  from,
  to,
  color = '#fce7f3',
  radius = 0.045,
  phase = 0,
}: Props) {
  const meshRef = useRef<THREE.Mesh>(null)

  const { geometry, material } = useMemo(() => {
    const mid = from.clone().lerp(to, 0.5)
    mid.y += 0.35 + Math.sin(phase) * 0.08
    mid.x += (phase % 2) * 0.12 - 0.06
    const curve = new THREE.CatmullRomCurve3([
      from.clone(),
      mid,
      to.clone(),
    ])
    const geo = new THREE.TubeGeometry(curve, 32, radius, 8, false)
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    return { geometry: geo, material: mat }
  }, [from, to, color, radius, phase])

  useFrame(({ clock }) => {
    material.opacity = 0.55 + Math.sin(clock.elapsedTime * 1.8 + phase) * 0.18
  })

  return <mesh ref={meshRef} geometry={geometry} material={material} />
}

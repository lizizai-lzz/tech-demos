import { Suspense, useEffect, useRef } from 'react'
import { useVideoTexture } from '@react-three/drei'
import * as THREE from 'three'
import { HOLOGRAM_VIDEO } from '@/lib/hologramPoints'

export function HologramVideo() {
  return (
    <Suspense fallback={null}>
      <HologramVideoPlane />
    </Suspense>
  )
}

function HologramVideoPlane() {
  const meshRef = useRef<THREE.Mesh>(null)
  const texture = useVideoTexture(HOLOGRAM_VIDEO.src, {
    start: true,
    loop: true,
    muted: true,
    playsInline: true,
    crossOrigin: 'anonymous',
  })

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace
    const el = texture.image as HTMLVideoElement
    el.setAttribute('playsinline', '')
    el.setAttribute('webkit-playsinline', '')
    void el.play().catch(() => {})
  }, [texture])

  const { width, height, position, rotation } = HOLOGRAM_VIDEO

  return (
    <group position={position} rotation={rotation}>
      <mesh ref={meshRef} renderOrder={2}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial
          map={texture}
          transparent
          depthWrite={false}
          toneMapped={false}
          side={THREE.DoubleSide}
          premultipliedAlpha
          blending={THREE.NormalBlending}
        />
      </mesh>
    </group>
  )
}

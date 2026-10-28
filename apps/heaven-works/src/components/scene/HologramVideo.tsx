import { Suspense, useEffect, useRef } from 'react'
import { useVideoTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { HOLOGRAM_VIDEO } from '@/lib/hologramPoints'

/**
 * 黑底 VP9 + AdditiveBlending：避免 Chromium WebGL 对 VP9 alpha 的 premul 错误。
 * 源 alpha 母带：public/hologram-devices.webm；运行时使用 composited 黑底版。
 */
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
  })

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.generateMipmaps = false
    texture.format = THREE.RGBFormat

    const el = texture.image as HTMLVideoElement
    el.setAttribute('playsinline', '')
    el.setAttribute('webkit-playsinline', '')
    void el.play().catch(() => {})
  }, [texture])

  useFrame(() => {
    const el = texture.image as HTMLVideoElement
    if (el && el.readyState >= el.HAVE_CURRENT_DATA) {
      texture.needsUpdate = true
    }
  })

  const { width, height, position, rotation } = HOLOGRAM_VIDEO

  return (
    <group position={position} rotation={rotation}>
      <mesh ref={meshRef} renderOrder={2}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial
          map={texture}
          transparent={false}
          depthWrite={false}
          depthTest
          toneMapped={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          opacity={1}
        />
      </mesh>
    </group>
  )
}

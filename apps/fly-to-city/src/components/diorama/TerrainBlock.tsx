import { useMemo } from 'react'
import * as THREE from 'three'
import type { CityData } from '@/lib/types'

const SLAB_DEPTH = 90

type Props = {
  data: CityData
  clipPlane: THREE.Plane | null
  clipEnabled: boolean
}

const strataSideShader = {
  uniforms: {
    uDepth: { value: SLAB_DEPTH },
    uColors: {
      value: [
        new THREE.Color('#d4b896'),
        new THREE.Color('#c9a882'),
        new THREE.Color('#b5a08a'),
        new THREE.Color('#9a9590'),
      ],
    },
  },
  vertexShader: `
    varying vec3 vPos;
    void main() {
      vPos = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uDepth;
    uniform vec3 uColors[4];
    varying vec3 vPos;
    void main() {
      float y = clamp(-vPos.y, 0.0, uDepth);
      vec3 col = uColors[3];
      if (y < uDepth * 0.2) col = uColors[0];
      else if (y < uDepth * 0.45) col = uColors[1];
      else if (y < uDepth * 0.72) col = uColors[2];
      gl_FragColor = vec4(col, 1.0);
    }
  `,
}

export function TerrainBlock({ data, clipPlane, clipEnabled }: Props) {
  const half = data.extentM / 2

  const topGeometry = useMemo(() => {
    const { gridSize, extentM, terrainHeights, minTerrain, maxTerrain } = data
    const geo = new THREE.PlaneGeometry(extentM, extentM, gridSize - 1, gridSize - 1)
    geo.rotateX(-Math.PI / 2)
    const pos = geo.attributes.position as THREE.BufferAttribute
    const range = Math.max(8, maxTerrain - minTerrain)
    for (let i = 0; i < pos.count; i++) {
      const ix = i % gridSize
      const iz = Math.floor(i / gridSize)
      const h = terrainHeights[iz * gridSize + ix] ?? minTerrain
      const norm = (h - minTerrain) / range
      pos.setY(i, norm * 14)
    }
    pos.needsUpdate = true
    geo.computeVertexNormals()
    return geo
  }, [data])

  const slabGeometry = useMemo(() => {
    const geo = new THREE.BoxGeometry(data.extentM, SLAB_DEPTH, data.extentM)
    return geo
  }, [data.extentM])

  const clip = clipEnabled && clipPlane ? [clipPlane] : []

  const topMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#e2e2de',
        roughness: 0.9,
        metalness: 0.02,
        clippingPlanes: clip,
        clipShadows: true,
      }),
    [clipPlane, clipEnabled],
  )

  const slabMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        ...strataSideShader,
        clippingPlanes: clip,
        clipShadows: true,
      }),
    [clipPlane, clipEnabled],
  )

  const pedestalMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#d4e0e8',
        roughness: 0.94,
        clippingPlanes: clip,
        clipShadows: true,
      }),
    [clipPlane, clipEnabled],
  )

  return (
    <group>
      <mesh geometry={topGeometry} receiveShadow castShadow material={topMat} />
      {/* 浅灰道路网格感 */}
      <mesh geometry={topGeometry} position={[0, 0.08, 0]} receiveShadow>
        <meshBasicMaterial
          color="#efefec"
          wireframe
          transparent
          opacity={0.07}
          clippingPlanes={clip}
        />
      </mesh>
      <mesh
        geometry={slabGeometry}
        position={[0, -SLAB_DEPTH / 2, 0]}
        castShadow
        receiveShadow
        material={slabMat}
      />
      <mesh position={[0, -SLAB_DEPTH - 3, 0]} receiveShadow material={pedestalMat}>
        <boxGeometry args={[data.extentM + 16, 6, data.extentM + 16]} />
      </mesh>
      {/* 侧壁加厚可视边（与 slab 一体，略突出） */}
      <mesh position={[0, -SLAB_DEPTH / 2, -half - 1]} castShadow receiveShadow material={slabMat}>
        <boxGeometry args={[data.extentM + 4, SLAB_DEPTH, 3]} />
      </mesh>
      <mesh position={[0, -SLAB_DEPTH / 2, half + 1]} castShadow receiveShadow material={slabMat}>
        <boxGeometry args={[data.extentM + 4, SLAB_DEPTH, 3]} />
      </mesh>
      <mesh position={[-half - 1, -SLAB_DEPTH / 2, 0]} castShadow receiveShadow material={slabMat}>
        <boxGeometry args={[3, SLAB_DEPTH, data.extentM + 4]} />
      </mesh>
      <mesh position={[half + 1, -SLAB_DEPTH / 2, 0]} castShadow receiveShadow material={slabMat}>
        <boxGeometry args={[3, SLAB_DEPTH, data.extentM + 4]} />
      </mesh>
    </group>
  )
}

export function terrainClipGeometries(data: CityData): THREE.BufferGeometry[] {
  const half = data.extentM / 2
  const slab = new THREE.BoxGeometry(data.extentM, SLAB_DEPTH, data.extentM)
  slab.translate(0, -SLAB_DEPTH / 2, 0)
  const geos: THREE.BufferGeometry[] = [slab]
  const top = new THREE.PlaneGeometry(data.extentM, data.extentM, 8, 8)
  top.rotateX(-Math.PI / 2)
  geos.push(top)
  const rim = new THREE.BoxGeometry(3, SLAB_DEPTH, data.extentM + 4)
  rim.translate(half + 1, -SLAB_DEPTH / 2, 0)
  geos.push(rim.clone())
  return geos
}

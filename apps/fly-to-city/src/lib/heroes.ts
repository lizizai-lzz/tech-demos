import * as THREE from 'three'
import { lngLatToLocal } from './geo'

export type HeroKind =
  | 'pearl'
  | 'shanghai-tower'
  | 'swfc'
  | 'jinmao'
  | 'twin'
  | 'cocoon'
  | 'eiffel'
  | 'opera'
  | 'mbs'
  | 'ifc'
  | 'zun'
  | 'empire'

type HeroDef = { kind: HeroKind; lng: number; lat: number; h: number }

const BY_CITY: Record<string, HeroDef[]> = {
  'shanghai-lujiazui': [
    { kind: 'pearl', lng: 121.49958, lat: 31.23969, h: 468 },
    { kind: 'shanghai-tower', lng: 121.50557, lat: 31.23351, h: 632 },
    { kind: 'swfc', lng: 121.50788, lat: 31.23439, h: 492 },
    { kind: 'jinmao', lng: 121.50545, lat: 31.23535, h: 421 },
  ],
  'tokyo-shinjuku': [
    { kind: 'twin', lng: 139.69172, lat: 35.6895, h: 243 },
    { kind: 'cocoon', lng: 139.6972, lat: 35.6917, h: 204 },
  ],
  'paris-eiffel': [{ kind: 'eiffel', lng: 2.29448, lat: 48.85837, h: 330 }],
  'sydney-opera': [{ kind: 'opera', lng: 151.2153, lat: -33.85678, h: 65 }],
  'singapore-marina-bay': [{ kind: 'mbs', lng: 103.8607, lat: 1.2834, h: 200 }],
  'hongkong-central': [{ kind: 'ifc', lng: 114.1577, lat: 22.285, h: 415 }],
  'beijing-cbd': [{ kind: 'zun', lng: 116.4619, lat: 39.9116, h: 528 }],
  'nyc-midtown': [{ kind: 'empire', lng: -73.9857, lat: 40.7484, h: 443 }],
}

const white = () =>
  new THREE.MeshStandardMaterial({ color: '#f4f2ee', roughness: 0.48, metalness: 0.03 })

function box(w: number, h: number, d: number, x: number, y: number, z: number, mat: THREE.Material) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
  m.position.set(x, y, z)
  m.castShadow = true
  m.receiveShadow = true
  return m
}

function sphere(r: number, x: number, y: number, z: number, mat: THREE.Material, sy = 1) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), mat)
  m.position.set(x, y, z)
  m.scale.y = sy
  m.castShadow = true
  m.receiveShadow = true
  return m
}

function addEdges(mesh: THREE.Mesh, group: THREE.Group) {
  const e = new THREE.LineSegments(
    new THREE.EdgesGeometry(mesh.geometry, 18),
    new THREE.LineBasicMaterial({ color: '#b7b1a8' }),
  )
  e.position.copy(mesh.position)
  e.rotation.copy(mesh.rotation)
  e.scale.copy(mesh.scale)
  group.add(e)
}

function buildKind(kind: HeroKind, h: number, mat: THREE.Material) {
  const g = new THREE.Group()
  if (kind === 'pearl') {
    g.add(box(18, h, 18, 0, h / 2, 0, mat))
    g.add(sphere(52, 0, h * 0.28, 0, mat))
    g.add(sphere(34, 0, h * 0.55, 0, mat))
    g.add(sphere(20, 0, h * 0.8, 0, mat))
    g.add(sphere(11, 0, h * 0.95, 0, mat))
  } else if (kind === 'shanghai-tower') {
    const steps = 28
    for (let i = 0; i < steps; i++) {
      const t = i / steps
      const w = 78 * (1 - t * 0.62)
      const m = box(w, h / steps + 0.4, w, 0, (i + 0.5) * (h / steps), 0, mat)
      m.rotation.y = t * Math.PI * 1.15
      g.add(m)
    }
  } else if (kind === 'swfc') {
    const steps = 18
    for (let i = 0; i < steps; i++) {
      const t = i / steps
      const w = 70 * (1 - t * 0.35)
      const d = 58 * (1 - t * 0.15)
      g.add(box(w, h / steps + 0.2, d, 0, (i + 0.5) * (h / steps), 0, mat))
    }
    const hole = new THREE.Mesh(
      new THREE.BoxGeometry(22, 28, 70),
      new THREE.MeshStandardMaterial({ color: '#9ec8de', roughness: 0.3, metalness: 0.1 }),
    )
    hole.position.set(0, h * 0.78, 0)
    g.add(hole)
  } else if (kind === 'jinmao') {
    let y = 0
    for (let i = 0; i < 13; i++) {
      const t = i / 13
      const w = 62 * (1 - t * 0.72)
      const tier = 18 + (1 - t) * 10
      g.add(box(w, tier, w, 0, y + tier / 2, 0, mat))
      y += tier
    }
    g.add(box(10, h - y, 10, 0, y + (h - y) / 2, 0, mat))
  } else if (kind === 'twin') {
    g.add(box(48, h, 48, -46, h / 2, 0, mat))
    g.add(box(48, h, 48, 46, h / 2, 0, mat))
    g.add(box(140, 18, 40, 0, 28, 0, mat))
  } else if (kind === 'cocoon') {
    g.add(sphere(36, 0, h * 0.48, 0, mat, h / 70))
  } else if (kind === 'eiffel') {
    const leg = (x: number, z: number) => {
      const m = box(12, h * 0.72, 12, x * 0.55, h * 0.36, z * 0.55, mat)
      m.rotation.z = x > 0 ? -0.12 : 0.12
      m.rotation.x = z > 0 ? 0.12 : -0.12
      g.add(m)
    }
    leg(-40, -40)
    leg(40, -40)
    leg(-40, 40)
    leg(40, 40)
    g.add(box(70, 6, 70, 0, h * 0.28, 0, mat))
    g.add(box(36, 6, 36, 0, h * 0.58, 0, mat))
    g.add(box(8, h * 0.28, 8, 0, h * 0.86, 0, mat))
  } else if (kind === 'opera') {
    g.add(sphere(48, -20, 28, 0, mat, 0.55))
    g.add(sphere(40, 18, 24, 8, mat, 0.5))
    g.add(sphere(30, 8, 20, -16, mat, 0.48))
  } else if (kind === 'mbs') {
    g.add(box(42, h, 42, -70, h / 2, 0, mat))
    g.add(box(42, h, 42, 0, h / 2, 0, mat))
    g.add(box(42, h, 42, 70, h / 2, 0, mat))
    g.add(box(200, 16, 48, 0, h + 8, 0, mat))
  } else if (kind === 'ifc') {
    g.add(box(62, h * 0.86, 62, 0, h * 0.43, 0, mat))
    g.add(box(28, h * 0.16, 28, 0, h * 0.92, 0, mat))
  } else if (kind === 'zun') {
    const steps = 16
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1)
      const w = 48 + Math.sin(t * Math.PI) * -18 + (t > 0.82 ? (t - 0.82) * 80 : 0)
      g.add(box(Math.max(22, w), h / steps, Math.max(22, w), 0, (i + 0.5) * (h / steps), 0, mat))
    }
  } else if (kind === 'empire') {
    let y = 0
    const tiers = [78, 64, 50, 36, 22, 12]
    tiers.forEach((w, i) => {
      const th = h * (i === 0 ? 0.42 : 0.08)
      g.add(box(w, th, w * 0.7, 0, y + th / 2, 0, mat))
      y += th
    })
    g.add(box(6, h - y, 6, 0, y + (h - y) / 2, 0, mat))
  }
  g.traverse((obj) => {
    if (obj instanceof THREE.Mesh) addEdges(obj, g)
  })
  return g
}

export function heroFocus(cityId: string, centerLng: number, centerLat: number) {
  const list = BY_CITY[cityId]
  if (!list?.length) return new THREE.Vector3(0, 140, 0)
  let x = 0
  let z = 0
  for (const hero of list) {
    const p = lngLatToLocal(hero.lng, hero.lat, centerLng, centerLat)
    x += p[0]
    z += p[1]
  }
  return new THREE.Vector3(x / list.length, 150, z / list.length)
}

export function createHeroGroup(cityId: string, centerLng: number, centerLat: number) {
  const group = new THREE.Group()
  const list = BY_CITY[cityId] ?? []
  const mat = white()
  for (const hero of list) {
    const [x, z] = lngLatToLocal(hero.lng, hero.lat, centerLng, centerLat)
    const piece = buildKind(hero.kind, hero.h, mat)
    piece.position.set(x, 0, z)
    group.add(piece)
  }
  return group
}

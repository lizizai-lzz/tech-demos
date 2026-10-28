import * as THREE from 'three'

type RGB = [number, number, number]

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

/** 竖直平面（Y–Z 平面，固定 X）上的线框采样 — 设备「立」在网格上 */
function sampleEdge(
  ax: number,
  ay: number,
  az: number,
  bx: number,
  by: number,
  bz: number,
  step: number,
  positions: number[],
  colors: number[],
  color: RGB,
  jitter = 0.006,
) {
  const dx = bx - ax
  const dy = by - ay
  const dz = bz - az
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz)
  const n = Math.max(2, Math.floor(len / step))
  for (let i = 0; i <= n; i++) {
    const t = i / n
    positions.push(
      lerp(ax, bx, t) + (Math.random() - 0.5) * jitter,
      lerp(ay, by, t) + (Math.random() - 0.5) * jitter,
      lerp(az, bz, t) + (Math.random() - 0.5) * jitter,
    )
    colors.push(color[0], color[1], color[2])
  }
}

function sampleDeviceFrameYZ(
  x: number,
  yBase: number,
  zCenter: number,
  height: number,
  widthZ: number,
  step: number,
  positions: number[],
  colors: number[],
  color: RGB,
) {
  const y0 = yBase
  const y1 = yBase + height
  const z0 = zCenter - widthZ / 2
  const z1 = zCenter + widthZ / 2
  sampleEdge(x, y0, z0, x, y1, z0, step, positions, colors, color)
  sampleEdge(x, y1, z0, x, y1, z1, step, positions, colors, color)
  sampleEdge(x, y1, z1, x, y0, z1, step, positions, colors, color)
  sampleEdge(x, y0, z1, x, y0, z0, step, positions, colors, color)
}

function sampleScreenFillYZ(
  x: number,
  yBase: number,
  zCenter: number,
  height: number,
  widthZ: number,
  step: number,
  positions: number[],
  colors: number[],
  color: RGB,
  density = 0.32,
) {
  const y0 = yBase + height * 0.08
  const y1 = yBase + height * 0.92
  const z0 = zCenter - widthZ * 0.42
  const z1 = zCenter + widthZ * 0.42
  for (let y = y0; y <= y1; y += step * 1.8) {
    for (let z = z0; z <= z1; z += step * 1.8) {
      if (Math.random() > density) continue
      positions.push(x + (Math.random() - 0.5) * 0.01, y, z)
      const dim = 0.55 + Math.random() * 0.45
      colors.push(color[0] * dim, color[1] * dim, color[2] * dim)
    }
  }
}

const CYAN: RGB = [0.75, 0.95, 1]
const EMERALD: RGB = [0.2, 0.95, 0.55]
const GOLD: RGB = [1, 0.78, 0.25]
const MAGENTA: RGB = [0.95, 0.35, 0.85]
const WHITE: RGB = [0.92, 0.96, 1]

/** 底部直立设备全息 + 地面粒子雾（桌面 / 平板 / 手机） */
export function buildHologramPointCloud(maxPoints = 9500) {
  const positions: number[] = []
  const colors: number[] = []
  const step = 0.055

  // 桌面显示器（大，居中）
  sampleDeviceFrameYZ(0, 0.12, 0, 1.85, 2.05, step, positions, colors, CYAN)
  sampleDeviceFrameYZ(0.02, 1.72, 0, 0.18, 1.85, step * 0.9, positions, colors, WHITE)
  sampleScreenFillYZ(0.015, 0.2, 0, 1.55, 1.85, step, positions, colors, CYAN, 0.38)
  sampleEdge(-0.02, 0.12, -0.35, -0.02, 0.02, -0.08, step, positions, colors, WHITE)
  sampleEdge(-0.02, 0.12, 0.35, -0.02, 0.02, 0.08, step, positions, colors, WHITE)

  // 平板（右侧）
  sampleDeviceFrameYZ(1.55, 0.1, -0.15, 1.35, 0.95, step, positions, colors, CYAN)
  sampleScreenFillYZ(1.555, 0.18, -0.15, 1.15, 0.82, step, positions, colors, CYAN, 0.3)

  // 手机（更右）
  sampleDeviceFrameYZ(2.35, 0.08, 0.12, 1.05, 0.42, step, positions, colors, MAGENTA)
  sampleScreenFillYZ(2.355, 0.15, 0.12, 0.9, 0.34, step, positions, colors, MAGENTA, 0.35)

  // 底座粒子雾 — 翡翠 / 金 / 品红
  for (let i = 0; i < 2200; i++) {
    const x = (Math.random() - 0.5) * 3.2 + 0.6
    const y = Math.random() * 0.35
    const z = (Math.random() - 0.5) * 1.8
    positions.push(x, y, z)
    const pick = Math.random()
    const c = pick < 0.4 ? EMERALD : pick < 0.7 ? GOLD : MAGENTA
    const f = 0.35 + Math.random() * 0.55
    colors.push(c[0] * f, c[1] * f, c[2] * f)
  }

  return downsample(positions, colors, maxPoints)
}

function downsample(positions: number[], colors: number[], maxPoints: number) {
  const count = positions.length / 3
  if (count <= maxPoints) {
    return {
      positions: new Float32Array(positions),
      colors: new Float32Array(colors),
    }
  }
  const stride = Math.ceil(count / maxPoints)
  const p: number[] = []
  const c: number[] = []
  for (let i = 0; i < count; i += stride) {
    p.push(positions[i * 3]!, positions[i * 3 + 1]!, positions[i * 3 + 2]!)
    c.push(colors[i * 3]!, colors[i * 3 + 1]!, colors[i * 3 + 2]!)
  }
  return { positions: new Float32Array(p), colors: new Float32Array(c) }
}

export function makeHologramGeometry(maxPoints = 9500) {
  const { positions, colors } = buildHologramPointCloud(maxPoints)
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  return geo
}

export type AgentAnchor = {
  id: string
  code: string
  label: string
  position: THREE.Vector3
  kind: 'drone' | 'camera' | 'sensor' | 'relay'
}

const AGENT_META = [
  { code: 'CODE_SMITH', kind: 'relay' as const },
  { code: 'RESEARCH', kind: 'camera' as const },
  { code: 'BUILDER', kind: 'drone' as const },
  { code: 'REVIEWER', kind: 'sensor' as const },
  { code: 'DESIGNER', kind: 'camera' as const },
  { code: 'SEO_WEAVE', kind: 'relay' as const },
  { code: 'RESPONSIVE', kind: 'drone' as const },
  { code: 'DELIVER', kind: 'sensor' as const },
]

export function agentAnchors(): AgentAnchor[] {
  const anchors: AgentAnchor[] = []
  const radius = 1.55
  const y = 4.15
  const hubZ = -0.35
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2
    const meta = AGENT_META[i]!
    anchors.push({
      id: `U0${i + 1}`,
      code: meta.code,
      label: `U0${i + 1} ${meta.code.split('_')[0]}`,
      kind: meta.kind,
      position: new THREE.Vector3(
        Math.cos(a) * radius,
        y + Math.sin(i) * 0.06,
        hubZ + Math.sin(a) * radius * 0.45,
      ),
    })
  }
  return anchors
}

export const HUB_POSITION = new THREE.Vector3(0, 4.55, -0.35)

export function stageCardWorldPositions(): THREE.Vector3[] {
  const cards: THREE.Vector3[] = []
  const startX = -3.05
  const spacing = 0.82
  const y = 2.55
  const z = -0.05
  for (let i = 0; i < 8; i++) {
    cards.push(new THREE.Vector3(startX + i * spacing, y, z))
  }
  return cards
}

/** 全息设备上的光束落点（世界坐标，与 buildHologram 布局一致） */
export const HOLOGRAM_BEAM_TARGETS: THREE.Vector3[] = [
  new THREE.Vector3(0.02, 1.2, -0.5),
  new THREE.Vector3(0.02, 1.55, 0.35),
  new THREE.Vector3(0.02, 0.75, 0.2),
  new THREE.Vector3(0.02, 0.45, -0.25),
  new THREE.Vector3(0.02, 1.35, 0.55),
  new THREE.Vector3(1.55, 0.95, -0.35),
  new THREE.Vector3(2.35, 0.7, 0.05),
  new THREE.Vector3(0.02, 0.25, 0.1),
]

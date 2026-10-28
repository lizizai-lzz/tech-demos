import * as THREE from 'three'

type RGB = [number, number, number]

/** 与粒子/线框共享的设备布局（世界坐标，屏面朝向 +Z） */
export const DEVICE_LAYOUT = {
  desktop: { cx: -1.2, y0: 0.38, w: 2.35, h: 1.48, z: 0.1, depth: 0.065 },
  tablet: { cx: 0.9, y0: 0.12, w: 0.72, h: 1.38, z: 0.11, depth: 0.055, radius: 0.08 },
  phone: { cx: 2.1, y0: 0.1, w: 0.3, h: 1.02, z: 0.12, depth: 0.05, radius: 0.05 },
} as const

export const HOLOGRAM_GROUP_TILT_Y = 0.06

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

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
  jitter = 0.003,
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

function sampleRectXY(
  z: number,
  yBase: number,
  xCenter: number,
  height: number,
  widthX: number,
  step: number,
  positions: number[],
  colors: number[],
  color: RGB,
) {
  const x0 = xCenter - widthX / 2
  const x1 = xCenter + widthX / 2
  const y0 = yBase
  const y1 = yBase + height
  sampleEdge(x0, y0, z, x1, y0, z, step, positions, colors, color)
  sampleEdge(x1, y0, z, x1, y1, z, step, positions, colors, color)
  sampleEdge(x1, y1, z, x0, y1, z, step, positions, colors, color)
  sampleEdge(x0, y1, z, x0, y0, z, step, positions, colors, color)
}

function sampleRoundedRectXY(
  z: number,
  yBase: number,
  xCenter: number,
  height: number,
  widthX: number,
  radius: number,
  step: number,
  positions: number[],
  colors: number[],
  color: RGB,
) {
  const hw = widthX / 2
  const hh = height
  const r = Math.min(radius, hw * 0.4, hh * 0.15)
  const x0 = xCenter - hw
  const x1 = xCenter + hw
  const y0 = yBase
  const y1 = yBase + height
  sampleEdge(x0 + r, y0, z, x1 - r, y0, z, step, positions, colors, color)
  sampleEdge(x1, y0 + r, z, x1, y1 - r, z, step, positions, colors, color)
  sampleEdge(x1 - r, y1, z, x0 + r, y1, z, step, positions, colors, color)
  sampleEdge(x0, y1 - r, z, x0, y0 + r, z, step, positions, colors, color)
  const segs = 6
  const corners: [number, number, number, number][] = [
    [x1 - r, y0 + r, 0, Math.PI / 2],
    [x1 - r, y1 - r, Math.PI / 2, Math.PI],
    [x0 + r, y1 - r, Math.PI, (3 * Math.PI) / 2],
    [x0 + r, y0 + r, (3 * Math.PI) / 2, Math.PI * 2],
  ]
  for (const [cx, cy, a0, a1] of corners) {
    for (let i = 0; i <= segs; i++) {
      const t = i / segs
      const a = a0 + (a1 - a0) * t
      positions.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r, z)
      colors.push(color[0], color[1], color[2])
    }
  }
}

function sampleFillXY(
  z: number,
  yBase: number,
  xCenter: number,
  height: number,
  widthX: number,
  step: number,
  positions: number[],
  colors: number[],
  color: RGB,
  density = 0.45,
) {
  const x0 = xCenter - widthX * 0.42
  const x1 = xCenter + widthX * 0.42
  const y0 = yBase + height * 0.12
  const y1 = yBase + height * 0.88
  for (let y = y0; y <= y1; y += step * 1.2) {
    for (let x = x0; x <= x1; x += step * 1.2) {
      if (Math.random() > density) continue
      positions.push(x, y, z + (Math.random() - 0.5) * 0.006)
      const dim = 0.55 + Math.random() * 0.45
      colors.push(color[0] * dim, color[1] * dim, color[2] * dim)
    }
  }
}

function doubleBezelParticles(
  layout: { cx: number; y0: number; w: number; h: number; z: number; depth: number },
  step: number,
  positions: number[],
  colors: number[],
  color: RGB,
  rounded = 0,
) {
  if (rounded > 0) {
    sampleRoundedRectXY(layout.z, layout.y0, layout.cx, layout.h, layout.w, rounded, step, positions, colors, color)
    sampleRoundedRectXY(
      layout.z - layout.depth,
      layout.y0,
      layout.cx,
      layout.h,
      layout.w,
      rounded,
      step * 1.1,
      positions,
      colors,
      [color[0] * 0.5, color[1] * 0.5, color[2] * 0.5],
    )
  } else {
    sampleRectXY(layout.z, layout.y0, layout.cx, layout.h, layout.w, step, positions, colors, color)
    sampleRectXY(
      layout.z - layout.depth,
      layout.y0,
      layout.cx,
      layout.h,
      layout.w * 0.98,
      step * 1.1,
      positions,
      colors,
      [color[0] * 0.55, color[1] * 0.55, color[2] * 0.55],
    )
  }
}

const CYAN: RGB = [0.78, 0.97, 1]
const EMERALD: RGB = [0.22, 0.95, 0.55]
const GOLD: RGB = [1, 0.8, 0.28]
const MAGENTA: RGB = [0.95, 0.4, 0.88]
const WHITE: RGB = [0.96, 0.99, 1]

export function buildDevicePointCloud() {
  const positions: number[] = []
  const colors: number[] = []
  const step = 0.03
  const d = DEVICE_LAYOUT.desktop
  const t = DEVICE_LAYOUT.tablet
  const p = DEVICE_LAYOUT.phone

  // —— 桌面显示器 ——
  doubleBezelParticles(d, step, positions, colors, WHITE)
  const innerW = d.w * 0.9
  const innerH = d.h * 0.82
  const innerY = d.y0 + d.h * 0.12
  sampleRectXY(d.z + 0.008, innerY, d.cx, innerH, innerW, step * 0.9, positions, colors, CYAN)
  // 浏览器 chrome
  const chromeH = 0.16
  sampleRectXY(d.z + 0.01, d.y0 + d.h - chromeH - 0.04, d.cx, chromeH, innerW, step * 0.85, positions, colors, WHITE)
  for (let i = 0; i < 5; i++) {
    positions.push(d.cx - innerW * 0.38 + i * 0.07, d.y0 + d.h - chromeH * 0.45, d.z + 0.012)
    colors.push(1, 0.3 + i * 0.1, 0.35)
  }
  sampleEdge(d.cx - innerW * 0.15, d.y0 + d.h - chromeH * 0.55, d.z + 0.012, d.cx + innerW * 0.35, d.y0 + d.h - chromeH * 0.55, d.z + 0.012, step, positions, colors, WHITE)
  sampleFillXY(d.z + 0.012, innerY, d.cx, innerH * 0.85, innerW * 0.88, step, positions, colors, CYAN, 0.42)
  // 页面线框块
  sampleRectXY(d.z + 0.015, innerY + innerH * 0.55, d.cx - innerW * 0.22, innerH * 0.28, innerW * 0.38, step, positions, colors, GOLD)
  sampleRectXY(d.z + 0.015, innerY + innerH * 0.55, d.cx + innerW * 0.22, innerH * 0.28, innerW * 0.38, step, positions, colors, MAGENTA)
  sampleRectXY(d.z + 0.015, innerY + innerH * 0.08, d.cx, innerH * 0.22, innerW * 0.75, step, positions, colors, WHITE)
  // 支架 + 底座
  sampleEdge(d.cx, d.y0, d.z, d.cx, 0.06, d.z - 0.02, step, positions, colors, WHITE)
  sampleRectXY(d.z - 0.03, 0.0, d.cx, 0.05, 0.55, step, positions, colors, WHITE)

  // —— 平板 ——
  doubleBezelParticles(t, step, positions, colors, CYAN, t.radius)
  sampleFillXY(t.z + 0.01, t.y0 + t.h * 0.08, t.cx, t.h * 0.84, t.w * 0.82, step, positions, colors, CYAN, 0.4)

  // —— 手机 ——
  doubleBezelParticles(p, step, positions, colors, MAGENTA, p.radius)
  sampleFillXY(p.z + 0.01, p.y0 + p.h * 0.1, p.cx, p.h * 0.78, p.w * 0.78, step, positions, colors, MAGENTA, 0.45)
  // 刘海
  sampleRectXY(p.z + 0.012, p.y0 + p.h - 0.08, p.cx, 0.055, p.w * 0.42, step * 0.9, positions, colors, WHITE)

  return { positions: new Float32Array(positions), colors: new Float32Array(colors) }
}

export function buildMistPointCloud(count = 650) {
  const positions: number[] = []
  const colors: number[] = []
  const feet = [
    { cx: DEVICE_LAYOUT.desktop.cx, spread: 1.4 },
    { cx: DEVICE_LAYOUT.tablet.cx, spread: 0.45 },
    { cx: DEVICE_LAYOUT.phone.cx, spread: 0.28 },
  ]
  for (let i = 0; i < count; i++) {
    const foot = feet[i % 3]!
    const x = foot.cx + (Math.random() - 0.5) * foot.spread
    const y = Math.random() * 0.14
    const z = (Math.random() - 0.5) * 0.12
    positions.push(x, y, z)
    const pick = Math.random()
    const c = pick < 0.38 ? EMERALD : pick < 0.72 ? GOLD : MAGENTA
    const f = 0.28 + Math.random() * 0.45
    colors.push(c[0] * f, c[1] * f, c[2] * f)
  }
  return { positions: new Float32Array(positions), colors: new Float32Array(colors) }
}

export type LineLoop = {
  points: THREE.Vector3[]
  color: string
}

function rectPoints(
  cx: number,
  y0: number,
  w: number,
  h: number,
  z: number,
): THREE.Vector3[] {
  const hw = w / 2
  return [
    new THREE.Vector3(cx - hw, y0, z),
    new THREE.Vector3(cx + hw, y0, z),
    new THREE.Vector3(cx + hw, y0 + h, z),
    new THREE.Vector3(cx - hw, y0 + h, z),
    new THREE.Vector3(cx - hw, y0, z),
  ]
}

/** 锐利的 emissive 线框（叠在粒子上） */
export function buildDeviceLineLoops(): LineLoop[] {
  const loops: LineLoop[] = []
  const d = DEVICE_LAYOUT.desktop
  const t = DEVICE_LAYOUT.tablet
  const p = DEVICE_LAYOUT.phone

  loops.push({ points: rectPoints(d.cx, d.y0, d.w, d.h, d.z), color: '#ffffff' })
  loops.push({
    points: rectPoints(d.cx, d.y0, d.w, d.h, d.z - d.depth),
    color: '#94a3b8',
  })
  loops.push({
    points: [
      new THREE.Vector3(d.cx, d.y0, d.z),
      new THREE.Vector3(d.cx, 0.06, d.z - 0.02),
      new THREE.Vector3(d.cx - 0.28, 0, d.z - 0.03),
      new THREE.Vector3(d.cx + 0.28, 0, d.z - 0.03),
      new THREE.Vector3(d.cx, 0, d.z - 0.03),
      new THREE.Vector3(d.cx, 0.06, d.z - 0.02),
    ],
    color: '#e2e8f0',
  })

  loops.push({ points: rectPoints(t.cx, t.y0, t.w, t.h, t.z), color: '#bae6fd' })
  loops.push({
    points: rectPoints(t.cx, t.y0, t.w, t.h, t.z - t.depth),
    color: '#64748b',
  })

  loops.push({ points: rectPoints(p.cx, p.y0, p.w, p.h, p.z), color: '#f0abfc' })
  loops.push({
    points: rectPoints(p.cx, p.y0, p.w, p.h, p.z - p.depth),
    color: '#a855f7',
  })

  return loops
}

export function makeDeviceGeometry() {
  const { positions, colors } = buildDevicePointCloud()
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  return geo
}

export function makeMistGeometry() {
  const { positions, colors } = buildMistPointCloud()
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  return geo
}

export function makeHologramGeometry() {
  return makeDeviceGeometry()
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

const d = DEVICE_LAYOUT.desktop
const t = DEVICE_LAYOUT.tablet
const p = DEVICE_LAYOUT.phone

export const HOLOGRAM_BEAM_TARGETS: THREE.Vector3[] = [
  new THREE.Vector3(d.cx - 0.55, d.y0 + 1.05, d.z + 0.02),
  new THREE.Vector3(d.cx - 0.15, d.y0 + 1.25, d.z + 0.02),
  new THREE.Vector3(d.cx + 0.45, d.y0 + 0.95, d.z + 0.02),
  new THREE.Vector3(d.cx, d.y0 + 0.55, d.z + 0.02),
  new THREE.Vector3(d.cx + 0.2, d.y0 + 1.35, d.z + 0.02),
  new THREE.Vector3(t.cx, t.y0 + 0.75, t.z + 0.02),
  new THREE.Vector3(p.cx, p.y0 + 0.62, p.z + 0.02),
  new THREE.Vector3(d.cx - 0.35, d.y0 + 0.35, d.z + 0.02),
]

export const HOLOGRAM_ANCHOR = new THREE.Vector3(0.3, 0.75, 0)

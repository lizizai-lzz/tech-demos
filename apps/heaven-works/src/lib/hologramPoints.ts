import * as THREE from 'three'

type RGB = [number, number, number]

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
  jitter = 0.004,
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

/** 设备屏面在 X–Y 平面，法线朝向 +Z（面向默认相机） */
function sampleDeviceFrameXY(
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

function sampleScreenFillXY(
  z: number,
  yBase: number,
  xCenter: number,
  height: number,
  widthX: number,
  step: number,
  positions: number[],
  colors: number[],
  color: RGB,
  density = 0.42,
) {
  const x0 = xCenter - widthX * 0.44
  const x1 = xCenter + widthX * 0.44
  const y0 = yBase + height * 0.1
  const y1 = yBase + height * 0.88
  for (let y = y0; y <= y1; y += step * 1.4) {
    for (let x = x0; x <= x1; x += step * 1.4) {
      if (Math.random() > density) continue
      positions.push(x, y, z + (Math.random() - 0.5) * 0.008)
      const dim = 0.5 + Math.random() * 0.5
      colors.push(color[0] * dim, color[1] * dim, color[2] * dim)
    }
  }
}

const CYAN: RGB = [0.72, 0.96, 1]
const EMERALD: RGB = [0.25, 0.95, 0.58]
const GOLD: RGB = [1, 0.82, 0.28]
const MAGENTA: RGB = [0.96, 0.38, 0.88]
const WHITE: RGB = [0.95, 0.98, 1]

/** 桌面 / 平板 / 手机 — 面向相机的直立线框 */
export function buildDevicePointCloud() {
  const positions: number[] = []
  const colors: number[] = []
  const step = 0.038

  const deskZ = 0.06
  const deskX = -0.15
  const deskW = 3.05
  const deskH = 1.95

  // 大显示器 + 浏览器顶栏
  sampleDeviceFrameXY(deskZ, 0.02, deskX, deskH, deskW, step, positions, colors, CYAN)
  sampleDeviceFrameXY(deskZ + 0.01, 1.62, deskX, 0.22, deskW * 0.96, step * 0.85, positions, colors, WHITE)
  sampleScreenFillXY(deskZ + 0.015, 0.12, deskX, 1.45, deskW * 0.92, step, positions, colors, CYAN, 0.5)
  // 页面区块线框
  sampleDeviceFrameXY(deskZ + 0.02, 0.85, deskX - 0.75, 0.45, 1.05, step, positions, colors, GOLD)
  sampleDeviceFrameXY(deskZ + 0.02, 0.85, deskX + 0.55, 0.45, 1.35, step, positions, colors, MAGENTA)
  sampleDeviceFrameXY(deskZ + 0.02, 0.22, deskX, 0.38, deskW * 0.9, step, positions, colors, WHITE)
  // 支架
  sampleEdge(deskX - 0.15, 0.02, deskZ, deskX - 0.15, 0.0, deskZ - 0.06, step, positions, colors, WHITE)
  sampleEdge(deskX + 0.15, 0.02, deskZ, deskX + 0.15, 0.0, deskZ - 0.06, step, positions, colors, WHITE)
  sampleEdge(deskX - 0.35, 0.0, deskZ - 0.06, deskX + 0.35, 0.0, deskZ - 0.06, step, positions, colors, WHITE)

  // 平板（中右，竖屏）
  const tabZ = 0.08
  const tabX = 1.85
  const tabW = 0.78
  const tabH = 1.28
  sampleDeviceFrameXY(tabZ, 0.04, tabX, tabH, tabW, step, positions, colors, CYAN)
  sampleScreenFillXY(tabZ + 0.012, 0.1, tabX, tabH * 0.88, tabW * 0.88, step, positions, colors, CYAN, 0.45)

  // 手机（右侧，窄竖屏）
  const phZ = 0.1
  const phX = 2.75
  const phW = 0.36
  const phH = 1.05
  sampleDeviceFrameXY(phZ, 0.05, phX, phH, phW, step, positions, colors, MAGENTA)
  sampleScreenFillXY(phZ + 0.012, 0.12, phX, phH * 0.86, phW * 0.82, step, positions, colors, MAGENTA, 0.48)

  return { positions: new Float32Array(positions), colors: new Float32Array(colors) }
}

/** 设备脚下的多色雾（低 Y，不遮挡屏面） */
export function buildMistPointCloud(count = 900) {
  const positions: number[] = []
  const colors: number[] = []
  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * 3.8 + 0.5
    const y = Math.random() * 0.22
    const z = (Math.random() - 0.5) * 0.35
    positions.push(x, y, z)
    const pick = Math.random()
    const c = pick < 0.38 ? EMERALD : pick < 0.72 ? GOLD : MAGENTA
    const f = 0.3 + Math.random() * 0.5
    colors.push(c[0] * f, c[1] * f, c[2] * f)
  }
  return { positions: new Float32Array(positions), colors: new Float32Array(colors) }
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

/** @deprecated 合并几何；请用 makeDeviceGeometry + makeMistGeometry */
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

/** 全息组整体微倾 (~12°) 后的落点 — 与 buildDevicePointCloud 布局一致 */
export const HOLOGRAM_GROUP_TILT_Y = 0.2

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

/** 光束落在设备屏面 (X,Y, 靠近 +Z) */
export const HOLOGRAM_BEAM_TARGETS: THREE.Vector3[] = [
  new THREE.Vector3(-1.05, 1.25, 0.09), // 导航 → 桌面左栏
  new THREE.Vector3(-0.35, 1.55, 0.09), // 品牌
  new THREE.Vector3(0.55, 1.05, 0.09), // 产品卡
  new THREE.Vector3(0.2, 0.42, 0.09), // 首页区块
  new THREE.Vector3(0.45, 1.48, 0.09), // SEO 顶栏区
  new THREE.Vector3(1.85, 0.82, 0.11), // 平板
  new THREE.Vector3(2.75, 0.68, 0.12), // 手机
  new THREE.Vector3(-0.5, 0.28, 0.09), // 表单
]

export const HOLOGRAM_ANCHOR = new THREE.Vector3(0.4, 0.5, 0)

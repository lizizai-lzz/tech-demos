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
  jitter = 0.008,
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

function sampleRectFrame(
  cx: number,
  cy: number,
  cz: number,
  w: number,
  h: number,
  step: number,
  positions: number[],
  colors: number[],
  color: RGB,
) {
  const hw = w / 2
  const hh = h / 2
  const z = cz
  sampleEdge(cx - hw, cy - hh, z, cx + hw, cy - hh, z, step, positions, colors, color)
  sampleEdge(cx + hw, cy - hh, z, cx + hw, cy + hh, z, step, positions, colors, color)
  sampleEdge(cx + hw, cy + hh, z, cx - hw, cy + hh, z, step, positions, colors, color)
  sampleEdge(cx - hw, cy + hh, z, cx - hw, cy - hh, z, step, positions, colors, color)
}

function sampleFillGrid(
  cx: number,
  cy: number,
  cz: number,
  w: number,
  h: number,
  step: number,
  positions: number[],
  colors: number[],
  color: RGB,
  density = 0.35,
) {
  const hw = w / 2
  const hh = h / 2
  for (let x = -hw; x <= hw; x += step * 2) {
    for (let y = -hh; y <= hh; y += step * 2) {
      if (Math.random() > density) continue
      positions.push(cx + x, cy + y, cz + (Math.random() - 0.5) * 0.02)
      const dim = 0.65 + Math.random() * 0.35
      colors.push(color[0] * dim, color[1] * dim, color[2] * dim)
    }
  }
}

const CYAN: RGB = [0.2, 0.95, 1]
const MAGENTA: RGB = [0.95, 0.35, 0.98]
const YELLOW: RGB = [1, 0.85, 0.2]
const WHITE: RGB = [0.85, 0.95, 1]

/** 生成网站线框粒子点云（桌面 + 平板 + 手机） */
export function buildHologramPointCloud(maxPoints = 12000) {
  const positions: number[] = []
  const colors: number[] = []
  const step = 0.06

  // Desktop browser chrome
  sampleRectFrame(0, 1.15, 0, 3.6, 2.1, step, positions, colors, CYAN)
  sampleRectFrame(0, 2.05, 0.02, 3.4, 0.22, step * 0.8, positions, colors, WHITE)
  sampleFillGrid(0, 1.0, 0.01, 3.0, 1.5, step, positions, colors, CYAN, 0.28)
  sampleRectFrame(-0.9, 1.55, 0.03, 1.2, 0.35, step, positions, colors, YELLOW)
  sampleRectFrame(0.3, 0.75, 0.03, 2.4, 0.55, step, positions, colors, MAGENTA,)

  // Tablet
  sampleRectFrame(2.15, 0.95, 0.05, 1.35, 1.75, step, positions, colors, CYAN)
  sampleFillGrid(2.15, 0.9, 0.06, 1.1, 1.45, step, positions, colors, CYAN, 0.22)

  // Mobile
  sampleRectFrame(3.05, 0.75, 0.08, 0.55, 1.15, step, positions, colors, MAGENTA)
  sampleFillGrid(3.05, 0.7, 0.09, 0.42, 0.95, step, positions, colors, MAGENTA, 0.3)

  // Ground scatter glow at base
  for (let i = 0; i < 400; i++) {
    positions.push(
      (Math.random() - 0.5) * 4.5,
      Math.random() * 0.15,
      (Math.random() - 0.5) * 1.2,
    )
    const c = Math.random() > 0.6 ? YELLOW : CYAN
    colors.push(c[0] * 0.4, c[1] * 0.4, c[2] * 0.4)
  }

  const count = positions.length / 3
  if (count > maxPoints) {
    const stride = Math.ceil(count / maxPoints)
    const p: number[] = []
    const c: number[] = []
    for (let i = 0; i < count; i += stride) {
      p.push(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2])
      c.push(colors[i * 3], colors[i * 3 + 1], colors[i * 3 + 2])
    }
    return { positions: new Float32Array(p), colors: new Float32Array(c) }
  }

  return {
    positions: new Float32Array(positions),
    colors: new Float32Array(colors),
  }
}

export function makeHologramGeometry(maxPoints = 12000) {
  const { positions, colors } = buildHologramPointCloud(maxPoints)
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  return geo
}

export type AgentAnchor = {
  id: string
  position: THREE.Vector3
}

export function agentAnchors(): AgentAnchor[] {
  const anchors: AgentAnchor[] = []
  const radius = 1.35
  const y = 3.35
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2
    anchors.push({
      id: `U0${i + 1}`,
      position: new THREE.Vector3(Math.cos(a) * radius, y, Math.sin(a) * radius * 0.55),
    })
  }
  return anchors
}

export function stageCardWorldPositions(): THREE.Vector3[] {
  const cards: THREE.Vector3[] = []
  const startX = -2.8
  const spacing = 0.78
  const y = 2.05
  const z = -0.15
  for (let i = 0; i < 8; i++) {
    cards.push(new THREE.Vector3(startX + i * spacing, y, z))
  }
  return cards
}

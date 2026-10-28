import * as THREE from 'three'

/**
 * 预渲染 Alpha WebM 平面布局（1280×720 VP9，见 public/hologram-devices.webm）
 * 世界单位：屏面朝向 +Z，略 pitch 贴网格。
 */
export const HOLOGRAM_VIDEO = {
  /** [x, y, z] 平面中心 */
  position: [0.28, 1.08, 0.18] as [number, number, number],
  /** 弧度：微 pitch + 与旧场景一致的轻微 yaw */
  rotation: [-0.06, 0.06, 0] as [number, number, number],
  width: 5.05,
  /** 16:9 */
  height: (5.05 * 720) / 1280,
  src: '/hologram-devices.webm',
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

/** 光束落在 WebM 全息内三台设备屏面近似位置 */
export const HOLOGRAM_BEAM_TARGETS: THREE.Vector3[] = [
  new THREE.Vector3(-0.95, 1.42, 0.24),
  new THREE.Vector3(-0.35, 1.55, 0.24),
  new THREE.Vector3(0.15, 1.05, 0.24),
  new THREE.Vector3(-0.15, 0.72, 0.24),
  new THREE.Vector3(0.05, 1.48, 0.24),
  new THREE.Vector3(0.72, 1.05, 0.24),
  new THREE.Vector3(1.62, 0.88, 0.24),
  new THREE.Vector3(-0.55, 0.55, 0.24),
]

import * as THREE from 'three'

/**
 * 全息视频平面：`hologram-devices-additive.webm` = alpha 母带合成到黑底后的 VP9（yuv420p），
 * 配合 AdditiveBlending（黑像素不贡献亮度，网格可透出）。
 */
export const HOLOGRAM_VIDEO = {
  position: [0.18, 0.92, 0.22] as [number, number, number],
  rotation: [-0.04, 0.05, 0] as [number, number, number],
  width: 5.45,
  height: (5.45 * 720) / 1280,
  /** 运行时播放（黑底，无 alpha 通道） */
  src: '/hologram-devices-additive.webm',
  /** 母带：VP9 alpha，供重编码 / Safari 实验 */
  alphaSource: '/hologram-devices.webm',
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
  new THREE.Vector3(-1.05, 1.22, 0.28),
  new THREE.Vector3(-0.45, 1.38, 0.28),
  new THREE.Vector3(0.05, 0.95, 0.28),
  new THREE.Vector3(-0.25, 0.58, 0.28),
  new THREE.Vector3(-0.05, 1.32, 0.28),
  new THREE.Vector3(0.62, 0.88, 0.28),
  new THREE.Vector3(1.52, 0.72, 0.28),
  new THREE.Vector3(-0.65, 0.42, 0.28),
]

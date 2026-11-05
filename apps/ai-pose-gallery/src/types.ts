export type PoseSystem = '全身·标准系' | '上半身'

export type PoseAngle =
  | '正面'
  | '斜侧'
  | '侧面'
  | '俯视'
  | '仰视'

export type PoseView = {
  angle: PoseAngle
  /** 简短构图备注 */
  framing: string
  /** 火柴人姿态变体（0–5） */
  variant: number
}

export type Pose = {
  id: string
  name: string
  nameEn: string
  system: PoseSystem
  category: string
  views: PoseView[]
  tags: string[]
}

export type ViewMode = 'group' | 'flat'

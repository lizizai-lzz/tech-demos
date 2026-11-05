import type { Pose, PoseAngle } from '@/types'

const ANGLE_EN: Record<PoseAngle, string> = {
  正面: 'front view',
  斜侧: 'three-quarter view',
  侧面: 'side profile',
  俯视: 'high angle / bird-eye',
  仰视: 'low angle / worm-eye',
}

export function buildPosePrompt(
  pose: Pose,
  angle: PoseAngle,
  framing: string,
): string {
  const view = pose.views.find((v) => v.angle === angle)
  const frameNote = framing || view?.framing || '标准构图'
  const zh = [
    `【姿势】${pose.name}`,
    `【体系】${pose.system}`,
    `【分类】${pose.category}`,
    `【视角】${angle}`,
    `【构图】${frameNote}`,
    '【风格】干净背景，自然光影，人物比例准确，无多余肢体。',
    '【用途】AI 文生图姿势参考占位（本 demo 无真实参考图）。',
  ].join('\n')

  const en = [
    `Pose reference: ${pose.nameEn} (${pose.id})`,
    `Body system: full-body standard / upper-body as labeled in source data`,
    `Category: ${pose.category}`,
    `Camera: ${ANGLE_EN[angle]}, ${frameNote}`,
    'Style: clean backdrop, realistic lighting, anatomically coherent silhouette.',
    'Note: dry-run demo — stick-figure placeholder only, no mirrored upstream assets.',
  ].join('\n')

  return `${zh}\n\n---\n\n${en}`
}

import type { ControlId, MotionParams } from '@/types'

const controlLabels: Record<ControlId, (p: MotionParams) => string> = {
  duration: (p) => `动画时长约 ${p.duration} 毫秒`,
  delay: (p) => `开始前延迟 ${p.delay} 毫秒`,
  easing: (p) => `缓动曲线使用 ${p.easing}`,
  stiffness: (p) => `弹簧刚度 stiffness=${p.stiffness}`,
  damping: (p) => `弹簧阻尼 damping=${p.damping}`,
}

export function buildPromptSnippet(
  termZh: string,
  termEn: string,
  description: string,
  params: MotionParams,
  controls: ControlId[],
): string {
  const paramLines = controls.map((id) => `- ${controlLabels[id](params)}`)

  return [
    `请用 Motion（motion.dev，\`motion\` 包）实现「${termZh} / ${termEn}」效果。`,
    description,
    '',
    '参数要求：',
    ...paramLines,
    '',
    '请给出可运行的 React 组件示例，预览区域约 320×180 像素，并提供 Replay 按钮可重复播放。',
  ].join('\n')
}

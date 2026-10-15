import { seconds } from '@/lib/motion-params'
import type { ControlId, MotionParams, PreviewKind } from '@/types'

export type PromptSnippetResult = {
  text: string
  motionHint: string
  paramValues: Record<ControlId, string | number>
}

function paramValuesFrom(params: MotionParams, controls: ControlId[]): Record<ControlId, string | number> {
  const all: Record<ControlId, string | number> = {
    duration: params.duration,
    delay: params.delay,
    easing: params.easing,
    stiffness: params.stiffness,
    damping: params.damping,
  }
  const out: Partial<Record<ControlId, string | number>> = {}
  for (const id of controls) out[id] = all[id]
  return out as Record<ControlId, string | number>
}

/** 单行 Motion transition 参考，供提示词与 UI 高亮使用 */
export function buildMotionCodeHint(
  params: MotionParams,
  controls: ControlId[],
  preview: PreviewKind,
): string {
  if (preview === 'spring' || preview === 'micro-interaction') {
    const parts = [
      `type: 'spring'`,
      `stiffness: ${params.stiffness}`,
      `damping: ${params.damping}`,
    ]
    if (controls.includes('delay') && params.delay > 0) {
      parts.push(`delay: ${seconds(params.delay)}`)
    }
    return `transition={{ ${parts.join(', ')} }}`
  }

  const parts = [`duration: ${seconds(params.duration)}`, `ease: '${params.easing}'`]
  if (controls.includes('delay') && params.delay > 0) {
    parts.push(`delay: ${seconds(params.delay)}`)
  }
  if (preview === 'stagger' && params.delay > 0) {
    return `transition={{ staggerChildren: ${seconds(params.delay)}, ... }}`
  }
  return `transition={{ ${parts.join(', ')} }}`
}

function formatReferenceLine(params: MotionParams, controls: ControlId[], preview: PreviewKind): string {
  const bits: string[] = []
  if (controls.includes('duration')) bits.push(`duration ${params.duration}ms`)
  if (controls.includes('delay')) bits.push(`delay ${params.delay}ms`)
  if (controls.includes('easing')) bits.push(`easing ${params.easing}`)
  if (controls.includes('stiffness')) bits.push(`stiffness ${params.stiffness}`)
  if (controls.includes('damping')) bits.push(`damping ${params.damping}`)
  const hint = buildMotionCodeHint(params, controls, preview)
  return `参考实现：Motion（motion.dev）— ${bits.join('，')}；${hint}`
}

const STACK_LINE =
  '请用我项目当前的技术栈实现同等效果，应用到我指定的元素上；如果项目里已有动画库就用它，没有再考虑 Motion 或 CSS。'

export function buildPromptSnippet(
  effectFeel: string,
  params: MotionParams,
  controls: ControlId[],
  preview: PreviewKind,
): PromptSnippetResult {
  const motionHint = buildMotionCodeHint(params, controls, preview)
  const text = [effectFeel, formatReferenceLine(params, controls, preview), STACK_LINE].join('\n')

  return {
    text,
    motionHint,
    paramValues: paramValuesFrom(params, controls),
  }
}

import { describe, expect, test } from 'bun:test'
import { DEFAULT_MOTION_PARAMS } from './motion-params'
import { buildMotionCodeHint, buildPromptSnippet } from './prompt'

describe('buildPromptSnippet', () => {
  test('先写效果描述，不强制库或固定尺寸组件', () => {
    const { text } = buildPromptSnippet(
      '元素由透明渐渐显现，节奏偏慢出。',
      { ...DEFAULT_MOTION_PARAMS, duration: 800, easing: 'easeInOut' },
      ['duration', 'easing', 'delay'],
      'fade-in',
    )

    expect(text.startsWith('元素由透明渐渐显现')).toBe(true)
    expect(text).toContain('参考实现：Motion（motion.dev）')
    expect(text).toContain('duration 800ms')
    expect(text).toContain('easeInOut')
    expect(text).toContain('项目当前的技术栈')
    expect(text).not.toContain('320')
    expect(text).not.toContain('请用 Motion（motion.dev')
  })

  test('弹簧词条含 transition 代码提示', () => {
    const { text, motionHint } = buildPromptSnippet(
      '轻微过冲后回稳，像按下弹簧。',
      { ...DEFAULT_MOTION_PARAMS, stiffness: 400, damping: 12 },
      ['stiffness', 'damping', 'delay'],
      'spring',
    )

    expect(motionHint).toContain("type: 'spring'")
    expect(motionHint).toContain('stiffness: 400')
    expect(motionHint).toContain('damping: 12')
    expect(text).toContain(motionHint)
  })
})

describe('buildMotionCodeHint', () => {
  test('tween 条目输出 duration 与 ease', () => {
    const hint = buildMotionCodeHint(
      { ...DEFAULT_MOTION_PARAMS, duration: 500, easing: 'easeOut' },
      ['duration', 'easing'],
      'scale',
    )
    expect(hint).toContain('duration: 0.5')
    expect(hint).toContain("ease: 'easeOut'")
  })
})

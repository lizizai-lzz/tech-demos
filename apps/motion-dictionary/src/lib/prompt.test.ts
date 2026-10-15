import { describe, expect, test } from 'bun:test'
import { DEFAULT_MOTION_PARAMS } from './motion-params'
import { buildPromptSnippet } from './prompt'

describe('buildPromptSnippet', () => {
  test('包含词条名与勾选的参数', () => {
    const text = buildPromptSnippet(
      '淡入',
      'fade-in',
      '元素从透明过渡到完全可见。',
      { ...DEFAULT_MOTION_PARAMS, duration: 800, easing: 'easeInOut' },
      ['duration', 'easing', 'delay'],
    )

    expect(text).toContain('淡入 / fade-in')
    expect(text).toContain('800 毫秒')
    expect(text).toContain('easeInOut')
    expect(text).toContain('延迟 0 毫秒')
    expect(text).not.toContain('stiffness')
  })

  test('弹簧参数写入提示词', () => {
    const text = buildPromptSnippet(
      '弹簧',
      'spring',
      '像物理弹簧一样过冲再回稳。',
      { ...DEFAULT_MOTION_PARAMS, stiffness: 400, damping: 12 },
      ['stiffness', 'damping', 'delay'],
    )

    expect(text).toContain('stiffness=400')
    expect(text).toContain('damping=12')
  })
})

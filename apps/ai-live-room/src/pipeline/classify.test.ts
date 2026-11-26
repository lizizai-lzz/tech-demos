import { describe, expect, test } from 'bun:test'
import { classifyDanmaku } from './classify'
import { DEFAULT_PIPELINE_CONFIG } from './defaults'

describe('classifyDanmaku', () => {
  test('识别聊天', () => {
    expect(classifyDanmaku('你好呀', DEFAULT_PIPELINE_CONFIG).kind).toBe('chat')
  })

  test('识别换装', () => {
    const r = classifyDanmaku('换校园制服吧', DEFAULT_PIPELINE_CONFIG)
    expect(r.kind).toBe('outfit')
    expect(r.label).toBe('校园制服')
  })

  test('识别动作', () => {
    expect(classifyDanmaku('比个心', DEFAULT_PIPELINE_CONFIG).label).toBe('比心')
  })

  test('识别礼物', () => {
    expect(classifyDanmaku('送火箭啦', DEFAULT_PIPELINE_CONFIG).kind).toBe('gift')
  })

  test('识别不支持', () => {
    expect(classifyDanmaku('唱首歌', DEFAULT_PIPELINE_CONFIG).kind).toBe('unsupported')
  })
})

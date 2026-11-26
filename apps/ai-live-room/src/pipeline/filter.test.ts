import { describe, expect, test } from 'bun:test'
import { filterDanmaku } from './filter'
import { DEFAULT_PIPELINE_CONFIG } from './defaults'

describe('filterDanmaku', () => {
  test('放行正常聊天', () => {
    const r = filterDanmaku('主播今天好看', DEFAULT_PIPELINE_CONFIG)
    expect(r.ok).toBe(true)
  })

  test('拦截低俗词', () => {
    const r = filterDanmaku('你个傻逼', DEFAULT_PIPELINE_CONFIG)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toContain('低俗')
  })

  test('拦截引流链接', () => {
    const r = filterDanmaku('点这里 https://spam.test', DEFAULT_PIPELINE_CONFIG)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/引流|链接/)
  })

  test('拦截加微信私信', () => {
    const r = filterDanmaku('加我微信聊', DEFAULT_PIPELINE_CONFIG)
    expect(r.ok).toBe(false)
  })
})

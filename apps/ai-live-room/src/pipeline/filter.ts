import type { FilterResult, PipelineConfig } from './types'

const LINK_PATTERN = /(https?:\/\/|www\.)/i

export function filterDanmaku(
  text: string,
  config: Pick<PipelineConfig, 'filterKeywords'>
): FilterResult {
  const trimmed = text.trim()
  if (!trimmed) {
    return { ok: false, reason: '空弹幕' }
  }

  const lower = trimmed.toLowerCase()

  if (LINK_PATTERN.test(trimmed)) {
    return { ok: false, reason: '引流链接' }
  }

  for (const keyword of config.filterKeywords) {
    const kw = keyword.trim()
    if (!kw) continue
    if (lower.includes(kw.toLowerCase())) {
      if (kw.includes('http') || kw.includes('www')) {
        return { ok: false, reason: '引流链接' }
      }
      if (['加微信', '加v', '私信', '引流'].some((s) => kw.toLowerCase().includes(s))) {
        return { ok: false, reason: '引流私信' }
      }
      if (['傻逼', '操'].some((s) => kw.includes(s))) {
        return { ok: false, reason: '低俗词汇' }
      }
      return { ok: false, reason: `命中过滤词：${kw}` }
    }
  }

  return { ok: true }
}

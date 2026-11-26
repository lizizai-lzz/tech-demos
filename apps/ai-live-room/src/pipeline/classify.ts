import type { ClassifiedIntent, PipelineConfig } from './types'

function includesAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase()
  return keywords.some((k) => k && lower.includes(k.toLowerCase()))
}

export function classifyDanmaku(
  text: string,
  config: PipelineConfig
): ClassifiedIntent {
  const trimmed = text.trim()

  if (includesAny(trimmed, config.unsupportedKeywords)) {
    return { kind: 'unsupported' }
  }

  if (/唱.{0,2}歌|来一?首/.test(trimmed)) {
    return { kind: 'unsupported' }
  }

  if (includesAny(trimmed, config.giftKeywords)) {
    return { kind: 'gift' }
  }

  for (const item of config.wardrobe) {
    if (trimmed.includes(item.name)) {
      return { kind: 'outfit', label: item.name }
    }
  }

  for (const [actionName, keywords] of Object.entries(config.actionKeywords)) {
    if (includesAny(trimmed, keywords)) {
      return { kind: 'action', label: actionName }
    }
  }

  if (/换.{0,4}装|穿衣服|换装/.test(trimmed)) {
    const fallback = config.wardrobe[0]?.name
    return { kind: 'outfit', label: fallback }
  }

  return { kind: 'chat' }
}

import type { OutlineResult } from "./types"

const EVENT_MARKERS = /[。！？…\n]/g

function splitSentences(text: string): string[] {
  return text
    .split(EVENT_MARKERS)
    .map((s) => s.trim())
    .filter((s) => s.length > 4)
}

export function extractOutline(sourceText: string, seed = 0): OutlineResult {
  const sentences = splitSentences(sourceText)
  const bullets: string[] = []

  if (sentences.length === 0) {
    bullets.push("开场：建立场景与情绪基调")
    bullets.push("冲突：主角面临抉择")
    bullets.push("转折：信息反转推动剧情")
    bullets.push("收束：留下悬念或情感落点")
    return { bullets }
  }

  const take = Math.min(5, Math.max(3, Math.ceil(sentences.length / 2)))
  for (let i = 0; i < take; i++) {
    const idx = (i + seed) % sentences.length
    const raw = sentences[idx]
    const clipped = raw.length > 36 ? `${raw.slice(0, 34)}…` : raw
    bullets.push(`事件 ${i + 1}：${clipped}`)
  }

  return { bullets }
}

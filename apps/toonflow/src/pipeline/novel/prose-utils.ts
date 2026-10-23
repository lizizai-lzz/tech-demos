import type { ChapterProseResult } from "./types"

/** 将样章各节拼成可检索的纯文本 */
export function flattenChapterProse(prose: ChapterProseResult): string {
  return prose.sections
    .flatMap((s) => s.paragraphs)
    .join("\n")
}

export function firstMatchingQuote(text: string, pattern: RegExp): string {
  const m = text.match(pattern)
  if (!m) return text.slice(0, 48)
  const idx = m.index ?? 0
  const start = Math.max(0, idx - 8)
  const end = Math.min(text.length, idx + m[0].length + 24)
  return text.slice(start, end).trim()
}

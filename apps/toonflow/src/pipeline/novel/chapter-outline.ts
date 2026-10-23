import type { ChapterOutlineItem, ChapterOutlineResult } from "./types"

function splitSentences(text: string): string[] {
  return text
    .split(/[。！？…\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3)
}

export function buildChapterOutline(
  sourceText: string,
  seed = 0
): ChapterOutlineResult {
  const sentences = splitSentences(sourceText)
  const chapterCount = Math.min(
    5,
    Math.max(3, 3 + (seed % 3) + (sentences.length > 6 ? 1 : 0))
  )

  const chapterTitles = [
    "入局",
    "裂缝",
    "对峙",
    "逆转",
    "余烬",
  ]

  const chapters: ChapterOutlineItem[] = []

  for (let i = 0; i < chapterCount; i++) {
    const sent =
      sentences.length > 0
        ? sentences[(i + seed) % sentences.length]
        : `第 ${i + 1} 章核心冲突`
    const summary =
      sent.length > 48 ? `围绕「${sent.slice(0, 44)}…」推进主线。` : `围绕「${sent}」推进主线。`

    const keyBeats = [
      `节拍 A：${i === 0 ? "建立世界与主角处境" : "承接上章悬念"}`,
      `节拍 B：${sent.slice(0, Math.min(20, sent.length)) || "新信息入场"}`,
      `节拍 C：${i === chapterCount - 1 ? "阶段性收束并留钩" : "为下一章埋线索"}`,
    ]

    chapters.push({
      id: `ch-${i + 1}`,
      title: `第${i + 1}章 · ${chapterTitles[i % chapterTitles.length]}`,
      summary,
      keyBeats,
    })
  }

  return { chapters }
}

import type { ChapterOutlineItem, ChapterOutlineResult } from "./types"
import { isCultivationCampus } from "./genre"

function splitSentences(text: string): string[] {
  return text
    .split(/[。！？…\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3)
}

const CULT_CHAPTER_TITLES = [
  "地下室逼炼",
  "禁灵牢里断骨",
  "青龙堂抢丹",
  "反杀白虎楼",
  "黑市血债",
]

const CULT_BEATS = [
  ["禁锢", "逼炼废丹", "灵脉反噬"],
  ["禁灵牢", "断骨威胁", "堂口印亮出"],
  ["青龙堂", "抢地盘", "黑市交易"],
  ["白虎楼", "境界压制", "反杀伏笔"],
  ["血债", "破境", "下一章钩"],
]

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
  const cult = isCultivationCampus(sourceText)

  for (let i = 0; i < chapterCount; i++) {
    const sent =
      sentences.length > 0
        ? sentences[(i + seed) % sentences.length]
        : `第 ${i + 1} 章核心冲突`

    const summary = cult
      ? `青龙堂要在晚自习后把${sent.slice(0, 16) || "新人"}逼进禁灵牢炼废丹。`
      : sent.length > 48
        ? `围绕「${sent.slice(0, 44)}…」推进主线。`
        : `围绕「${sent}」推进主线。`

    const keyBeats = cult
      ? CULT_BEATS[i % CULT_BEATS.length].map(
          (b, j) => `节拍 ${String.fromCharCode(65 + j)}：${b}`
        )
      : [
          `节拍 A：${i === 0 ? "建立世界与主角处境" : "承接上章悬念"}`,
          `节拍 B：${sent.slice(0, Math.min(20, sent.length)) || "新信息入场"}`,
          `节拍 C：${i === chapterCount - 1 ? "阶段性收束并留钩" : "为下一章埋线索"}`,
        ]

    const title = cult
      ? `第${i + 1}章 · ${CULT_CHAPTER_TITLES[i % CULT_CHAPTER_TITLES.length]}`
      : `第${i + 1}章 · ${chapterTitles[i % chapterTitles.length]}`

    chapters.push({
      id: `ch-${i + 1}`,
      title,
      summary,
      keyBeats,
    })
  }

  return { chapters }
}

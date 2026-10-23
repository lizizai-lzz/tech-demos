import type { ChapterOutlineItem, ChapterOutlineResult } from "./types"
import { isMartialCampusUnderworld } from "./genre"

function splitSentences(text: string): string[] {
  return text
    .split(/[。！？…\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3)
}

const MARTIAL_CHAPTER_TITLES = [
  "地下室炼狱",
  "禁闭仓断骨",
  "青龙会抢场",
  "反杀白虎馆",
  "黑市血账",
]

const MARTIAL_BEATS = [
  ["禁锢", "地狱集训", "肋骨作响"],
  ["禁闭仓", "断指威胁", "会印亮出"],
  ["青龙会", "抢地盘", "黑市赌拳"],
  ["白虎馆", "段位压制", "反杀伏笔"],
  ["血账", "杀拳突破", "下一章钩"],
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
  const martial = isMartialCampusUnderworld(sourceText)

  for (let i = 0; i < chapterCount; i++) {
    const sent =
      sentences.length > 0
        ? sentences[(i + seed) % sentences.length]
        : `第 ${i + 1} 章核心冲突`

    const summary = martial
      ? `青龙会要在夜课后把${sent.slice(0, 16) || "新人"}关进禁闭仓加练杀拳。`
      : sent.length > 48
        ? `围绕「${sent.slice(0, 44)}…」推进主线。`
        : `围绕「${sent}」推进主线。`

    const keyBeats = martial
      ? MARTIAL_BEATS[i % MARTIAL_BEATS.length].map(
          (b, j) => `节拍 ${String.fromCharCode(65 + j)}：${b}`
        )
      : [
          `节拍 A：${i === 0 ? "建立世界与主角处境" : "承接上章悬念"}`,
          `节拍 B：${sent.slice(0, Math.min(20, sent.length)) || "新信息入场"}`,
          `节拍 C：${i === chapterCount - 1 ? "阶段性收束并留钩" : "为下一章埋线索"}`,
        ]

    const title = martial
      ? `第${i + 1}章 · ${MARTIAL_CHAPTER_TITLES[i % MARTIAL_CHAPTER_TITLES.length]}`
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

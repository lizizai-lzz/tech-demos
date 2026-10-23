import type { ChapterProseResult, QualityVerdictResult } from "./types"

const AI_PHRASE_REPLACEMENTS: [RegExp, string][] = [
  [/这一刻[，,][^。！？]{0,24}(明白|懂得|顿悟)[^。！？]*[。！？]/g, ""],
  [/他的目光深邃[^。！？]*[。！？]/g, "他眼皮一跳，先看了门缝里的光。"],
  [/首先[，,][^。！？]*其次[，,][^。！？]*最后[^。！？]*[。！？]/g, ""],
  [/总而言之[^。！？]*[。！？]/g, ""],
  [
    /「这不是输赢的问题。」[^「]*「是我们要不要还相信同一条规则。」/g,
    "「要场子可以。」他吐掉血沫，「拿会印来换。」",
  ],
  [/学生会.{0,16}(倡议|公约|演讲)[^。！？]*[。！？]/g, ""],
  [/灵力[^。！？]*[。！？]/g, ""],
  [/丹药[^。！？]*[。！？]/g, ""],
]

function applyBriefHints(paragraph: string, brief: string[]): string {
  let next = paragraph
  for (const [re, rep] of AI_PHRASE_REPLACEMENTS) {
    re.lastIndex = 0
    next = next.replace(re, rep)
  }
  if (brief.some((b) => b.includes("节拍") || b.includes("炼狱")) && !/禁闭|堂口|反杀/.test(next)) {
    next = `${next}青龙会的印还烫在他颈侧。`
  }
  if (brief.some((b) => b.includes("段位") || b.includes("武学")) && !/杀拳|半格|熟手/.test(next)) {
    next = `${next}熟手架势硬顶上去，肋骨发出一声闷响。`
  }
  return next.replace(/\s+/g, " ").trim()
}

export function rewriteChapterProse(
  draft: ChapterProseResult,
  verdict: QualityVerdictResult
): ChapterProseResult {
  if (verdict.verdict === "accept") {
    return {
      chapterId: draft.chapterId,
      chapterTitle: draft.chapterTitle,
      sections: draft.sections.map((s) => ({
        ...s,
        paragraphs: [...s.paragraphs],
      })),
    }
  }

  const brief = verdict.rewriteBrief
  const sections = draft.sections.map((sec) => ({
    ...sec,
    paragraphs: sec.paragraphs.map((p) => {
      let line = applyBriefHints(p, brief)
      if (line.length < 8) {
        line = p
      }
      if (verdict.verdict === "rewrite" && !line.endsWith("。") && !line.endsWith("」")) {
        line += "。"
      }
      return line
    }),
  }))

  if (verdict.verdict === "rewrite") {
    const hook = sections[sections.length - 1]
    if (hook && !hook.paragraphs.some((p) => /反杀|断骨|血账/.test(p))) {
      hook.paragraphs.push(
        "门外脚步乱了。他拎着会印反手一扣——今晚的反杀，要让白虎馆记住肋骨折断的声音。"
      )
    }
  }

  return {
    chapterId: draft.chapterId,
    chapterTitle: draft.chapterTitle,
    sections,
  }
}

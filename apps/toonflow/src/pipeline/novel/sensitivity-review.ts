import type { ChapterProseResult, SensitivityFinding, SensitivityReviewResult } from "./types"
import { flattenChapterProse, firstMatchingQuote } from "./prose-utils"

/**
 * 仅硬阻断：涉及未成年人的性内容 / 性羞辱 / 性剥削。
 * 绑架、禁锢、暴力、逼炼、黑市丹药等类型桥段在空跑中允许（note 级提示，不阻断）。
 */
const HARD_BLOCK_RULES: {
  pattern: RegExp
  issue: string
  fix: string
}[] = [
  {
    pattern: /(未成年|高一|高二|高三|少年|少女|学弟|学妹).{0,20}(性侵|强奸|猥亵|裸照|卖淫|性奴)/g,
    issue: "涉及未成年人的性暴力或性剥削",
    fix: "删除一切未成年人性相关描写；冲突改用暴力/修炼压迫等非性手段",
  },
  {
    pattern: /(性侵|强奸|猥亵).{0,16}(学生|未成年|少年|少女)/g,
    issue: "涉及未成年人的性暴力或性剥削",
    fix: "删除一切未成年人性相关描写",
  },
  {
    pattern: /性羞辱|当众.{0,8}脱衣|强迫.{0,6}性服务/g,
    issue: "性羞辱或性剥削情节",
    fix: "改为非性相关的压迫（禁锢、逼炼、勒索灵石等）",
  },
]

const GENRE_NOTE_RULES: {
  pattern: RegExp
  issue: string
}[] = [
  { pattern: /禁锢|囚禁|绑架|逼炼|黑市|断骨|械斗|鲜血/g, issue: "类型暴力/压迫桥段（空跑允许，非性相关）" },
  { pattern: /校园|高中|晚自习/g, issue: "未成年背景 — 仅禁止性相关内容，其余按类型处理" },
]

export function runSensitivityReview(
  prose: ChapterProseResult,
  sourceText: string
): SensitivityReviewResult {
  const text = `${flattenChapterProse(prose)}\n${sourceText}`
  const findings: SensitivityFinding[] = []

  for (const rule of HARD_BLOCK_RULES) {
    rule.pattern.lastIndex = 0
    if (rule.pattern.test(text)) {
      findings.push({
        severity: "block",
        quote: firstMatchingQuote(text, rule.pattern),
        issue: rule.issue,
        fix: rule.fix,
      })
    }
  }

  for (const rule of GENRE_NOTE_RULES) {
    rule.pattern.lastIndex = 0
    if (rule.pattern.test(text) && !findings.some((f) => f.severity === "block")) {
      findings.push({
        severity: "note",
        quote: firstMatchingQuote(text, rule.pattern),
        issue: rule.issue,
        fix: "保持类型张力即可，勿添加性描写",
      })
    }
  }

  if (findings.length === 0) {
    findings.push({
      severity: "note",
      quote: text.slice(0, 36),
      issue: "未命中未成年性内容红线（空跑词表）",
      fix: "暴力/逼炼等类型桥段无需软化成校规现实主义",
    })
  }

  const blocked = findings.some((f) => f.severity === "block")
  const summary = blocked
    ? "命中性相关红线，必须改写"
    : "未命中性红线，类型暴力按题材容忍"

  return { findings, summary }
}

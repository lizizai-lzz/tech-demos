import type { ChapterProseResult, SensitivityFinding, SensitivityReviewResult } from "./types"
import { flattenChapterProse, firstMatchingQuote } from "./prose-utils"

/**
 * 成人高校地下格斗黑道：凡人肉体极限（刃牙式），非修真。
 * 允许类型桥段：绑架、禁锢、羞辱、黑市赌拳/禁药暗示（无教程）、炼狱集训、帮派暴力等。
 * 仅阻断：真实可模仿犯罪教程（非虚构叙事）、以及明确将角色 framing 为未满 18 岁。
 */
const HARD_BLOCK_RULES: {
  pattern: RegExp
  issue: string
  fix: string
}[] = [
  {
    pattern: /未满\s*18|未满十八|十七岁|十六岁|十五岁|初中生|高中生(?!院)|高三\(|高一\(|高二\(/g,
    issue: "正文将角色明确 framing 为未成年人（与本设定成年高校冲突）",
    fix: "改为大学/高校/分院年级或成年身份，勿写具体未成年年龄",
  },
  {
    pattern: /(制作|配制|合成).{0,12}(炸药|雷管|枪械|毒品).{0,20}(原料|比例|步骤|教程)/g,
    issue: "出现真实可模仿的犯罪制作教程（非虚构叙事）",
    fix: "改为模糊后果描写或虚构灵材名称，不写现实配方与步骤",
  },
  {
    pattern: /第一步.{0,40}第二步.{0,40}(制毒|开锁|撬车|入侵)/g,
    issue: "分步骤的现实犯罪操作指南",
    fix: "删除教程式步骤，保留剧情结果与虚构手段",
  },
]

const GENRE_NOTE_RULES: {
  pattern: RegExp
  issue: string
}[] = [
  {
    pattern: /禁锢|囚禁|绑架|炼狱|黑市|羞辱|断骨|堂口/g,
    issue: "成人向类型压迫/暴力桥段（空跑允许，按网文尺度处理）",
  },
  {
    pattern: /大学|高校|分院|大学城/g,
    issue: "成年高校背景（默认角色为大学生）",
  },
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
        fix: "保持成人高校 + 类型张力，勿写成现实校规宣教",
      })
    }
  }

  if (findings.length === 0) {
    findings.push({
      severity: "note",
      quote: text.slice(0, 36),
      issue: "未命中红线（空跑：成年高校网文词表）",
      fix: "绑架/炼狱/羞辱等类型桥段无需软化；避免真实犯罪教程与未成年 framing",
    })
  }

  const blocked = findings.some((f) => f.severity === "block")
  const summary = blocked
    ? "命中红线，必须改写"
    : "成人向类型尺度通过（空跑）"

  return { findings, summary }
}

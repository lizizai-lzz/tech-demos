import type {
  ChapterOutlineItem,
  ChapterProseResult,
  PunchFinding,
  PunchReviewResult,
} from "./types"
import { flattenChapterProse, firstMatchingQuote } from "./prose-utils"
import {
  isMartialCampusUnderworld,
  PUNCH_TITLE_MARKERS,
  WEAK_TITLE_MARKERS,
} from "./genre"

const SOFT_PLOT_PATTERNS: { pattern: RegExp; issue: string; fix: string }[] = [
  {
    pattern: /学生会.{0,12}(演讲|倡议|公约)|保卫科|家长群|班主任.{0,8}谈话/g,
    issue: "剧情偏「校规现实主义」，网文狠劲不足",
    fix: "改成堂口规矩、段位压制或地下赌拳，用短句肉搏推进",
  },
  {
    pattern: /交给老师|制度介入|温馨提示|共建和谐校园/g,
    issue: "落点过软，像说教收尾",
    fix: "用反杀、抢场或杀拳突破作钩",
  },
  {
    pattern: /这不是输赢的问题|我们要不要还相信/g,
    issue: "对白像学生会辩论，缺乏爽文冲击力",
    fix: "改成威胁、要价或折骨见血的短对白",
  },
]

function titlePunchScore(title: string): number {
  let score = 55
  if (PUNCH_TITLE_MARKERS.some((m) => title.includes(m))) score += 28
  if (WEAK_TITLE_MARKERS.some((m) => title.includes(m))) score -= 22
  if (title.length < 8) score -= 10
  if (/第\d+章/.test(title) && !/[·•]/.test(title)) score -= 8
  return Math.max(0, Math.min(100, score))
}

export function runPunchReview(
  prose: ChapterProseResult,
  chapter: ChapterOutlineItem,
  sourceText: string
): PunchReviewResult {
  const text = flattenChapterProse(prose)
  const findings: PunchFinding[] = []
  let score = titlePunchScore(chapter.title)

  if (score < 60) {
    findings.push({
      severity: "fail",
      quote: chapter.title,
      issue: "章标题偏软或模板化，缺少狠味钩子",
      fix: "换成带杀拳/禁闭/反杀意象的短标题，如「地下室炼狱」「断骨反杀」",
    })
  }

  if (isMartialCampusUnderworld(sourceText)) {
    if (!/入门|熟手|杀拳|半格|怪力|拳场|禁闭|堂口|青龙|白虎/.test(text)) {
      score -= 25
      findings.push({
        severity: "fail",
        quote: firstMatchingQuote(text, /./),
        issue: "正文未扣住凡人武学层级或地下堂口",
        fix: "点出段位差、炼狱集训或帮派地盘，别写成普通校园纠纷",
      })
    }
    if (!/禁锢|炼狱|反杀|黑市|囚禁|锁|断骨|羞辱/.test(`${text}${chapter.summary}`)) {
      score -= 15
      findings.push({
        severity: "warn",
        quote: chapter.summary.slice(0, 40),
        issue: "节拍偏温，缺少暗黑爽点（禁锢/炼狱/反杀）",
        fix: "在冲突段加入禁闭、羞辱或反杀预告",
      })
    }
    if (/灵力|丹药|开脉|修真/.test(text)) {
      score -= 20
      findings.push({
        severity: "fail",
        quote: firstMatchingQuote(text, /灵力|丹药/),
        issue: "混入玄幻修真味，与刃牙式凡人设定冲突",
        fix: "全部改为肉体极限与地下格斗语汇",
      })
    }
  }

  for (const rule of SOFT_PLOT_PATTERNS) {
    rule.pattern.lastIndex = 0
    if (rule.pattern.test(text)) {
      score -= 18
      findings.push({
        severity: "fail",
        quote: firstMatchingQuote(text, rule.pattern),
        issue: rule.issue,
        fix: rule.fix,
      })
    }
  }

  score = Math.max(0, Math.min(100, score))

  if (findings.length === 0) {
    findings.push({
      severity: "pass",
      quote: chapter.title,
      issue: "标题与节拍具备网文冲击力",
      fix: "保持短句肉搏流，继续压段位差",
    })
  }

  const summary =
    score >= 75
      ? "狠劲充足，可放行"
      : score >= 55
        ? "冲击力一般，建议润色"
        : "标题或剧情偏软，建议改写"

  return { score, findings, summary }
}

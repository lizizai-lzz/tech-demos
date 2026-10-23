import type { AiTasteFinding, AiTasteGateResult, ChapterProseResult } from "./types"
import { flattenChapterProse, firstMatchingQuote } from "./prose-utils"

const AI_PATTERNS: {
  pattern: RegExp
  label: string
  penalty: number
  fix: string
}[] = [
  {
    pattern: /这一刻[，,].{0,12}(明白|懂得|顿悟)/g,
    label: "万能金句",
    penalty: 18,
    fix: "改成具体动作或对话，删掉抽象顿悟",
  },
  {
    pattern: /目光深邃|眼眸深处|仿佛能看穿/g,
    label: "目光深邃套话",
    penalty: 14,
    fix: "用视线落点（看哪里、回避什么）替代",
  },
  {
    pattern: /首先[，,].{0,40}其次[，,].{0,40}最后/g,
    label: "说明书腔排比",
    penalty: 22,
    fix: "拆成短句动作，不要用教程式连接词",
  },
  {
    pattern: /(不禁|不由得).{0,6}(陷入|陷入沉思|感慨万千)/g,
    label: "空洞抒情",
    penalty: 12,
    fix: "写一句有信息量的内心独白",
  },
  {
    pattern: /总而言之|综上所述|毋庸置疑/g,
    label: "总结腔",
    penalty: 10,
    fix: "删除总结句，用情节落点收尾",
  },
  {
    pattern: /学生会.{0,10}(倡议|公约|演讲)|共建和谐|德育标兵/g,
    label: "学生会演讲腔",
    penalty: 20,
    fix: "改成堂口威胁、灵石要价或境界碾压式对白",
  },
  {
    pattern: /我们要不要还相信|这不是输赢的问题/g,
    label: "辩论式说教对白",
    penalty: 16,
    fix: "改成一刀见血的短句，别像班会发言",
  },
]

export function runAiTasteGate(prose: ChapterProseResult): AiTasteGateResult {
  const text = flattenChapterProse(prose)
  const findings: AiTasteFinding[] = []
  let score = 100

  for (const rule of AI_PATTERNS) {
    rule.pattern.lastIndex = 0
    if (rule.pattern.test(text)) {
      score -= rule.penalty
      findings.push({
        pattern: rule.label,
        quote: firstMatchingQuote(text, rule.pattern),
        issue: `检测到模板化「${rule.label}」`,
        fix: rule.fix,
      })
    }
  }

  const lines = text.split(/[。！？]/)
  const starters = lines.map((l) => l.slice(0, 4))
  const dup = starters.filter((s, i) => starters.indexOf(s) !== i && s.length >= 3)
  if (dup.length >= 2) {
    score -= 8
    findings.push({
      pattern: "空洞排比",
      quote: dup[0] ?? text.slice(0, 20),
      issue: "相邻句式重复，有排比灌水感",
      fix: "变换句首，合并重复信息",
    })
  }

  const shortAction = text.split(/[。！？]/).filter((s) => s.length > 0 && s.length <= 28)
  if (shortAction.length >= 3 && score < 90) {
    score = Math.min(100, score + 6)
  }

  score = Math.max(0, Math.min(100, score))
  const summary =
    score >= 85
      ? "AI 味较低，可放行"
      : score >= 65
        ? "略有模板痕迹，建议润色"
        : "AI 味偏重，建议改写"

  return { score, findings, summary }
}

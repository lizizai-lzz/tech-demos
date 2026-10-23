import type {
  AiTasteGateResult,
  ConsistencyReviewResult,
  PunchReviewResult,
  QualityVerdictResult,
  SensitivityReviewResult,
} from "./types"

export function buildQualityVerdict(
  consistency: ConsistencyReviewResult,
  sensitivity: SensitivityReviewResult,
  ai: AiTasteGateResult,
  punch: PunchReviewResult
): QualityVerdictResult {
  const rewriteBrief: string[] = []

  const consistencyFail = consistency.findings.some((f) => f.severity === "fail")
  const consistencyWarn = consistency.findings.some((f) => f.severity === "warn")
  const blocked = sensitivity.findings.some((f) => f.severity === "block")
  const punchFail = punch.findings.some((f) => f.severity === "fail")
  const punchLow = punch.score < 58

  if (punchFail || punchLow) {
    rewriteBrief.push("标题与钩子加狠：堂口/炼狱/反杀意象，避免软萌或校规现实主义")
  }
  if (consistencyFail) {
    rewriteBrief.push("对齐章纲节拍、凡人武学层级与堂口势力（无灵气修真）")
  } else if (consistencyWarn) {
    rewriteBrief.push("补强段位差、帮派名号与章纲暗黑节拍")
  }

  if (blocked) {
    rewriteBrief.push("删除真实犯罪教程或未成年年龄 framing；类型压迫桥段可保留")
  }

  if (ai.score < 65) {
    rewriteBrief.push("删减万能金句、说明书腔与学生会演讲腔，保留短句动作")
  } else if (ai.score < 85) {
    rewriteBrief.push("局部润色：压缩套话，加脏短打戏")
  }

  for (const f of punch.findings) {
    if (f.severity === "fail" || f.severity === "warn") rewriteBrief.push(f.fix)
  }
  for (const f of consistency.findings) {
    if (f.severity === "fail" || f.severity === "warn") rewriteBrief.push(f.fix)
  }
  for (const f of sensitivity.findings) {
    if (f.severity === "block") rewriteBrief.push(f.fix)
  }
  for (const f of ai.findings) {
    rewriteBrief.push(f.fix)
  }

  const uniqueBrief = [...new Set(rewriteBrief)].slice(0, 10)

  let verdict: QualityVerdictResult["verdict"] = "accept"
  if (blocked || consistencyFail || punchFail || punch.score < 50 || ai.score < 52) {
    verdict = "rewrite"
  } else if (
    consistencyWarn ||
    punch.score < 72 ||
    ai.score < 78 ||
    punch.findings.some((f) => f.severity === "warn")
  ) {
    verdict = "polish"
  }

  if (verdict === "polish" && (blocked || consistencyFail || punchFail)) {
    verdict = "rewrite"
  }

  const summary =
    verdict === "accept"
      ? "质检通过，狠劲与设定一致"
      : verdict === "polish"
        ? "建议润色后复审（去 AI 味 / 加压钩子）"
        : "需按改写要点重写样章"

  return {
    verdict,
    rewriteBrief: verdict === "accept" ? [] : uniqueBrief,
    summary,
    inputs: {
      consistencySummary: consistency.summary,
      sensitivitySummary: sensitivity.summary,
      aiScore: ai.score,
      aiSummary: ai.summary,
      punchScore: punch.score,
      punchSummary: punch.summary,
    },
  }
}

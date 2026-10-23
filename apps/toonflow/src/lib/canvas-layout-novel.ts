import type { Edge, Node } from "@xyflow/react"
import type {
  ConsistencyFinding,
  NovelPipelineState,
  SensitivityFinding,
} from "@/pipeline/novel/types"
import type { NodeOverrides } from "@/types/studio"
import type {
  GraphBuildContext,
  StatusChip,
  StudioNodeData,
  StudioNodeKind,
} from "@/lib/canvas-layout"

function visualForStage(
  stageId: string | undefined,
  ctx: GraphBuildContext
): StudioNodeData["visualStatus"] {
  if (!stageId) return "done"
  if (ctx.status === "running" && ctx.currentStageId === stageId) {
    return "generating"
  }
  return "done"
}

function consistencyChip(findings: ConsistencyFinding[]): StatusChip {
  if (findings.some((f) => f.severity === "fail")) {
    return { label: "未通过", tone: "destructive" }
  }
  if (findings.some((f) => f.severity === "warn")) {
    return { label: "待修", tone: "warning" }
  }
  return { label: "通过", tone: "success" }
}

function sensitivityChip(findings: SensitivityFinding[]): StatusChip {
  if (findings.some((f) => f.severity === "block")) {
    return { label: "拦截", tone: "destructive" }
  }
  if (findings.some((f) => f.severity === "warn")) {
    return { label: "警示", tone: "warning" }
  }
  return { label: "通过", tone: "success" }
}

function verdictChip(verdict: string): StatusChip {
  if (verdict === "accept") return { label: "通过", tone: "success" }
  if (verdict === "polish") return { label: "润色", tone: "warning" }
  return { label: "改写", tone: "destructive" }
}

const X_GAP = 280
const Y_GAP = 140

export function buildNovelGraph(
  pipeline: NovelPipelineState,
  overrides: NodeOverrides,
  ctx: GraphBuildContext = { status: "idle", currentStageId: null }
): { nodes: Node<StudioNodeData>[]; edges: Edge[] } {
  const nodes: Node<StudioNodeData>[] = []
  const edges: Edge[] = []
  let col = 0

  const sourceId = "node-source"
  const sourceOverride = overrides[sourceId]
  nodes.push({
    id: sourceId,
    type: "studio",
    position: { x: col * X_GAP, y: 0 },
    data: {
      kind: "source",
      title: sourceOverride?.title ?? "种子原文",
      body: sourceOverride?.body ?? pipeline.sourceText,
      subtitle: `${pipeline.sourceText.length} 字`,
      visualStatus:
        ctx.status === "running" && !pipeline.completedStages.length
          ? "generating"
          : "done",
    },
  })
  let prevId = sourceId
  col++

  if (pipeline.world) {
    const id = "node-world"
    const ov = overrides[id]
    const body =
      ov?.body ??
      [
        `时代：${pipeline.world.era}`,
        `场景：${pipeline.world.setting}`,
        `基调：${pipeline.world.tone}`,
        "",
        "世界规则：",
        ...pipeline.world.rules.map((r, i) => `${i + 1}. ${r}`),
      ].join("\n")
    nodes.push({
      id,
      type: "studio",
      position: { x: col * X_GAP, y: 0 },
      data: {
        kind: "world" as StudioNodeKind,
        stageId: "world",
        title: ov?.title ?? "设定 / 世界观",
        body,
        subtitle: pipeline.world.era,
        visualStatus: visualForStage("world", ctx),
      },
    })
    edges.push({ id: `e-${prevId}-${id}`, source: prevId, target: id })
    prevId = id
    col++
  }

  if (pipeline.chapterOutline?.chapters.length) {
    pipeline.chapterOutline.chapters.forEach((ch, i) => {
      const id = `node-choutline-${ch.id}`
      const ov = overrides[id]
      const body =
        ov?.body ??
        [ch.summary, "", ...ch.keyBeats.map((b) => `· ${b}`)].join("\n")
      nodes.push({
        id,
        type: "studio",
        position: { x: col * X_GAP, y: (i - 1) * Y_GAP },
        data: {
          kind: "chapterOutline" as StudioNodeKind,
          stageId: "chapterOutline",
          entityId: ch.id,
          title: ov?.title ?? ch.title,
          body,
          subtitle: "章纲",
          visualStatus: visualForStage("chapterOutline", ctx),
        },
      })
      edges.push({ id: `e-${prevId}-${id}`, source: prevId, target: id })
    })
    prevId = `node-choutline-${pipeline.chapterOutline.chapters[0].id}`
    col++
  }

  if (pipeline.characters?.length) {
    pipeline.characters.forEach((char, i) => {
      const id = `node-char-${char.id}`
      const ov = overrides[id]
      const body =
        ov?.body ??
        `角色：${char.role}\n造型标签：${char.lookTags.join(" · ")}`
      nodes.push({
        id,
        type: "studio",
        position: { x: col * X_GAP, y: (i - 1) * Y_GAP },
        data: {
          kind: "character",
          stageId: "characters",
          entityId: char.id,
          title: ov?.title ?? char.name,
          body,
          subtitle: char.role,
          visualStatus: visualForStage("characters", ctx),
        },
      })
      edges.push({ id: `e-${prevId}-${id}`, source: prevId, target: id })
    })
    prevId = `node-char-${pipeline.characters[0].id}`
    col++
  }

  if (pipeline.chapterProse) {
    const prose = pipeline.chapterProse
    let lastProseId = prevId
    prose.sections.forEach((sec, i) => {
      const id = `node-prose-${sec.id}`
      const ov = overrides[id]
      const body = ov?.body ?? sec.paragraphs.join("\n\n")
      nodes.push({
        id,
        type: "studio",
        position: { x: col * X_GAP, y: (i - 1) * Y_GAP },
        data: {
          kind: "chapterProse" as StudioNodeKind,
          stageId: "chapterProse",
          entityId: sec.id,
          title: ov?.title ?? `${prose.chapterTitle} · ${sec.heading}`,
          body,
          subtitle: sec.heading,
          visualStatus: visualForStage("chapterProse", ctx),
        },
      })
      edges.push({ id: `e-${prevId}-${id}`, source: prevId, target: id })
      lastProseId = id
    })
    prevId = lastProseId
    col++
  }

  const formatFindings = (
    lines: { severity: string; issue: string; quote: string }[]
  ) =>
    lines
      .map(
        (f, i) =>
          `${i + 1}. [${f.severity}] ${f.issue}\n   摘录：${f.quote.slice(0, 60)}`
      )
      .join("\n\n")

  if (pipeline.consistencyReview) {
    const id = "node-consistency-review"
    const ov = overrides[id]
    const review = pipeline.consistencyReview
    const chip = consistencyChip(review.findings)
    const body =
      ov?.body ??
      `${review.summary}\n\n${formatFindings(review.findings)}`
    nodes.push({
      id,
      type: "studio",
      position: { x: col * X_GAP, y: 0 },
      data: {
        kind: "consistencyReview",
        stageId: "consistencyReview",
        title: ov?.title ?? "一致性审核",
        body,
        subtitle: chip.label,
        statusChip: chip,
        visualStatus: visualForStage("consistencyReview", ctx),
        sheetExtras: [review.summary],
      },
    })
    edges.push({ id: `e-${prevId}-${id}`, source: prevId, target: id })
    prevId = id
    col++
  }

  if (pipeline.sensitivityReview) {
    const id = "node-sensitivity-review"
    const ov = overrides[id]
    const review = pipeline.sensitivityReview
    const chip = sensitivityChip(review.findings)
    const body =
      ov?.body ??
      `${review.summary}\n\n${formatFindings(review.findings)}`
    nodes.push({
      id,
      type: "studio",
      position: { x: col * X_GAP, y: 0 },
      data: {
        kind: "sensitivityReview",
        stageId: "sensitivityReview",
        title: ov?.title ?? "敏感话题",
        body,
        subtitle: chip.label,
        statusChip: chip,
        visualStatus: visualForStage("sensitivityReview", ctx),
        sheetExtras: [review.summary],
      },
    })
    edges.push({ id: `e-${prevId}-${id}`, source: prevId, target: id })
    prevId = id
    col++
  }

  if (pipeline.aiTasteGate) {
    const id = "node-ai-taste"
    const ov = overrides[id]
    const ai = pipeline.aiTasteGate
    const body =
      ov?.body ??
      [
        `${ai.summary}（得分 ${ai.score}/100）`,
        "",
        ...ai.findings.map(
          (f, i) =>
            `${i + 1}. ${f.pattern}：${f.issue}\n   摘录：${f.quote.slice(0, 48)}`
        ),
      ].join("\n")
    const chip: StatusChip = {
      label: `${ai.score} 分`,
      tone:
        ai.score >= 75 ? "success" : ai.score >= 55 ? "warning" : "destructive",
    }
    nodes.push({
      id,
      type: "studio",
      position: { x: col * X_GAP, y: 0 },
      data: {
        kind: "aiTasteGate",
        stageId: "aiTasteGate",
        title: ov?.title ?? "去AI味",
        body,
        subtitle: chip.label,
        statusChip: chip,
        visualStatus: visualForStage("aiTasteGate", ctx),
        sheetExtras: [`得分 ${ai.score}/100`, ai.summary],
      },
    })
    edges.push({ id: `e-${prevId}-${id}`, source: prevId, target: id })
    prevId = id
    col++
  }

  if (pipeline.qualityVerdict) {
    const id = "node-quality-verdict"
    const ov = overrides[id]
    const v = pipeline.qualityVerdict
    const body =
      ov?.body ??
      [
        v.summary,
        `裁定：${v.verdict}`,
        `狠劲分：${v.inputs.punchScore}/100（${v.inputs.punchSummary}）`,
        `去AI味：${v.inputs.aiScore}/100`,
        "",
        v.rewriteBrief.length
          ? "改写要点：\n" + v.rewriteBrief.map((b, i) => `${i + 1}. ${b}`).join("\n")
          : "无需改写要点",
      ].join("\n")
    const chip = verdictChip(v.verdict)
    const punchChip: StatusChip = {
      label: `狠劲 ${v.inputs.punchScore}`,
      tone:
        v.inputs.punchScore >= 70
          ? "success"
          : v.inputs.punchScore >= 50
            ? "warning"
            : "destructive",
    }
    nodes.push({
      id,
      type: "studio",
      position: { x: col * X_GAP, y: 0 },
      data: {
        kind: "qualityVerdict",
        stageId: "qualityVerdict",
        title: ov?.title ?? "质检裁定",
        body,
        subtitle: chip.label,
        statusChip: chip,
        visualStatus: visualForStage("qualityVerdict", ctx),
        sheetExtras: [
          `裁定：${v.verdict}`,
          punchChip.label + "/100",
          `去AI味：${v.inputs.aiScore}/100`,
          ...(v.rewriteBrief.length
            ? ["改写要点：", ...v.rewriteBrief.map((b, i) => `${i + 1}. ${b}`)]
            : []),
        ],
      },
    })
    edges.push({ id: `e-${prevId}-${id}`, source: prevId, target: id })
    prevId = id
    col++
  }

  if (pipeline.chapterProseFinal && pipeline.qualityVerdict) {
    const draft = pipeline.chapterProse!
    const final = pipeline.chapterProseFinal
    const draftText = draft.sections
      .flatMap((s) => s.paragraphs)
      .join("\n\n")
    const revisedText = final.sections
      .flatMap((s) => s.paragraphs)
      .join("\n\n")
    const rewritten = pipeline.qualityVerdict.verdict !== "accept"

    const rewriteId = "node-rewrite"
    const ovRewrite = overrides[rewriteId]
    nodes.push({
      id: rewriteId,
      type: "studio",
      position: { x: col * X_GAP, y: 0 },
      data: {
        kind: "rewrite",
        stageId: "rewrite",
        title: ovRewrite?.title ?? "改写",
        body:
          ovRewrite?.body ??
          (rewritten
            ? `已按裁定「${pipeline.qualityVerdict.verdict}」生成终稿，详见详情对照初稿。`
            : "裁定为通过，终稿与初稿一致。"),
        subtitle: rewritten ? "已改写" : "直通",
        draftBody: draftText,
        revisedBody: revisedText,
        visualStatus: visualForStage("rewrite", ctx),
      },
    })
    edges.push({ id: `e-${prevId}-${rewriteId}`, source: prevId, target: rewriteId })
    prevId = rewriteId
    col++

    if (rewritten) {
      final.sections.forEach((sec, i) => {
        const id = `node-prose-final-${sec.id}`
        const ov = overrides[id]
        const body = ov?.body ?? sec.paragraphs.join("\n\n")
        nodes.push({
          id,
          type: "studio",
          position: { x: col * X_GAP, y: (i - 1) * Y_GAP },
          data: {
            kind: "chapterProseRevised",
            stageId: "rewrite",
            entityId: sec.id,
            title: ov?.title ?? `${final.chapterTitle} · ${sec.heading}（终稿）`,
            body,
            subtitle: sec.heading,
            visualStatus: visualForStage("rewrite", ctx),
          },
        })
        edges.push({ id: `e-${prevId}-${id}`, source: prevId, target: id })
      })
    }
  }

  return { nodes, edges }
}

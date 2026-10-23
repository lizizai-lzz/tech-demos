import type { Edge, Node } from "@xyflow/react"
import type { NovelPipelineState } from "@/pipeline/novel/types"
import type { NodeOverrides } from "@/types/studio"
import type { StudioNodeData, StudioNodeKind } from "@/lib/canvas-layout"

const X_GAP = 280
const Y_GAP = 140

export function buildNovelGraph(
  pipeline: NovelPipelineState,
  overrides: NodeOverrides
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
    const body =
      ov?.body ??
      `${pipeline.consistencyReview.summary}\n\n${formatFindings(
        pipeline.consistencyReview.findings
      )}`
    nodes.push({
      id,
      type: "studio",
      position: { x: col * X_GAP, y: 0 },
      data: {
        kind: "consistencyReview",
        stageId: "consistencyReview",
        title: ov?.title ?? "一致性审核",
        body,
        subtitle: pipeline.consistencyReview.summary,
      },
    })
    edges.push({ id: `e-${prevId}-${id}`, source: prevId, target: id })
    prevId = id
    col++
  }

  if (pipeline.sensitivityReview) {
    const id = "node-sensitivity-review"
    const ov = overrides[id]
    const body =
      ov?.body ??
      `${pipeline.sensitivityReview.summary}\n\n${formatFindings(
        pipeline.sensitivityReview.findings
      )}`
    nodes.push({
      id,
      type: "studio",
      position: { x: col * X_GAP, y: 0 },
      data: {
        kind: "sensitivityReview",
        stageId: "sensitivityReview",
        title: ov?.title ?? "敏感话题",
        body,
        subtitle: pipeline.sensitivityReview.summary,
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
    nodes.push({
      id,
      type: "studio",
      position: { x: col * X_GAP, y: 0 },
      data: {
        kind: "aiTasteGate",
        stageId: "aiTasteGate",
        title: ov?.title ?? "去AI味",
        body,
        subtitle: `${ai.score} 分`,
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
    nodes.push({
      id,
      type: "studio",
      position: { x: col * X_GAP, y: 0 },
      data: {
        kind: "qualityVerdict",
        stageId: "qualityVerdict",
        title: ov?.title ?? "质检裁定",
        body,
        subtitle: v.verdict,
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
          },
        })
        edges.push({ id: `e-${prevId}-${id}`, source: prevId, target: id })
      })
    }
  }

  return { nodes, edges }
}

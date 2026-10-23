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
    })
  }

  return { nodes, edges }
}

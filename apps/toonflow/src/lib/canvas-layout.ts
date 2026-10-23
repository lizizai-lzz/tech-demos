import type { Edge, Node } from "@xyflow/react"
import type { PipelineState } from "@/pipeline/types"
import type { NodeOverrides, RunnerStatus } from "@/types/studio"

export type StudioNodeKind =
  | "source"
  | "outline"
  | "character"
  | "script"
  | "storyboard"
  | "world"
  | "chapterOutline"
  | "chapterProse"
  | "consistencyReview"
  | "sensitivityReview"
  | "aiTasteGate"
  | "qualityVerdict"
  | "rewrite"
  | "chapterProseRevised"

export type NodeVisualStatus = "pending" | "generating" | "done"

export type StatusChipTone = "success" | "warning" | "destructive" | "neutral"

export interface StatusChip {
  label: string
  tone: StatusChipTone
}

export interface GraphBuildContext {
  status: RunnerStatus
  currentStageId: string | null
}

export interface StudioNodeData extends Record<string, unknown> {
  kind: StudioNodeKind
  title: string
  subtitle?: string
  body: string
  stageId?: string
  entityId?: string
  frameColor?: string
  visualStatus?: NodeVisualStatus
  statusChip?: StatusChip
  sheetExtras?: string[]
  /** 改写节点：初稿对照 */
  draftBody?: string
  /** 改写节点：终稿对照 */
  revisedBody?: string
}

function visualForStage(
  stageId: string | undefined,
  ctx: GraphBuildContext
): NodeVisualStatus {
  if (!stageId) return "done"
  if (
    ctx.status === "running" &&
    ctx.currentStageId === stageId
  ) {
    return "generating"
  }
  return "done"
}

const X_GAP = 280
const Y_GAP = 140

export function buildGraph(
  pipeline: PipelineState,
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
      title: sourceOverride?.title ?? "原文片段",
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

  if (pipeline.outline) {
    const id = "node-outline"
    const ov = overrides[id]
    const body =
      ov?.body ??
      pipeline.outline.bullets.map((b, i) => `${i + 1}. ${b}`).join("\n")
    nodes.push({
      id,
      type: "studio",
      position: { x: col * X_GAP, y: 0 },
      data: {
        kind: "outline",
        stageId: "outline",
        title: ov?.title ?? "故事大纲",
        body,
        subtitle: `${pipeline.outline.bullets.length} 条事件`,
        visualStatus: visualForStage("outline", ctx),
      },
    })
    edges.push({ id: `e-${prevId}-${id}`, source: prevId, target: id })
    prevId = id
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

  if (pipeline.script?.length) {
    pipeline.script.forEach((beat, i) => {
      const id = `node-script-${beat.id}`
      const ov = overrides[id]
      const body = ov?.body ?? beat.dialogue.join("\n")
      nodes.push({
        id,
        type: "studio",
        position: { x: col * X_GAP, y: (i - 1) * Y_GAP },
        data: {
          kind: "script",
          stageId: "script",
          entityId: beat.id,
          title: ov?.title ?? beat.title,
          body,
          subtitle: beat.location,
          visualStatus: visualForStage("script", ctx),
        },
      })
      edges.push({ id: `e-${prevId}-${id}`, source: prevId, target: id })
    })
    prevId = `node-script-${pipeline.script[0].id}`
    col++
  }

  if (pipeline.storyboard?.length) {
    pipeline.storyboard.forEach((card, i) => {
      const id = `node-sb-${card.beatId}`
      const ov = overrides[id]
      const body = ov?.body ?? card.promptText
      nodes.push({
        id,
        type: "studio",
        position: { x: col * X_GAP, y: (i - 1) * Y_GAP },
        data: {
          kind: "storyboard",
          stageId: "storyboard",
          entityId: card.beatId,
          title: ov?.title ?? `分镜 · ${card.shotType}`,
          body,
          subtitle: card.shotType,
          frameColor: card.frameColor,
          visualStatus: visualForStage("storyboard", ctx),
        },
      })
      edges.push({ id: `e-${prevId}-${id}`, source: prevId, target: id })
    })
  }

  return { nodes, edges }
}

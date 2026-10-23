import type { PipelineStage } from "@/pipeline/types"

export interface NodeOverride {
  title?: string
  body?: string
}

export type NodeOverrides = Record<string, NodeOverride>

export type RunnerStatus = "idle" | "running" | "paused" | "done"

export interface SelectedNode {
  id: string
  kind: string
  title: string
  body: string
  stageId?: PipelineStage
}

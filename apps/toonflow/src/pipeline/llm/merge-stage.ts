import { STAGE_ORDER, type PipelineStage, type PipelineState } from "@/pipeline/types"
import {
  NOVEL_STAGE_ORDER,
  type NovelPipelineStage,
  type NovelPipelineState,
} from "@/pipeline/novel/types"

export function mergeDramaStage(
  state: PipelineState,
  stage: PipelineStage,
  patch: Partial<PipelineState>
): PipelineState {
  const completedStages = [...state.completedStages]
  if (!completedStages.includes(stage)) completedStages.push(stage)
  completedStages.sort(
    (a, b) => STAGE_ORDER.indexOf(a) - STAGE_ORDER.indexOf(b)
  )
  return { ...state, ...patch, completedStages }
}

export function mergeNovelStage(
  state: NovelPipelineState,
  stage: NovelPipelineStage,
  patch: Partial<NovelPipelineState>
): NovelPipelineState {
  const completedStages = [...state.completedStages]
  if (!completedStages.includes(stage)) completedStages.push(stage)
  completedStages.sort(
    (a, b) => NOVEL_STAGE_ORDER.indexOf(a) - NOVEL_STAGE_ORDER.indexOf(b)
  )
  return { ...state, ...patch, completedStages }
}

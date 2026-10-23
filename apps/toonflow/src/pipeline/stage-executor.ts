import type { ModelSettings } from "@/lib/model-settings"
import { isLiveModelReady } from "@/lib/model-settings"
import {
  clearFromStage,
  regenerateNode,
  runStage,
} from "@/pipeline/run"
import type { PipelineStage, PipelineState } from "@/pipeline/types"
import {
  clearFromNovelStage,
  regenerateNovelNode,
  runNovelStage,
} from "@/pipeline/novel/run"
import type {
  NovelPipelineStage,
  NovelPipelineState,
} from "@/pipeline/novel/types"
import { runDramaStageLive } from "@/pipeline/llm/drama-live"
import { runNovelStageLive } from "@/pipeline/llm/novel-live"

export async function executeDramaStage(
  state: PipelineState,
  stage: PipelineStage,
  seed: number,
  settings: ModelSettings
): Promise<PipelineState> {
  if (settings.runMode === "live" && isLiveModelReady(settings)) {
    return runDramaStageLive(state, stage, settings)
  }
  return runStage(state, stage, seed)
}

export async function executeNovelStage(
  state: NovelPipelineState,
  stage: NovelPipelineStage,
  seed: number,
  settings: ModelSettings
): Promise<NovelPipelineState> {
  if (settings.runMode === "live" && isLiveModelReady(settings)) {
    return runNovelStageLive(state, stage, settings)
  }
  return runNovelStage(state, stage, seed)
}

export async function regenerateDramaStage(
  state: PipelineState,
  stage: PipelineStage,
  seed: number,
  settings: ModelSettings
): Promise<PipelineState> {
  if (settings.runMode === "live" && isLiveModelReady(settings)) {
    const cleared = clearFromStage(state, stage)
    return runDramaStageLive(cleared, stage, settings)
  }
  return regenerateNode(state, stage, seed)
}

export async function regenerateNovelStage(
  state: NovelPipelineState,
  stage: NovelPipelineStage,
  seed: number,
  settings: ModelSettings
): Promise<NovelPipelineState> {
  if (settings.runMode === "live" && isLiveModelReady(settings)) {
    const cleared = clearFromNovelStage(state, stage)
    return runNovelStageLive(cleared, stage, settings)
  }
  return regenerateNovelNode(state, stage, seed)
}

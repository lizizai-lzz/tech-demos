import type { ModelSettings } from "@/lib/model-settings"
import { isLiveModelReady } from "@/lib/model-settings"
import type { MediaSettings } from "@/lib/media/media-settings"
import { enrichStoryboardWithMedia } from "@/pipeline/media/storyboard-media"
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
  settings: ModelSettings,
  media?: MediaSettings
): Promise<PipelineState> {
  let next: PipelineState
  if (settings.runMode === "live" && isLiveModelReady(settings)) {
    next = await runDramaStageLive(state, stage, settings)
  } else {
    next = runStage(state, stage, seed)
  }
  return maybeEnrichStoryboard(next, stage, media)
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

async function maybeEnrichStoryboard(
  state: PipelineState,
  stage: PipelineStage,
  media?: MediaSettings
): Promise<PipelineState> {
  if (stage !== "storyboard" || !media) return state
  const needsJimeng =
    media.imageProvider === "jimeng" || media.videoProvider === "jimeng"
  if (!needsJimeng) return state
  return enrichStoryboardWithMedia(state, media)
}

export async function regenerateDramaStage(
  state: PipelineState,
  stage: PipelineStage,
  seed: number,
  settings: ModelSettings,
  media?: MediaSettings
): Promise<PipelineState> {
  let next: PipelineState
  if (settings.runMode === "live" && isLiveModelReady(settings)) {
    const cleared = clearFromStage(state, stage)
    next = await runDramaStageLive(cleared, stage, settings)
  } else {
    next = regenerateNode(state, stage, seed)
  }
  return maybeEnrichStoryboard(next, stage, media)
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

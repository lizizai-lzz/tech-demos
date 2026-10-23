import { identifyCharacters } from "../characters"
import { clampSource } from "../run"
import { buildChapterOutline } from "./chapter-outline"
import { buildChapterProse } from "./chapter-prose"
import { buildWorld } from "./world"
import {
  NOVEL_STAGE_ORDER,
  type NovelPipelineArtifacts,
  type NovelPipelineStage,
  type NovelPipelineState,
} from "./types"

export function emptyNovelPipelineState(sourceText: string): NovelPipelineState {
  return {
    sourceText: clampSource(sourceText),
    completedStages: [],
  }
}

export function nextNovelStage(state: NovelPipelineState): NovelPipelineStage | null {
  for (const stage of NOVEL_STAGE_ORDER) {
    if (!state.completedStages.includes(stage)) return stage
  }
  return null
}

export function runNovelStage(
  state: NovelPipelineState,
  stage: NovelPipelineStage,
  seed = 0
): NovelPipelineState {
  const sourceText = state.sourceText
  const next: NovelPipelineState = {
    ...state,
    completedStages: [...state.completedStages],
  }

  switch (stage) {
    case "world":
      next.world = buildWorld(sourceText, seed)
      break
    case "chapterOutline":
      next.chapterOutline = buildChapterOutline(sourceText, seed)
      break
    case "characters":
      next.characters = identifyCharacters(sourceText, seed)
      break
    case "chapterProse": {
      if (!next.chapterOutline)
        next.chapterOutline = buildChapterOutline(sourceText, seed)
      if (!next.characters) next.characters = identifyCharacters(sourceText, seed)
      const first = next.chapterOutline.chapters[0]
      next.chapterProse = buildChapterProse(
        first,
        next.characters,
        sourceText,
        seed
      )
      break
    }
  }

  if (!next.completedStages.includes(stage)) {
    next.completedStages.push(stage)
  }
  next.completedStages.sort(
    (a, b) => NOVEL_STAGE_ORDER.indexOf(a) - NOVEL_STAGE_ORDER.indexOf(b)
  )
  return next
}

export function runFullNovelPipeline(
  sourceText: string,
  seed = 0
): NovelPipelineArtifacts {
  let state = emptyNovelPipelineState(sourceText)
  for (const stage of NOVEL_STAGE_ORDER) {
    state = runNovelStage(state, stage, seed)
  }
  return {
    sourceText: state.sourceText,
    world: state.world!,
    chapterOutline: state.chapterOutline!,
    characters: state.characters!,
    chapterProse: state.chapterProse!,
  }
}

function clearFromNovelStage(
  state: NovelPipelineState,
  stage: NovelPipelineStage
): NovelPipelineState {
  const idx = NOVEL_STAGE_ORDER.indexOf(stage)
  const completedStages = state.completedStages.filter(
    (s) => NOVEL_STAGE_ORDER.indexOf(s) < idx
  )
  const next: NovelPipelineState = { ...state, completedStages }
  if (idx <= NOVEL_STAGE_ORDER.indexOf("world")) next.world = undefined
  if (idx <= NOVEL_STAGE_ORDER.indexOf("chapterOutline"))
    next.chapterOutline = undefined
  if (idx <= NOVEL_STAGE_ORDER.indexOf("characters")) next.characters = undefined
  if (idx <= NOVEL_STAGE_ORDER.indexOf("chapterProse")) next.chapterProse = undefined
  return next
}

export function regenerateNovelNode(
  state: NovelPipelineState,
  stage: NovelPipelineStage,
  seed: number
): NovelPipelineState {
  let next = clearFromNovelStage(state, stage)
  next = runNovelStage(next, stage, seed)
  for (const s of NOVEL_STAGE_ORDER) {
    if (
      NOVEL_STAGE_ORDER.indexOf(s) > NOVEL_STAGE_ORDER.indexOf(stage) &&
      state.completedStages.includes(s)
    ) {
      next = runNovelStage(next, s, seed)
    }
  }
  return next
}

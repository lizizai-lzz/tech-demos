import { extractOutline } from "./extract"
import { identifyCharacters } from "./characters"
import { adaptScript } from "./script"
import { buildStoryboard } from "./storyboard"
import {
  STAGE_ORDER,
  type PipelineArtifacts,
  type PipelineStage,
  type PipelineState,
} from "./types"

export function clampSource(text: string, max = 800): string {
  return text.trim().slice(0, max)
}

export function emptyPipelineState(sourceText: string): PipelineState {
  return {
    sourceText: clampSource(sourceText),
    completedStages: [],
  }
}

export function nextStage(state: PipelineState): PipelineStage | null {
  for (const stage of STAGE_ORDER) {
    if (!state.completedStages.includes(stage)) return stage
  }
  return null
}

export function runStage(
  state: PipelineState,
  stage: PipelineStage,
  seed = 0
): PipelineState {
  const sourceText = state.sourceText
  const next: PipelineState = {
    ...state,
    completedStages: [...state.completedStages],
  }

  switch (stage) {
    case "outline": {
      next.outline = extractOutline(sourceText, seed)
      break
    }
    case "characters": {
      next.characters = identifyCharacters(sourceText, seed)
      break
    }
    case "script": {
      if (!next.outline) next.outline = extractOutline(sourceText, seed)
      if (!next.characters) next.characters = identifyCharacters(sourceText, seed)
      next.script = adaptScript(next.outline, next.characters, sourceText, seed)
      break
    }
    case "storyboard": {
      if (!next.outline) next.outline = extractOutline(sourceText, seed)
      if (!next.characters) next.characters = identifyCharacters(sourceText, seed)
      if (!next.script)
        next.script = adaptScript(next.outline, next.characters, sourceText, seed)
      next.storyboard = buildStoryboard(next.script, seed)
      break
    }
  }

  if (!next.completedStages.includes(stage)) {
    next.completedStages.push(stage)
  }
  next.completedStages.sort(
    (a, b) => STAGE_ORDER.indexOf(a) - STAGE_ORDER.indexOf(b)
  )
  return next
}

export function runFullPipeline(sourceText: string, seed = 0): PipelineArtifacts {
  let state = emptyPipelineState(sourceText)
  for (const stage of STAGE_ORDER) {
    state = runStage(state, stage, seed)
  }
  return {
    sourceText: state.sourceText,
    outline: state.outline!,
    characters: state.characters!,
    script: state.script!,
    storyboard: state.storyboard!,
  }
}

function clearFromStage(state: PipelineState, stage: PipelineStage): PipelineState {
  const idx = STAGE_ORDER.indexOf(stage)
  const completedStages = state.completedStages.filter(
    (s) => STAGE_ORDER.indexOf(s) < idx
  )
  const next: PipelineState = { ...state, completedStages }
  if (idx <= STAGE_ORDER.indexOf("outline")) next.outline = undefined
  if (idx <= STAGE_ORDER.indexOf("characters")) next.characters = undefined
  if (idx <= STAGE_ORDER.indexOf("script")) next.script = undefined
  if (idx <= STAGE_ORDER.indexOf("storyboard")) next.storyboard = undefined
  return next
}

export function regenerateNode(
  state: PipelineState,
  stage: PipelineStage,
  seed: number
): PipelineState {
  let next = clearFromStage(state, stage)
  next = runStage(next, stage, seed)
  for (const s of STAGE_ORDER) {
    if (
      STAGE_ORDER.indexOf(s) > STAGE_ORDER.indexOf(stage) &&
      state.completedStages.includes(s)
    ) {
      next = runStage(next, s, seed)
    }
  }
  return next
}

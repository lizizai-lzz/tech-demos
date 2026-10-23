import { identifyCharacters } from "../characters"
import { clampSource } from "../run"
import { runAiTasteGate } from "./ai-taste-gate"
import { buildChapterOutline } from "./chapter-outline"
import { buildChapterProse } from "./chapter-prose"
import { runConsistencyReview } from "./consistency-review"
import { buildQualityVerdict } from "./quality-verdict"
import { runPunchReview } from "./punch-review"
import { rewriteChapterProse } from "./rewrite-chapter"
import { runSensitivityReview } from "./sensitivity-review"
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

function ensureChapterDeps(
  next: NovelPipelineState,
  sourceText: string,
  seed: number
) {
  if (!next.chapterOutline) next.chapterOutline = buildChapterOutline(sourceText, seed)
  if (!next.characters) next.characters = identifyCharacters(sourceText, seed)
  if (!next.world) next.world = buildWorld(sourceText, seed)
}

export function runNovelStage(
  state: NovelPipelineState,
  stage: NovelPipelineStage,
  seed = 0
): NovelPipelineState {
  const sourceText = state.sourceText
  let next: NovelPipelineState = {
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
      ensureChapterDeps(next, sourceText, seed)
      const first = next.chapterOutline!.chapters[0]
      next.chapterProse = buildChapterProse(
        first,
        next.characters!,
        sourceText,
        seed
      )
      break
    }
    case "consistencyReview": {
      ensureChapterDeps(next, sourceText, seed)
      if (!next.chapterProse) {
        const first = next.chapterOutline!.chapters[0]
        next.chapterProse = buildChapterProse(
          first,
          next.characters!,
          sourceText,
          seed
        )
      }
      const first = next.chapterOutline!.chapters[0]
      next.consistencyReview = runConsistencyReview(
        next.chapterProse,
        next.world!,
        next.characters!,
        first,
        sourceText
      )
      break
    }
    case "sensitivityReview": {
      if (!next.chapterProse) {
        ensureChapterDeps(next, sourceText, seed)
        const first = next.chapterOutline!.chapters[0]
        next.chapterProse = buildChapterProse(
          first,
          next.characters!,
          sourceText,
          seed
        )
      }
      next.sensitivityReview = runSensitivityReview(next.chapterProse, sourceText)
      break
    }
    case "aiTasteGate": {
      if (!next.chapterProse) {
        ensureChapterDeps(next, sourceText, seed)
        const first = next.chapterOutline!.chapters[0]
        next.chapterProse = buildChapterProse(
          first,
          next.characters!,
          sourceText,
          seed
        )
      }
      next.aiTasteGate = runAiTasteGate(next.chapterProse)
      break
    }
    case "qualityVerdict": {
      if (!next.consistencyReview || !next.sensitivityReview || !next.aiTasteGate) {
        next = runNovelStage(next, "consistencyReview", seed)
        next = runNovelStage(next, "sensitivityReview", seed)
        next = runNovelStage(next, "aiTasteGate", seed)
      }
      if (!next.chapterOutline) {
        ensureChapterDeps(next, sourceText, seed)
      }
      const firstChapter = next.chapterOutline!.chapters[0]
      next.punchReview = runPunchReview(
        next.chapterProse!,
        firstChapter,
        sourceText
      )
      next.qualityVerdict = buildQualityVerdict(
        next.consistencyReview!,
        next.sensitivityReview!,
        next.aiTasteGate!,
        next.punchReview
      )
      break
    }
    case "rewrite": {
      if (!next.qualityVerdict) {
        next = runNovelStage(next, "qualityVerdict", seed)
      }
      if (!next.chapterProse) {
        ensureChapterDeps(next, sourceText, seed)
        const first = next.chapterOutline!.chapters[0]
        next.chapterProse = buildChapterProse(
          first,
          next.characters!,
          sourceText,
          seed
        )
      }
      next.chapterProseFinal = rewriteChapterProse(
        next.chapterProse,
        next.qualityVerdict!
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
  const draft = state.chapterProse!
  const final = state.chapterProseFinal ?? draft
  return {
    sourceText: state.sourceText,
    world: state.world!,
    chapterOutline: state.chapterOutline!,
    characters: state.characters!,
    chapterProse: final,
    chapterProseDraft: draft,
    consistencyReview: state.consistencyReview!,
    sensitivityReview: state.sensitivityReview!,
    aiTasteGate: state.aiTasteGate!,
    qualityVerdict: state.qualityVerdict!,
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
  if (idx <= NOVEL_STAGE_ORDER.indexOf("chapterProse")) {
    next.chapterProse = undefined
    next.chapterProseFinal = undefined
  }
  if (idx <= NOVEL_STAGE_ORDER.indexOf("consistencyReview"))
    next.consistencyReview = undefined
  if (idx <= NOVEL_STAGE_ORDER.indexOf("sensitivityReview"))
    next.sensitivityReview = undefined
  if (idx <= NOVEL_STAGE_ORDER.indexOf("aiTasteGate")) next.aiTasteGate = undefined
  if (idx <= NOVEL_STAGE_ORDER.indexOf("qualityVerdict")) {
    next.qualityVerdict = undefined
    next.punchReview = undefined
  }
  if (idx <= NOVEL_STAGE_ORDER.indexOf("rewrite")) next.chapterProseFinal = undefined
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

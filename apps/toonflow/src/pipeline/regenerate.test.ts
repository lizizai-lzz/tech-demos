import { describe, expect, test } from "bun:test"
import { getSampleById } from "./samples"
import {
  emptyPipelineState,
  regenerateNode,
  runStage,
} from "./run"
import { getNovelSampleById } from "./samples"
import {
  emptyNovelPipelineState,
  regenerateNovelNode,
  runNovelStage,
} from "./novel/run"

describe("regenerate clears downstream", () => {
  test("drama: regen outline drops script and storyboard", () => {
    const text = getSampleById("rain-alley").excerpt
    let state = emptyPipelineState(text)
    state = runStage(state, "outline")
    state = runStage(state, "characters")
    state = runStage(state, "script")
    state = runStage(state, "storyboard")
    expect(state.storyboard?.length).toBeGreaterThan(0)

    const regen = regenerateNode(state, "outline", 1)
    expect(regen.outline).toBeDefined()
    expect(regen.script).toBeUndefined()
    expect(regen.storyboard).toBeUndefined()
    expect(regen.completedStages).toEqual(["outline"])
  })

  test("novel: regen chapterOutline drops rewrite", () => {
    const text = getNovelSampleById("campus-underworld").excerpt
    let state = emptyNovelPipelineState(text)
    for (const stage of [
      "world",
      "chapterOutline",
      "characters",
      "chapterProse",
      "consistencyReview",
      "sensitivityReview",
      "aiTasteGate",
      "qualityVerdict",
      "rewrite",
    ] as const) {
      state = runNovelStage(state, stage)
    }
    expect(state.chapterProseFinal).toBeDefined()

    const regen = regenerateNovelNode(state, "chapterOutline", 2)
    expect(regen.chapterOutline).toBeDefined()
    expect(regen.consistencyReview).toBeUndefined()
    expect(regen.qualityVerdict).toBeUndefined()
    expect(regen.chapterProseFinal).toBeUndefined()
    expect(regen.completedStages).toEqual(["world", "chapterOutline"])
  })
})

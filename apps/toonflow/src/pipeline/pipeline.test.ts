import { describe, expect, test } from "bun:test"
import { getSampleById } from "./samples"
import { emptyPipelineState, nextStage, runFullPipeline, runStage } from "./index"
import { STAGE_ORDER } from "./types"

describe("pipeline stage ordering", () => {
  test("stages complete in fixed order", () => {
    const text = getSampleById("rain-alley").excerpt
    let state = emptyPipelineState(text)
    const seen: string[] = []
    while (true) {
      const stage = nextStage(state)
      if (!stage) break
      seen.push(stage)
      state = runStage(state, stage)
    }
    expect(seen).toEqual(STAGE_ORDER)
  })
})

describe("character bounds", () => {
  test("produces 2–4 characters", () => {
    for (const sample of ["rain-alley", "midnight-diner", "rooftop-signal"]) {
      const art = runFullPipeline(getSampleById(sample).excerpt)
      expect(art.characters.length).toBeGreaterThanOrEqual(2)
      expect(art.characters.length).toBeLessThanOrEqual(4)
    }
  })
})

describe("storyboard alignment", () => {
  test("one storyboard card per script beat", () => {
    const art = runFullPipeline(getSampleById("midnight-diner").excerpt)
    expect(art.script.length).toBeGreaterThanOrEqual(3)
    expect(art.script.length).toBeLessThanOrEqual(5)
    expect(art.storyboard.length).toBe(art.script.length)
    const beatIds = new Set(art.script.map((b) => b.id))
    for (const card of art.storyboard) {
      expect(beatIds.has(card.beatId)).toBe(true)
    }
  })
})

import { describe, expect, test } from "bun:test"
import { getNovelSampleById } from "../samples"
import {
  emptyNovelPipelineState,
  nextNovelStage,
  runFullNovelPipeline,
  runNovelStage,
} from "./run"
import { NOVEL_STAGE_ORDER } from "./types"

describe("novel pipeline stage ordering", () => {
  test("stages complete in fixed order", () => {
    const text = getNovelSampleById("campus-underworld").excerpt
    let state = emptyNovelPipelineState(text)
    const seen: string[] = []
    while (true) {
      const stage = nextNovelStage(state)
      if (!stage) break
      seen.push(stage)
      state = runNovelStage(state, stage)
    }
    expect(seen).toEqual(NOVEL_STAGE_ORDER)
  })
})

describe("novel chapter outline bounds", () => {
  test("produces 3–5 chapters", () => {
    for (const id of ["campus-underworld", "ink-mountain"]) {
      const art = runFullNovelPipeline(getNovelSampleById(id).excerpt)
      expect(art.chapterOutline.chapters.length).toBeGreaterThanOrEqual(3)
      expect(art.chapterOutline.chapters.length).toBeLessThanOrEqual(5)
    }
  })
})

describe("novel prose alignment", () => {
  test("sample chapter matches first chapter outline id", () => {
    const art = runFullNovelPipeline(getNovelSampleById("ink-mountain").excerpt)
    const first = art.chapterOutline.chapters[0]
    expect(art.chapterProse.chapterId).toBe(first.id)
    expect(art.chapterProse.sections.length).toBeGreaterThanOrEqual(3)
    expect(art.characters.length).toBeGreaterThanOrEqual(2)
    expect(art.characters.length).toBeLessThanOrEqual(4)
  })
})

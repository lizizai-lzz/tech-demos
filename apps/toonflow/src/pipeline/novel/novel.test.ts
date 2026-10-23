import { describe, expect, test } from "bun:test"
import { getNovelSampleById } from "../samples"
import {
  emptyNovelPipelineState,
  nextNovelStage,
  runFullNovelPipeline,
  runNovelStage,
} from "./run"
import { NOVEL_STAGE_ORDER } from "./types"
import { flattenChapterProse } from "./prose-utils"
import { runSensitivityReview } from "./sensitivity-review"
import { buildChapterProse } from "./chapter-prose"
import { buildChapterOutline } from "./chapter-outline"
import { buildWorld } from "./world"
import { identifyCharacters } from "../characters"

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
    expect(art.chapterProseDraft.chapterId).toBe(first.id)
    expect(art.chapterProse.sections.length).toBeGreaterThanOrEqual(3)
    expect(art.characters.length).toBeGreaterThanOrEqual(2)
    expect(art.characters.length).toBeLessThanOrEqual(4)
  })
})

describe("novel quality review loop", () => {
  test("martial campus: punch/ai drive rewrite, violence not sensitivity-blocked", () => {
    const text = getNovelSampleById("campus-underworld").excerpt
    const art = runFullNovelPipeline(text)
    const first = art.chapterOutline.chapters[0]

    expect(art.world.martialSystem).toMatch(/入门|杀拳|怪力/)
    expect(art.world.martialSystem).not.toMatch(/灵力|丹药|开脉/)
    expect(art.world.factions?.length).toBeGreaterThanOrEqual(2)
    expect(first.title).toMatch(/炼狱|禁闭|青龙|反杀|黑市/)

    expect(
      art.sensitivityReview.findings.some((f) => f.severity === "block")
    ).toBe(false)
    expect(art.qualityVerdict.verdict).not.toBe("accept")
    expect(art.qualityVerdict.inputs.punchScore).toBeLessThan(90)
    expect(art.aiTasteGate.score).toBeLessThan(85)

    expect(art.chapterProse.chapterId).toBe(first.id)
    expect(art.chapterProseDraft.chapterId).toBe(first.id)

    const draftText = flattenChapterProse(art.chapterProseDraft)
    const finalText = flattenChapterProse(art.chapterProse)
    expect(finalText).not.toBe(draftText)
    expect(finalText.includes("目光深邃")).toBe(false)
    expect(/反杀|堂口|禁闭|杀拳|炼狱/.test(finalText)).toBe(true)
    expect(finalText.includes("灵力")).toBe(false)
    expect(finalText.includes("交给老师")).toBe(false)
  })

  test("sensitivity allows kidnapping and training-hell tropes", () => {
    const text = getNovelSampleById("campus-underworld").excerpt
    const outline = buildChapterOutline(text)
    const chars = identifyCharacters(text)
    const prose = buildChapterProse(outline.chapters[0], chars, text)
    const sens = runSensitivityReview(prose, text)
    expect(sens.findings.some((f) => f.severity === "block")).toBe(false)
  })

  test("sensitivity blocks under-18 framing and real crime how-to", () => {
    const fake = {
      chapterId: "ch-1",
      chapterTitle: "测",
      sections: [
        {
          id: "s",
          heading: "h",
          paragraphs: [
            "十七岁的他按照第一步配比原料、第二步合成炸药，详细写下教程。",
          ],
        },
      ],
    }
    const sens = runSensitivityReview(fake, "")
    expect(sens.findings.some((f) => f.severity === "block")).toBe(true)
  })
})

describe("martial world consistency", () => {
  test("world rules reference factions and human ranks not xianxia", () => {
    const text = getNovelSampleById("campus-underworld").excerpt
    const world = buildWorld(text)
    expect(world.rules.join("")).not.toMatch(/保卫科|家长群|校规/)
    expect(world.rules.join("")).toMatch(/堂口|拳场|杀拳|禁闭/)
    expect(world.rules.join("")).not.toMatch(/灵力|丹药|元婴/)
  })
})

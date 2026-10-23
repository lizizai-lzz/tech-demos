import type { ChapterOutlineItem } from "./types"
import type { CharacterCard } from "../types"
import type { ChapterProseResult, ProseSection } from "./types"

export function buildChapterProse(
  chapter: ChapterOutlineItem,
  characters: CharacterCard[],
  sourceText: string,
  seed = 0
): ChapterProseResult {
  const lead = characters[0]?.name ?? "主角"
  const rival = characters[1]?.name ?? "对手"
  const snippet =
    sourceText.replace(/\s+/g, "").slice(0, 40) || "风雨将至的傍晚"

  const sections: ProseSection[] = [
    {
      id: "sec-opening",
      heading: "第一节 · 场景",
      paragraphs: [
        `${chapter.summary}`,
        `${lead}站在风口，想起${snippet}。${chapter.keyBeats[0]}。`,
      ],
    },
    {
      id: "sec-conflict",
      heading: "第二节 · 冲突",
      paragraphs: [
        `${rival}的话音未落，空气像被拧紧。${chapter.keyBeats[1]}。`,
        `「这不是输赢的问题。」${lead}低声说，「是我们要不要还相信同一条规则。」`,
      ],
    },
    {
      id: "sec-hook",
      heading: "第三节 · 落钩",
      paragraphs: [
        `${chapter.keyBeats[2]}。`,
        `夜色降下来时，${lead}把未寄出的信折好——读者此刻知道的，比任何角色都多一点点。`,
      ],
    },
  ]

  if (seed % 3 === 1) {
    sections.push({
      id: "sec-coda",
      heading: "第四节 · 余韵",
      paragraphs: [
        `远处传来${seed % 2 === 0 ? "操场哨声" : "街灯电流声"}，像给本章盖章。`,
      ],
    })
  }

  return {
    chapterId: chapter.id,
    chapterTitle: chapter.title,
    sections,
  }
}

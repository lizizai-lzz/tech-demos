import type { ChapterOutlineItem } from "./types"
import type { CharacterCard } from "../types"
import type { ChapterProseResult, ProseSection } from "./types"
import { isMartialCampusUnderworld } from "./genre"

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
  const martial = isMartialCampusUnderworld(sourceText)

  if (martial) {
    const sections: ProseSection[] = [
      {
        id: "sec-opening",
        heading: "第一节 · 地下",
        paragraphs: [
          `${chapter.summary}`,
          `铁门一落，${lead}被按在沙袋上。腹肌抽搐，汗咸得像血。`,
          `他的目光深邃，仿佛能看穿人心。这一刻，他忽然明白，成长从来不是一蹴而就的童话。首先，你要学会忍耐；其次，你要学会放手；最后，你要学会与自己和解。`,
        ],
      },
      {
        id: "sec-conflict",
        heading: "第二节 · 堂口",
        paragraphs: [
          `${rival}踩着会印进来：「青龙会要的杀拳架势，今晚得练出来。」`,
          `「这不是输赢的问题。」${lead}低声说，「是我们要不要还相信同一条规则。」`,
          `${chapter.keyBeats[1]}。${snippet}像烙在墙上，洗不掉。`,
        ],
      },
      {
        id: "sec-hook",
        heading: "第三节 · 反杀",
        paragraphs: [
          `禁闭仓外有人放风：白虎馆要来抢场。${lead}咬破舌尖，熟手硬顶半格。`,
          `${chapter.keyBeats[2]}。他反手扣住${rival}手腕：「你想关我炼狱？先算算断几根肋。」`,
        ],
      },
    ]
    if (seed % 3 === 1) {
      sections.push({
        id: "sec-coda",
        heading: "第四节 · 血账",
        paragraphs: [`地下拳场的灯晃了一下。${lead}知道，今晚的反杀只是开始。`],
      })
    }
    return {
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      sections,
    }
  }

  const sections: ProseSection[] = [
    {
      id: "sec-opening",
      heading: "第一节 · 场景",
      paragraphs: [
        `${chapter.summary}`,
        `${lead}站在风口，想起${snippet}。${chapter.keyBeats[0]}。`,
        `他的目光深邃，仿佛能看穿人心。这一刻，他忽然明白，成长从来不是一蹴而就的童话。首先，你要学会忍耐；其次，你要学会放手；最后，你要学会与自己和解。`,
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

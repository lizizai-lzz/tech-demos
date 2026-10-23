import { chatCompletionJson } from "@/lib/openai-chat"
import type { ModelSettings } from "@/lib/model-settings"
import type { CharacterCard } from "@/pipeline/types"
import { runNovelStage } from "@/pipeline/novel/run"
import type {
  ChapterOutlineResult,
  ChapterProseResult,
  NovelPipelineStage,
  NovelPipelineState,
  WorldResult,
} from "@/pipeline/novel/types"
import { mergeNovelStage } from "./merge-stage"

const MARTIAL_RULE =
  "若种子含地下高校/格斗题材：武学层级只能是凡人肉体极限「入门/熟手/杀拳/半格/怪力」，禁止灵气、丹药、修真、元婴等玄幻设定。"

const SYSTEM = `你是中文网文策划。只输出合法 JSON，不要 markdown。${MARTIAL_RULE}`

const REVIEW_STAGES: NovelPipelineStage[] = [
  "consistencyReview",
  "sensitivityReview",
  "aiTasteGate",
  "qualityVerdict",
  "rewrite",
]

export async function runNovelStageLive(
  state: NovelPipelineState,
  stage: NovelPipelineStage,
  settings: ModelSettings
): Promise<NovelPipelineState> {
  if (REVIEW_STAGES.includes(stage)) {
    return runNovelStage(state, stage, 0)
  }

  const sourceText = state.sourceText

  switch (stage) {
    case "world": {
      const data = await chatCompletionJson<WorldResult>(
        settings,
        SYSTEM,
        `根据种子生成世界观设定。\n种子：\n${sourceText}\n\nJSON 字段：era, setting, tone, rules(string[]), 可选 martialSystem, factions(string[])。`
      )
      if (!data.rules?.length) throw new Error("世界观 rules 为空")
      return mergeNovelStage(state, stage, {
        world: {
          era: data.era || "当代",
          setting: data.setting || "架空都市",
          tone: data.tone || "现实主义",
          rules: data.rules,
          martialSystem: data.martialSystem,
          factions: data.factions,
        },
      })
    }
    case "chapterOutline": {
      const data = await chatCompletionJson<ChapterOutlineResult>(
        settings,
        SYSTEM,
        `生成 3-5 章章纲。\n种子：\n${sourceText}\n世界观：${JSON.stringify(state.world)}\n\nJSON：{"chapters":[{"id":"ch1","title":"…","summary":"…","keyBeats":["…"]}]}`
      )
      const chapters = (data.chapters ?? []).slice(0, 5).map((ch, i) => ({
        id: ch.id || `ch${i + 1}`,
        title: ch.title || `第${i + 1}章`,
        summary: ch.summary || "待写",
        keyBeats: ch.keyBeats?.length ? ch.keyBeats : ["节拍1"],
      }))
      if (chapters.length < 3) throw new Error("章纲数量不足")
      return mergeNovelStage(state, stage, { chapterOutline: { chapters } })
    }
    case "characters": {
      const data = await chatCompletionJson<{ characters: CharacterCard[] }>(
        settings,
        SYSTEM,
        `识别 2-4 名角色。\n种子：\n${sourceText}\n\nJSON：{"characters":[{"id":"c1","name":"…","role":"…","lookTags":["…"]}]}`
      )
      const characters = (data.characters ?? []).slice(0, 4).map((c, i) => ({
        id: c.id || `c${i + 1}`,
        name: c.name || `角色${i + 1}`,
        role: c.role || "配角",
        lookTags: c.lookTags?.length ? c.lookTags : ["日常"],
      }))
      if (characters.length < 2) throw new Error("角色数量不足")
      return mergeNovelStage(state, stage, { characters })
    }
    case "chapterProse": {
      const first = state.chapterOutline?.chapters[0]
      const data = await chatCompletionJson<ChapterProseResult>(
        settings,
        SYSTEM,
        `写第一章样章正文（2-3 个小节）。\n种子：${sourceText}\n章纲：${JSON.stringify(first)}\n角色：${JSON.stringify(state.characters)}\n\nJSON：{"chapterId":"ch1","chapterTitle":"…","sections":[{"id":"p1","heading":"…","paragraphs":["段落…"]}]}`
      )
      if (!data.sections?.length) throw new Error("样章 sections 为空")
      return mergeNovelStage(state, stage, {
        chapterProse: {
          chapterId: data.chapterId || first?.id || "ch1",
          chapterTitle: data.chapterTitle || first?.title || "第一章",
          sections: data.sections,
        },
      })
    }
    default:
      return runNovelStage(state, stage, 0)
  }
}

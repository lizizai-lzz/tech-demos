import { chatCompletionJson } from "@/lib/openai-chat"
import type { ModelSettings } from "@/lib/model-settings"
import type {
  CharacterCard,
  OutlineResult,
  PipelineStage,
  PipelineState,
  SceneBeat,
  StoryboardCard,
} from "@/pipeline/types"
import { mergeDramaStage } from "./merge-stage"

const SYSTEM =
  "你是短剧编剧助手。只输出合法 JSON，不要 markdown。对白与标题使用简体中文。"

export async function runDramaStageLive(
  state: PipelineState,
  stage: PipelineStage,
  settings: ModelSettings
): Promise<PipelineState> {
  const sourceText = state.sourceText

  switch (stage) {
    case "outline": {
      const data = await chatCompletionJson<{ bullets: string[] }>(
        settings,
        SYSTEM,
        `根据种子原文生成 3-5 条章节事件大纲。\n种子：\n${sourceText}\n\nJSON 格式：{"bullets":["事件1…","事件2…"]}`
      )
      const outline: OutlineResult = {
        bullets: (data.bullets ?? []).slice(0, 5).filter(Boolean),
      }
      if (outline.bullets.length === 0) {
        throw new Error("大纲 bullets 为空")
      }
      return mergeDramaStage(state, stage, { outline })
    }
    case "characters": {
      const data = await chatCompletionJson<{ characters: CharacterCard[] }>(
        settings,
        SYSTEM,
        `从种子识别 2-4 个主要角色。\n种子：\n${sourceText}\n\nJSON：{"characters":[{"id":"c1","name":"…","role":"…","lookTags":["…"]}]}`
      )
      const characters = (data.characters ?? []).slice(0, 4).map((c, i) => ({
        id: c.id || `c${i + 1}`,
        name: c.name || `角色${i + 1}`,
        role: c.role || "配角",
        lookTags: c.lookTags?.length ? c.lookTags : ["日常造型"],
      }))
      if (characters.length < 2) throw new Error("角色数量不足")
      return mergeDramaStage(state, stage, { characters })
    }
    case "script": {
      const outline = state.outline
      const characters = state.characters
      const data = await chatCompletionJson<{ script: SceneBeat[] }>(
        settings,
        SYSTEM,
        `将大纲改编为 3-5 场剧本场次，含地点与对白数组。\n种子：${sourceText}\n大纲：${JSON.stringify(outline)}\n角色：${JSON.stringify(characters)}\n\nJSON：{"script":[{"id":"s1","title":"…","location":"…","dialogue":["…"]}]}`
      )
      const script = (data.script ?? []).slice(0, 5).map((s, i) => ({
        id: s.id || `s${i + 1}`,
        title: s.title || `第${i + 1}场`,
        location: s.location || "内景",
        dialogue: s.dialogue?.length ? s.dialogue : ["……"],
      }))
      if (script.length < 3) throw new Error("剧本场次不足")
      return mergeDramaStage(state, stage, { script })
    }
    case "storyboard": {
      const script = state.script
      const data = await chatCompletionJson<{ storyboard: StoryboardCard[] }>(
        settings,
        SYSTEM,
        `为每场生成一条分镜卡：景别 shotType、画面描述 promptText、占位色 frameColor（#RRGGBB）。\n场次：${JSON.stringify(script)}\n\nJSON：{"storyboard":[{"beatId":"s1","shotType":"中景","promptText":"…","frameColor":"#334455"}]}`
      )
      const storyboard = (data.storyboard ?? []).map((card, i) => ({
        beatId: card.beatId || script?.[i]?.id || `s${i + 1}`,
        shotType: card.shotType || "中景",
        promptText: card.promptText || "画面描述",
        frameColor: card.frameColor || "#445566",
      }))
      if (!storyboard.length) throw new Error("分镜为空")
      return mergeDramaStage(state, stage, { storyboard })
    }
    default:
      throw new Error(`未知短剧阶段：${stage}`)
  }
}

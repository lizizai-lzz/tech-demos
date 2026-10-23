import { JimengClientError, jimengGenerateImage, jimengGenerateVideo } from "@/lib/media/jimeng-client"
import type { MediaSettings } from "@/lib/media/media-settings"
import { jimengConfigError } from "@/lib/media/media-settings"
import type { PipelineState } from "@/pipeline/types"

export async function enrichStoryboardWithMedia(
  state: PipelineState,
  media: MediaSettings
): Promise<PipelineState> {
  if (!state.storyboard?.length) return state
  const cards = [...state.storyboard]
  let changed = false

  for (let i = 0; i < cards.length; i++) {
    const card = { ...cards[i] }

    try {
      if (media.imageProvider === "jimeng" && !card.imageUrl) {
        const err = jimengConfigError(media, "image")
        if (err) throw new JimengClientError(err, "config")
        const result = await jimengGenerateImage(media.jimeng, {
          prompt: card.promptText,
          reqKey: media.jimeng.imageReqKey,
          aspectRatio: media.jimeng.aspectRatio,
        })
        if (result.imageUrls[0]) {
          card.imageUrl = result.imageUrls[0]
          card.mediaMock = result.mock
        }
      }

      if (media.videoProvider === "jimeng" && !card.videoUrl) {
        const err = jimengConfigError(media, "video")
        if (err) throw new JimengClientError(err, "config")
        const result = await jimengGenerateVideo(media.jimeng, {
          prompt: card.promptText,
          reqKey: media.jimeng.videoReqKey,
          aspectRatio: media.jimeng.aspectRatio,
          frames: media.jimeng.frames,
          imageUrls: card.imageUrl ? [card.imageUrl] : undefined,
        })
        if (result.videoUrl) {
          card.videoUrl = result.videoUrl
          card.mediaMock = result.mock
        }
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "媒资生成失败"
      card.mediaError = message
      cards[i] = card
      changed = true
      return { ...state, storyboard: cards }
    }

    cards[i] = card
    changed = true
  }

  if (!changed) return state
  return { ...state, storyboard: cards }
}

export function storyboardMediaSummary(media: MediaSettings): string {
  return `生图：${label(media.imageProvider)} · 生视频：${label(media.videoProvider)}`
}

function label(p: MediaSettings["imageProvider"]): string {
  switch (p) {
    case "off":
      return "关闭"
    case "skill":
      return "Skill"
    case "jimeng":
      return "即梦"
  }
}

export function markSkillExported(
  state: PipelineState,
  beatId: string
): PipelineState {
  if (!state.storyboard) return state
  const storyboard = state.storyboard.map((c) =>
    c.beatId === beatId
      ? { ...c, skillJobExportedAt: new Date().toISOString() }
      : c
  )
  return { ...state, storyboard }
}

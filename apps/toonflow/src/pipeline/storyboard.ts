import type { SceneBeat, StoryboardCard } from "./types"

const SHOT_TYPES = ["远景建立", "中景对话", "近景情绪", "过肩镜头", "俯拍转场"]
const FRAME_COLORS = [
  "#c4b5fd",
  "#93c5fd",
  "#fda4af",
  "#fcd34d",
  "#86efac",
  "#a5b4fc",
]

export function buildStoryboard(script: SceneBeat[], seed = 0): StoryboardCard[] {
  return script.map((beat, i) => ({
    beatId: beat.id,
    shotType: SHOT_TYPES[(i + seed) % SHOT_TYPES.length],
    promptText: `${beat.location}，${beat.title}。${beat.dialogue[0]}。电影感，浅景深，中文短剧竖屏 9:16。`,
    frameColor: FRAME_COLORS[(i + seed) % FRAME_COLORS.length],
  }))
}

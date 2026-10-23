export type PipelineStage = "outline" | "characters" | "script" | "storyboard"

export const STAGE_ORDER: PipelineStage[] = [
  "outline",
  "characters",
  "script",
  "storyboard",
]

export const STAGE_LABELS: Record<PipelineStage, string> = {
  outline: "章节事件 / 大纲",
  characters: "角色识别",
  script: "剧本改编",
  storyboard: "分镜生成",
}

export interface OutlineResult {
  bullets: string[]
}

export interface CharacterCard {
  id: string
  name: string
  role: string
  lookTags: string[]
}

export interface SceneBeat {
  id: string
  title: string
  location: string
  dialogue: string[]
}

export interface StoryboardCard {
  beatId: string
  shotType: string
  promptText: string
  frameColor: string
}

export interface PipelineArtifacts {
  sourceText: string
  outline: OutlineResult
  characters: CharacterCard[]
  script: SceneBeat[]
  storyboard: StoryboardCard[]
}

export interface PipelineState {
  sourceText: string
  completedStages: PipelineStage[]
  outline?: OutlineResult
  characters?: CharacterCard[]
  script?: SceneBeat[]
  storyboard?: StoryboardCard[]
}

export const MAX_SOURCE_CHARS = 800

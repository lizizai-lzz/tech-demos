import type { CharacterCard } from "../types"

export type NovelPipelineStage =
  | "world"
  | "chapterOutline"
  | "characters"
  | "chapterProse"

export const NOVEL_STAGE_ORDER: NovelPipelineStage[] = [
  "world",
  "chapterOutline",
  "characters",
  "chapterProse",
]

export const NOVEL_STAGE_LABELS: Record<NovelPipelineStage, string> = {
  world: "设定 / 世界观",
  chapterOutline: "章纲",
  characters: "角色",
  chapterProse: "正文样章",
}

export interface WorldResult {
  era: string
  setting: string
  tone: string
  rules: string[]
}

export interface ChapterOutlineItem {
  id: string
  title: string
  summary: string
  keyBeats: string[]
}

export interface ChapterOutlineResult {
  chapters: ChapterOutlineItem[]
}

export interface ProseSection {
  id: string
  heading: string
  paragraphs: string[]
}

export interface ChapterProseResult {
  chapterId: string
  chapterTitle: string
  sections: ProseSection[]
}

export interface NovelPipelineArtifacts {
  sourceText: string
  world: WorldResult
  chapterOutline: ChapterOutlineResult
  characters: CharacterCard[]
  chapterProse: ChapterProseResult
}

export interface NovelPipelineState {
  sourceText: string
  completedStages: NovelPipelineStage[]
  world?: WorldResult
  chapterOutline?: ChapterOutlineResult
  characters?: CharacterCard[]
  chapterProse?: ChapterProseResult
}

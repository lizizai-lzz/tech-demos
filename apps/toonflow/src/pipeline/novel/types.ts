import type { CharacterCard } from "../types"

export type NovelPipelineStage =
  | "world"
  | "chapterOutline"
  | "characters"
  | "chapterProse"
  | "consistencyReview"
  | "sensitivityReview"
  | "aiTasteGate"
  | "qualityVerdict"
  | "rewrite"

export const NOVEL_STAGE_ORDER: NovelPipelineStage[] = [
  "world",
  "chapterOutline",
  "characters",
  "chapterProse",
  "consistencyReview",
  "sensitivityReview",
  "aiTasteGate",
  "qualityVerdict",
  "rewrite",
]

export const NOVEL_STAGE_LABELS: Record<NovelPipelineStage, string> = {
  world: "设定 / 世界观",
  chapterOutline: "章纲",
  characters: "角色",
  chapterProse: "正文样章",
  consistencyReview: "一致性审核",
  sensitivityReview: "敏感话题",
  aiTasteGate: "去AI味",
  qualityVerdict: "质检裁定",
  rewrite: "改写",
}

export interface WorldResult {
  era: string
  setting: string
  tone: string
  rules: string[]
  /** 凡人武学层级（人体极限，非玄幻灵气） */
  martialSystem?: string
  /** 帮派 / 堂口名 */
  factions?: string[]
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

export type ConsistencySeverity = "pass" | "warn" | "fail"

export interface ConsistencyFinding {
  severity: ConsistencySeverity
  quote: string
  issue: string
  fix: string
}

export interface ConsistencyReviewResult {
  findings: ConsistencyFinding[]
  summary: string
}

export type SensitivitySeverity = "block" | "warn" | "note"

export interface SensitivityFinding {
  severity: SensitivitySeverity
  quote: string
  issue: string
  fix: string
}

export interface SensitivityReviewResult {
  findings: SensitivityFinding[]
  summary: string
}

export interface AiTasteFinding {
  pattern: string
  quote: string
  issue: string
  fix: string
}

export interface AiTasteGateResult {
  score: number
  findings: AiTasteFinding[]
  summary: string
}

export interface PunchFinding {
  severity: ConsistencySeverity
  quote: string
  issue: string
  fix: string
}

export interface PunchReviewResult {
  score: number
  findings: PunchFinding[]
  summary: string
}

export type QualityVerdict = "accept" | "polish" | "rewrite"

export interface QualityVerdictResult {
  verdict: QualityVerdict
  rewriteBrief: string[]
  summary: string
  inputs: {
    consistencySummary: string
    sensitivitySummary: string
    aiScore: number
    aiSummary: string
    punchScore: number
    punchSummary: string
  }
}

export interface NovelPipelineState {
  sourceText: string
  completedStages: NovelPipelineStage[]
  world?: WorldResult
  chapterOutline?: ChapterOutlineResult
  characters?: CharacterCard[]
  /** 样章初稿（chapterProse 阶段产出） */
  chapterProse?: ChapterProseResult
  /** 改写后终稿；未改写时与初稿相同 */
  chapterProseFinal?: ChapterProseResult
  consistencyReview?: ConsistencyReviewResult
  sensitivityReview?: SensitivityReviewResult
  aiTasteGate?: AiTasteGateResult
  punchReview?: PunchReviewResult
  qualityVerdict?: QualityVerdictResult
}

export interface NovelPipelineArtifacts {
  sourceText: string
  world: WorldResult
  chapterOutline: ChapterOutlineResult
  characters: CharacterCard[]
  chapterProse: ChapterProseResult
  chapterProseDraft: ChapterProseResult
  consistencyReview: ConsistencyReviewResult
  sensitivityReview: SensitivityReviewResult
  aiTasteGate: AiTasteGateResult
  qualityVerdict: QualityVerdictResult
}

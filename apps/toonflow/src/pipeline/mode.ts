export type StudioMode = "novel" | "drama"

export const STUDIO_MODE_LABELS: Record<StudioMode, string> = {
  novel: "写小说",
  drama: "写短剧",
}

export const DEFAULT_STUDIO_MODE: StudioMode = "drama"

import { DEFAULT_PIPELINE_CONFIG, STORAGE_KEY } from '@/pipeline/defaults'
import type { PipelineConfig } from '@/pipeline/types'

export function loadConfig(): PipelineConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PIPELINE_CONFIG
    const parsed = JSON.parse(raw) as PipelineConfig
    return { ...DEFAULT_PIPELINE_CONFIG, ...parsed }
  } catch {
    return DEFAULT_PIPELINE_CONFIG
  }
}

export function saveConfig(config: PipelineConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

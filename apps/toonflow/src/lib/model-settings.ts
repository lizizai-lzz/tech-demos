export type RunMode = "dry-run" | "live"

export interface ModelSettings {
  runMode: RunMode
  baseUrl: string
  apiKey: string
  modelId: string
  temperature: number
}

export const MODEL_SETTINGS_KEY = "toonflow:model-settings"

export const DEFAULT_MODEL_SETTINGS: ModelSettings = {
  runMode: "dry-run",
  baseUrl: "https://api.deepseek.com/v1",
  apiKey: "",
  modelId: "deepseek-chat",
  temperature: 0.7,
}

export function normalizeModelSettings(
  partial: Partial<ModelSettings> | null | undefined
): ModelSettings {
  if (!partial) return { ...DEFAULT_MODEL_SETTINGS }
  return {
    runMode: partial.runMode === "live" ? "live" : "dry-run",
    baseUrl: (partial.baseUrl ?? DEFAULT_MODEL_SETTINGS.baseUrl).trim(),
    apiKey: partial.apiKey ?? "",
    modelId: (partial.modelId ?? DEFAULT_MODEL_SETTINGS.modelId).trim(),
    temperature:
      typeof partial.temperature === "number" && !Number.isNaN(partial.temperature)
        ? Math.min(2, Math.max(0, partial.temperature))
        : DEFAULT_MODEL_SETTINGS.temperature,
  }
}

export function loadModelSettings(): ModelSettings {
  try {
    const raw = localStorage.getItem(MODEL_SETTINGS_KEY)
    if (!raw) return { ...DEFAULT_MODEL_SETTINGS }
    return normalizeModelSettings(JSON.parse(raw) as Partial<ModelSettings>)
  } catch {
    return { ...DEFAULT_MODEL_SETTINGS }
  }
}

export function saveModelSettings(settings: ModelSettings) {
  try {
    const normalized = normalizeModelSettings(settings)
    localStorage.setItem(MODEL_SETTINGS_KEY, JSON.stringify(normalized))
  } catch {
    /* ignore */
  }
}

export function clearModelSettings() {
  try {
    localStorage.removeItem(MODEL_SETTINGS_KEY)
  } catch {
    /* ignore */
  }
}

/** 真实模型模式且 base / key / model 均已填写 */
export function isLiveModelReady(settings: ModelSettings): boolean {
  if (settings.runMode !== "live") return true
  return (
    settings.baseUrl.length > 0 &&
    settings.apiKey.length > 0 &&
    settings.modelId.length > 0
  )
}

export function liveConfigError(settings: ModelSettings): string | null {
  if (settings.runMode !== "live") return null
  if (!settings.baseUrl) return "请填写 Base URL"
  if (!settings.apiKey) return "请填写 API Key"
  if (!settings.modelId) return "请填写 Model id"
  return null
}

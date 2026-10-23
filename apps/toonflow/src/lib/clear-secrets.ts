import { clearModelSettings } from "@/lib/model-settings"
import { clearMediaSettings } from "@/lib/media/media-settings"

/** 清除本机 LLM 与媒资密钥（localStorage） */
export function clearAllAppSecrets() {
  clearModelSettings()
  clearMediaSettings()
}

export type MediaProvider = "off" | "skill" | "jimeng"

export interface SkillMediaConfig {
  skillId: string
  skillRootHint?: string
  exportDirHint?: string
}

export interface JimengConfig {
  accessKeyId: string
  secretAccessKey: string
  region: string
  imageReqKey: string
  videoReqKey: string
  aspectRatio?: string
  frames?: number
}

export interface MediaSettings {
  imageProvider: MediaProvider
  videoProvider: MediaProvider
  skill: SkillMediaConfig
  jimeng: JimengConfig
}

export const MEDIA_SETTINGS_KEY = "toonflow:media-settings"

export const DEFAULT_JIMENG_CONFIG: JimengConfig = {
  accessKeyId: "",
  secretAccessKey: "",
  region: "cn-north-1",
  imageReqKey: "jimeng_t2i_v40",
  videoReqKey: "jimeng_t2v_v30",
  aspectRatio: "16:9",
  frames: 121,
}

export const DEFAULT_MEDIA_SETTINGS: MediaSettings = {
  imageProvider: "off",
  videoProvider: "off",
  skill: {
    skillId: "seedance-20",
    skillRootHint: "",
    exportDirHint: "",
  },
  jimeng: { ...DEFAULT_JIMENG_CONFIG },
}

const PROVIDERS: MediaProvider[] = ["off", "skill", "jimeng"]

function normalizeProvider(value: unknown): MediaProvider {
  if (typeof value === "string" && PROVIDERS.includes(value as MediaProvider)) {
    return value as MediaProvider
  }
  return "off"
}

export function normalizeMediaSettings(
  partial: Partial<MediaSettings> | null | undefined
): MediaSettings {
  if (!partial) return { ...DEFAULT_MEDIA_SETTINGS, jimeng: { ...DEFAULT_JIMENG_CONFIG } }
  const j: Partial<JimengConfig> = partial.jimeng ?? {}
  const skill: Partial<SkillMediaConfig> = partial.skill ?? {}
  const frames =
    typeof j.frames === "number" && !Number.isNaN(j.frames)
      ? j.frames === 241 ? 241 : 121
      : DEFAULT_JIMENG_CONFIG.frames
  return {
    imageProvider: normalizeProvider(partial.imageProvider),
    videoProvider: normalizeProvider(partial.videoProvider),
    skill: {
      skillId: (skill.skillId ?? DEFAULT_MEDIA_SETTINGS.skill.skillId).trim() || "seedance-20",
      skillRootHint: skill.skillRootHint?.trim() || undefined,
      exportDirHint: skill.exportDirHint?.trim() || undefined,
    },
    jimeng: {
      accessKeyId: (j.accessKeyId ?? "").trim(),
      secretAccessKey: j.secretAccessKey ?? "",
      region: (j.region ?? DEFAULT_JIMENG_CONFIG.region).trim() || "cn-north-1",
      imageReqKey:
        (j.imageReqKey ?? DEFAULT_JIMENG_CONFIG.imageReqKey).trim() ||
        DEFAULT_JIMENG_CONFIG.imageReqKey,
      videoReqKey:
        (j.videoReqKey ?? DEFAULT_JIMENG_CONFIG.videoReqKey).trim() ||
        DEFAULT_JIMENG_CONFIG.videoReqKey,
      aspectRatio: (j.aspectRatio ?? DEFAULT_JIMENG_CONFIG.aspectRatio)?.trim() || "16:9",
      frames,
    },
  }
}

export function loadMediaSettings(): MediaSettings {
  try {
    const raw = localStorage.getItem(MEDIA_SETTINGS_KEY)
    if (!raw) return normalizeMediaSettings(null)
    return normalizeMediaSettings(JSON.parse(raw) as Partial<MediaSettings>)
  } catch {
    return normalizeMediaSettings(null)
  }
}

export function saveMediaSettings(settings: MediaSettings) {
  try {
    const normalized = normalizeMediaSettings(settings)
    localStorage.setItem(MEDIA_SETTINGS_KEY, JSON.stringify(normalized))
  } catch {
    /* ignore */
  }
}

export function clearMediaSettings() {
  try {
    localStorage.removeItem(MEDIA_SETTINGS_KEY)
  } catch {
    /* ignore */
  }
}

export function isJimengReady(settings: MediaSettings): boolean {
  const { accessKeyId, secretAccessKey } = settings.jimeng
  return accessKeyId.length > 0 && secretAccessKey.length > 0
}

export function jimengConfigError(settings: MediaSettings, kind: "image" | "video"): string | null {
  const provider = kind === "image" ? settings.imageProvider : settings.videoProvider
  if (provider !== "jimeng") return null
  if (!settings.jimeng.accessKeyId) return "请填写即梦 AccessKeyId"
  if (!settings.jimeng.secretAccessKey) return "请填写即梦 SecretAccessKey"
  const key =
    kind === "image" ? settings.jimeng.imageReqKey : settings.jimeng.videoReqKey
  if (!key) return `请填写即梦 ${kind === "image" ? "生图" : "生视频"} req_key`
  return null
}

export function isSkillReady(settings: MediaSettings, kind: "image" | "video"): boolean {
  const provider = kind === "image" ? settings.imageProvider : settings.videoProvider
  if (provider !== "skill") return true
  return settings.skill.skillId.trim().length > 0
}

export function mediaProviderLabel(provider: MediaProvider): string {
  switch (provider) {
    case "off":
      return "关闭"
    case "skill":
      return "Skill"
    case "jimeng":
      return "即梦 API"
  }
}

/** Base64 JSON for local proxy header（仅发往本机 dev 代理） */
export function encodeJimengCredentials(jimeng: JimengConfig): string {
  const payload = JSON.stringify({
    ak: jimeng.accessKeyId,
    sk: jimeng.secretAccessKey,
    region: jimeng.region,
  })
  return btoa(unescape(encodeURIComponent(payload)))
}

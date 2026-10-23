import { describe, expect, test, beforeEach, afterEach } from "bun:test"
import {
  MEDIA_SETTINGS_KEY,
  clearMediaSettings,
  isJimengReady,
  isSkillReady,
  jimengConfigError,
  loadMediaSettings,
  normalizeMediaSettings,
  saveMediaSettings,
} from "./media-settings"

const memoryStore = new Map<string, string>()

function installLocalStorage() {
  globalThis.localStorage = {
    getItem: (key: string) => memoryStore.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memoryStore.set(key, value)
    },
    removeItem: (key: string) => {
      memoryStore.delete(key)
    },
    clear: () => memoryStore.clear(),
    key: () => null,
    length: 0,
  } as Storage
}

describe("media settings", () => {
  beforeEach(() => {
    memoryStore.clear()
    installLocalStorage()
  })

  afterEach(() => {
    localStorage.removeItem(MEDIA_SETTINGS_KEY)
  })

  test("defaults providers to off", () => {
    const s = loadMediaSettings()
    expect(s.imageProvider).toBe("off")
    expect(s.videoProvider).toBe("off")
    expect(isJimengReady(s)).toBe(false)
  })

  test("save roundtrip strips unknown provider", () => {
    saveMediaSettings(
      normalizeMediaSettings({
        imageProvider: "jimeng",
        videoProvider: "skill",
        jimeng: {
          accessKeyId: "ak",
          secretAccessKey: "sk",
          region: "cn-north-1",
          imageReqKey: "jimeng_t2i_v40",
          videoReqKey: "jimeng_t2v_v30",
        },
      })
    )
    const loaded = loadMediaSettings()
    expect(loaded.imageProvider).toBe("jimeng")
    expect(isJimengReady(loaded)).toBe(true)
    expect(isSkillReady(loaded, "video")).toBe(true)
  })

  test("jimeng ready check and errors", () => {
    const off = normalizeMediaSettings({ imageProvider: "off" })
    expect(jimengConfigError(off, "image")).toBeNull()

    const jimeng = normalizeMediaSettings({
      imageProvider: "jimeng",
      jimeng: { accessKeyId: "", secretAccessKey: "" },
    })
    expect(jimengConfigError(jimeng, "image")).toMatch(/AccessKeyId/)
  })

  test("clear removes storage", () => {
    saveMediaSettings(
      normalizeMediaSettings({
        jimeng: { accessKeyId: "x", secretAccessKey: "y" },
      })
    )
    clearMediaSettings()
    expect(localStorage.getItem(MEDIA_SETTINGS_KEY)).toBeNull()
  })
})

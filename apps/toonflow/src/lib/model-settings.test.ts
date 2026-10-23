import { describe, expect, test, beforeEach, afterEach } from "bun:test"
import {
  MODEL_SETTINGS_KEY,
  clearModelSettings,
  DEFAULT_MODEL_SETTINGS,
  isLiveModelReady,
  liveConfigError,
  loadModelSettings,
  normalizeModelSettings,
  saveModelSettings,
} from "./model-settings"

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

describe("model settings storage", () => {
  beforeEach(() => {
    memoryStore.clear()
    installLocalStorage()
    localStorage.removeItem(MODEL_SETTINGS_KEY)
  })

  afterEach(() => {
    localStorage.removeItem(MODEL_SETTINGS_KEY)
  })

  test("defaults to dry-run without key", () => {
    const s = loadModelSettings()
    expect(s.runMode).toBe("dry-run")
    expect(isLiveModelReady(s)).toBe(true)
    expect(liveConfigError(s)).toBeNull()
  })

  test("save and load roundtrip", () => {
    saveModelSettings({
      runMode: "live",
      baseUrl: "https://api.example.com/v1",
      apiKey: "secret",
      modelId: "gpt-4o-mini",
      temperature: 0.5,
    })
    const loaded = loadModelSettings()
    expect(loaded.runMode).toBe("live")
    expect(loaded.apiKey).toBe("secret")
    expect(loaded.modelId).toBe("gpt-4o-mini")
    expect(loaded.temperature).toBe(0.5)
  })

  test("clear removes stored config", () => {
    saveModelSettings({
      ...DEFAULT_MODEL_SETTINGS,
      apiKey: "x",
      runMode: "live",
    })
    clearModelSettings()
    expect(localStorage.getItem(MODEL_SETTINGS_KEY)).toBeNull()
    expect(loadModelSettings().runMode).toBe("dry-run")
  })

  test("live mode requires base key model", () => {
    const live = normalizeModelSettings({ runMode: "live", apiKey: "" })
    expect(isLiveModelReady(live)).toBe(false)
    expect(liveConfigError(live)).toMatch(/API Key/)
  })
})

import type { StoredState } from '@/types'

const STORAGE_KEY = 'word-atlas-progress-v1'

export const defaultSettings = (): StoredState['settings'] => ({
  targetRetention: 0.9,
})

export function loadState(): StoredState {
  if (typeof localStorage === 'undefined') {
    return { version: 1, settings: defaultSettings(), progress: {} }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { version: 1, settings: defaultSettings(), progress: {} }
    }
    const parsed = JSON.parse(raw) as StoredState
    if (parsed.version !== 1) {
      return { version: 1, settings: defaultSettings(), progress: {} }
    }
    return {
      version: 1,
      settings: { ...defaultSettings(), ...parsed.settings },
      progress: parsed.progress ?? {},
    }
  } catch {
    return { version: 1, settings: defaultSettings(), progress: {} }
  }
}

export function saveState(state: StoredState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function exportStateJson(state: StoredState): string {
  return JSON.stringify(state, null, 2)
}

export function clearState(): StoredState {
  const fresh: StoredState = {
    version: 1,
    settings: defaultSettings(),
    progress: {},
  }
  saveState(fresh)
  return fresh
}

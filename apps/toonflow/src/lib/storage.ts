import type { StudioMode } from "@/pipeline/mode"
import { DEFAULT_STUDIO_MODE } from "@/pipeline/mode"

const PASTE_KEY = "toonflow:last-paste"
const VIEWPORT_KEY = "toonflow:viewport"
const SAMPLE_KEY = "toonflow:sample-id"
const MODE_KEY = "toonflow:studio-mode"
const NOVEL_SAMPLE_KEY = "toonflow:novel-sample-id"

export function loadLastPaste(): string | null {
  try {
    return localStorage.getItem(PASTE_KEY)
  } catch {
    return null
  }
}

export function saveLastPaste(text: string) {
  try {
    localStorage.setItem(PASTE_KEY, text)
  } catch {
    /* ignore */
  }
}

export function loadSampleId(): string | null {
  try {
    return localStorage.getItem(SAMPLE_KEY)
  } catch {
    return null
  }
}

export function saveSampleId(id: string) {
  try {
    localStorage.setItem(SAMPLE_KEY, id)
  } catch {
    /* ignore */
  }
}

export function loadStudioMode(): StudioMode {
  try {
    const raw = localStorage.getItem(MODE_KEY)
    if (raw === "novel" || raw === "drama") return raw
  } catch {
    /* ignore */
  }
  return DEFAULT_STUDIO_MODE
}

export function saveStudioMode(mode: StudioMode) {
  try {
    localStorage.setItem(MODE_KEY, mode)
  } catch {
    /* ignore */
  }
}

export function loadNovelSampleId(): string | null {
  try {
    return localStorage.getItem(NOVEL_SAMPLE_KEY)
  } catch {
    return null
  }
}

export function saveNovelSampleId(id: string) {
  try {
    localStorage.setItem(NOVEL_SAMPLE_KEY, id)
  } catch {
    /* ignore */
  }
}

export interface StoredViewport {
  x: number
  y: number
  zoom: number
}

export function loadViewport(): StoredViewport | null {
  try {
    const raw = localStorage.getItem(VIEWPORT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StoredViewport
  } catch {
    return null
  }
}

export function saveViewport(viewport: StoredViewport) {
  try {
    localStorage.setItem(VIEWPORT_KEY, JSON.stringify(viewport))
  } catch {
    /* ignore */
  }
}

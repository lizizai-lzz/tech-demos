const PASTE_KEY = "toonflow:last-paste"
const VIEWPORT_KEY = "toonflow:viewport"
const SAMPLE_KEY = "toonflow:sample-id"

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

import type { GeocodeResult } from './types'

let lastCall = 0

async function throttle() {
  const now = Date.now()
  const wait = Math.max(0, 600 - (now - lastCall))
  if (wait) await new Promise((r) => setTimeout(r, wait))
  lastCall = Date.now()
}

export async function searchPlaces(query: string): Promise<GeocodeResult[]> {
  if (!query.trim()) return []
  await throttle()
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6&lang=default`
  const res = await fetch(url)
  if (!res.ok) return []
  const json = (await res.json()) as {
    features: {
      properties: { name?: string; city?: string; country?: string }
      geometry: { coordinates: [number, number] }
    }[]
  }
  return (json.features ?? []).map((f) => {
    const [lng, lat] = f.geometry.coordinates
    const parts = [f.properties.name, f.properties.city, f.properties.country].filter(Boolean)
    return { label: parts.join(', '), lng, lat }
  })
}

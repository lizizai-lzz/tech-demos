import type { LandmarkPreset } from './landmarks'
import { LANDMARKS } from './landmarks'

export type Shot =
  | { kind: 'globe'; cityId: string; u: number }
  | { kind: 'city'; cityId: string; orbit: number; push: number }

function ease(u: number) {
  const t = Math.min(1, Math.max(0, u))
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
}

/** 16:9 默认 42s：地球 → 上海飞入 → 低机位环绕 → 硬切东京飞入 → 环绕定格 */
export function shotAt(t: number, duration = 42): Shot {
  const scale = duration / 42
  const shFlyEnd = 9 * scale
  const shCityEnd = 23 * scale
  const tkFlyEnd = 31 * scale
  if (t < shFlyEnd) {
    return { kind: 'globe', cityId: 'shanghai-lujiazui', u: ease(t / shFlyEnd) }
  }
  if (t < shCityEnd) {
    const u = (t - shFlyEnd) / (shCityEnd - shFlyEnd)
    return { kind: 'city', cityId: 'shanghai-lujiazui', orbit: u, push: u }
  }
  if (t < tkFlyEnd) {
    const u = (t - shCityEnd) / (tkFlyEnd - shCityEnd)
    return { kind: 'globe', cityId: 'tokyo-shinjuku', u: ease(u) }
  }
  const u = Math.min(1, (t - tkFlyEnd) / Math.max(0.001, duration - tkFlyEnd))
  return { kind: 'city', cityId: 'tokyo-shinjuku', orbit: u, push: Math.min(1, u * 1.1) }
}

export function landmarkById(id: string): LandmarkPreset {
  return LANDMARKS.find((l) => l.id === id) ?? LANDMARKS[0]
}

export function globePose(city: LandmarkPreset, u: number) {
  const e = Math.min(1, Math.max(0, u))
  return {
    lng: city.lng,
    lat: city.lat,
    zoom: 1.15 + (16.2 - 1.15) * e ** 2.6,
    pitch: 68 * e ** 2.2,
    bearing: -24 + 60 * e,
  }
}

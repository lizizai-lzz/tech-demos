import type { LandmarkPreset } from './landmarks'
import { LANDMARKS } from './landmarks'

export type Shot =
  | { kind: 'globe'; cityId: string; u: number }
  | { kind: 'city'; cityId: string; orbit: number; push: number; reveal: number }

/** 进入城市后贴面从下往上长出来，大约 3.6 秒。 */
function revealAt(tInCity: number) {
  return Math.min(1, Math.max(0, tInCity / 3.6))
}

export function flightEase(u: number) {
  const t = Math.min(1, Math.max(0, u))
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
}

/** 贴面还在长的时候，镜头已经收进定稿机位。 */
export function arriveFromReveal(reveal: number) {
  return Math.min(1, Math.max(0, reveal) * 1.35)
}

export type Timeline = 'full' | 'lujiazui'

/** 16:9 默认 42s：地球 → 上海飞入 → 斜俯视环绕 → 硬切东京飞入 → 环绕定格。
 *  lujiazui：只保留地球飞入和陆家嘴环绕，给短预览用。
 */
export function shotAt(t: number, duration = 42, timeline: Timeline = 'full'): Shot {
  if (timeline === 'lujiazui') {
    const fly = duration * 0.45
    if (t < fly) {
      return { kind: 'globe', cityId: 'shanghai-lujiazui', u: flightEase(t / Math.max(0.001, fly)) }
    }
    const u = Math.min(1, (t - fly) / Math.max(0.001, duration - fly))
    return {
      kind: 'city',
      cityId: 'shanghai-lujiazui',
      orbit: u,
      push: u * 0.85,
      reveal: revealAt(t - fly),
    }
  }
  const scale = duration / 42
  const shFlyEnd = 9 * scale
  const shCityEnd = 23 * scale
  const tkFlyEnd = 31 * scale
  if (t < shFlyEnd) {
    return { kind: 'globe', cityId: 'shanghai-lujiazui', u: flightEase(t / shFlyEnd) }
  }
  if (t < shCityEnd) {
    const u = (t - shFlyEnd) / (shCityEnd - shFlyEnd)
    return {
      kind: 'city',
      cityId: 'shanghai-lujiazui',
      orbit: u,
      push: u,
      reveal: revealAt(t - shFlyEnd),
    }
  }
  if (t < tkFlyEnd) {
    const u = (t - shCityEnd) / (tkFlyEnd - shCityEnd)
    return { kind: 'globe', cityId: 'tokyo-shinjuku', u: flightEase(u) }
  }
  const u = Math.min(1, (t - tkFlyEnd) / Math.max(0.001, duration - tkFlyEnd))
  return {
    kind: 'city',
    cityId: 'tokyo-shinjuku',
    orbit: u,
    push: Math.min(1, u * 1.1),
    reveal: revealAt(t - tkFlyEnd),
  }
}

export function landmarkById(id: string): LandmarkPreset {
  return LANDMARKS.find((l) => l.id === id) ?? LANDMARKS[0]
}

export function globePose(city: LandmarkPreset, u: number) {
  const e = Math.min(1, Math.max(0, u))
  const surge = Math.sin(e * Math.PI)
  return {
    lng: city.lng,
    lat: city.lat,
    zoom: 1.15 + (16.2 - 1.15) * e ** 2.6,
    pitch: 68 * e ** 2.2,
    bearing: -24 + 60 * e,
    // 默认约 36.9°。速度最高时略为拉开，仍然朝目的地冲，不抬头。
    fov: 36.87 + surge * 9,
  }
}

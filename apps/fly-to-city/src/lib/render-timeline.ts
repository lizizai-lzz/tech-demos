import type { LandmarkPreset } from './landmarks'
import { LANDMARKS } from './landmarks'

export type Shot =
  | { kind: 'globe'; cityId: string; u: number }
  | { kind: 'city'; cityId: string; roam: number; reveal: number; arrive: number }

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

export type Timeline = 'full' | 'lujiazui' | 'shinjuku'

/** 进城后先收到斜俯视落点，再开始漫游，避免和下降末帧错开。 */
function cityShot(cityId: string, tInCity: number, citySpan: number): Shot {
  const reveal = revealAt(tInCity)
  const arrive = arriveFromReveal(reveal)
  const roamStart = 2.7
  const roam = tInCity <= roamStart ? 0 : Math.min(1, (tInCity - roamStart) / Math.max(0.001, citySpan - roamStart))
  return { kind: 'city', cityId, roam, reveal, arrive }
}

/** 16:9 默认 42s：地球 → 上海飞入 → 漫游 → 东京飞入 → 漫游。
 *  lujiazui / shinjuku：只保留地球飞入和一座城市，给短预览用。
 *  cityId 有值时，整段都改成这一座城市。
 */
export function shotAt(t: number, duration = 42, timeline: Timeline = 'full', cityId?: string | null): Shot {
  if (cityId || timeline === 'lujiazui' || timeline === 'shinjuku') {
    const id = cityId || (timeline === 'shinjuku' ? 'tokyo-shinjuku' : 'shanghai-lujiazui')
    const fly = duration * 0.45
    if (t < fly) {
      return { kind: 'globe', cityId: id, u: flightEase(t / Math.max(0.001, fly)) }
    }
    return cityShot(id, t - fly, Math.max(0.001, duration - fly))
  }
  const scale = duration / 42
  const shFlyEnd = 9 * scale
  const shCityEnd = 23 * scale
  const tkFlyEnd = 31 * scale
  if (t < shFlyEnd) {
    return { kind: 'globe', cityId: 'shanghai-lujiazui', u: flightEase(t / shFlyEnd) }
  }
  if (t < shCityEnd) return cityShot('shanghai-lujiazui', t - shFlyEnd, shCityEnd - shFlyEnd)
  if (t < tkFlyEnd) {
    const u = (t - shCityEnd) / (tkFlyEnd - shCityEnd)
    return { kind: 'globe', cityId: 'tokyo-shinjuku', u: flightEase(u) }
  }
  return cityShot('tokyo-shinjuku', t - tkFlyEnd, Math.max(0.001, duration - tkFlyEnd))
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

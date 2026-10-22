import { LANDMARKS } from './landmarks'
import { buildCityDataFromOsm, loadBakedCity } from './osm-fetch'
import type { CityData } from './types'

export async function loadCityForLandmark(
  landmarkId: string,
  onProgress?: (msg: string, p: number) => void,
): Promise<CityData> {
  const baked = await loadBakedCity(landmarkId)
  if (baked) {
    onProgress?.('已加载预烘焙沙盘数据', 1)
    return baked
  }
  const lm = LANDMARKS.find((l) => l.id === landmarkId)
  if (!lm) throw new Error('未找到地标')
  return buildCityDataFromOsm(
    {
      id: lm.id,
      nameEn: lm.nameEn,
      nameZh: lm.nameZh,
      subtitle: lm.subtitle,
      lng: lm.lng,
      lat: lm.lat,
      extentM: lm.extentM,
    },
    onProgress,
  )
}

export async function loadCityForCoords(
  meta: {
    id: string
    nameEn: string
    nameZh: string
    subtitle: string
    lng: number
    lat: number
    extentM: number
  },
  onProgress?: (msg: string, p: number) => void,
): Promise<CityData> {
  const baked = await loadBakedCity(meta.id)
  if (baked) return baked
  return buildCityDataFromOsm(meta, onProgress)
}

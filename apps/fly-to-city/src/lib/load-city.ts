import { LANDMARKS } from './landmarks'
import { buildCityDataFromOsm, loadBakedCity } from './osm-fetch'
import type { CityData } from './types'

function logHeightSources(data: CityData) {
  if (!import.meta.env.DEV || !data.buildings?.length) return
  const counts: Record<string, number> = {}
  for (const b of data.buildings) {
    const s = b.src ?? 'unknown'
    counts[s] = (counts[s] ?? 0) + 1
  }
  const total = data.buildings.length
  const parts = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([k, n]) => `${k} ${Math.round((n / total) * 100)}%`)
    .join('  ')
  console.info(`[高度来源] ${data.id} ${total} 栋  ${parts}`)
}

export async function loadCityForLandmark(
  landmarkId: string,
  onProgress?: (msg: string, p: number) => void,
): Promise<CityData> {
  const baked = await loadBakedCity(landmarkId)
  if (baked) {
    logHeightSources(baked)
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
  if (baked) {
    logHeightSources(baked)
    return baked
  }
  return buildCityDataFromOsm(meta, onProgress)
}

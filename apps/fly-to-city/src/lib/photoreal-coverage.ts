const PRESET_OFF = new Set(['shanghai-lujiazui', 'beijing-cbd'])
const PRESET_ON = new Set([
  'hongkong-central',
  'tokyo-shinjuku',
  'singapore-marina-bay',
  'sydney-opera',
  'nyc-midtown',
  'paris-eiffel',
])

function inBox(lng: number, lat: number, west: number, east: number, south: number, north: number) {
  return lng >= west && lng <= east && lat >= south && lat <= north
}

/**
 * Google Photorealistic 3D Tiles 在中国大陆没有覆盖。
 * 八个预置城市按名单判断；搜索来的地点用经纬度粗分，香港和台湾仍算有覆盖。
 */
export function hasPhotorealCoverage(id: string, lng: number, lat: number) {
  if (PRESET_OFF.has(id)) return false
  if (PRESET_ON.has(id)) return true
  if (inBox(lng, lat, 113.82, 114.45, 22.15, 22.58)) return true
  if (inBox(lng, lat, 119.3, 122.05, 21.85, 25.35)) return true
  if (inBox(lng, lat, 73, 135, 18, 54)) return false
  return true
}

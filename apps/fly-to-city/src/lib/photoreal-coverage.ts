function inBox(lng: number, lat: number, west: number, east: number, south: number, north: number) {
  return lng >= west && lng <= east && lat >= south && lat <= north
}

/** 香港、澳门、台湾有实景，即使粗多边形擦到边缘也不算大陆。 */
function isSarOrTaiwan(lng: number, lat: number) {
  if (inBox(lng, lat, 113.82, 114.45, 22.15, 22.58)) return true
  if (inBox(lng, lat, 113.52, 113.6, 22.1, 22.22)) return true
  if (inBox(lng, lat, 119.3, 122.05, 21.85, 25.35)) return true
  return false
}

/**
 * 大陆轮廓，大约 60 个点，不含台湾。
 * 用来决定要不要发瓦片请求，不是行政边界。
 */
const MAINLAND: [number, number][] = [
  [73.6, 39.4],
  [75.2, 37.2],
  [78.2, 35.2],
  [79.0, 32.5],
  [81.0, 30.2],
  [85.2, 28.2],
  [91.0, 27.8],
  [97.0, 28.4],
  [98.6, 25.6],
  [97.8, 24.0],
  [99.2, 22.6],
  [101.6, 21.6],
  [104.8, 22.7],
  [106.6, 23.1],
  [108.0, 21.6],
  [108.6, 18.2],
  [111.0, 18.2],
  [111.0, 20.2],
  [109.7, 21.5],
  [113.2, 22.15],
  [113.6, 22.8],
  [114.5, 22.7],
  [117.2, 23.4],
  [119.5, 25.3],
  [121.4, 28.2],
  [122.1, 30.2],
  [121.9, 32.2],
  [121.0, 35.0],
  [122.6, 37.4],
  [122.5, 39.6],
  [121.1, 41.0],
  [124.3, 39.9],
  [125.2, 40.9],
  [124.4, 42.6],
  [126.2, 44.2],
  [131.2, 45.0],
  [134.6, 47.6],
  [133.2, 48.3],
  [127.4, 49.6],
  [124.8, 53.4],
  [120.0, 53.2],
  [119.2, 50.2],
  [115.8, 47.6],
  [112.0, 45.2],
  [105.0, 41.8],
  [96.0, 42.6],
  [90.5, 45.0],
  [87.6, 49.1],
  [85.2, 47.2],
  [80.4, 45.2],
  [73.6, 40.4],
]

function insideRing(lng: number, lat: number, ring: [number, number][]) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    const hit = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi + 0) + xi
    if (hit) inside = !inside
  }
  return inside
}

/** 中国大陆没有这套实景。多边形是粗轮廓，香港、澳门、台湾另外排除。 */
export function isMainlandChina(lng: number, lat: number) {
  if (isSarOrTaiwan(lng, lat)) return false
  return insideRing(lng, lat, MAINLAND)
}

/**
 * procedural：直接程序化，不请求瓦片。
 * probe：可以加载实景，落地后再看有没有高细节建筑。
 */
export function coveragePolicy(lng: number, lat: number): 'procedural' | 'probe' {
  return isMainlandChina(lng, lat) ? 'procedural' : 'probe'
}

/** 兼容旧调用。probe 只表示「可以试」，不是已经确认有覆盖。 */
export function hasPhotorealCoverage(_id: string, lng: number, lat: number) {
  return coveragePolicy(lng, lat) === 'probe'
}

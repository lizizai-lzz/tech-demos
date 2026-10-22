import { bboxAround, lngLatToLocal, pointInRing, ringArea } from './geo'
import type { Vec2 } from './types'
import type { BuildingFootprint, CityData, WaterPolygon } from './types'

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

const DEFAULT_HEIGHTS: Record<string, number> = {
  house: 8,
  residential: 12,
  apartments: 24,
  commercial: 28,
  retail: 12,
  industrial: 10,
  office: 36,
  hotel: 40,
  skyscraper: 80,
  tower: 60,
  yes: 14,
}

function parseHeight(tags: Record<string, string>): number {
  if (tags.height) {
    const m = tags.height.match(/([\d.]+)/)
    if (m) return Math.min(400, parseFloat(m[1]))
  }
  if (tags['building:levels']) {
    const lv = parseInt(tags['building:levels'], 10)
    if (!Number.isNaN(lv)) return Math.min(400, lv * 3.2)
  }
  const t = tags.building ?? 'yes'
  return DEFAULT_HEIGHTS[t] ?? DEFAULT_HEIGHTS.yes
}

type OsmElement = {
  type: string
  id: number
  tags?: Record<string, string>
  geometry?: { lat: number; lon: number }[]
  members?: { type: string; role: string; geometry?: { lat: number; lon: number }[] }[]
}

function wayToRing(
  geom: { lat: number; lon: number }[],
  centerLng: number,
  centerLat: number,
): Vec2[] {
  return geom.map((p) => lngLatToLocal(p.lon, p.lat, centerLng, centerLat))
}

function extractBuildings(
  elements: OsmElement[],
  centerLng: number,
  centerLat: number,
  extentM: number,
): BuildingFootprint[] {
  const half = extentM / 2
  const out: BuildingFootprint[] = []
  for (const el of elements) {
    if (!el.tags?.building) continue
    let geom = el.geometry
    if (el.type === 'relation' && el.members) {
      const outer = el.members.find((m) => m.role === 'outer')
      geom = outer?.geometry
    }
    if (!geom || geom.length < 3) continue
    const ring = wayToRing(geom, centerLng, centerLat)
    const cx = ring.reduce((s, p) => s + p[0], 0) / ring.length
    const cz = ring.reduce((s, p) => s + p[1], 0) / ring.length
    if (Math.abs(cx) > half || Math.abs(cz) > half) continue
    const height = parseHeight(el.tags)
    const levels = Math.max(1, Math.round(height / 3.5))
    out.push({
      id: `${el.type}/${el.id}`,
      ring,
      height,
      levels,
    })
  }
  return out.sort((a, b) => b.height - a.height).slice(0, 1200)
}

function extractWater(
  elements: OsmElement[],
  centerLng: number,
  centerLat: number,
  extentM: number,
): WaterPolygon[] {
  const half = extentM / 2
  const out: WaterPolygon[] = []
  for (const el of elements) {
    const isWater =
      el.tags?.natural === 'water' ||
      el.tags?.waterway === 'riverbank' ||
      el.tags?.landuse === 'reservoir'
    if (!isWater) continue
    let geom = el.geometry
    if (el.type === 'relation' && el.members) {
      const outer = el.members.find((m) => m.role === 'outer')
      geom = outer?.geometry
    }
    if (!geom || geom.length < 3) continue
    const ring = wayToRing(geom, centerLng, centerLat)
    const cx = ring.reduce((s, p) => s + p[0], 0) / ring.length
    const cz = ring.reduce((s, p) => s + p[1], 0) / ring.length
    if (Math.abs(cx) > half * 1.2 || Math.abs(cz) > half * 1.2) continue
    out.push({ id: `${el.type}/${el.id}`, ring })
  }
  return out.slice(0, 80)
}

function scatterTreesInRing(ring: Vec2[], count: number, rng: () => number): Vec2[] {
  const area = ringArea(ring)
  if (area < 4) return []
  const n = Math.min(count, Math.max(2, Math.floor(area / 120)))
  const pts: Vec2[] = []
  let tries = 0
  while (pts.length < n && tries < n * 30) {
    tries++
    const minX = Math.min(...ring.map((p) => p[0]))
    const maxX = Math.max(...ring.map((p) => p[0]))
    const minZ = Math.min(...ring.map((p) => p[1]))
    const maxZ = Math.max(...ring.map((p) => p[1]))
    const x = minX + rng() * (maxX - minX)
    const z = minZ + rng() * (maxZ - minZ)
    if (pointInRing(x, z, ring)) pts.push([x, z])
  }
  return pts
}

function extractTrees(
  elements: OsmElement[],
  centerLng: number,
  centerLat: number,
  extentM: number,
  seed: number,
): Vec2[] {
  const half = extentM / 2
  let rngState = seed
  const rng = () => {
    rngState = (rngState * 1664525 + 1013904223) >>> 0
    return rngState / 0xffffffff
  }
  const trees: Vec2[] = []
  for (const el of elements) {
    if (el.tags?.natural === 'tree' && el.geometry?.[0]) {
      const p = el.geometry[0]
      const [x, z] = lngLatToLocal(p.lon, p.lat, centerLng, centerLat)
      if (Math.abs(x) <= half && Math.abs(z) <= half) trees.push([x, z])
    }
    const isGreen =
      el.tags?.leisure === 'park' ||
      el.tags?.landuse === 'grass' ||
      el.tags?.landuse === 'forest' ||
      el.tags?.natural === 'wood'
    if (!isGreen || !el.geometry || el.geometry.length < 3) continue
    const ring = wayToRing(el.geometry, centerLng, centerLat)
    trees.push(...scatterTreesInRing(ring, 40, rng))
  }
  return trees.slice(0, 2500)
}

export async function fetchOverpass(
  lng: number,
  lat: number,
  radiusM: number,
): Promise<OsmElement[]> {
  const query = `
[out:json][timeout:90];
(
  way["building"](around:${radiusM},${lat},${lng});
  relation["building"](around:${radiusM},${lat},${lng});
  way["natural"="water"](around:${radiusM},${lat},${lng});
  way["waterway"="riverbank"](around:${radiusM},${lat},${lng});
  way["natural"="tree"](around:${radiusM},${lat},${lng});
  way["leisure"="park"](around:${radiusM},${lat},${lng});
  way["landuse"~"grass|forest"](around:${radiusM},${lat},${lng});
  way["natural"="wood"](around:${radiusM},${lat},${lng});
);
out body geom;
`
  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    body: query,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  if (!res.ok) throw new Error(`Overpass 请求失败 (${res.status})`)
  const json = (await res.json()) as { elements: OsmElement[] }
  return json.elements ?? []
}

function decodeTerrarium(r: number, g: number, b: number) {
  return r * 256 + g + b / 256 - 32768
}

async function fetchTerrariumTile(z: number, x: number, y: number): Promise<Float32Array> {
  const url = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`地形瓦片失败 ${z}/${x}/${y}`)
  const blob = await res.blob()
  const bitmap = await createImageBitmap(blob)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0)
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const out = new Float32Array(canvas.width * canvas.height)
  for (let i = 0; i < out.length; i++) {
    const o = i * 4
    out[i] = decodeTerrarium(img.data[o], img.data[o + 1], img.data[o + 2])
  }
  return out
}

/** 浏览器端地形采样（烘焙脚本使用 Node 版） */
export async function sampleTerrainBrowser(
  lng: number,
  lat: number,
  extentM: number,
  gridSize: number,
): Promise<{ heights: number[]; min: number; max: number }> {
  const zoom = 14
  const half = extentM / 2
  const { south, west, north, east } = bboxAround(lng, lat, half * 1.05)
  const n = 2 ** zoom
  const lonToTileX = (lo: number) => Math.floor(((lo + 180) / 360) * n)
  const latToTileY = (la: number) => {
    const rad = (la * Math.PI) / 180
    return Math.floor(((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n)
  }
  const x0 = lonToTileX(west)
  const x1 = lonToTileX(east)
  const y0 = latToTileY(north)
  const y1 = latToTileY(south)
  const tileHeights = new Map<string, Float32Array>()
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      tileHeights.set(`${tx},${ty}`, await fetchTerrariumTile(zoom, tx, ty))
    }
  }
  const heights: number[] = []
  let min = Infinity
  let max = -Infinity
  for (let gy = 0; gy < gridSize; gy++) {
    for (let gx = 0; gx < gridSize; gx++) {
      const fx = gx / (gridSize - 1)
      const fy = gy / (gridSize - 1)
      const lo = west + (east - west) * fx
      const la = north + (south - north) * fy
      const tx = lonToTileX(lo)
      const ty = latToTileY(la)
      const tile = tileHeights.get(`${tx},${ty}`)
      let h = 0
      if (tile) {
        const px = Math.min(255, Math.max(0, Math.floor(((lo + 180) / 360) * n * 256) % 256))
        const py = Math.min(255, Math.max(0, Math.floor(
          ((1 - Math.log(Math.tan((la * Math.PI) / 180) + 1 / Math.cos((la * Math.PI) / 180)) / Math.PI) / 2) * n * 256,
        ) % 256))
        h = tile[py * 256 + px] ?? 0
      }
      heights.push(h)
      min = Math.min(min, h)
      max = Math.max(max, h)
    }
  }
  return { heights, min, max }
}

export function processOsmElements(
  elements: OsmElement[],
  meta: {
    id: string
    nameEn: string
    nameZh: string
    subtitle: string
    lng: number
    lat: number
    extentM: number
  },
  gridSize = 64,
): Omit<CityData, 'terrainHeights' | 'minTerrain' | 'maxTerrain'> {
  const buildings = extractBuildings(elements, meta.lng, meta.lat, meta.extentM)
  const water = extractWater(elements, meta.lng, meta.lat, meta.extentM)
  const seed = Math.abs(Math.floor(meta.lng * 1000 + meta.lat * 1000))
  const trees = extractTrees(elements, meta.lng, meta.lat, meta.extentM, seed)
  return {
    id: meta.id,
    nameEn: meta.nameEn,
    nameZh: meta.nameZh,
    subtitle: meta.subtitle,
    center: { lng: meta.lng, lat: meta.lat },
    extentM: meta.extentM,
    gridSize,
    buildings,
    trees,
    water,
    bakedAt: new Date().toISOString(),
  }
}

export async function buildCityDataFromOsm(
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
  const gridSize = 64
  onProgress?.('正在查询 OpenStreetMap…', 0.15)
  const elements = await fetchOverpass(meta.lng, meta.lat, meta.extentM / 2)
  onProgress?.('正在解析建筑与植被…', 0.35)
  const base = processOsmElements(elements, meta, gridSize)
  onProgress?.('正在采样地形高程…', 0.55)
  const terrain = await sampleTerrainBrowser(meta.lng, meta.lat, meta.extentM, gridSize)
  onProgress?.('正在组装沙盘数据…', 0.9)
  return {
    ...base,
    terrainHeights: Array.from(terrain.heights),
    minTerrain: terrain.min,
    maxTerrain: terrain.max,
  }
}

export async function loadBakedCity(id: string): Promise<CityData | null> {
  try {
    const res = await fetch(`/data/${id}.json`)
    if (!res.ok) return null
    return (await res.json()) as CityData
  } catch {
    return null
  }
}

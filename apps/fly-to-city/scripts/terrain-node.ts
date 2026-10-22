import { bboxAround } from '../src/lib/geo'

function decodeTerrarium(r: number, g: number, b: number) {
  return r * 256 + g + b / 256 - 32768
}

function lonToTileX(lon: number, z: number) {
  return Math.floor(((lon + 180) / 360) * 2 ** z)
}

function latToTileY(lat: number, z: number) {
  const rad = (lat * Math.PI) / 180
  return Math.floor(
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** z,
  )
}

function lonLatToPixel(lon: number, lat: number, z: number, tileX: number, tileY: number) {
  const n = 2 ** z
  const x = ((lon + 180) / 360) * n
  const rad = (lat * Math.PI) / 180
  const y =
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n
  const px = Math.floor((x - tileX) * 256)
  const py = Math.floor((y - tileY) * 256)
  return { px: Math.min(255, Math.max(0, px)), py: Math.min(255, Math.max(0, py)) }
}

async function loadTile(z: number, x: number, y: number, png: typeof import('pngjs').PNG) {
  const url = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`地形瓦片 ${z}/${x}/${y} 失败`)
  const buf = Buffer.from(await res.arrayBuffer())
  return png.sync.read(buf)
}

export async function sampleTerrainNode(
  lng: number,
  lat: number,
  extentM: number,
  gridSize: number,
) {
  const { PNG } = await import('pngjs')
  const zoom = 14
  const half = extentM / 2
  const { south, west, north, east } = bboxAround(lng, lat, half * 1.05)
  const x0 = lonToTileX(west, zoom)
  const x1 = lonToTileX(east, zoom)
  const y0 = latToTileY(north, zoom)
  const y1 = latToTileY(south, zoom)
  const tiles = new Map<string, ReturnType<typeof PNG.sync.read>>()
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      tiles.set(`${tx},${ty}`, await loadTile(zoom, tx, ty, PNG))
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
      const tx = lonToTileX(lo, zoom)
      const ty = latToTileY(la, zoom)
      const tile = tiles.get(`${tx},${ty}`)
      let h = 0
      if (tile) {
        const { px, py } = lonLatToPixel(lo, la, zoom, tx, ty)
        const idx = (py * tile.width + px) * 4
        h = decodeTerrarium(tile.data[idx], tile.data[idx + 1], tile.data[idx + 2])
      }
      heights.push(h)
      min = Math.min(min, h)
      max = Math.max(max, h)
    }
  }
  return { heights, min, max }
}

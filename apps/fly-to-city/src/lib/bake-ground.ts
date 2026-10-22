import maplibregl from 'maplibre-gl'
import { metersPerDegLng } from './geo'
import { groundStyle } from './ground-style'

/** 地面贴图覆盖的边长（米）。比建筑范围更大，道路能延伸到雾里。 */
export const GROUND_SPAN_M = 14000
/** 烘焙分辨率。8192 约每像素 1.7 米。 */
export const GROUND_TEX = 8192

const EQUATOR_M = 40075016.686
const cache = new Map<string, HTMLCanvasElement>()
const pending = new Map<string, Promise<HTMLCanvasElement>>()

function keyOf(lng: number, lat: number) {
  // v3：卫星底图 + 深色路网。换样式时必须换键，否则会一直用旧贴图。
  return `v4:${lng.toFixed(4)},${lat.toFixed(4)}`
}

export function peekGround(lng: number, lat: number) {
  return cache.get(keyOf(lng, lat)) ?? null
}

function guessZoom(lat: number) {
  const mpp = GROUND_SPAN_M / GROUND_TEX
  const cos = Math.cos((lat * Math.PI) / 180)
  return Math.log2((EQUATOR_M * cos) / (mpp * 512))
}

function metersBetween(
  a: { lng: number; lat: number },
  b: { lng: number; lat: number },
) {
  const dx = (b.lng - a.lng) * metersPerDegLng((a.lat + b.lat) / 2)
  const dy = (b.lat - a.lat) * 111320
  return Math.hypot(dx, dy)
}

/**
 * 把当前视口的东西向跨度校正到 GROUND_SPAN_M，保证贴图和地面网格对齐。
 */
function alignZoom(map: maplibregl.Map) {
  const size = GROUND_TEX
  const west = map.unproject([0, size / 2])
  const east = map.unproject([size, size / 2])
  const span = metersBetween(west, east)
  if (span > 100) {
    map.jumpTo({ zoom: map.getZoom() + Math.log2(span / GROUND_SPAN_M) })
  }
}

function bakeOnce(lng: number, lat: number) {
  return new Promise<HTMLCanvasElement>((resolve, reject) => {
    const wrap = document.createElement('div')
    wrap.setAttribute('data-ground-bake', '1')
    wrap.style.cssText = `position:fixed;left:-${GROUND_TEX + 40}px;top:0;width:${GROUND_TEX}px;height:${GROUND_TEX}px;pointer-events:none;`
    document.body.appendChild(wrap)

    let settled = false
    const map = new maplibregl.Map({
      container: wrap,
      style: groundStyle(),
      center: [lng, lat],
      zoom: guessZoom(lat),
      bearing: 0,
      pitch: 0,
      interactive: false,
      attributionControl: false,
      fadeDuration: 0,
      pixelRatio: 1,
      canvasContextAttributes: { preserveDrawingBuffer: true, antialias: true },
    } as maplibregl.MapOptions)

    const finish = (err?: Error, canvas?: HTMLCanvasElement) => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      map.remove()
      wrap.remove()
      if (err || !canvas) reject(err ?? new Error('地面地图烘焙失败'))
      else resolve(canvas)
    }

    const timer = window.setTimeout(() => finish(new Error('地面地图烘焙超时')), 150000)

    const copy = () => {
      const src = map.getCanvas()
      const out = document.createElement('canvas')
      out.width = GROUND_TEX
      out.height = GROUND_TEX
      const ctx = out.getContext('2d')
      if (!ctx || src.width < 64) {
        finish(new Error('地面地图画布为空'))
        return
      }
      ctx.drawImage(src, 0, 0, GROUND_TEX, GROUND_TEX)
      finish(undefined, out)
    }

    map.on('load', () => {
      map.resize()
      alignZoom(map)
      const started = performance.now()
      const check = () => {
        if (settled) return
        const waited = performance.now() - started
        // 卫星瓦片比矢量慢。等它进画面，但不要无限等。
        if ((map.areTilesLoaded() && waited > 900) || waited > 28000) {
          requestAnimationFrame(copy)
          return
        }
        window.setTimeout(check, 250)
      }
      window.setTimeout(check, 400)
    })
  })
}

/** 离屏烘焙一张北向上的地面图。同一坐标只烘焙一次。 */
export function bakeGroundCanvas(lng: number, lat: number) {
  const key = keyOf(lng, lat)
  const hit = cache.get(key)
  if (hit) return Promise.resolve(hit)
  let job = pending.get(key)
  if (!job) {
    job = bakeOnce(lng, lat)
      .then((canvas) => {
        cache.set(key, canvas)
        pending.delete(key)
        return canvas
      })
      .catch((err) => {
        pending.delete(key)
        throw err
      })
    pending.set(key, job)
  }
  return job
}

import type maplibregl from 'maplibre-gl'

export type GlobeCam = {
  lng: number
  lat: number
  zoom: number
  pitch: number
  bearing: number
  fov?: number
}

let map: maplibregl.Map | null = null
let ready = false

export function attachGlobe(next: maplibregl.Map) {
  map = next
  ready = false
  next.on('load', () => {
    ready = true
  })
}

export function globeIsReady() {
  return ready && map != null
}

export function jumpGlobe(cam: GlobeCam) {
  map?.resize()
  map?.jumpTo({
    center: [cam.lng, cam.lat],
    zoom: cam.zoom,
    pitch: cam.pitch,
    bearing: cam.bearing,
  })
  if (map && cam.fov != null && Math.abs(map.getVerticalFieldOfView() - cam.fov) > 0.2) {
    map.setVerticalFieldOfView(cam.fov)
  }
}

export function waitGlobeIdle(timeoutMs = 1200) {
  return new Promise<void>((resolve) => {
    if (!map) {
      resolve()
      return
    }
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      resolve()
    }
    map.once('idle', finish)
    map.triggerRepaint()
    window.setTimeout(finish, timeoutMs)
  })
}

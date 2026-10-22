import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useRef } from 'react'
import { attachGlobe } from '@/lib/globe-bridge'

function hideBuildingLayers(map: maplibregl.Map, hidden: boolean) {
  const layers = map.getStyle()?.layers ?? []
  for (const layer of layers) {
    if (!layer.id.toLowerCase().includes('building')) continue
    if (!map.getLayer(layer.id)) continue
    map.setLayoutProperty(layer.id, 'visibility', hidden ? 'none' : 'visible')
  }
}

type Props = {
  visible: boolean
  center: { lng: number; lat: number } | null
  onFlyEnd?: () => void
  flyTrigger: number
  recording: boolean
  hideChrome?: boolean
  /** 0..1，速度最高时略为拉开地球视场 */
  rush: number
  /** 实景下降由外部逐帧摆相机，这里不再 flyTo。 */
  poseLocked?: boolean
  /** 实景城市不显示 MapLibre 的灰色挤出体。 */
  hideExtrusions?: boolean
  /** 0..1，和实景画面交叉淡化。 */
  opacity?: number
}

export function GlobeView({
  visible,
  center,
  onFlyEnd,
  flyTrigger,
  recording,
  hideChrome,
  rush,
  poseLocked = false,
  hideExtrusions = false,
  opacity = 1,
}: Props) {
  const container = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const endHandler = useRef(onFlyEnd)
  const hideExtrusionsRef = useRef(hideExtrusions)

  endHandler.current = onFlyEnd
  hideExtrusionsRef.current = hideExtrusions

  useEffect(() => {
    if (!container.current || mapRef.current) return
    const map = new maplibregl.Map({
      container: container.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [105, 20],
      zoom: 1.4,
      pitch: 0,
      bearing: 0,
      maxPitch: 85,
      attributionControl: false,
      canvasContextAttributes: { preserveDrawingBuffer: true, antialias: true },
      projection: 'globe',
    } as maplibregl.MapOptions)
    attachGlobe(map)
    if (!hideChrome) map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right')
    map.on('load', () => {
      map.resize()
      try {
        map.setProjection({ type: 'globe' })
      } catch {
        /* 旧构建无 globe 时保持平面 */
      }
      const skipExtrusions = new URLSearchParams(window.location.search).get('photoreal') === '1'
      try {
        if (!skipExtrusions) {
          map.addLayer({
            id: '3d-buildings',
            source: 'openmaptiles',
            'source-layer': 'building',
            type: 'fill-extrusion',
            minzoom: 12,
            paint: {
              'fill-extrusion-color': '#e8e4dc',
              'fill-extrusion-height': [
                'interpolate',
                ['linear'],
                ['zoom'],
                12,
                0,
                16,
                ['coalesce', ['get', 'render_height'], ['get', 'height'], 18],
              ],
              'fill-extrusion-opacity': 0.65,
            },
          })
        }
        if (skipExtrusions || hideExtrusionsRef.current) hideBuildingLayers(map, true)
      } catch {
        /* 部分样式无建筑图层 */
      }
    })
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map?.isStyleLoaded()) return
    hideBuildingLayers(map, hideExtrusions)
  }, [hideExtrusions])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !center || flyTrigger === 0 || hideChrome) return
    const duration = recording ? 7500 : 6800
    if (!poseLocked) {
      map.flyTo({
        center: [center.lng, center.lat],
        zoom: 16.2,
        pitch: 58,
        bearing: 24,
        duration,
        essential: true,
      })
    }
    // 视场会在飞行中改，不能用 moveend，否则中途就被当成飞完。
    const timer = window.setTimeout(() => endHandler.current?.(), duration + 160)
    return () => window.clearTimeout(timer)
  }, [center, flyTrigger, recording, hideChrome, poseLocked])

  useEffect(() => {
    const map = mapRef.current
    if (!map || hideChrome || poseLocked) return
    const fov = 36.87 + Math.min(1, Math.max(0, rush)) * 9
    if (Math.abs(map.getVerticalFieldOfView() - fov) > 0.2) map.setVerticalFieldOfView(fov)
  }, [rush, hideChrome, poseLocked])

  return (
    <div
      ref={container}
      className="absolute inset-0 h-full w-full"
      style={{ opacity: visible ? opacity : 0, pointerEvents: visible && opacity > 0.4 ? 'auto' : 'none' }}
    />
  )
}

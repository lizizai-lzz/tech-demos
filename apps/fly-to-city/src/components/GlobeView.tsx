import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useRef } from 'react'
import { attachGlobe } from '@/lib/globe-bridge'

type Props = {
  visible: boolean
  center: { lng: number; lat: number } | null
  onFlyEnd?: () => void
  flyTrigger: number
  recording: boolean
  hideChrome?: boolean
}

export function GlobeView({ visible, center, onFlyEnd, flyTrigger, recording, hideChrome }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const endHandler = useRef(onFlyEnd)

  endHandler.current = onFlyEnd

  useEffect(() => {
    if (!container.current || mapRef.current) return
    const map = new maplibregl.Map({
      container: container.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [105, 20],
      zoom: 1.4,
      pitch: 0,
      bearing: 0,
      attributionControl: { compact: true },
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
      try {
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
    if (!map || !center || flyTrigger === 0 || hideChrome) return
    const duration = recording ? 7500 : 6800
    map.flyTo({
      center: [center.lng, center.lat],
      zoom: 16.2,
      pitch: 58,
      bearing: 24,
      duration,
      essential: true,
    })
    const onMoveEnd = () => {
      endHandler.current?.()
    }
    map.once('moveend', onMoveEnd)
    return () => {
      map.off('moveend', onMoveEnd)
    }
  }, [center, flyTrigger, recording, hideChrome])

  return (
    <div
      ref={container}
      className="absolute inset-0 h-full w-full"
      style={{ opacity: visible ? 1 : 0, pointerEvents: visible ? 'auto' : 'none' }}
    />
  )
}

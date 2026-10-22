import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import {
  acquirePhotorealTiles,
  bindPhotorealRenderer,
  orientTilesToCity,
  tileBuildingSignal,
  tileCreditLines,
  tilesBusy,
} from '@/lib/photoreal-tiles'

type Status = {
  visible: boolean
  credits: string[]
  failed: boolean
}

type Props = {
  token: string
  lng: number
  lat: number
  onStatus: (status: Status) => void
}

/**
 * 实景瓦片。组件反复挂载也不会新建瓦片集。
 * 根瓦片长时间出不来就通知外面改回程序化城市。
 */
export function PhotorealTiles({ token, lng, lat, onStatus }: Props) {
  const { camera, gl, scene } = useThree()
  const tiles = acquirePhotorealTiles(token)
  const onStatusRef = useRef(onStatus)
  const failedRef = useRef(false)
  const lastKey = useRef('')
  const quiet = useRef(0)
  const detailTick = useRef(0)
  onStatusRef.current = onStatus

  useEffect(() => {
    orientTilesToCity(tiles, lng, lat)
    quiet.current = 0
    window.__photorealReady = false
    window.__photorealBuilding = false
  }, [tiles, lng, lat])

  useEffect(() => {
    bindPhotorealRenderer(gl)
    const onError = (event: { tile: unknown }) => {
      if (event.tile == null) failedRef.current = true
    }
    tiles.addEventListener('load-error', onError)
    scene.add(tiles.group)
    const started = performance.now()
    const timer = window.setInterval(() => {
      if (!tiles.root && performance.now() - started > 40000) failedRef.current = true
    }, 500)
    return () => {
      window.clearInterval(timer)
      tiles.removeEventListener('load-error', onError)
      tiles.group.removeFromParent()
      window.__photorealVisible = false
    }
  }, [gl, scene, tiles])

  useFrame(() => {
    tiles.setCamera(camera)
    tiles.setResolutionFromRenderer(camera, gl)
    tiles.group.updateMatrixWorld(true)
    tiles.update()
    const visible = tiles.visibleTiles.size > 0 && !failedRef.current
    const settled = Boolean(tiles.root) && visible && !tilesBusy(tiles)
    quiet.current = settled ? quiet.current + 1 : 0
    window.__photorealVisible = visible
    window.__photorealReady = failedRef.current || quiet.current >= 2
    detailTick.current += 1
    if (detailTick.current % 12 === 0 && !window.__photorealBuilding) {
      window.__photorealBuilding = tileBuildingSignal(tiles).building
    }
    const credits = visible ? tileCreditLines(tiles) : []
    const key = `${visible ? 1 : 0}|${failedRef.current ? 1 : 0}|${credits.join('\n')}`
    if (key === lastKey.current) return
    lastKey.current = key
    onStatusRef.current({ visible, credits, failed: failedRef.current })
  })

  return null
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { toast } from 'sonner'
import { ControlPanel } from '@/components/ControlPanel'
import { GlobeView } from '@/components/GlobeView'
import { TitleOverlay } from '@/components/TitleOverlay'
import { Attribution } from '@/components/Attribution'
import { FlightRush } from '@/components/FlightRush'
import { PhotorealCredit } from '@/components/PhotorealCredit'
import { CityScene } from '@/components/diorama/DioramaScene'
import { bakeGroundCanvas } from '@/lib/bake-ground'
import { globeIsReady, jumpGlobe, waitGlobeIdle } from '@/lib/globe-bridge'
import { heroFocus } from '@/lib/heroes'
import { flightEase, globePose, landmarkById, shotAt, type Timeline } from '@/lib/render-timeline'
import {
  globeToLocal,
  photorealBlend,
  photorealFlightPose,
  PHOTOREAL_STREAM_U,
  parseRoam,
  stageHeight,
  type LocalPose,
  type RoamMode,
} from '@/lib/view-pose'
import { playWhoosh, primeWhoosh } from '@/lib/whoosh'
import { findLandmark } from '@/lib/landmarks'
import { searchPlaces } from '@/lib/geocode'
import { loadCityForCoords, placeholderCity } from '@/lib/load-city'
import { loadBakedCity } from '@/lib/osm-fetch'
import { hasPhotorealCoverage, isMainlandChina } from '@/lib/photoreal-coverage'
import { cesiumIonToken, retryPhotorealTiles } from '@/lib/photoreal-tiles'
import type { AppPhase, AspectRatio, CityData, RecordingStage } from '@/lib/types'
import { Toaster } from '@/components/ui/sonner'
import './App.css'

const RECORD_SEQUENCE = ['shanghai-lujiazui', 'tokyo-shinjuku'] as const
const DEFAULT_EXTENT = 7000

function phaseLabel(phase: AppPhase, stage: RecordingStage) {
  if (stage !== 'idle') {
    const map: Record<RecordingStage, string> = {
      idle: '',
      'fly-in': '录制：地球飞入',
      transition: '录制：切换城市',
      orbit: '录制：环绕',
      hold: '录制：定格',
    }
    return map[stage]
  }
  if (phase === 'globe') return '地球视角'
  if (phase === 'transition') return '飞向城市'
  return '彩色城市'
}

export default function App() {
  const [phase, setPhase] = useState<AppPhase>('globe')
  const [city, setCity] = useState<CityData | null>(null)
  const [center, setCenter] = useState<{ lng: number; lat: number } | null>(null)
  const [flyTrigger, setFlyTrigger] = useState(0)
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<{ label: string; lng: number; lat: number }[]>([])
  const [loading, setLoading] = useState(false)
  const [loadMessage, setLoadMessage] = useState('')
  const [aspect, setAspect] = useState<AspectRatio>('16:9')
  const [recording, setRecording] = useState(false)
  const [recStage, setRecStage] = useState<RecordingStage>('idle')
  const [recordLeg, setRecordLeg] = useState(0)
  const [driven, setDriven] = useState(false)
  const facadeLock = (() => {
    const v = new URLSearchParams(window.location.search).get('facade')
    if (v === '0') return 0
    if (v === '1') return 1
    return null
  })()
  const [facadeReveal, setFacadeReveal] = useState(facadeLock ?? 1)
  const [globeU, setGlobeU] = useState(0)
  const [arrive, setArrive] = useState(0)
  const [flightBlend, setFlightBlend] = useState(0)
  const [matchedPose, setMatchedPose] = useState<LocalPose | null>(null)
  const roamParam = parseRoam(new URLSearchParams(window.location.search).get('roam')) ?? 'flyover'
  const [roamMode, setRoamMode] = useState<RoamMode>(roamParam)
  const [roaming, setRoaming] = useState(true)
  const [roamU, setRoamU] = useState(0)
  const [uncovered, setUncovered] = useState(false)
  const [muted, setMuted] = useState(false)
  const photorealParam = new URLSearchParams(window.location.search).get('photoreal')
  const [preferPhotoreal, setPreferPhotoreal] = useState(photorealParam !== '0')
  const [tileVisible, setTileVisible] = useState(false)
  const [tileCredits, setTileCredits] = useState<string[]>([])
  const [tileFailed, setTileFailed] = useState(false)
  const preferRef = useRef(preferPhotoreal)
  const failedRef = useRef(tileFailed)
  preferRef.current = preferPhotoreal
  failedRef.current = tileFailed
  const mutedRef = useRef(false)
  const whooshSent = useRef(false)
  mutedRef.current = muted
  const viewportRef = useRef<HTMLDivElement>(null)
  const renderMode = new URLSearchParams(window.location.search).get('render') === '1'
  const renderFps = Number(new URLSearchParams(window.location.search).get('fps') ?? 30)
  const renderDuration = Number(new URLSearchParams(window.location.search).get('duration') ?? 42)
  const timelineParam = new URLSearchParams(window.location.search).get('timeline')
  const renderTimeline: Timeline =
    timelineParam === 'lujiazui' || timelineParam === 'shinjuku' ? timelineParam : 'full'
  const shootMode = new URLSearchParams(window.location.search).get('shoot') === '1'
  const cityParam = new URLSearchParams(window.location.search).get('city')
  const cityOverride = cityParam && findLandmark(cityParam) ? cityParam : null
  const citiesRef = useRef<Record<string, CityData>>({})
  const cityRef = useRef<CityData | null>(null)
  cityRef.current = city

  const startJourney = useCallback(
    async (
      meta: {
        id: string
        nameEn: string
        nameZh: string
        subtitle: string
        lng: number
        lat: number
        extentM: number
      },
      keepRecordingStage = false,
    ) => {
      setLoading(true)
      setLoadMessage('准备数据…')
      setPhase('globe')
      setGlobeU(0)
      setArrive(0)
      setFlightBlend(0)
      setMatchedPose(null)
      setRoaming(true)
      setRoamU(0)
      setUncovered(false)
      setCenter({ lng: meta.lng, lat: meta.lat })
      if (!keepRecordingStage) setRecStage('idle')
      try {
        const baked = await loadBakedCity(meta.id)
        const mainland = isMainlandChina(meta.lng, meta.lat)
        if (!baked && !mainland) {
          setCity(placeholderCity({ ...meta, extentM: meta.extentM }))
          void bakeGroundCanvas(meta.lng, meta.lat)
          setFlyTrigger((n) => n + 1)
          if (recording) setRecStage('fly-in')
          void loadCityForCoords(meta, (msg, p) => {
            setLoadMessage(`${msg} ${Math.round(p * 100)}%`)
          })
            .then((data) => {
              setCity((curr) => (curr?.id === meta.id ? { ...data, extentM: meta.extentM } : curr))
            })
            .catch(() => {})
          setLoading(false)
          return
        }
        const data = await loadCityForCoords(meta, (msg, p) => {
          setLoadMessage(`${msg} ${Math.round(p * 100)}%`)
        })
        setCity({ ...data, extentM: meta.extentM })
        void bakeGroundCanvas(meta.lng, meta.lat)
        setFlyTrigger((n) => n + 1)
        if (recording) setRecStage('fly-in')
      } catch (e) {
        console.error(e)
        toast.error('数据加载失败，请稍后重试或换用地标卡片')
        setLoading(false)
      }
    },
    [recording],
  )

  const onFlyEnd = useCallback(() => {
    setArrive(0)
    setRoamU(0)
    setRoaming(true)
    setMatchedPose(null)
    setFlightBlend(1)
    setPhase('transition')
    window.setTimeout(() => {
      setPhase('diorama')
      setLoading(false)
      if (recording) setRecStage('orbit')
    }, 900)
  }, [recording])

  useEffect(() => {
    if (!recording || recStage !== 'orbit') return
    const t = window.setTimeout(() => setRecStage('hold'), 12000)
    return () => clearTimeout(t)
  }, [recording, recStage])

  useEffect(() => {
    if (renderMode || !recording || recStage !== 'orbit') return
    const t0 = performance.now()
    let raf = 0
    const tick = () => {
      const u = Math.min(1, (performance.now() - t0) / 3600)
      setFacadeReveal(facadeLock ?? u)
      if (u < 1) raf = requestAnimationFrame(tick)
    }
    setFacadeReveal(facadeLock ?? 0)
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [recording, recStage, recordLeg, renderMode, facadeLock])

  useEffect(() => {
    if (!recording || recStage !== 'hold') return
    const t = window.setTimeout(() => {
      const next = recordLeg + 1
      if (next >= RECORD_SEQUENCE.length) {
        setRecording(false)
        setRecStage('idle')
        return
      }
      setRecordLeg(next)
      const lm = findLandmark(RECORD_SEQUENCE[next])
      if (!lm) return
      startJourney(
        {
          id: lm.id,
          nameEn: lm.nameEn,
          nameZh: lm.nameZh,
          subtitle: lm.subtitle,
          lng: lm.lng,
          lat: lm.lat,
          extentM: lm.extentM,
        },
        true,
      )
    }, 5000)
    return () => clearTimeout(t)
  }, [recording, recStage, recordLeg, startJourney])

  useEffect(() => {
    if (renderMode || flyTrigger === 0) return
    whooshSent.current = false
    const duration = recording ? 7500 : 6800
    const t0 = performance.now()
    let raf = 0
    setGlobeU(0)
    setArrive(0)
    const tick = () => {
      const u = Math.min(1, (performance.now() - t0) / duration)
      const eased = flightEase(u)
      if (!whooshSent.current && eased >= 0.18 && !mutedRef.current) {
        whooshSent.current = true
        playWhoosh()
      }
      const current = cityRef.current
      const photo =
        !!current &&
        preferRef.current &&
        cesiumIonToken() !== '' &&
        hasPhotorealCoverage(current.id, current.center.lng, current.center.lat) &&
        !failedRef.current
      if (photo) {
        const h = stageHeight()
        const focus = heroFocus(current.id, current.center.lng, current.center.lat)
        const globe = photorealFlightPose(
          { id: current.id, lng: current.center.lng, lat: current.center.lat },
          eased,
          h,
          focus,
        )
        jumpGlobe(globe)
        setFlightBlend(photorealBlend(eased))
        setMatchedPose(globeToLocal(current.center.lng, current.center.lat, globe, h))
      } else {
        setFlightBlend(0)
        setMatchedPose(null)
      }
      setGlobeU(eased)
      if (u < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [flyTrigger, recording, renderMode])

  useEffect(() => {
    if (renderMode || phase !== 'diorama') return
    const t0 = performance.now()
    let raf = 0
    const tick = () => {
      const u = Math.min(1, (performance.now() - t0) / 2800)
      setArrive(u)
      if (u < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [phase, city?.id, renderMode])

  useEffect(() => {
    setTileVisible(false)
    setTileCredits([])
    setTileFailed(false)
    setUncovered(false)
    window.__photorealBuilding = false
    retryPhotorealTiles()
  }, [city?.id])

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([])
      return
    }
    const t = setTimeout(() => {
      searchPlaces(query).then(setSuggestions).catch(() => setSuggestions([]))
    }, 400)
    return () => clearTimeout(t)
  }, [query])

  const pickLandmark = (id: string) => {
    primeWhoosh()
    const lm = findLandmark(id)
    if (!lm) return
    startJourney({
      id: lm.id,
      nameEn: lm.nameEn,
      nameZh: lm.nameZh,
      subtitle: lm.subtitle,
      lng: lm.lng,
      lat: lm.lat,
      extentM: lm.extentM,
    })
  }

  const onSearch = () => {
    primeWhoosh()
    const s = suggestions[0]
    if (!s) {
      toast.message('请输入并选择搜索结果')
      return
    }
    startJourney({
      id: `custom-${s.lng.toFixed(4)}-${s.lat.toFixed(4)}`,
      nameEn: s.label.split(',')[0]?.toUpperCase() ?? 'CUSTOM',
      nameZh: '自定义',
      subtitle: s.label,
      lng: s.lng,
      lat: s.lat,
      extentM: DEFAULT_EXTENT,
    })
  }

  const beginRecording = useCallback(() => {
    setRecording(true)
    setRecordLeg(0)
    setRecStage('fly-in')
    setAspect('16:9')
    const lm = findLandmark(RECORD_SEQUENCE[0])
    if (lm) {
      startJourney({
        id: lm.id,
        nameEn: lm.nameEn,
        nameZh: lm.nameZh,
        subtitle: lm.subtitle,
        lng: lm.lng,
        lat: lm.lat,
        extentM: lm.extentM,
      })
    }
  }, [startJourney])

  const toggleRecording = () => {
    if (!recording) {
      beginRecording()
      return
    }
    setRecording(false)
    setRecStage('idle')
  }

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    if (p.get('autorecord') === '1' && !recording && !renderMode) beginRecording()
  }, [beginRecording, recording, renderMode])

  useEffect(() => {
    if (!renderMode) return
    document.body.classList.add('render-mode')
    let dead = false
    const wantTiles = (cityId: string) => {
      const lm = landmarkById(cityId)
      return (
        preferRef.current &&
        cesiumIonToken() !== '' &&
        hasPhotorealCoverage(cityId, lm.lng, lm.lat) &&
        !failedRef.current
      )
    }
    const boot = async () => {
      const ids = cityOverride
        ? [cityOverride]
        : renderTimeline === 'lujiazui'
          ? ['shanghai-lujiazui']
          : renderTimeline === 'shinjuku'
            ? shootMode
              ? ['tokyo-shinjuku', 'hongkong-central']
              : ['tokyo-shinjuku']
            : ['shanghai-lujiazui', 'tokyo-shinjuku']
      for (const id of ids) {
        const lm = landmarkById(id)
        citiesRef.current[id] = await loadCityForCoords({
          id: lm.id,
          nameEn: lm.nameEn,
          nameZh: lm.nameZh,
          subtitle: lm.subtitle,
          lng: lm.lng,
          lat: lm.lat,
          extentM: lm.extentM,
        })
        await bakeGroundCanvas(lm.lng, lm.lat)
      }
      if (dead) return
      const firstId = ids[0]
      flushSync(() => {
        setPhase('globe')
        setCity(citiesRef.current[firstId])
        setDriven(true)
      })
      for (let i = 0; i < 400 && !dead; i++) {
        if (globeIsReady() && window.__cityReady === firstId) break
        await new Promise((r) => setTimeout(r, 50))
      }
      const applyFlight = (cityId: string, u: number) => {
        const lm = landmarkById(cityId)
        const h = stageHeight()
        const focus = heroFocus(lm.id, lm.lng, lm.lat)
        const globe = photorealFlightPose({ id: lm.id, lng: lm.lng, lat: lm.lat }, u, h, focus)
        return { globe, local: globeToLocal(lm.lng, lm.lat, globe, h) }
      }
      const showSettled = async (id: string) => {
        const data = citiesRef.current[id]
        if (!data) return
        window.__photorealReady = !wantTiles(id)
        flushSync(() => {
          setCity(data)
          setPhase('diorama')
          setGlobeU(1)
          setArrive(1)
          setRoamU(0.35)
          setRoaming(true)
          setFacadeReveal(facadeLock ?? 1)
          setDriven(true)
          setFlightBlend(1)
          setMatchedPose(null)
        })
        for (let i = 0; i < 80; i++) {
          if (window.__cityReady === id) break
          await new Promise((r) => setTimeout(r, 40))
        }
        await new Promise((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve(null)))
        })
      }
      window.__showCity = showSettled
      // 下降段先把相机放到接近落地的位置，让同一套瓦片提前流出根节点。
      window.__preloadPhotoreal = async () => {
        const id = Object.keys(citiesRef.current).find((key) => wantTiles(key))
        if (!id) {
          window.__photorealReady = true
          return
        }
        const data = citiesRef.current[id]
        const { globe, local } = applyFlight(id, 0.92)
        window.__photorealReady = false
        flushSync(() => {
          setCity(data)
          setPhase('globe')
          setGlobeU(0.92)
          setArrive(0)
          setRoamU(0)
          setFlightBlend(photorealBlend(0.92))
          setMatchedPose(local)
          setDriven(true)
        })
        jumpGlobe(globe)
        await new Promise((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve(null)))
        })
      }
      window.__seek = async (frame: number) => {
        const shot = shotAt(frame / renderFps, renderDuration, renderTimeline, cityOverride)
        const data = citiesRef.current[shot.cityId]
        const tiles = wantTiles(shot.cityId)
        if (shot.kind === 'globe' && tiles) {
          const { globe, local } = applyFlight(shot.cityId, shot.u)
          window.__photorealReady = shot.u < PHOTOREAL_STREAM_U
          flushSync(() => {
            setCity(data)
            setPhase('globe')
            setGlobeU(shot.u)
            setArrive(0)
            setRoamU(0)
            setFlightBlend(photorealBlend(shot.u))
            setMatchedPose(local)
          })
          jumpGlobe(globe)
        } else if (shot.kind === 'globe') {
          window.__photorealReady = true
          flushSync(() => {
            setCity(data)
            setPhase('globe')
            setGlobeU(shot.u)
            setArrive(0)
            setRoamU(0)
            setFlightBlend(0)
            setMatchedPose(null)
          })
          jumpGlobe(globePose(landmarkById(shot.cityId), shot.u))
        } else {
          window.__photorealReady = !tiles
          flushSync(() => {
            setCity(data)
            setPhase('diorama')
            setGlobeU(1)
            setArrive(shot.arrive)
            setRoamU(shot.roam)
            setFacadeReveal(facadeLock ?? shot.reveal)
            setFlightBlend(1)
            setMatchedPose(null)
          })
        }
        if (shot.kind === 'globe') await waitGlobeIdle(800)
        else {
          for (let i = 0; i < 80; i++) {
            if (window.__cityReady === shot.cityId) break
            await new Promise((r) => setTimeout(r, 40))
          }
        }
        await new Promise((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve(null)))
        })
      }
      window.__setFacade = async (value: number) => {
        const next = facadeLock ?? Math.min(1, Math.max(0, value))
        flushSync(() => setFacadeReveal(next))
        await new Promise((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve(null)))
        })
      }
      window.__flyReady = true
    }
    void boot()
    return () => {
      dead = true
      document.body.classList.remove('render-mode')
      window.__flyReady = false
    }
  }, [renderMode, renderFps, renderDuration, renderTimeline, facadeLock, shootMode, cityOverride])

  const tokenReady = cesiumIonToken() !== ''
  const covered = city ? hasPhotorealCoverage(city.id, city.center.lng, city.center.lat) : false
  const wantPhotoreal = preferPhotoreal && tokenReady && covered && !tileFailed && !uncovered
  const streaming = wantPhotoreal && globeU >= PHOTOREAL_STREAM_U
  const photoreal = wantPhotoreal && (phase === 'diorama' || streaming)
  const modeNote = !preferPhotoreal
    ? '当前是程序化城市。'
    : !tokenReady
      ? '没有 Cesium ion 令牌，已改用程序化城市。'
      : city && !covered
        ? '中国大陆没有这套实景，已改用程序化城市。'
        : tileFailed
          ? '实景瓦片没有加载成功，已改用程序化城市。'
          : uncovered
            ? '落地后没有看到高细节建筑，已改用程序化城市。'
            : photoreal && !tileVisible
              ? '正在确认实景覆盖…'
              : tileVisible
                ? '正在显示 Google 实景。'
                : '实景会在下降途中淡入。'

  useEffect(() => {
    if (phase !== 'diorama' || !wantPhotoreal) return
    let settledMs = 0
    let last = performance.now()
    const id = window.setInterval(() => {
      const now = performance.now()
      if (window.__photorealBuilding) {
        window.clearInterval(id)
        return
      }
      if (window.__photorealReady) settledMs += now - last
      last = now
      if (settledMs > 8000) setUncovered(true)
    }, 400)
    return () => window.clearInterval(id)
  }, [phase, city?.id, wantPhotoreal])

  const aspectFrame =
    aspect === '9:16' && !recording
      ? 'mx-auto h-full w-auto max-h-[100dvh] max-w-[100vw] aspect-[9/16]'
      : 'h-full w-full'

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#f4f4f2] text-foreground">
      {!recording && <Toaster position="top-center" />}

      <div
        id="stage"
        ref={viewportRef}
        className={`relative ${aspectFrame}`}
        style={
          recording && aspect === '16:9'
            ? { width: '100vw', height: '100vh', maxWidth: 1920, maxHeight: 1080, margin: 'auto' }
            : { width: '100vw', height: '100dvh' }
        }
      >
        <GlobeView
          visible={phase !== 'diorama'}
          center={center}
          flyTrigger={flyTrigger}
          onFlyEnd={onFlyEnd}
          recording={recording}
          hideChrome={renderMode}
          rush={phase === 'diorama' ? 0 : Math.sin(Math.min(1, Math.max(0, globeU)) * Math.PI)}
          poseLocked={wantPhotoreal && !renderMode}
          hideExtrusions={wantPhotoreal}
          opacity={phase === 'diorama' ? 0 : 1 - (wantPhotoreal ? flightBlend : 0)}
        />
        {/* 隐藏时仍占满画面。display:none 会把画布收成 0×0，实景瓦片就按错误分辨率停止细分。 */}
        <div
          className="absolute inset-0"
          style={{
            visibility: renderMode && phase !== 'diorama' && !streaming ? 'hidden' : 'visible',
            opacity: phase === 'diorama' ? 1 : wantPhotoreal ? flightBlend : 0,
            pointerEvents: phase === 'diorama' ? 'auto' : 'none',
            transition: renderMode || wantPhotoreal ? 'none' : 'opacity 1000ms',
          }}
        >
          {city && (
            <CityScene
              data={city}
              interactive={!recording && !renderMode}
              photoreal={photoreal}
              onPhotorealStatus={(status) => {
                setTileVisible(status.visible)
                setTileCredits(status.credits)
                if (status.failed) setTileFailed(true)
              }}
              controls={{
                driven: driven || renderMode,
                facadeReveal,
                arrive: renderMode || wantPhotoreal || phase === 'diorama' ? arrive : 1,
                matched: matchedPose,
                roamMode,
                roamU,
                roaming: roaming && phase === 'diorama',
                onStopRoam: () => setRoaming(false),
              }}
            />
          )}
        </div>
        <div className="pointer-events-none absolute inset-0 z-10" aria-hidden>
          <FlightRush globeU={globeU} arrive={phase === 'globe' ? 0 : arrive} />
        </div>
        {tileVisible ? <PhotorealCredit visible lines={tileCredits} /> : <Attribution />}
        <TitleOverlay
          data={city}
          visible={(phase === 'diorama' || recording) && !!city}
          recording={recording}
        />
      </div>

      {!recording && !renderMode && (
        <ControlPanel
          query={query}
          onQueryChange={setQuery}
          onSearch={onSearch}
          suggestions={suggestions}
          onPickSuggestion={(s) => {
            setQuery(s.label)
            setSuggestions([])
          }}
          onPickLandmark={pickLandmark}
          aspect={aspect}
          onAspect={setAspect}
          onToggleRecording={toggleRecording}
          facadeOn={facadeReveal > 0.5}
          onFacade={(on) => setFacadeReveal(on ? 1 : 0)}
          muted={muted}
          onMuted={(next) => {
            if (!next) primeWhoosh()
            setMuted(next)
          }}
          roamMode={roamMode}
          onRoamMode={(next) => {
            setRoamMode(next)
            setRoaming(true)
            setRoamU(0)
          }}
          roaming={roaming}
          onToggleRoam={() => setRoaming((value) => !value)}
          preferPhotoreal={preferPhotoreal}
          onPhotoreal={(next) => {
            if (next) {
              retryPhotorealTiles()
              setTileFailed(false)
            }
            setPreferPhotoreal(next)
          }}
          modeNote={modeNote}
          loading={loading}
          loadMessage={loadMessage}
          phaseLabel={phaseLabel(phase, recStage)}
        />
      )}
    </div>
  )
}

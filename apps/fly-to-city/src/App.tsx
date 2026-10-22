import { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { toast } from 'sonner'
import { ControlPanel } from '@/components/ControlPanel'
import { GlobeView } from '@/components/GlobeView'
import { TitleOverlay } from '@/components/TitleOverlay'
import { FlightRush } from '@/components/FlightRush'
import { CityScene } from '@/components/diorama/DioramaScene'
import { bakeGroundCanvas } from '@/lib/bake-ground'
import { globeIsReady, jumpGlobe, waitGlobeIdle } from '@/lib/globe-bridge'
import { arriveFromReveal, flightEase, globePose, landmarkById, shotAt, type Timeline } from '@/lib/render-timeline'
import { playWhoosh, primeWhoosh } from '@/lib/whoosh'
import { findLandmark } from '@/lib/landmarks'
import { searchPlaces } from '@/lib/geocode'
import { loadCityForCoords } from '@/lib/load-city'
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
  const [autoOrbit, setAutoOrbit] = useState(false)
  const [recordLeg, setRecordLeg] = useState(0)
  const [driven, setDriven] = useState(false)
  const [orbit, setOrbit] = useState(0.2)
  const [push, setPush] = useState(0)
  const facadeLock = (() => {
    const v = new URLSearchParams(window.location.search).get('facade')
    if (v === '0') return 0
    if (v === '1') return 1
    return null
  })()
  const [facadeReveal, setFacadeReveal] = useState(facadeLock ?? 1)
  const [globeU, setGlobeU] = useState(0)
  const [arrive, setArrive] = useState(0)
  const [muted, setMuted] = useState(false)
  const mutedRef = useRef(false)
  const whooshSent = useRef(false)
  mutedRef.current = muted
  const viewportRef = useRef<HTMLDivElement>(null)
  const renderMode = new URLSearchParams(window.location.search).get('render') === '1'
  const renderFps = Number(new URLSearchParams(window.location.search).get('fps') ?? 30)
  const renderDuration = Number(new URLSearchParams(window.location.search).get('duration') ?? 42)
  const renderTimeline: Timeline =
    new URLSearchParams(window.location.search).get('timeline') === 'lujiazui' ? 'lujiazui' : 'full'
  const citiesRef = useRef<Record<string, CityData>>({})

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
      setCenter({ lng: meta.lng, lat: meta.lat })
      setAutoOrbit(false)
      if (!keepRecordingStage) setRecStage('idle')
      try {
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
    setPhase('transition')
    window.setTimeout(() => {
      setPhase('diorama')
      setLoading(false)
      setAutoOrbit(true)
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
        setAutoOrbit(false)
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
    setAutoOrbit(false)
  }

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    if (p.get('autorecord') === '1' && !recording && !renderMode) beginRecording()
  }, [beginRecording, recording, renderMode])

  useEffect(() => {
    if (!renderMode) return
    document.body.classList.add('render-mode')
    let dead = false
    const boot = async () => {
      const ids =
        renderTimeline === 'lujiazui'
          ? (['shanghai-lujiazui'] as const)
          : (['shanghai-lujiazui', 'tokyo-shinjuku'] as const)
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
      flushSync(() => {
        setPhase('globe')
        setCity(citiesRef.current['shanghai-lujiazui'])
        setDriven(true)
      })
      for (let i = 0; i < 400 && !dead; i++) {
        if (globeIsReady() && window.__cityReady === 'shanghai-lujiazui') break
        await new Promise((r) => setTimeout(r, 50))
      }
      window.__seek = async (frame: number) => {
        const shot = shotAt(frame / renderFps, renderDuration, renderTimeline)
        const data = citiesRef.current[shot.cityId]
        flushSync(() => {
          setCity(data)
          if (shot.kind === 'globe') {
            setPhase('globe')
            setGlobeU(shot.u)
            setArrive(0)
            jumpGlobe(globePose(landmarkById(shot.cityId), shot.u))
          } else {
            setPhase('diorama')
            setGlobeU(1)
            setArrive(arriveFromReveal(shot.reveal))
            setOrbit(shot.orbit)
            setPush(shot.push)
            setFacadeReveal(facadeLock ?? shot.reveal)
          }
        })
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
  }, [renderMode, renderFps, renderDuration, renderTimeline, facadeLock])

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
        />
        <div
          className="absolute inset-0"
          style={{
            display: renderMode && phase !== 'diorama' ? 'none' : 'block',
            opacity: phase === 'diorama' ? 1 : 0,
            pointerEvents: phase === 'diorama' ? 'auto' : 'none',
            transition: renderMode ? 'none' : 'opacity 1000ms',
          }}
        >
          {city && (
            <CityScene
              data={city}
              interactive={!recording && !renderMode}
              controls={{
                autoOrbit: autoOrbit || recording,
                orbit,
                push,
                driven: driven || renderMode,
                facadeReveal,
                arrive: renderMode ? arrive : phase === 'diorama' ? arrive : 1,
              }}
            />
          )}
        </div>
        <div className="pointer-events-none absolute inset-0 z-10" aria-hidden>
          <FlightRush globeU={globeU} arrive={phase === 'globe' ? 0 : arrive} />
        </div>
        {!recording && !renderMode && (
          <p className="pointer-events-none absolute bottom-2 right-3 z-30 max-w-[28rem] text-right text-[10px] leading-snug text-neutral-800/80">
            地图 © OpenStreetMap / OpenFreeMap · 影像 Sentinel-2 cloudless © EOX CC BY 4.0（含 Copernicus Sentinel 数据）
          </p>
        )}
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
          loading={loading}
          loadMessage={loadMessage}
          phaseLabel={phaseLabel(phase, recStage)}
        />
      )}
    </div>
  )
}

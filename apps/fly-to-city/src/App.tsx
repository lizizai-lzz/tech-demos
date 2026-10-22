import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ControlPanel } from '@/components/ControlPanel'
import { GlobeView } from '@/components/GlobeView'
import { TitleOverlay } from '@/components/TitleOverlay'
import {
  DioramaScene,
  type DioramaControls,
} from '@/components/diorama/DioramaScene'
import { findLandmark } from '@/lib/landmarks'
import { searchPlaces } from '@/lib/geocode'
import { loadCityForCoords } from '@/lib/load-city'
import type { AppPhase, AspectRatio, CityData, RecordingStage } from '@/lib/types'
import { Toaster } from '@/components/ui/sonner'
import './App.css'

const RECORD_SEQUENCE = ['shanghai-lujiazui', 'tokyo-shinjuku'] as const

function phaseLabel(phase: AppPhase, stage: RecordingStage) {
  if (stage !== 'idle') {
    const map: Record<RecordingStage, string> = {
      idle: '',
      'fly-in': '录制：地球飞入',
      transition: '录制：切换沙盘',
      orbit: '录制：环绕',
      section: '录制：剖切横扫',
      hold: '录制：定格',
    }
    return map[stage]
  }
  if (phase === 'globe') return '地球视角'
  if (phase === 'transition') return '进入沙盘'
  return '城市沙盘'
}

export default function App() {
  const [phase, setPhase] = useState<AppPhase>('globe')
  const [city, setCity] = useState<CityData | null>(null)
  const [center, setCenter] = useState<{ lng: number; lat: number } | null>(null)
  const [flyTrigger, setFlyTrigger] = useState(0)
  const [extentM, setExtentM] = useState(1200)
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<{ label: string; lng: number; lat: number }[]>([])
  const [loading, setLoading] = useState(false)
  const [loadMessage, setLoadMessage] = useState('')
  const [clipEnabled, setClipEnabled] = useState(true)
  const [buildingsOnlyClip, setBuildingsOnlyClip] = useState(true)
  const [sectionPos, setSectionPos] = useState(-200)
  const [sectionAxis, setSectionAxis] = useState<'x' | 'z'>('x')
  const [aspect, setAspect] = useState<AspectRatio>('16:9')
  const [recording, setRecording] = useState(false)
  const [recStage, setRecStage] = useState<RecordingStage>('idle')
  const [autoOrbit, setAutoOrbit] = useState(false)
  const [autoSection, setAutoSection] = useState(false)
  const [recordLeg, setRecordLeg] = useState(0)
  const viewportRef = useRef<HTMLDivElement>(null)

  const half = (city?.extentM ?? extentM) / 2

  const dioramaControls: DioramaControls = useMemo(
    () => ({
      sectionPos,
      sectionAxis,
      clipEnabled,
      buildingsOnlyClip,
      autoOrbit,
      autoSection,
      orbitSpeed: recording ? 0.16 : 0.14,
    }),
    [sectionPos, sectionAxis, clipEnabled, buildingsOnlyClip, autoOrbit, autoSection, recording],
  )

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
      setCenter({ lng: meta.lng, lat: meta.lat })
      setAutoOrbit(false)
      setAutoSection(false)
      if (!keepRecordingStage) setRecStage('idle')
      try {
        const data = await loadCityForCoords(meta, (msg, p) => {
          setLoadMessage(`${msg} ${Math.round(p * 100)}%`)
        })
        setCity({ ...data, extentM: meta.extentM })
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
      setSectionPos(-half)
      if (recording) setRecStage('orbit')
    }, 900)
  }, [recording, half])

  useEffect(() => {
    if (!recording || recStage !== 'orbit') return
    const t = window.setTimeout(() => {
      setRecStage('section')
      setAutoSection(true)
      setClipEnabled(true)
      setBuildingsOnlyClip(true)
      setSectionPos(-half)
    }, 9000)
    return () => clearTimeout(t)
  }, [recording, recStage, half])

  useEffect(() => {
    if (!autoSection) return
    let frame = 0
    const start = performance.now()
    const duration = recording ? 10000 : 9000
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
      setSectionPos(-half + eased * half * 2)
      if (t < 1) frame = requestAnimationFrame(tick)
      else {
        setAutoSection(false)
        if (recording) setRecStage('hold')
      }
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [autoSection, half, recording])

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
      setExtentM(lm.extentM)
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
    }, 6000)
    return () => clearTimeout(t)
  }, [recording, recStage, recordLeg, startJourney])

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
    const lm = findLandmark(id)
    if (!lm) return
    setExtentM(lm.extentM)
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
      extentM,
    })
  }

  const beginRecording = useCallback(() => {
    setRecording(true)
    setRecordLeg(0)
    setRecStage('fly-in')
    setAspect('16:9')
    setBuildingsOnlyClip(true)
    setClipEnabled(true)
    const lm = findLandmark(RECORD_SEQUENCE[0])
    if (lm) {
      setExtentM(lm.extentM)
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
    setAutoSection(false)
  }

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    if (p.get('autorecord') === '1' && !recording) beginRecording()
  }, [beginRecording, recording])

  const aspectStyle =
    aspect === '16:9'
      ? recording
        ? { width: 1920, height: 1080, maxWidth: '100%', maxHeight: '100vh' }
        : undefined
      : { maxWidth: 420 }

  const aspectClass =
    aspect === '16:9'
      ? recording
        ? 'h-auto w-full max-h-[100vh]'
        : 'aspect-video w-full max-h-[calc(100vh-4rem)]'
      : 'aspect-[9/16] w-full max-w-[420px]'

  return (
    <div className="relative min-h-screen bg-[#f3f3f1] text-foreground">
      {!recording && <Toaster position="top-center" />}
      {!recording && (
        <header className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-6 py-3">
          <div>
            <p className="text-base font-semibold">Fly to City</p>
            <p className="text-xs text-muted-foreground">地球飞入 · 白模沙盘 · 剖切录屏</p>
          </div>
        </header>
      )}

      <div
        className={`flex min-h-screen items-center justify-center ${recording ? 'p-0' : 'px-0 pb-4 pt-14 pl-[min(0px,0)]'}`}
      >
        <div
          ref={viewportRef}
          className={`relative overflow-hidden bg-white ${recording ? '' : 'rounded-2xl border border-border shadow-lg'} ${aspectClass} ${recording ? 'record-frame' : ''}`}
          style={aspectStyle}
        >
          <GlobeView
            visible={phase !== 'diorama'}
            center={center}
            flyTrigger={flyTrigger}
            onFlyEnd={onFlyEnd}
            recording={recording}
          />
          <div
            className="absolute inset-0 transition-opacity duration-1000"
            style={{ opacity: phase === 'diorama' ? 1 : 0, pointerEvents: phase === 'diorama' ? 'auto' : 'none' }}
          >
            {city && <DioramaScene data={city} controls={dioramaControls} recording={recording} />}
          </div>
          <TitleOverlay
            data={city}
            visible={(phase === 'diorama' || recording) && !!city}
            recording={recording}
          />
        </div>
      </div>

      {!recording && (
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
          extentM={extentM}
          onExtentChange={setExtentM}
          clipEnabled={clipEnabled}
          onClipEnabled={setClipEnabled}
          buildingsOnlyClip={buildingsOnlyClip}
          onBuildingsOnlyClip={setBuildingsOnlyClip}
          sectionPos={sectionPos}
          onSectionPos={setSectionPos}
          sectionAxis={sectionAxis}
          onSectionAxis={setSectionAxis}
          aspect={aspect}
          onAspect={setAspect}
          onToggleRecording={toggleRecording}
          loading={loading}
          loadMessage={loadMessage}
          phaseLabel={phaseLabel(phase, recStage)}
        />
      )}
    </div>
  )
}

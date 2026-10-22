import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ControlPanel } from '@/components/ControlPanel'
import { GlobeView } from '@/components/GlobeView'
import { TitleOverlay } from '@/components/TitleOverlay'
import { CityScene, type CitySceneControls } from '@/components/diorama/DioramaScene'
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
  if (phase === 'transition') return '进入白模城市'
  return '白模城市'
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
  const viewportRef = useRef<HTMLDivElement>(null)

  const sceneControls: CitySceneControls = useMemo(
    () => ({
      autoOrbit,
      orbitSpeed: recording ? 0.14 : 0.12,
    }),
    [autoOrbit, recording],
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
      if (recording) setRecStage('orbit')
    }, 900)
  }, [recording])

  useEffect(() => {
    if (!recording || recStage !== 'orbit') return
    const t = window.setTimeout(() => setRecStage('hold'), 12000)
    return () => clearTimeout(t)
  }, [recording, recStage])

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
    if (p.get('autorecord') === '1' && !recording) beginRecording()
  }, [beginRecording, recording])

  const aspectFrame =
    aspect === '9:16' && !recording
      ? 'mx-auto h-full w-auto max-h-[100dvh] max-w-[100vw] aspect-[9/16]'
      : 'h-full w-full'

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#f4f4f2] text-foreground">
      {!recording && <Toaster position="top-center" />}

      <div
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
        />
        <div
          className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: phase === 'diorama' ? 1 : 0, pointerEvents: phase === 'diorama' ? 'auto' : 'none' }}
        >
          {city && <CityScene data={city} controls={sceneControls} recording={recording} />}
        </div>
        <TitleOverlay
          data={city}
          visible={(phase === 'diorama' || recording) && !!city}
          recording={recording}
        />
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

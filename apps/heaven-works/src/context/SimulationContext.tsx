import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  deliveryExtras,
  deliverySeed,
  loopPyExtra,
  loopPySeed,
  type ConsoleLine,
} from '@/data/console'
import {
  initialTasks,
  initialUnits,
  projectMeta,
  type LoopUnit,
  type TaskRow,
} from '@/data/simulation'

export type CameraPreset = 'default' | 'hologram' | 'orbit'

export type LiveMetrics = {
  fps: number
  unitsActive: number
  unitsTotal: number
  heartbeat: number
  silkKh: number
  knots: number
}

export type DeliveryEntry = {
  id: string
  time: string
  text: string
}

type SimulationState = {
  units: LoopUnit[]
  tasks: TaskRow[]
  completion: number
  consoleLines: ConsoleLine[]
  heatmap: number[][]
  deliveries: DeliveryEntry[]
  metrics: LiveMetrics
  cameraPreset: CameraPreset
  themeStub: 'cyber' | 'amber'
  setCameraPreset: (p: CameraPreset) => void
  cycleCameraPreset: () => void
  toggleThemeStub: () => void
  toggleFullscreenStub: () => void
}

const SimulationContext = createContext<SimulationState | null>(null)

const HEAT_ROWS = 8
const HEAT_COLS = 16

function padTime(d: Date) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function initHeatmap() {
  return Array.from({ length: HEAT_ROWS }, () =>
    Array.from({ length: HEAT_COLS }, () => Math.floor(Math.random() * 5)),
  )
}

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [units, setUnits] = useState(initialUnits)
  const [tasks, setTasks] = useState(initialTasks)
  const [completion, setCompletion] = useState(projectMeta.completion)
  const [consoleLines, setConsoleLines] = useState([...loopPySeed, ...loopPyExtra])
  const [heatmap, setHeatmap] = useState(initHeatmap)
  const [deliveries, setDeliveries] = useState<DeliveryEntry[]>(deliverySeed)
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('default')
  const [themeStub, setThemeStub] = useState<'cyber' | 'amber'>('cyber')
  const [metrics, setMetrics] = useState<LiveMetrics>({
    fps: 60,
    unitsActive: 8,
    unitsTotal: 8,
    heartbeat: 72,
    silkKh: 59.48,
    knots: 96244,
  })

  const frameTimes = useRef<number[]>([])
  const jobCounter = useRef(504)

  const cycleCameraPreset = useCallback(() => {
    setCameraPreset((p) =>
      p === 'default' ? 'hologram' : p === 'hologram' ? 'orbit' : 'default',
    )
  }, [])

  const toggleThemeStub = useCallback(() => {
    setThemeStub((t) => (t === 'cyber' ? 'amber' : 'cyber'))
  }, [])

  const toggleFullscreenStub = useCallback(() => {
    if (!document.fullscreenElement) {
      void document.documentElement.requestFullscreen().catch(() => {})
    } else {
      void document.exitFullscreen().catch(() => {})
    }
  }, [])

  useEffect(() => {
    let raf = 0
    const loop = (t: number) => {
      frameTimes.current.push(t)
      if (frameTimes.current.length > 30) frameTimes.current.shift()
      if (frameTimes.current.length >= 2) {
        const first = frameTimes.current[0]!
        const last = frameTimes.current[frameTimes.current.length - 1]!
        const fps = Math.round(
          ((frameTimes.current.length - 1) * 1000) / (last - first || 1),
        )
        setMetrics((m) => ({ ...m, fps: Math.min(60, Math.max(24, fps)) }))
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => {
      setUnits((prev) =>
        prev.map((u) => {
          if (u.status === 'DONE') return u
          const bump = u.status === 'VERIFY' ? 0.4 : 0.65
          const next = Math.min(100, u.progress + bump)
          const status =
            next >= 100 ? ('DONE' as LoopUnit['status']) : u.status
          return { ...u, progress: next, status }
        }),
      )

      setTasks((prev) =>
        prev.map((t) => ({
          ...t,
          progress: Math.min(100, t.progress + (t.progress >= 100 ? 0 : 0.35)),
        })),
      )

      setCompletion((c) => Math.min(99, c + 0.02))

      setMetrics((m) => ({
        ...m,
        heartbeat: 68 + Math.floor(Math.random() * 12),
        silkKh: +(m.silkKh + Math.random() * 0.08).toFixed(2),
        knots: m.knots + Math.floor(Math.random() * 40 - 10),
      }))

      setHeatmap((grid) =>
        grid.map((row) =>
          row.map((cell) => {
            if (Math.random() > 0.15) return cell
            const delta = Math.random() > 0.5 ? 1 : -1
            return Math.max(0, Math.min(4, cell + delta))
          }),
        ),
      )

      if (Math.random() > 0.55) {
        const extra = loopPyExtra[Math.floor(Math.random() * loopPyExtra.length)]!
        setConsoleLines((lines) => {
          const next = [...lines, { ...extra, num: lines[lines.length - 1]!.num + 1 }]
          return next.slice(-14)
        })
      }

      if (Math.random() > 0.7) {
        jobCounter.current += 1
        const id = `JOB-${String(jobCounter.current).padStart(4, '0')}`
        const text =
          deliveryExtras[Math.floor(Math.random() * deliveryExtras.length)]!
        setDeliveries((d) =>
          [{ id, time: padTime(new Date()), text }, ...d].slice(0, 8),
        )
      }
    }, 900)
    return () => clearInterval(id)
  }, [])

  const value = useMemo(
    () => ({
      units,
      tasks,
      completion,
      consoleLines,
      heatmap,
      deliveries,
      metrics,
      cameraPreset,
      themeStub,
      setCameraPreset,
      cycleCameraPreset,
      toggleThemeStub,
      toggleFullscreenStub,
    }),
    [
      units,
      tasks,
      completion,
      consoleLines,
      heatmap,
      deliveries,
      metrics,
      cameraPreset,
      themeStub,
      cycleCameraPreset,
      toggleThemeStub,
      toggleFullscreenStub,
    ],
  )

  return (
    <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>
  )
}

export function useSimulation() {
  const ctx = useContext(SimulationContext)
  if (!ctx) throw new Error('useSimulation must be used within SimulationProvider')
  return ctx
}

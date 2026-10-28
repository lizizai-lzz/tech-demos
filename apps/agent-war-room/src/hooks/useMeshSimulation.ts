import { useEffect, useRef, useState } from 'react'
import {
  createInitialState,
  simTick,
  type SimConfig,
  type SimSpeed,
  type SimState,
} from '@/sim/scheduler'

const STORAGE_KEY = 'agent-mesh-controls'

type StoredControls = {
  speed: SimSpeed
  paused: boolean
}

function loadControls(): StoredControls {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { speed: 1, paused: false }
    return JSON.parse(raw) as StoredControls
  } catch {
    return { speed: 1, paused: false }
  }
}

export function useMeshSimulation() {
  const stored = loadControls()
  const [config, setConfig] = useState<SimConfig>({
    speed: stored.speed,
    paused: stored.paused,
    sourceBias: null,
  })
  const [state, setState] = useState<SimState>(() => createInitialState())
  const configRef = useRef(config)
  configRef.current = config

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ speed: config.speed, paused: config.paused }),
    )
  }, [config.speed, config.paused])

  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const loop = (now: number) => {
      const dt = now - last
      last = now
      if (dt < 4) {
        raf = requestAnimationFrame(loop)
        return
      }
      setState((prev) =>
        simTick(prev, configRef.current, now, Math.random),
      )
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  return {
    state,
    config,
    setSpeed: (speed: SimSpeed) => setConfig((c) => ({ ...c, speed })),
    setPaused: (paused: boolean) => setConfig((c) => ({ ...c, paused })),
    togglePause: () => setConfig((c) => ({ ...c, paused: !c.paused })),
    setSourceBias: (sourceBias: SimConfig['sourceBias']) =>
      setConfig((c) => ({ ...c, sourceBias })),
  }
}

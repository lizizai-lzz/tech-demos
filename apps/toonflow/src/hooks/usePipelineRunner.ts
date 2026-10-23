import { useCallback, useEffect, useRef, useState } from "react"
import {
  emptyPipelineState,
  nextStage,
  regenerateNode,
  runStage,
  type PipelineStage,
  type PipelineState,
  STAGE_LABELS,
} from "@/pipeline"
import type { RunnerStatus } from "@/types/studio"

const STAGE_DELAY_MS = 900

export function usePipelineRunner(initialText: string) {
  const [pipeline, setPipeline] = useState<PipelineState>(() =>
    emptyPipelineState(initialText)
  )
  const [status, setStatus] = useState<RunnerStatus>("idle")
  const [seed, setSeed] = useState(0)
  const pauseRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const resetPipeline = useCallback((text: string) => {
    clearTimer()
    pauseRef.current = false
    setStatus("idle")
    setPipeline(emptyPipelineState(text))
  }, [])

  const finishOrContinue = useCallback(
    (state: PipelineState) => {
      const stage = nextStage(state)
      if (!stage) {
        setStatus("done")
        return
      }
      if (pauseRef.current) {
        setStatus("paused")
        return
      }
      timerRef.current = setTimeout(() => {
        const updated = runStage(state, stage, seed)
        setPipeline(updated)
        finishOrContinue(updated)
      }, STAGE_DELAY_MS)
    },
    [seed]
  )

  const start = useCallback(() => {
    clearTimer()
    pauseRef.current = false
    const fresh = emptyPipelineState(pipeline.sourceText)
    setPipeline(fresh)
    setStatus("running")
    finishOrContinue(fresh)
  }, [finishOrContinue, pipeline.sourceText])

  const pause = useCallback(() => {
    pauseRef.current = true
    clearTimer()
    setStatus("paused")
  }, [])

  const step = useCallback(() => {
    clearTimer()
    pauseRef.current = true
    const stage = nextStage(pipeline)
    if (!stage) {
      setStatus("done")
      return
    }
    const updated = runStage(pipeline, stage, seed)
    setPipeline(updated)
    setStatus(nextStage(updated) ? "paused" : "done")
  }, [pipeline, seed])

  const setSourceText = useCallback((text: string) => {
    setPipeline((p) => ({ ...p, sourceText: text }))
  }, [])

  const regenStage = useCallback(
    (stage: PipelineStage) => {
      const nextSeed = seed + 1
      setSeed(nextSeed)
      setPipeline((p) => regenerateNode(p, stage, nextSeed))
    },
    [seed]
  )

  useEffect(() => () => clearTimer(), [])

  const currentStage = nextStage(pipeline)
  const stageLabel = currentStage ? STAGE_LABELS[currentStage] : "全部完成"

  return {
    pipeline,
    status,
    stageLabel,
    currentStage,
    start,
    pause,
    step,
    resetPipeline,
    setSourceText,
    regenStage,
    completedStages: pipeline.completedStages,
  }
}

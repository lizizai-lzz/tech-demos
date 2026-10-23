import { useCallback, useEffect, useRef, useState } from "react"
import type { StudioMode } from "@/pipeline/mode"
import {
  emptyPipelineState,
  nextStage,
  regenerateNode,
  runStage,
  STAGE_LABELS,
  type PipelineStage,
  type PipelineState,
} from "@/pipeline"
import {
  emptyNovelPipelineState,
  nextNovelStage,
  NOVEL_STAGE_LABELS,
  regenerateNovelNode,
  runNovelStage,
  type NovelPipelineStage,
  type NovelPipelineState,
} from "@/pipeline/novel"
import type { PipelineStageId } from "@/pipeline/stage-id"
import type { RunnerStatus } from "@/types/studio"

const STAGE_DELAY_MS = 900

export type { PipelineStageId } from "@/pipeline/stage-id"

export function usePipelineRunner(mode: StudioMode, initialText: string) {
  const [dramaPipeline, setDramaPipeline] = useState<PipelineState>(() =>
    emptyPipelineState(initialText)
  )
  const [novelPipeline, setNovelPipeline] = useState<NovelPipelineState>(() =>
    emptyNovelPipelineState(initialText)
  )
  const [status, setStatus] = useState<RunnerStatus>("idle")
  const [seed, setSeed] = useState(0)
  const pauseRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const pipeline = mode === "drama" ? dramaPipeline : novelPipeline

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const resetPipeline = useCallback(
    (text: string, forMode?: StudioMode) => {
      const target = forMode ?? mode
      clearTimer()
      pauseRef.current = false
      setStatus("idle")
      if (target === "drama") {
        setDramaPipeline(emptyPipelineState(text))
      } else {
        setNovelPipeline(emptyNovelPipelineState(text))
      }
    },
    [mode]
  )

  const finishOrContinueDrama = useCallback(
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
        setDramaPipeline(updated)
        finishOrContinueDrama(updated)
      }, STAGE_DELAY_MS)
    },
    [seed]
  )

  const finishOrContinueNovel = useCallback(
    (state: NovelPipelineState) => {
      const stage = nextNovelStage(state)
      if (!stage) {
        setStatus("done")
        return
      }
      if (pauseRef.current) {
        setStatus("paused")
        return
      }
      timerRef.current = setTimeout(() => {
        const updated = runNovelStage(state, stage, seed)
        setNovelPipeline(updated)
        finishOrContinueNovel(updated)
      }, STAGE_DELAY_MS)
    },
    [seed]
  )

  const start = useCallback(() => {
    clearTimer()
    pauseRef.current = false
    if (mode === "drama") {
      const fresh = emptyPipelineState(dramaPipeline.sourceText)
      setDramaPipeline(fresh)
      setStatus("running")
      finishOrContinueDrama(fresh)
    } else {
      const fresh = emptyNovelPipelineState(novelPipeline.sourceText)
      setNovelPipeline(fresh)
      setStatus("running")
      finishOrContinueNovel(fresh)
    }
  }, [
    mode,
    dramaPipeline.sourceText,
    novelPipeline.sourceText,
    finishOrContinueDrama,
    finishOrContinueNovel,
  ])

  const pause = useCallback(() => {
    pauseRef.current = true
    clearTimer()
    setStatus("paused")
  }, [])

  const step = useCallback(() => {
    clearTimer()
    pauseRef.current = true
    if (mode === "drama") {
      const stage = nextStage(dramaPipeline)
      if (!stage) {
        setStatus("done")
        return
      }
      const updated = runStage(dramaPipeline, stage, seed)
      setDramaPipeline(updated)
      setStatus(nextStage(updated) ? "paused" : "done")
    } else {
      const stage = nextNovelStage(novelPipeline)
      if (!stage) {
        setStatus("done")
        return
      }
      const updated = runNovelStage(novelPipeline, stage, seed)
      setNovelPipeline(updated)
      setStatus(nextNovelStage(updated) ? "paused" : "done")
    }
  }, [mode, dramaPipeline, novelPipeline, seed])

  const setSourceText = useCallback((text: string) => {
    setDramaPipeline((p) => ({ ...p, sourceText: text }))
    setNovelPipeline((p) => ({ ...p, sourceText: text }))
  }, [])

  const regenStage = useCallback(
    (stage: PipelineStageId) => {
      const nextSeed = seed + 1
      setSeed(nextSeed)
      if (mode === "drama") {
        setDramaPipeline((p) => regenerateNode(p, stage as PipelineStage, nextSeed))
      } else {
        setNovelPipeline((p) =>
          regenerateNovelNode(p, stage as NovelPipelineStage, nextSeed)
        )
      }
    },
    [mode, seed]
  )

  useEffect(() => () => clearTimer(), [])

  const currentStage =
    mode === "drama" ? nextStage(dramaPipeline) : nextNovelStage(novelPipeline)

  const stageLabel = currentStage
    ? mode === "drama"
      ? STAGE_LABELS[currentStage as PipelineStage]
      : NOVEL_STAGE_LABELS[currentStage as NovelPipelineStage]
    : "全部完成"

  const completedStages =
    mode === "drama"
      ? dramaPipeline.completedStages
      : novelPipeline.completedStages

  return {
    mode,
    pipeline,
    dramaPipeline,
    novelPipeline,
    status,
    stageLabel,
    currentStage,
    start,
    pause,
    step,
    resetPipeline,
    setSourceText,
    regenStage,
    completedStages,
  }
}

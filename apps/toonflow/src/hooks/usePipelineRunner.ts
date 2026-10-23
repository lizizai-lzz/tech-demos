import { useCallback, useEffect, useRef, useState } from "react"
import type { ModelSettings } from "@/lib/model-settings"
import { loadRunnerSnapshot, saveRunnerSnapshot } from "@/lib/storage"
import type { StudioMode } from "@/pipeline/mode"
import {
  emptyPipelineState,
  nextStage,
  STAGE_LABELS,
  type PipelineStage,
  type PipelineState,
} from "@/pipeline"
import {
  emptyNovelPipelineState,
  nextNovelStage,
  NOVEL_STAGE_LABELS,
  type NovelPipelineStage,
  type NovelPipelineState,
} from "@/pipeline/novel"
import type { PipelineStageId } from "@/pipeline/stage-id"
import {
  executeDramaStage,
  executeNovelStage,
  regenerateDramaStage,
  regenerateNovelStage,
} from "@/pipeline/stage-executor"
import type { RunnerStatus } from "@/types/studio"

const STAGE_DELAY_MS = 900
const STAGE_DELAY_LIVE_MS = 120

export type { PipelineStageId } from "@/pipeline/stage-id"

export interface PipelineRunnerOptions {
  getModelSettings: () => ModelSettings
  onStageError?: (message: string) => void
}

function initialDramaState(text: string): PipelineState {
  const snap = loadRunnerSnapshot()
  if (snap?.dramaPipeline) return snap.dramaPipeline
  return emptyPipelineState(text)
}

function initialNovelState(text: string): NovelPipelineState {
  const snap = loadRunnerSnapshot()
  if (snap?.novelPipeline) return snap.novelPipeline
  return emptyNovelPipelineState(text)
}

function initialStatus(): RunnerStatus {
  const snap = loadRunnerSnapshot()
  return snap?.status ?? "idle"
}

function initialSeed(): number {
  const snap = loadRunnerSnapshot()
  return snap?.seed ?? 0
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return "阶段执行失败"
}

export function usePipelineRunner(
  mode: StudioMode,
  initialText: string,
  options: PipelineRunnerOptions
) {
  const { getModelSettings, onStageError } = options
  const [dramaPipeline, setDramaPipeline] = useState<PipelineState>(() =>
    initialDramaState(initialText)
  )
  const [novelPipeline, setNovelPipeline] = useState<NovelPipelineState>(() =>
    initialNovelState(initialText)
  )
  const [status, setStatus] = useState<RunnerStatus>(initialStatus)
  const [seed, setSeed] = useState(initialSeed)
  const pauseRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const runningRef = useRef(false)

  const pipeline = mode === "drama" ? dramaPipeline : novelPipeline

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const stageDelay = useCallback(() => {
    const settings = getModelSettings()
    return settings.runMode === "live" ? STAGE_DELAY_LIVE_MS : STAGE_DELAY_MS
  }, [getModelSettings])

  const resetPipeline = useCallback(
    (text: string, forMode?: StudioMode) => {
      const target = forMode ?? mode
      clearTimer()
      pauseRef.current = false
      runningRef.current = false
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
        runningRef.current = false
        setStatus("done")
        return
      }
      if (pauseRef.current) {
        runningRef.current = false
        setStatus("paused")
        return
      }
      const settings = getModelSettings()
      timerRef.current = setTimeout(() => {
        void executeDramaStage(state, stage, seed, settings)
          .then((updated) => {
            setDramaPipeline(updated)
            finishOrContinueDrama(updated)
          })
          .catch((err) => {
            pauseRef.current = true
            runningRef.current = false
            setStatus("paused")
            onStageError?.(errorMessage(err))
          })
      }, stageDelay())
    },
    [seed, getModelSettings, onStageError, stageDelay]
  )

  const finishOrContinueNovel = useCallback(
    (state: NovelPipelineState) => {
      const stage = nextNovelStage(state)
      if (!stage) {
        runningRef.current = false
        setStatus("done")
        return
      }
      if (pauseRef.current) {
        runningRef.current = false
        setStatus("paused")
        return
      }
      const settings = getModelSettings()
      timerRef.current = setTimeout(() => {
        void executeNovelStage(state, stage, seed, settings)
          .then((updated) => {
            setNovelPipeline(updated)
            finishOrContinueNovel(updated)
          })
          .catch((err) => {
            pauseRef.current = true
            runningRef.current = false
            setStatus("paused")
            onStageError?.(errorMessage(err))
          })
      }, stageDelay())
    },
    [seed, getModelSettings, onStageError, stageDelay]
  )

  const startFresh = useCallback(() => {
    clearTimer()
    pauseRef.current = false
    runningRef.current = true
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

  const continueRun = useCallback(() => {
    clearTimer()
    pauseRef.current = false
    runningRef.current = true
    if (mode === "drama") {
      if (!nextStage(dramaPipeline)) {
        setStatus("done")
        return
      }
      setStatus("running")
      finishOrContinueDrama(dramaPipeline)
    } else {
      if (!nextNovelStage(novelPipeline)) {
        setStatus("done")
        return
      }
      setStatus("running")
      finishOrContinueNovel(novelPipeline)
    }
  }, [
    mode,
    dramaPipeline,
    novelPipeline,
    finishOrContinueDrama,
    finishOrContinueNovel,
  ])

  const restart = useCallback(() => {
    startFresh()
  }, [startFresh])

  const pause = useCallback(() => {
    pauseRef.current = true
    clearTimer()
    runningRef.current = false
    setStatus("paused")
  }, [])

  const step = useCallback(() => {
    clearTimer()
    pauseRef.current = true
    const settings = getModelSettings()
    if (mode === "drama") {
      const stage = nextStage(dramaPipeline)
      if (!stage) {
        setStatus("done")
        return
      }
      void executeDramaStage(dramaPipeline, stage, seed, settings)
        .then((updated) => {
          setDramaPipeline(updated)
          setStatus(nextStage(updated) ? "paused" : "done")
        })
        .catch((err) => {
          setStatus("paused")
          onStageError?.(errorMessage(err))
        })
    } else {
      const stage = nextNovelStage(novelPipeline)
      if (!stage) {
        setStatus("done")
        return
      }
      void executeNovelStage(novelPipeline, stage, seed, settings)
        .then((updated) => {
          setNovelPipeline(updated)
          setStatus(nextNovelStage(updated) ? "paused" : "done")
        })
        .catch((err) => {
          setStatus("paused")
          onStageError?.(errorMessage(err))
        })
    }
  }, [mode, dramaPipeline, novelPipeline, seed, getModelSettings, onStageError])

  const setSourceText = useCallback((text: string) => {
    setDramaPipeline((p) => ({ ...p, sourceText: text }))
    setNovelPipeline((p) => ({ ...p, sourceText: text }))
  }, [])

  const regenStage = useCallback(
    (stage: PipelineStageId) => {
      const nextSeed = seed + 1
      setSeed(nextSeed)
      clearTimer()
      pauseRef.current = true
      const settings = getModelSettings()
      if (mode === "drama") {
        void regenerateDramaStage(
          dramaPipeline,
          stage as PipelineStage,
          nextSeed,
          settings
        )
          .then((updated) => setDramaPipeline(updated))
          .catch((err) => onStageError?.(errorMessage(err)))
      } else {
        void regenerateNovelStage(
          novelPipeline,
          stage as NovelPipelineStage,
          nextSeed,
          settings
        )
          .then((updated) => setNovelPipeline(updated))
          .catch((err) => onStageError?.(errorMessage(err)))
      }
      setStatus("paused")
    },
    [mode, seed, dramaPipeline, novelPipeline, getModelSettings, onStageError]
  )

  useEffect(() => {
    saveRunnerSnapshot({
      dramaPipeline,
      novelPipeline,
      status,
      seed,
    })
  }, [dramaPipeline, novelPipeline, status, seed])

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

  const hasProgress = completedStages.length > 0

  return {
    mode,
    pipeline,
    dramaPipeline,
    novelPipeline,
    status,
    stageLabel,
    currentStage,
    startFresh,
    continueRun,
    restart,
    pause,
    step,
    resetPipeline,
    setSourceText,
    regenStage,
    completedStages,
    hasProgress,
  }
}

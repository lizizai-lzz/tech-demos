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
import { loadRunnerSnapshot, saveRunnerSnapshot } from "@/lib/storage"
import type { RunnerStatus } from "@/types/studio"

const STAGE_DELAY_MS = 900

export type { PipelineStageId } from "@/pipeline/stage-id"

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

export function usePipelineRunner(mode: StudioMode, initialText: string) {
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

  /** 从空流水线完整空跑（idle / done 主按钮） */
  const startFresh = useCallback(() => {
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

  /** 暂停后从下一待办阶段继续，不清空已完成节点 */
  const continueRun = useCallback(() => {
    clearTimer()
    pauseRef.current = false
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

  /** 确认后清空并从头空跑 */
  const restart = useCallback(() => {
    startFresh()
  }, [startFresh])

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
      clearTimer()
      pauseRef.current = true
      if (mode === "drama") {
        setDramaPipeline((p) => regenerateNode(p, stage as PipelineStage, nextSeed))
      } else {
        setNovelPipeline((p) =>
          regenerateNovelNode(p, stage as NovelPipelineStage, nextSeed)
        )
      }
      setStatus("paused")
    },
    [mode, seed]
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

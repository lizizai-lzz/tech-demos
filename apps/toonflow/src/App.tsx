import { StudioCanvas } from "@/components/StudioCanvas"
import { NodeDetailSheet } from "@/components/NodeDetailSheet"
import { Toast } from "@/components/Toast"
import { Workbench } from "@/components/Workbench"
import { usePipelineRunner } from "@/hooks/usePipelineRunner"
import type { StudioNodeData } from "@/lib/canvas-layout"
import {
  loadLastPaste,
  loadNovelSampleId,
  loadSampleId,
  loadStudioMode,
  saveLastPaste,
  saveNovelSampleId,
  saveSampleId,
  saveStudioMode,
} from "@/lib/storage"
import type { StudioMode } from "@/pipeline/mode"
import {
  defaultSampleIdForMode,
  getNovelSampleById,
  getSampleById,
  samplesForMode,
} from "@/pipeline/samples"
import { MAX_SOURCE_CHARS } from "@/pipeline/types"
import type { NodeOverrides, SelectedNode } from "@/types/studio"
import type { Node } from "@xyflow/react"
import { useCallback, useMemo, useState } from "react"

function initialMode(): StudioMode {
  return loadStudioMode()
}

function initialText(mode: StudioMode): string {
  const saved = loadLastPaste()
  if (saved) return saved.slice(0, MAX_SOURCE_CHARS)
  const sid =
    mode === "novel"
      ? loadNovelSampleId() ?? defaultSampleIdForMode("novel")
      : loadSampleId() ?? defaultSampleIdForMode("drama")
  if (mode === "novel") {
    return getNovelSampleById(sid).excerpt
  }
  return getSampleById(sid).excerpt
}

function initialSampleId(mode: StudioMode): string {
  if (mode === "novel") {
    return loadNovelSampleId() ?? defaultSampleIdForMode("novel")
  }
  return loadSampleId() ?? defaultSampleIdForMode("drama")
}

export default function App() {
  const [mode, setMode] = useState<StudioMode>(initialMode)
  const [sampleId, setSampleId] = useState(() => initialSampleId(initialMode()))
  const [overrides, setOverrides] = useState<NodeOverrides>({})
  const [selected, setSelected] = useState<SelectedNode | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [fitViewKey, setFitViewKey] = useState(() => `init-${initialMode()}`)

  const runner = usePipelineRunner(mode, initialText(mode))

  const bumpFitView = useCallback(
    (reason: string) => {
      setFitViewKey(`${mode}-${reason}-${Date.now()}`)
    },
    [mode]
  )

  const handleModeChange = useCallback(
    (next: StudioMode) => {
      if (next === mode) return
      const inFlight =
        runner.status === "running" || runner.status === "paused"
      if (inFlight && runner.hasProgress) {
        const ok = window.confirm(
          "当前模式流水线尚未跑完，切换将暂停进度并离开本模式画布。确定切换？"
        )
        if (!ok) return
        if (runner.status === "running") {
          runner.pause()
        }
      }
      const sid = samplesForMode(next).some((s) => s.id === sampleId)
        ? sampleId
        : defaultSampleIdForMode(next)
      setSampleId(sid)
      setMode(next)
      saveStudioMode(next)
      setOverrides({})
      setSelected(null)
      setSheetOpen(false)
      bumpFitView("mode")
    },
    [mode, runner, sampleId, bumpFitView]
  )

  const handleSourceChange = useCallback(
    (text: string) => {
      runner.setSourceText(text)
      saveLastPaste(text)
      setOverrides({})
    },
    [runner]
  )

  const handleSampleChange = useCallback(
    (id: string) => {
      const sample =
        mode === "novel" ? getNovelSampleById(id) : getSampleById(id)
      setSampleId(id)
      if (mode === "novel") {
        saveNovelSampleId(id)
      } else {
        saveSampleId(id)
      }
      runner.resetPipeline(sample.excerpt, mode)
      saveLastPaste(sample.excerpt)
      setOverrides({})
      setSelected(null)
      bumpFitView("sample")
    },
    [mode, runner, bumpFitView]
  )

  const onNodeSelect = useCallback((node: Node<StudioNodeData> | null) => {
    if (!node) {
      setSelected(null)
      setSheetOpen(false)
      return
    }
    const d = node.data
    setSelected({
      id: node.id,
      kind: d.kind,
      title: d.title,
      body: d.body,
      stageId: d.stageId as SelectedNode["stageId"],
      draftBody: d.draftBody,
      revisedBody: d.revisedBody,
      sheetExtras: d.sheetExtras,
    })
    setSheetOpen(true)
  }, [])

  const onSaveNode = useCallback(
    (id: string, title: string, body: string, revisedBody?: string) => {
      if (revisedBody !== undefined) {
        setOverrides((prev) => ({
          ...prev,
          [id]: { title, body: revisedBody },
        }))
        setSelected((s) =>
          s && s.id === id ? { ...s, title, body, revisedBody } : s
        )
      } else {
        setOverrides((prev) => ({ ...prev, [id]: { title, body } }))
        setSelected((s) => (s && s.id === id ? { ...s, title, body } : s))
      }
      setToast("已保存到画布")
    },
    []
  )

  const onRegenerate = useCallback(
    (stage: SelectedNode["stageId"]) => {
      if (!stage) return
      runner.regenStage(stage)
      setOverrides({})
      setToast("已重生成该阶段，下游产物已清空")
    },
    [runner]
  )

  const handleStartFresh = useCallback(() => {
    runner.startFresh()
    bumpFitView("start")
  }, [runner, bumpFitView])

  const handleRestart = useCallback(() => {
    runner.restart()
    setOverrides({})
    bumpFitView("restart")
  }, [runner, bumpFitView])

  const sourceText = useMemo(
    () => runner.pipeline.sourceText.slice(0, MAX_SOURCE_CHARS),
    [runner.pipeline.sourceText]
  )

  return (
    <div className="flex h-svh w-full overflow-hidden">
      <Workbench
        mode={mode}
        sourceText={sourceText}
        sampleId={sampleId}
        status={runner.status}
        stageLabel={runner.stageLabel}
        currentStageId={runner.currentStage}
        completedStages={runner.completedStages}
        dramaPipeline={runner.dramaPipeline}
        novelPipeline={runner.novelPipeline}
        onModeChange={handleModeChange}
        onSourceChange={handleSourceChange}
        onSampleChange={handleSampleChange}
        onStartFresh={handleStartFresh}
        onContinue={runner.continueRun}
        onRestart={handleRestart}
        onPause={runner.pause}
        onStep={runner.step}
        onExportDone={() => setToast("JSON 已下载")}
      />
      <main className="relative flex-1 min-w-0">
        <StudioCanvas
          mode={mode}
          dramaPipeline={{ ...runner.dramaPipeline, sourceText }}
          novelPipeline={{ ...runner.novelPipeline, sourceText }}
          overrides={overrides}
          status={runner.status}
          currentStageId={runner.currentStage}
          fitViewKey={fitViewKey}
          onNodeSelect={onNodeSelect}
        />
      </main>
      <NodeDetailSheet
        node={selected}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSave={onSaveNode}
        onRegenerate={onRegenerate}
      />
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}

import { StudioCanvas } from "@/components/StudioCanvas"
import { NodeDetailSheet } from "@/components/NodeDetailSheet"
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

  const runner = usePipelineRunner(mode, initialText(mode))

  const handleModeChange = useCallback(
    (next: StudioMode) => {
      if (next === mode) return
      const shared = runner.pipeline.sourceText.slice(0, MAX_SOURCE_CHARS)
      const sid = samplesForMode(next).some((s) => s.id === sampleId)
        ? sampleId
        : defaultSampleIdForMode(next)
      setSampleId(sid)
      setMode(next)
      saveStudioMode(next)
      runner.resetPipeline(shared, next)
      setOverrides({})
      setSelected(null)
      setSheetOpen(false)
    },
    [mode, runner]
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
    },
    [mode, runner]
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
    })
    setSheetOpen(true)
  }, [])

  const onSaveNode = useCallback((id: string, title: string, body: string) => {
    setOverrides((prev) => ({ ...prev, [id]: { title, body } }))
    setSelected((s) => (s && s.id === id ? { ...s, title, body } : s))
  }, [])

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
        completedStages={runner.completedStages}
        dramaPipeline={runner.dramaPipeline}
        novelPipeline={runner.novelPipeline}
        onModeChange={handleModeChange}
        onSourceChange={handleSourceChange}
        onSampleChange={handleSampleChange}
        onStart={runner.start}
        onPause={runner.pause}
        onStep={runner.step}
      />
      <main className="relative flex-1 min-w-0">
        <StudioCanvas
          mode={mode}
          dramaPipeline={{ ...runner.dramaPipeline, sourceText }}
          novelPipeline={{ ...runner.novelPipeline, sourceText }}
          overrides={overrides}
          onNodeSelect={onNodeSelect}
        />
      </main>
      <NodeDetailSheet
        node={selected}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSave={onSaveNode}
        onRegenerate={runner.regenStage}
      />
    </div>
  )
}

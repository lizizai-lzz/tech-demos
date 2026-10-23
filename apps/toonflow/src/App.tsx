import { StudioCanvas } from "@/components/StudioCanvas"
import { NodeDetailSheet } from "@/components/NodeDetailSheet"
import { Workbench } from "@/components/Workbench"
import { usePipelineRunner } from "@/hooks/usePipelineRunner"
import type { StudioNodeData } from "@/lib/canvas-layout"
import {
  loadLastPaste,
  loadSampleId,
  saveLastPaste,
  saveSampleId,
} from "@/lib/storage"
import { getSampleById } from "@/pipeline/samples"
import { MAX_SOURCE_CHARS } from "@/pipeline/types"
import type { NodeOverrides, SelectedNode } from "@/types/studio"
import type { Node } from "@xyflow/react"
import { useCallback, useMemo, useState } from "react"

function initialText(): string {
  const saved = loadLastPaste()
  if (saved) return saved.slice(0, MAX_SOURCE_CHARS)
  const sid = loadSampleId() ?? "rain-alley"
  return getSampleById(sid).excerpt
}

function initialSampleId(): string {
  return loadSampleId() ?? "rain-alley"
}

export default function App() {
  const [sampleId, setSampleId] = useState(initialSampleId)
  const [overrides, setOverrides] = useState<NodeOverrides>({})
  const [selected, setSelected] = useState<SelectedNode | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const runner = usePipelineRunner(initialText())

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
      const sample = getSampleById(id)
      setSampleId(id)
      saveSampleId(id)
      runner.resetPipeline(sample.excerpt)
      runner.setSourceText(sample.excerpt)
      saveLastPaste(sample.excerpt)
      setOverrides({})
      setSelected(null)
    },
    [runner]
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
    })
    setSheetOpen(true)
  }, [])

  const onSaveNode = useCallback((id: string, title: string, body: string) => {
    setOverrides((prev) => ({ ...prev, [id]: { title, body } }))
    setSelected((s) => (s && s.id === id ? { ...s, title, body } : s))
  }, [])

  const pipelineForCanvas = useMemo(
    () => ({
      ...runner.pipeline,
      sourceText: runner.pipeline.sourceText.slice(0, MAX_SOURCE_CHARS),
    }),
    [runner.pipeline]
  )

  return (
    <div className="flex h-svh w-full overflow-hidden">
      <Workbench
        sourceText={runner.pipeline.sourceText}
        sampleId={sampleId}
        status={runner.status}
        stageLabel={runner.stageLabel}
        completedStages={runner.completedStages}
        onSourceChange={handleSourceChange}
        onSampleChange={handleSampleChange}
        onStart={runner.start}
        onPause={runner.pause}
        onStep={runner.step}
      />
      <main className="relative flex-1 min-w-0">
        <StudioCanvas
          pipeline={pipelineForCanvas}
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

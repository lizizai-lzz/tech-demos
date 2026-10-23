import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type OnMove,
  type Node,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { useCallback, useEffect, useMemo, useRef } from "react"
import { StudioNode } from "@/components/StudioNode"
import { buildGraph, type StudioNodeData } from "@/lib/canvas-layout"
import { buildNovelGraph } from "@/lib/canvas-layout-novel"
import { loadViewport, saveViewport } from "@/lib/storage"
import type { StudioMode } from "@/pipeline/mode"
import type { NovelPipelineState } from "@/pipeline/novel/types"
import type { PipelineState } from "@/pipeline/types"
import type { NodeOverrides, RunnerStatus } from "@/types/studio"

const nodeTypes = { studio: StudioNode }

interface StudioCanvasProps {
  mode: StudioMode
  dramaPipeline: PipelineState
  novelPipeline: NovelPipelineState
  overrides: NodeOverrides
  status: RunnerStatus
  currentStageId: string | null
  fitViewKey: string
  onNodeSelect: (node: Node<StudioNodeData> | null) => void
}

export function StudioCanvas({
  mode,
  dramaPipeline,
  novelPipeline,
  overrides,
  status,
  currentStageId,
  fitViewKey,
  onNodeSelect,
}: StudioCanvasProps) {
  const graphCtx = useMemo(
    () => ({ status, currentStageId }),
    [status, currentStageId]
  )

  const graph = useMemo(
    () =>
      mode === "drama"
        ? buildGraph(dramaPipeline, overrides, graphCtx)
        : buildNovelGraph(novelPipeline, overrides, graphCtx),
    [mode, dramaPipeline, novelPipeline, overrides, graphCtx]
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(graph.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(graph.edges)

  useEffect(() => {
    setNodes(graph.nodes)
    setEdges(graph.edges)
  }, [graph, setNodes, setEdges])

  const defaultViewport = useMemo(() => loadViewport() ?? { x: 0, y: 0, zoom: 0.85 }, [])

  const onMoveEnd: OnMove = useCallback((_event, viewport) => {
    saveViewport(viewport)
  }, [])

  const flowRef = useRef<{ fitView: (opts?: { padding?: number; duration?: number }) => void } | null>(null)
  const lastFitKey = useRef<string | null>(null)

  const onInit = useCallback(
    (instance: { fitView: (opts?: { padding?: number; duration?: number }) => void }) => {
      flowRef.current = instance
    },
    []
  )

  useEffect(() => {
    if (!flowRef.current) return
    if (lastFitKey.current === fitViewKey) return
    lastFitKey.current = fitViewKey
    flowRef.current.fitView({ padding: 0.18, duration: 200 })
  }, [fitViewKey, graph.nodes.length])

  const completedCount =
    mode === "drama"
      ? dramaPipeline.completedStages.length
      : novelPipeline.completedStages.length

  const showEmptyOverlay =
    completedCount === 0 && status !== "running"

  return (
    <div className="relative h-full w-full canvas-dots">
      {showEmptyOverlay && (
        <div
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
          aria-hidden
        >
          <div className="rounded-xl border border-dashed border-border bg-card/80 px-6 py-4 text-center shadow-sm backdrop-blur-sm max-w-sm">
            <p className="text-sm font-medium">画布还是空的</p>
            <p className="mt-1 text-xs text-muted-foreground">
              先选左侧示例或粘贴种子，再点「开始空跑」
            </p>
          </div>
        </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        defaultViewport={defaultViewport}
        onInit={onInit}
        onMoveEnd={onMoveEnd}
        onNodeClick={(_, node) => onNodeSelect(node as Node<StudioNodeData>)}
        onPaneClick={() => onNodeSelect(null)}
        minZoom={0.35}
        maxZoom={1.6}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} color="var(--border)" />
        <Controls showInteractive={false} />
        <MiniMap
          pannable
          zoomable
          className="!bg-card/90 !border-border"
          nodeColor={(n) =>
            n.type === "studio" ? "var(--primary)" : "var(--muted-foreground)"
          }
        />
      </ReactFlow>
    </div>
  )
}

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
import { useCallback, useEffect, useMemo } from "react"
import { StudioNode } from "@/components/StudioNode"
import { buildGraph, type StudioNodeData } from "@/lib/canvas-layout"
import { loadViewport, saveViewport } from "@/lib/storage"
import type { PipelineState } from "@/pipeline/types"
import type { NodeOverrides } from "@/types/studio"

const nodeTypes = { studio: StudioNode }

interface StudioCanvasProps {
  pipeline: PipelineState
  overrides: NodeOverrides
  onNodeSelect: (node: Node<StudioNodeData> | null) => void
}

export function StudioCanvas({
  pipeline,
  overrides,
  onNodeSelect,
}: StudioCanvasProps) {
  const graph = useMemo(
    () => buildGraph(pipeline, overrides),
    [pipeline, overrides]
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

  return (
    <div className="h-full w-full canvas-dots">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        defaultViewport={defaultViewport}
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

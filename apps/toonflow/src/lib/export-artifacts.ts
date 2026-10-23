import type { StudioMode } from "@/pipeline/mode"
import type { PipelineState } from "@/pipeline/types"
import type { NovelPipelineState } from "@/pipeline/novel/types"

export type ExportPayload =
  | { mode: "drama"; exportedAt: string; artifacts: PipelineState }
  | { mode: "novel"; exportedAt: string; artifacts: NovelPipelineState }

export function buildExportPayload(
  mode: StudioMode,
  state: PipelineState | NovelPipelineState
): ExportPayload {
  return {
    mode,
    exportedAt: new Date().toISOString(),
    artifacts: state,
  } as ExportPayload
}

export function downloadArtifactsJson(mode: StudioMode, state: PipelineState | NovelPipelineState) {
  const payload = buildExportPayload(mode, state)
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `toonflow-${mode}-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

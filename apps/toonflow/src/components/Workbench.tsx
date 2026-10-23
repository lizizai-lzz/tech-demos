import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { downloadArtifactsJson } from "@/lib/export-artifacts"
import {
  NOVEL_STAGE_LABELS,
  NOVEL_STAGE_ORDER,
  type NovelPipelineStage,
  type NovelPipelineState,
} from "@/pipeline/novel/types"
import { samplesForMode } from "@/pipeline/samples"
import type { StudioMode } from "@/pipeline/mode"
import { STUDIO_MODE_LABELS } from "@/pipeline/mode"
import {
  MAX_SOURCE_CHARS,
  STAGE_LABELS,
  type PipelineStage,
  type PipelineState,
} from "@/pipeline/types"
import type { RunnerStatus } from "@/types/studio"
import { BookOpen, Clapperboard, Download, Pause, Play, StepForward } from "lucide-react"

interface WorkbenchProps {
  mode: StudioMode
  sourceText: string
  sampleId: string
  status: RunnerStatus
  stageLabel: string
  completedStages: (PipelineStage | NovelPipelineStage)[]
  dramaPipeline: PipelineState
  novelPipeline: NovelPipelineState
  onModeChange: (mode: StudioMode) => void
  onSourceChange: (text: string) => void
  onSampleChange: (id: string) => void
  onStart: () => void
  onPause: () => void
  onStep: () => void
}

const DRAMA_STAGES: PipelineStage[] = [
  "outline",
  "characters",
  "script",
  "storyboard",
]

export function Workbench({
  mode,
  sourceText,
  sampleId,
  status,
  stageLabel,
  completedStages,
  dramaPipeline,
  novelPipeline,
  onModeChange,
  onSourceChange,
  onSampleChange,
  onStart,
  onPause,
  onStep,
}: WorkbenchProps) {
  const samples = samplesForMode(mode)
  const stageList =
    mode === "drama"
      ? DRAMA_STAGES.map((s) => ({ id: s, label: STAGE_LABELS[s] }))
      : NOVEL_STAGE_ORDER.map((s) => ({ id: s, label: NOVEL_STAGE_LABELS[s] }))

  const modeSubtitle =
    mode === "drama"
      ? "种子 → 大纲 → 角色 → 剧本 → 分镜（本地模拟）"
      : "种子 → 世界观 → 章纲 → 角色 → 样章 → 质检 → 改写（本地模拟）"

  return (
    <aside className="flex w-[320px] shrink-0 flex-col border-r border-border bg-card/80 backdrop-blur-sm">
      <div className="border-b border-border px-4 py-3 space-y-3">
        <div>
          <h1 className="text-base font-semibold tracking-tight">Toonflow 双引擎工作室</h1>
          <p className="text-xs text-muted-foreground mt-1">{modeSubtitle}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            size="sm"
            variant={mode === "novel" ? "default" : "outline"}
            onClick={() => onModeChange("novel")}
          >
            <BookOpen className="size-4" />
            {STUDIO_MODE_LABELS.novel}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "drama" ? "default" : "outline"}
            onClick={() => onModeChange("drama")}
          >
            <Clapperboard className="size-4" />
            {STUDIO_MODE_LABELS.drama}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        <div className="space-y-2">
          <Label>示例项目</Label>
          <div className="flex flex-wrap gap-2">
            {samples.map((s) => (
              <Button
                key={s.id}
                type="button"
                size="sm"
                variant={sampleId === s.id ? "default" : "outline"}
                onClick={() => onSampleChange(s.id)}
              >
                {s.title}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="paste">种子原文（≤ {MAX_SOURCE_CHARS} 字）</Label>
            <span className="text-[10px] text-muted-foreground">
              {sourceText.length}/{MAX_SOURCE_CHARS}
            </span>
          </div>
          <Textarea
            id="paste"
            value={sourceText}
            onChange={(e) =>
              onSourceChange(e.target.value.slice(0, MAX_SOURCE_CHARS))
            }
            className="min-h-[140px] text-sm"
            placeholder="粘贴短篇种子，或切换上方示例…"
          />
        </div>

        <div className="space-y-2">
          <Label>流水线进度</Label>
          <div className="flex flex-wrap gap-1.5">
            {stageList.map((stage) => {
              const done = completedStages.includes(stage.id)
              return (
                <Badge
                  key={stage.id}
                  variant={done ? "default" : "outline"}
                  className="text-[10px] font-normal"
                >
                  {stage.label}
                </Badge>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            当前：{status === "running" ? `生成中 · ${stageLabel}` : stageLabel}
          </p>
        </div>
      </div>

      <div className="border-t border-border p-4 flex flex-col gap-2">
        <Button
          type="button"
          onClick={onStart}
          disabled={status === "running"}
          className="w-full"
        >
          <Play className="size-4" />
          开始空跑
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onPause}
            disabled={status !== "running"}
          >
            <Pause className="size-4" />
            暂停
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onStep}
            disabled={status === "running"}
          >
            <StepForward className="size-4" />
            单步
          </Button>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="w-full text-muted-foreground"
          onClick={() =>
            downloadArtifactsJson(
              mode,
              mode === "drama" ? dramaPipeline : novelPipeline
            )
          }
        >
          <Download className="size-4" />
          导出 JSON
        </Button>
      </div>
    </aside>
  )
}

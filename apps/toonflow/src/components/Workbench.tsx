import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SAMPLE_PROJECTS } from "@/pipeline/samples"
import {
  MAX_SOURCE_CHARS,
  STAGE_LABELS,
  type PipelineStage,
} from "@/pipeline/types"
import type { RunnerStatus } from "@/types/studio"
import { Pause, Play, StepForward } from "lucide-react"

interface WorkbenchProps {
  sourceText: string
  sampleId: string
  status: RunnerStatus
  stageLabel: string
  completedStages: PipelineStage[]
  onSourceChange: (text: string) => void
  onSampleChange: (id: string) => void
  onStart: () => void
  onPause: () => void
  onStep: () => void
}

const ALL_STAGES: PipelineStage[] = [
  "outline",
  "characters",
  "script",
  "storyboard",
]

export function Workbench({
  sourceText,
  sampleId,
  status,
  stageLabel,
  completedStages,
  onSourceChange,
  onSampleChange,
  onStart,
  onPause,
  onStep,
}: WorkbenchProps) {
  return (
    <aside className="flex w-[320px] shrink-0 flex-col border-r border-border bg-card/80 backdrop-blur-sm">
      <div className="border-b border-border px-4 py-3">
        <h1 className="text-base font-semibold tracking-tight">Toonflow 空跑工作台</h1>
        <p className="text-xs text-muted-foreground mt-1">
          小说片段 → 大纲 → 角色 → 剧本 → 分镜（本地模拟）
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        <div className="space-y-2">
          <Label>示例项目</Label>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_PROJECTS.map((s) => (
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
            <Label htmlFor="paste">粘贴原文（≤ {MAX_SOURCE_CHARS} 字）</Label>
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
            placeholder="粘贴短小说片段，或切换上方示例…"
          />
        </div>

        <div className="space-y-2">
          <Label>流水线进度</Label>
          <div className="flex flex-wrap gap-1.5">
            {ALL_STAGES.map((stage) => {
              const done = completedStages.includes(stage)
              return (
                <Badge
                  key={stage}
                  variant={done ? "default" : "outline"}
                  className="text-[10px] font-normal"
                >
                  {STAGE_LABELS[stage]}
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
      </div>
    </aside>
  )
}

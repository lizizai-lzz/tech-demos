import { cn } from "@/lib/utils"
import type { RunnerStatus } from "@/types/studio"
import { Check, Circle, Loader2 } from "lucide-react"

export interface StepperStage {
  id: string
  label: string
}

type StepState = "pending" | "active" | "done"

interface PipelineStepperProps {
  stages: StepperStage[]
  completedIds: string[]
  currentStageId: string | null
  status: RunnerStatus
}

function stepState(
  stageId: string,
  completedIds: string[],
  currentStageId: string | null,
  status: RunnerStatus
): StepState {
  if (completedIds.includes(stageId)) return "done"
  if (status === "running" && currentStageId === stageId) return "active"
  if (status === "paused" && currentStageId === stageId) return "active"
  return "pending"
}

export function PipelineStepper({
  stages,
  completedIds,
  currentStageId,
  status,
}: PipelineStepperProps) {
  return (
    <ol className="space-y-0">
      {stages.map((stage, index) => {
        const state = stepState(stage.id, completedIds, currentStageId, status)
        const isLast = index === stages.length - 1
        return (
          <li key={stage.id} className="flex gap-2">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border text-[10px]",
                  state === "done" &&
                    "border-primary bg-primary text-primary-foreground",
                  state === "active" &&
                    "border-primary bg-primary/10 text-primary ring-2 ring-primary/30",
                  state === "pending" &&
                    "border-border bg-muted/30 text-muted-foreground"
                )}
                aria-hidden
              >
                {state === "done" ? (
                  <Check className="size-3.5" />
                ) : state === "active" ? (
                  <Loader2
                    className={cn(
                      "size-3.5",
                      status === "running" && "animate-spin"
                    )}
                  />
                ) : (
                  <Circle className="size-2 fill-current" />
                )}
              </span>
              {!isLast && (
                <span
                  className={cn(
                    "my-0.5 w-px flex-1 min-h-4",
                    completedIds.includes(stage.id)
                      ? "bg-primary/50"
                      : "bg-border"
                  )}
                />
              )}
            </div>
            <div className={cn("pb-3 min-w-0", isLast && "pb-0")}>
              <p
                className={cn(
                  "text-xs leading-snug",
                  state === "active" && "font-medium text-foreground",
                  state === "done" && "text-foreground",
                  state === "pending" && "text-muted-foreground"
                )}
              >
                {stage.label}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

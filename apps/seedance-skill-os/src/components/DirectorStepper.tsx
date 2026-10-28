import { cn } from '@/lib/utils'
import type { WorkflowStepId } from '@/pipeline/types'
import { Check, Circle, Loader2 } from 'lucide-react'

export interface StepperStage {
  id: WorkflowStepId
  label: string
}

type StepState = 'pending' | 'active' | 'done'

interface DirectorStepperProps {
  stages: StepperStage[]
  activeId: WorkflowStepId
  completedIds: WorkflowStepId[]
  busy: boolean
}

function stepState(
  stageId: WorkflowStepId,
  completedIds: WorkflowStepId[],
  activeId: WorkflowStepId,
  busy: boolean
): StepState {
  if (completedIds.includes(stageId)) return 'done'
  if (activeId === stageId) return busy ? 'active' : 'active'
  return 'pending'
}

export function DirectorStepper({
  stages,
  activeId,
  completedIds,
  busy,
}: DirectorStepperProps) {
  return (
    <ol className="space-y-0" aria-label="导演台步骤">
      {stages.map((stage, index) => {
        const state = stepState(stage.id, completedIds, activeId, busy)
        const isLast = index === stages.length - 1
        return (
          <li key={stage.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-medium',
                  state === 'done' &&
                    'border-primary bg-primary text-primary-foreground',
                  state === 'active' &&
                    'border-primary bg-primary/10 text-primary ring-2 ring-primary/25',
                  state === 'pending' &&
                    'border-border bg-muted/40 text-muted-foreground'
                )}
              >
                {state === 'done' ? (
                  <Check className="size-3.5" aria-hidden />
                ) : state === 'active' && busy ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                ) : (
                  <Circle className="size-2 fill-current" aria-hidden />
                )}
              </span>
              {!isLast && (
                <span
                  className={cn(
                    'my-1 w-px flex-1 min-h-5',
                    completedIds.includes(stage.id) ? 'bg-primary/40' : 'bg-border'
                  )}
                />
              )}
            </div>
            <div className="pb-5 pt-0.5">
              <p
                className={cn(
                  'text-sm font-medium leading-none',
                  state === 'pending' && 'text-muted-foreground',
                  state === 'active' && 'text-foreground',
                  state === 'done' && 'text-foreground'
                )}
              >
                {stage.label}
              </p>
              {state === 'active' && busy && (
                <p className="mt-1 text-xs text-muted-foreground">导演模型编译中…</p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

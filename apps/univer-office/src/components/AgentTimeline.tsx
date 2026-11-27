import { Bot, Play, RotateCcw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { AGENT_STEPS } from '@/agent/agent-steps'
import { runAgentStep } from '@/agent/run-agent-step'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { UniverAPI } from '@/components/UniverSheet'
import { cn } from '@/lib/utils'

type AgentTimelineProps = {
  univerAPI: UniverAPI | null
}

const STEP_DELAY_MS = 650

export function AgentTimeline({ univerAPI }: AgentTimelineProps) {
  const [activeIndex, setActiveIndex] = useState(-1)
  const [running, setRunning] = useState(false)
  const [log, setLog] = useState<string[]>([])

  const reset = useCallback(() => {
    setActiveIndex(-1)
    setRunning(false)
    setLog([])
  }, [])

  const play = useCallback(async () => {
    if (!univerAPI || running) return
    setRunning(true)
    setLog([])
    setActiveIndex(-1)

    for (let i = 0; i < AGENT_STEPS.length; i++) {
      const step = AGENT_STEPS[i]!
      setActiveIndex(i)
      setLog((prev) => [...prev, step.label])
      try {
        await runAgentStep(univerAPI, step)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        setLog((prev) => [...prev, `⚠ ${message}`])
        setRunning(false)
        return
      }
      await new Promise((resolve) => setTimeout(resolve, STEP_DELAY_MS))
    }

    setRunning(false)
  }, [running, univerAPI])

  useEffect(() => {
    if (!univerAPI) reset()
  }, [univerAPI, reset])

  return (
    <aside className="flex h-full w-[320px] shrink-0 flex-col border-l border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Bot className="size-5 text-primary" aria-hidden />
          <h2 className="text-sm font-semibold">脚本 Agent</h2>
          <Badge variant="secondary">空跑</Badge>
        </div>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
          按时间线写单元格、套公式并高亮选区；不调用大模型，表格仍可手工编辑。
        </p>
      </div>

      <div className="flex gap-2 border-b border-border px-4 py-3">
        <Button
          size="sm"
          className="flex-1"
          disabled={!univerAPI || running}
          onClick={() => void play()}
        >
          <Play className="size-3.5" aria-hidden />
          播放时间线
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={running}
          onClick={reset}
          aria-label="重置进度"
        >
          <RotateCcw className="size-3.5" aria-hidden />
        </Button>
      </div>

      <ol className="flex-1 space-y-2 overflow-y-auto px-3 py-3 text-sm">
        {AGENT_STEPS.map((step, index) => {
          const done = activeIndex > index
          const current = activeIndex === index
          return (
            <li
              key={step.id}
              className={cn(
                'rounded-lg border px-3 py-2 transition-colors',
                current && 'border-primary bg-primary/5',
                done && 'border-border bg-muted/40 text-muted-foreground',
                !done && !current && 'border-transparent bg-transparent',
              )}
            >
              <span className="text-xs text-muted-foreground">步骤 {index + 1}</span>
              <p className="mt-0.5 leading-snug">{step.label}</p>
            </li>
          )
        })}
      </ol>

      {log.length > 0 && (
        <div className="max-h-28 overflow-y-auto border-t border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          {log.map((line, i) => (
            <p key={`${line}-${i}`}>{line}</p>
          ))}
        </div>
      )}
    </aside>
  )
}
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { AgentDef } from '@/data/mesh'

type Props = {
  agent: AgentDef | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const FAKE_RUNS = [
  { id: 'run_a', status: 200, ms: 842, tool: 'feed.search' },
  { id: 'run_b', status: 200, ms: 1204, tool: 'vector.parse' },
  { id: 'run_c', status: 403, ms: 210, tool: 'email.index' },
  { id: 'run_d', status: 200, ms: 956, tool: 'link.parse' },
  { id: 'run_e', status: 200, ms: 673, tool: 'sql.query' },
]

export function AgentDetailSheet({ agent, open, onOpenChange }: Props) {
  if (!agent) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[320px] border-cyan-500/20 bg-[#0a1020]/95 font-mono text-[11px] text-slate-200"
      >
        <SheetHeader>
          <SheetTitle className="text-cyan-300">{agent.name}</SheetTitle>
          <SheetDescription className="text-slate-400">{agent.nameZh}</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4 px-4">
          <div className="grid grid-cols-2 gap-2">
            <Metric label="成功率" value="94.2%" />
            <Metric label="平均延迟" value="780ms" />
            <Metric label="队列深度" value="3" />
            <Metric label="今日调用" value="1,284" />
          </div>
          <div>
            <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-500">
              最近 5 次运行（模拟）
            </p>
            <ul className="space-y-1.5">
              {FAKE_RUNS.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between rounded border border-white/5 bg-black/30 px-2 py-1.5"
                >
                  <span className="text-slate-400">{r.tool}</span>
                  <span className={r.status === 200 ? 'text-emerald-400' : 'text-red-400'}>
                    {r.status} · {r.ms}ms
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-[10px] leading-relaxed text-slate-500">
            干跑数据 · 无真实后端。点击其他 Agent 可切换详情。
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-white/5 bg-black/25 px-2 py-2">
      <p className="text-[9px] uppercase text-slate-500">{label}</p>
      <p className="text-sm text-cyan-200">{value}</p>
    </div>
  )
}

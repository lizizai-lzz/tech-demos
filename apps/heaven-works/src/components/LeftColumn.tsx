import { useMemo } from 'react'
import { useSimulation } from '@/context/SimulationContext'
import type { LoopUnit } from '@/data/simulation'
import { CodeConsole } from '@/components/CodeConsole'

const statusLabel: Record<LoopUnit['status'], string> = {
  DONE: '[完成 DONE]',
  VERIFY: '[审核 VERIFY]',
  RUN: '[运行 RUN]',
  WAIT: '[等待 WAIT]',
}

function Sparkline({ seed }: { seed: number }) {
  const points = useMemo(() => {
    const pts: number[] = []
    let v = seed % 7
    for (let i = 0; i < 16; i++) {
      v = (v * 3 + i) % 11
      pts.push(v)
    }
    const max = Math.max(...pts, 1)
    return pts.map((p, i) => `${(i / 15) * 100},${100 - (p / max) * 100}`).join(' ')
  }, [seed])

  return (
    <svg viewBox="0 0 100 100" className="h-4 w-14 shrink-0 opacity-70" preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke="#94a3b8"
        strokeWidth="6"
        points={points}
      />
    </svg>
  )
}

export function LeftColumn() {
  const { units } = useSimulation()
  const activeId = 'U04'

  return (
    <aside className="flex h-full min-h-0 flex-col gap-1 overflow-hidden p-1.5">
      <div className="fui-panel rounded-sm p-1.5 text-[8px] leading-relaxed text-slate-500">
        <p className="text-slate-400">PANEL 01 · 线程序列</p>
        <p>轨道卫星指挥 · 八单元织网 · 全息 dry-run 可视化</p>
      </div>

      <section className="fui-panel flex min-h-0 flex-[1.1] flex-col rounded-sm p-1.5">
        <header className="mb-1 flex items-center justify-between text-[9px] text-slate-400">
          <span>LOOP UNITS · U01–U08</span>
          <span className="text-slate-600">SILK THREAD</span>
        </header>
        <ul className="scroll-thin min-h-0 flex-1 space-y-1 overflow-y-auto">
          {units.map((u, idx) => {
            const active = u.id === activeId
            return (
              <li
                key={u.id}
                className={`rounded-sm border px-1.5 py-1 text-[8px] ${
                  active
                    ? 'border-red-500 bg-red-950/40 ring-1 ring-red-500/80'
                    : 'border-slate-800/80 bg-black/25'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className="w-6 text-slate-300">{u.id}</span>
                  <span className="min-w-0 flex-1 truncate text-slate-200">{u.code}</span>
                  <Sparkline seed={idx * 13 + u.progress} />
                  <span className="text-[7px] text-slate-500">{statusLabel[u.status]}</span>
                </div>
                <p className="text-[7px] text-slate-600">{u.nameZh}</p>
                <div className="mt-0.5 h-0.5 overflow-hidden bg-slate-800">
                  <div
                    className="animate-pulse-bar h-full bg-slate-400"
                    style={{ width: `${u.progress}%` }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="fui-panel flex h-[42%] min-h-[150px] flex-col rounded-sm p-1.5">
        <header className="mb-0.5 text-[9px] text-slate-400">
          PANEL 05 · 执行代码 · LOOP.PY
        </header>
        <CodeConsole />
      </section>
    </aside>
  )
}

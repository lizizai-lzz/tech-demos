import { useSimulation } from '@/context/SimulationContext'
import type { LoopUnit } from '@/data/simulation'
import { CodeConsole } from '@/components/CodeConsole'

const statusLabel: Record<LoopUnit['status'], string> = {
  DONE: '[完成 DONE]',
  VERIFY: '[审核 VERIFY]',
  RUN: '[运行 RUN]',
  WAIT: '[等待 WAIT]',
}

export function LeftColumn() {
  const { units } = useSimulation()
  const activeId = 'U04'

  return (
    <aside className="flex h-full min-h-0 flex-col gap-2 overflow-hidden p-2">
      <div className="fui-panel rounded p-2 text-[9px] leading-relaxed text-slate-400">
        <p className="text-cyan-200/80">PANEL 01 · 线程序列</p>
        <p>轨道卫星指挥 · 八单元并发织网 · 全息投影 dry-run</p>
      </div>

      <section className="fui-panel flex min-h-0 flex-1 flex-col rounded p-2">
        <header className="mb-2 flex items-center justify-between text-[10px] text-cyan-200/90">
          <span>LOOP UNITS · U01–U08</span>
          <span className="text-slate-500">SILK THREAD</span>
        </header>
        <ul className="scroll-thin min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
          {units.map((u) => {
            const active = u.id === activeId
            return (
              <li
                key={u.id}
                className={`rounded border px-2 py-1.5 text-[9px] ${
                  active
                    ? 'border-fuchsia-400/70 bg-fuchsia-950/30 shadow-[0_0_12px_rgba(232,121,249,0.25)]'
                    : 'border-cyan-900/40 bg-black/20'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-cyan-300">{u.id}</span>
                  <span className="truncate text-slate-300">{u.code}</span>
                  <span className="text-slate-500">{statusLabel[u.status]}</span>
                </div>
                <p className="text-slate-500">{u.nameZh}</p>
                <div className="mt-1 h-1 overflow-hidden rounded bg-slate-800">
                  <div
                    className="animate-pulse-bar h-full bg-gradient-to-r from-cyan-600 to-cyan-300"
                    style={{ width: `${u.progress}%` }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="fui-panel flex h-[38%] min-h-[140px] flex-col rounded p-2">
        <header className="mb-1 text-[10px] text-cyan-200/90">
          PANEL 05 · 执行代码 · LOOP.PY
        </header>
        <CodeConsole />
      </section>
    </aside>
  )
}

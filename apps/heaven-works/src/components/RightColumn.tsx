import { useSimulation } from '@/context/SimulationContext'
import { pipelineSteps, projectMeta } from '@/data/simulation'

const heatColors = [
  'bg-slate-900',
  'bg-cyan-950',
  'bg-cyan-900/80',
  'bg-cyan-600/70',
  'bg-cyan-400/90 shadow-[0_0_6px_#22d3ee]',
]

export function RightColumn() {
  const { tasks, completion, heatmap, deliveries, metrics } = useSimulation()

  return (
    <aside className="flex h-full min-h-0 flex-col gap-2 overflow-hidden p-2">
      <section className="fui-panel rounded p-2">
        <p className="text-[9px] text-cyan-200/80">PANEL 02 · 项目预览</p>
        <h2 className="text-sm font-semibold text-white">{projectMeta.title}</h2>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-2xl font-bold text-cyan-300">
            {Math.round(completion)}%
          </span>
          <div className="h-1.5 flex-1 overflow-hidden rounded bg-slate-800">
            <div
              className="h-full bg-gradient-to-r from-cyan-700 to-emerald-400"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1 text-[8px] tracking-wider">
          {pipelineSteps.map((step, i) => {
            const active = step === projectMeta.activeStep
            return (
              <span key={step} className="flex items-center gap-1">
                {i > 0 && <span className="text-slate-600">›</span>}
                <span
                  className={
                    active
                      ? 'rounded bg-fuchsia-900/50 px-1.5 py-0.5 text-fuchsia-200 ring-1 ring-fuchsia-400/50'
                      : 'text-slate-500'
                  }
                >
                  {String(i + 1).padStart(2, '0')} {step}
                </span>
              </span>
            )
          })}
        </div>
        <ul className="mt-3 space-y-1.5 text-[9px]">
          {tasks.map((t) => (
            <li key={t.id}>
              <div className="flex justify-between text-slate-400">
                <span>
                  {t.agent} · {t.title}
                </span>
                <span>{Math.round(t.progress)}%</span>
              </div>
              <div className="h-1 overflow-hidden rounded bg-slate-800">
                <div
                  className="h-full bg-cyan-500/80"
                  style={{ width: `${t.progress}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="fui-panel rounded p-2">
        <header className="mb-2 text-[9px] text-cyan-200/80">
          PANEL 03 · SILK ACTIVITY
        </header>
        <div
          className="grid gap-0.5"
          style={{ gridTemplateColumns: 'repeat(16, minmax(0, 1fr))' }}
        >
          {heatmap.flatMap((row, ri) =>
            row.map((level, ci) => (
              <div
                key={`${ri}-${ci}`}
                className={`aspect-square rounded-sm ${heatColors[level] ?? heatColors[0]}`}
                title={`U0${ri + 1} · ${level}`}
              />
            )),
          )}
        </div>
      </section>

      <section className="fui-panel flex min-h-0 flex-1 flex-col rounded p-2">
        <header className="mb-1 flex items-center justify-between text-[9px] text-cyan-200/80">
          <span>PANEL 04 · 交付记录</span>
          <span className="text-slate-500">
            FPS {metrics.fps} · HB {metrics.heartbeat}
          </span>
        </header>
        <ul className="scroll-thin min-h-0 flex-1 space-y-1 overflow-y-auto text-[9px]">
          {deliveries.map((d) => (
            <li
              key={d.id}
              className="border-b border-cyan-900/30 pb-1 text-slate-300 last:border-0"
            >
              <span className="text-cyan-600">{d.time}</span> {d.id}{' '}
              <span className="text-slate-400">{d.text}</span>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  )
}

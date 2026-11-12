import { useSimulation } from '@/context/SimulationContext'
import { pipelineSteps, projectMeta } from '@/data/simulation'

const heatColors = [
  'bg-slate-950',
  'bg-slate-800',
  'bg-teal-950',
  'bg-teal-800/90',
  'bg-teal-500/85 shadow-[0_0_4px_rgba(45,212,191,0.35)]',
]

export function RightColumn() {
  const { tasks, completion, heatmap, deliveries } = useSimulation()

  return (
    <aside className="flex h-full min-h-0 flex-col gap-1 overflow-hidden p-1.5">
      <section className="fui-panel rounded-sm p-1.5">
        <p className="text-[8px] text-slate-500">PANEL 02 · 项目预览 · PROJECT</p>
        <h2 className="text-xs font-semibold text-white">{projectMeta.title}</h2>
        <div className="mt-1 flex items-end gap-2">
          <span className="text-3xl font-bold leading-none text-slate-100">
            {Math.round(completion)}%
          </span>
          <div className="mb-1 h-1 flex-1 overflow-hidden bg-slate-800">
            <div className="h-full bg-slate-400" style={{ width: `${completion}%` }} />
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-0.5 text-[7px] tracking-wide text-slate-500">
          {pipelineSteps.map((step, i) => {
            const active = step === projectMeta.activeStep
            return (
              <span key={step} className="flex items-center">
                {i > 0 && <span className="mx-0.5 text-slate-700">›</span>}
                <span
                  className={
                    active
                      ? 'rounded-sm border border-red-500/70 bg-red-950/50 px-1 py-0.5 text-red-200'
                      : ''
                  }
                >
                  {String(i + 1).padStart(2, '0')} {step}
                </span>
              </span>
            )
          })}
        </div>
        <ul className="mt-2 space-y-1 text-[8px]">
          {tasks.map((t) => (
            <li key={t.id}>
              <div className="flex justify-between text-slate-400">
                <span className="truncate">
                  {t.agent} · {t.title}
                </span>
                <span className="text-slate-500">{Math.round(t.progress)}%</span>
              </div>
              <div className="h-0.5 bg-slate-800">
                <div className="h-full bg-slate-500" style={{ width: `${t.progress}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="fui-panel flex min-h-[140px] flex-1 flex-col rounded-sm p-1.5">
        <header className="mb-1 text-[8px] text-slate-500">PANEL 03 · SILK ACTIVITY</header>
        <div
          className="grid flex-1 gap-px"
          style={{ gridTemplateColumns: 'repeat(18, minmax(0, 1fr))' }}
        >
          {heatmap.flatMap((row, ri) =>
            row.map((level, ci) => (
              <div
                key={`${ri}-${ci}`}
                className={`min-h-[7px] ${heatColors[level] ?? heatColors[0]}`}
              />
            )),
          )}
        </div>
      </section>

      <section className="fui-panel flex max-h-[38%] min-h-[120px] flex-col rounded-sm p-1.5">
        <header className="mb-0.5 text-[8px] text-slate-500">PANEL 04 · 交付记录 · DELIVERED</header>
        <ul className="scroll-thin min-h-0 flex-1 space-y-0.5 overflow-y-auto text-[8px] leading-tight">
          {deliveries.map((d) => (
            <li key={d.id} className="border-b border-slate-800/80 pb-0.5 text-slate-400">
              <span className="text-teal-700/90">{d.time}</span> {d.id}{' '}
              <span className="text-slate-500">{d.text}</span>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  )
}

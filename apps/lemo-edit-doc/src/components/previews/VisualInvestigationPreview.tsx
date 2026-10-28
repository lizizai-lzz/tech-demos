import { useCyclePhase } from '@/hooks/use-cycle-phase'
import type { PreviewProps } from './types'

export function VisualInvestigationPreview({ theme }: PreviewProps) {
  const phase = useCyclePhase(10000)
  const step = Math.floor(phase * 4) % 4

  return (
    <div className="relative h-full w-full bg-[#0d1117] p-4">
      <div className="grid h-full grid-rows-[1fr_auto] gap-3">
        <div className="relative overflow-hidden rounded-lg border border-slate-700 bg-[#1a2332]">
          <div className="absolute inset-0 opacity-40">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="absolute h-px w-full bg-slate-600/30"
                style={{ top: `${(i + 1) * 5}%` }}
              />
            ))}
          </div>
          {step >= 1 && (
            <div
              className="absolute left-[30%] top-[35%] size-16 rounded-full border-2 border-red-500 animate-pulse"
            />
          )}
          {step >= 2 && (
            <svg className="absolute inset-0 h-full w-full" aria-hidden>
              <line x1="38%" y1="43%" x2="62%" y2="58%" stroke="#38bdf8" strokeWidth="2" />
              <circle cx="62%" cy="58%" r="6" fill="#38bdf8" />
            </svg>
          )}
          <p className="absolute left-3 top-3 rounded bg-black/60 px-2 py-1 text-[10px] text-slate-300">
            证据 {step + 1}/4
          </p>
        </div>
        <div className="flex gap-1">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded ${i <= step ? 'bg-red-500' : 'bg-slate-700'}`}
            />
          ))}
        </div>
      </div>
      <p className="absolute bottom-3 left-4 right-4 text-xs text-slate-400">{theme.subline}</p>
    </div>
  )
}

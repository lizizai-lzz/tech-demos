import { useCyclePhase } from '@/hooks/use-cycle-phase'
import type { PreviewProps } from './types'

export function CountdownPreview({ theme }: PreviewProps) {
  const phase = useCyclePhase(10000)
  const seconds = Math.max(0, Math.ceil(10 - phase * 10))

  return (
    <div className="relative flex h-full w-full">
      <div className="relative flex-1 bg-gradient-to-br from-slate-900 to-slate-800 p-4">
        <div className="absolute left-3 top-3 rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
          LIVE
        </div>
        <div className="mt-10 h-[70%] w-full rounded bg-slate-700/50" />
        <p className="mt-2 text-xs text-slate-300">{theme.headline}</p>
      </div>
      <div className="w-px bg-white/30" />
      <div className="relative flex w-[42%] flex-col bg-[#0a1628] p-4">
        <p className="text-[10px] uppercase tracking-wider text-cyan-400">倒计时</p>
        <p className="mt-2 font-mono text-5xl font-bold tabular-nums text-white">
          00:{seconds.toString().padStart(2, '0')}
        </p>
        <div className="mt-4 space-y-2">
          {[72, 48, 91].map((v, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-16">指标 {i + 1}</span>
              <div className="h-1.5 flex-1 rounded bg-slate-700">
                <div
                  className="h-full rounded bg-cyan-500 transition-all"
                  style={{ width: `${v}%`, transform: `scaleX(${0.8 + phase * 0.2})` }}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-auto text-[10px] text-slate-500">{theme.tag}</p>
      </div>
      {seconds <= 3 && (
        <div className="pointer-events-none absolute inset-0 animate-pulse border-4 border-red-500/60" />
      )}
    </div>
  )
}

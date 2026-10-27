import { useCyclePhase } from '@/hooks/use-cycle-phase'
import type { PreviewProps } from './types'

const FRAMES = ['КИНО', '切!', '红', '黑']

export function KinoMontagePreview({ theme }: PreviewProps) {
  const phase = useCyclePhase(8000)
  const idx = Math.floor(phase * FRAMES.length) % FRAMES.length
  const bg = idx % 2 === 0 ? '#c41e1e' : '#111'

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: bg }}>
      <div
        className="absolute -left-1/4 top-0 h-full w-[150%] -skew-x-12 bg-black/20"
        style={{ transform: `skewX(-12deg) translateX(${Math.sin(phase * Math.PI * 2) * 20}px)` }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <p
          className="text-6xl font-black uppercase tracking-tighter text-white mix-blend-difference"
          style={{ transform: `rotate(${idx * 3 - 4}deg)` }}
        >
          {FRAMES[idx]}
        </p>
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-black p-3">
        <p className="text-sm font-bold text-white">{theme.headline}</p>
        <p className="text-[10px] text-red-300">{theme.tag}</p>
      </div>
      <div className="absolute right-2 top-2 flex gap-1">
        {FRAMES.map((_, i) => (
          <div
            key={i}
            className={`h-8 w-1 ${i === idx ? 'bg-white' : 'bg-white/30'}`}
          />
        ))}
      </div>
    </div>
  )
}

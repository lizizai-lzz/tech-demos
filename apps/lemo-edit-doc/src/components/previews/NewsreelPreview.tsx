import { useCyclePhase } from '@/hooks/use-cycle-phase'
import type { PreviewProps } from './types'

export function NewsreelPreview({ theme }: PreviewProps) {
  const phase = useCyclePhase(8000)
  const flicker = phase < 0.02 ? 0.3 : 1
  const titleCard = phase > 0.15 && phase < 0.35

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-[#2a2318]"
      style={{ opacity: flicker }}
    >
      <div
        className="absolute inset-4 border-4 border-[#e8dcc8]/40"
        style={{ boxShadow: 'inset 0 0 80px rgba(0,0,0,0.8)' }}
      />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.4) 3px)',
        }}
      />
      {titleCard ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
          <div className="border-4 border-[#f5e6c8] px-8 py-6 text-center">
            <p className="text-[#f5e6c8] text-xs tracking-[0.4em] uppercase">Newsreel</p>
            <h3 className="mt-2 text-2xl font-black text-[#fff8e7]">{theme.headline}</h3>
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8">
          <div className="h-32 w-48 rotate-1 bg-[#c4a574] shadow-lg" />
          <p className="max-w-md text-center text-sm text-[#f0e4c8]/90">{theme.subline}</p>
        </div>
      )}
      <div className="absolute bottom-6 left-0 right-0 text-center text-[10px] tracking-widest text-[#d4c4a0]">
        ● EXTRA ● {theme.tag} ●
      </div>
    </div>
  )
}

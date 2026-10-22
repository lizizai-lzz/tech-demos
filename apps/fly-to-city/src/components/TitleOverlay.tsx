import type { CityData } from '@/lib/types'
import { cn } from '@/lib/utils'

type Props = {
  data: CityData | null
  visible: boolean
  recording: boolean
}

export function TitleOverlay({ data, visible, recording }: Props) {
  if (!data || !visible) return null
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col items-start pl-[7vw] text-left',
        recording ? 'pt-[8vh]' : 'pt-[6vh]',
      )}
    >
      <div className="w-fit max-w-[86vw] rounded-lg bg-white/72 px-4 py-2.5 shadow-[0_10px_28px_rgba(16,24,32,0.18)] backdrop-blur-[3px]">
        <h1 className="text-4xl font-semibold tracking-[0.22em] text-neutral-900 md:text-5xl">
          {data.nameEn}
          <span className="ml-3 text-2xl font-normal tracking-normal text-neutral-600 md:text-3xl">
            {data.nameZh}
          </span>
        </h1>
        <p className="mt-1.5 text-sm tracking-wide text-neutral-700 md:text-base">{data.subtitle}</p>
      </div>
    </div>
  )
}

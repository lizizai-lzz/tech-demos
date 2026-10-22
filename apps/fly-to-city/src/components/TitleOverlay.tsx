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
      <h1 className="text-4xl font-semibold tracking-[0.22em] text-neutral-900 drop-shadow-[0_1px_0_rgba(255,255,255,0.85)] md:text-5xl">
        {data.nameEn}
        <span className="ml-3 text-2xl font-normal tracking-normal text-muted-foreground md:text-3xl">
          {data.nameZh}
        </span>
      </h1>
      <p className="mt-2 text-sm tracking-wide text-muted-foreground md:text-base">{data.subtitle}</p>
    </div>
  )
}

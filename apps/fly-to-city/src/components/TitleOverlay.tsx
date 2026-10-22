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
        'pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col items-center pt-10 text-center',
        recording ? 'pt-[8vh]' : 'pt-10',
      )}
    >
      <h1 className="text-4xl font-semibold tracking-[0.35em] text-foreground md:text-5xl">
        {data.nameEn}
        <span className="ml-3 text-2xl font-normal tracking-normal text-muted-foreground md:text-3xl">
          {data.nameZh}
        </span>
      </h1>
      <p className="mt-2 text-sm tracking-wide text-muted-foreground md:text-base">{data.subtitle}</p>
    </div>
  )
}

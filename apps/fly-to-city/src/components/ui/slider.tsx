import { cn } from '@/lib/utils'

type Props = {
  value: number[]
  onValueChange: (v: number[]) => void
  min: number
  max: number
  step?: number
  className?: string
}

export function Slider({ value, onValueChange, min, max, step = 1, className }: Props) {
  const v = value[0] ?? min
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={v}
      onChange={(e) => onValueChange([Number(e.target.value)])}
      className={cn('h-2 w-full cursor-pointer accent-primary', className)}
    />
  )
}

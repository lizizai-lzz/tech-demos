import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { EASING_OPTIONS } from '@/lib/motion-params'
import type { ControlId, MotionParams } from '@/types'

type ParamControlsProps = {
  controls: ControlId[]
  params: MotionParams
  onChange: (next: MotionParams) => void
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <Label>{label}</Label>
        <span className="text-muted-foreground tabular-nums">
          {value}
          {unit}
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(v) => {
          const next = Array.isArray(v) ? v[0] : v
          if (typeof next === 'number') onChange(next)
        }}
      />
    </div>
  )
}

export function ParamControls({ controls, params, onChange }: ParamControlsProps) {
  const patch = (partial: Partial<MotionParams>) => onChange({ ...params, ...partial })

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {controls.includes('duration') && (
        <SliderRow
          label="时长 duration"
          value={params.duration}
          min={100}
          max={2000}
          step={50}
          unit="ms"
          onChange={(v) => patch({ duration: v })}
        />
      )}
      {controls.includes('delay') && (
        <SliderRow
          label="延迟 delay"
          value={params.delay}
          min={0}
          max={800}
          step={20}
          unit="ms"
          onChange={(v) => patch({ delay: v })}
        />
      )}
      {controls.includes('stiffness') && (
        <SliderRow
          label="刚度 stiffness"
          value={params.stiffness}
          min={80}
          max={600}
          step={10}
          unit=""
          onChange={(v) => patch({ stiffness: v })}
        />
      )}
      {controls.includes('damping') && (
        <SliderRow
          label="阻尼 damping"
          value={params.damping}
          min={4}
          max={40}
          step={1}
          unit=""
          onChange={(v) => patch({ damping: v })}
        />
      )}
      {controls.includes('easing') && (
        <div className="space-y-2 sm:col-span-2">
          <Label>缓动 easing</Label>
          <Select value={params.easing} onValueChange={(v) => v && patch({ easing: v })}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="选择缓动" />
            </SelectTrigger>
            <SelectContent>
              {EASING_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}

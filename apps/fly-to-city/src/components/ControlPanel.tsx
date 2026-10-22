import { ChevronLeft, ChevronRight, Film, MapPin, Scissors, Search } from 'lucide-react'
import { useState } from 'react'
import { LANDMARKS } from '@/lib/landmarks'
import type { AspectRatio } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

type Props = {
  query: string
  onQueryChange: (q: string) => void
  onSearch: () => void
  suggestions: { label: string; lng: number; lat: number }[]
  onPickSuggestion: (s: { label: string; lng: number; lat: number }) => void
  onPickLandmark: (id: string) => void
  extentM: number
  onExtentChange: (v: number) => void
  clipEnabled: boolean
  onClipEnabled: (v: boolean) => void
  buildingsOnlyClip: boolean
  onBuildingsOnlyClip: (v: boolean) => void
  sectionPos: number
  onSectionPos: (v: number) => void
  sectionAxis: 'x' | 'z'
  onSectionAxis: (v: 'x' | 'z') => void
  aspect: AspectRatio
  onAspect: (a: AspectRatio) => void
  onToggleRecording: () => void
  loading: boolean
  loadMessage: string
  phaseLabel: string
}

export function ControlPanel(props: Props) {
  const [open, setOpen] = useState(true)
  const half = props.extentM / 2

  return (
    <>
      <button
        type="button"
        aria-label={open ? '收起面板' : '展开面板'}
        onClick={() => setOpen((o) => !o)}
        className="pointer-events-auto absolute left-3 top-20 z-30 flex size-9 items-center justify-center rounded-lg border border-border bg-card/95 shadow-sm backdrop-blur"
      >
        {open ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
      </button>

      <Card
        className={cn(
          'pointer-events-auto absolute left-3 top-28 z-30 flex max-h-[calc(100vh-8rem)] w-[min(100%,22rem)] flex-col gap-3 overflow-y-auto p-3 shadow-lg transition-transform duration-300',
          open ? 'translate-x-0' : '-translate-x-[110%]',
        )}
      >
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-8 pl-8 text-xs"
            placeholder="搜索地址…"
            value={props.query}
            onChange={(e) => props.onQueryChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && props.onSearch()}
          />
        </div>
        {props.suggestions.length > 0 && (
          <div className="max-h-28 overflow-y-auto rounded-md border bg-popover p-1">
            {props.suggestions.map((s) => (
              <button
                key={s.label}
                type="button"
                className="w-full rounded px-2 py-1 text-left text-xs hover:bg-muted"
                onClick={() => props.onPickSuggestion(s)}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Button size="sm" className="flex-1" onClick={props.onSearch} disabled={props.loading}>
            飞到此处
          </Button>
          <Button size="sm" variant="outline" onClick={props.onToggleRecording}>
            <Film className="size-3.5" />
            录制
          </Button>
        </div>

        <div className="flex flex-wrap gap-1">
          {LANDMARKS.map((lm) => (
            <Button
              key={lm.id}
              size="sm"
              variant="secondary"
              className="h-7 px-2 text-xs"
              disabled={props.loading}
              onClick={() => props.onPickLandmark(lm.id)}
            >
              <MapPin className="size-3" />
              {lm.nameZh}
            </Button>
          ))}
        </div>

        <div className="space-y-2 border-t border-border pt-2">
          <Label className="text-xs">沙盘范围</Label>
          <Slider
            min={600}
            max={2000}
            step={100}
            value={[props.extentM]}
            onValueChange={(v) => props.onExtentChange(v[0])}
          />
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Scissors className="size-3" /> 剖切
            </span>
            <Switch checked={props.clipEnabled} onCheckedChange={props.onClipEnabled} />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>仅切建筑</span>
            <Switch checked={props.buildingsOnlyClip} onCheckedChange={props.onBuildingsOnlyClip} />
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              className="h-7 flex-1 text-xs"
              variant={props.sectionAxis === 'x' ? 'default' : 'outline'}
              onClick={() => props.onSectionAxis('x')}
            >
              X
            </Button>
            <Button
              size="sm"
              className="h-7 flex-1 text-xs"
              variant={props.sectionAxis === 'z' ? 'default' : 'outline'}
              onClick={() => props.onSectionAxis('z')}
            >
              Z
            </Button>
          </div>
          <Slider
            min={-half}
            max={half}
            step={5}
            value={[props.sectionPos]}
            onValueChange={(v) => props.onSectionPos(v[0])}
          />
          <div className="flex gap-1">
            <Button
              size="sm"
              className="h-7 flex-1 text-xs"
              variant={props.aspect === '16:9' ? 'default' : 'outline'}
              onClick={() => props.onAspect('16:9')}
            >
              16:9
            </Button>
            <Button
              size="sm"
              className="h-7 flex-1 text-xs"
              variant={props.aspect === '9:16' ? 'default' : 'outline'}
              onClick={() => props.onAspect('9:16')}
            >
              9:16
            </Button>
          </div>
          <div className="flex flex-wrap gap-1">
            <Badge className="text-[10px]">{props.phaseLabel}</Badge>
            {props.loading && <Badge className="text-[10px]">{props.loadMessage}</Badge>}
          </div>
        </div>
      </Card>
    </>
  )
}

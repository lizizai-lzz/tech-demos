import { ChevronLeft, ChevronRight, Film, MapPin, Search, Volume2, VolumeX } from 'lucide-react'
import { useState } from 'react'
import { LANDMARKS } from '@/lib/landmarks'
import type { AspectRatio } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type Props = {
  query: string
  onQueryChange: (q: string) => void
  onSearch: () => void
  suggestions: { label: string; lng: number; lat: number }[]
  onPickSuggestion: (s: { label: string; lng: number; lat: number }) => void
  onPickLandmark: (id: string) => void
  aspect: AspectRatio
  onAspect: (a: AspectRatio) => void
  onToggleRecording: () => void
  facadeOn: boolean
  onFacade: (on: boolean) => void
  muted: boolean
  onMuted: (muted: boolean) => void
  loading: boolean
  loadMessage: string
  phaseLabel: string
}

export function ControlPanel(props: Props) {
  const [open, setOpen] = useState(true)

  return (
    <>
      <button
        type="button"
        aria-label={open ? '收起面板' : '展开面板'}
        onClick={() => setOpen((o) => !o)}
        className="pointer-events-auto fixed left-3 top-3 z-40 flex size-9 items-center justify-center rounded-lg border border-border/80 bg-card/90 shadow-sm backdrop-blur"
      >
        {open ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
      </button>

      <Card
        className={cn(
          'pointer-events-auto fixed left-3 top-14 z-40 flex max-h-[min(70vh,520px)] w-[min(100%,20rem)] flex-col gap-2 overflow-y-auto p-3 shadow-lg transition-transform duration-300',
          open ? 'translate-x-0' : '-translate-x-[120%]',
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
          <div className="max-h-24 overflow-y-auto rounded-md border bg-popover p-1">
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
          <Label className="text-xs">录屏画幅</Label>
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
          <Label className="text-xs">建筑外观</Label>
          <div className="flex gap-1">
            <Button
              size="sm"
              className="h-7 flex-1 text-xs"
              variant={props.facadeOn ? 'outline' : 'default'}
              onClick={() => props.onFacade(false)}
            >
              白模
            </Button>
            <Button
              size="sm"
              className="h-7 flex-1 text-xs"
              variant={props.facadeOn ? 'default' : 'outline'}
              onClick={() => props.onFacade(true)}
            >
              贴面
            </Button>
          </div>
          <Label className="text-xs">飞行音效</Label>
          <div className="flex gap-1">
            <Button
              size="sm"
              className="h-7 flex-1 text-xs"
              variant={props.muted ? 'outline' : 'default'}
              onClick={() => props.onMuted(false)}
            >
              <Volume2 className="size-3.5" />
              开
            </Button>
            <Button
              size="sm"
              className="h-7 flex-1 text-xs"
              variant={props.muted ? 'default' : 'outline'}
              onClick={() => props.onMuted(true)}
            >
              <VolumeX className="size-3.5" />
              关
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

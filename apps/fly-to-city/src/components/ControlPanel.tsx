import { Film, MapPin, Scissors, Search } from 'lucide-react'
import { LANDMARKS } from '@/lib/landmarks'
import type { AspectRatio } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'

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
  recording: boolean
  onToggleRecording: () => void
  loading: boolean
  loadMessage: string
  phaseLabel: string
}

export function ControlPanel(props: Props) {
  const half = props.extentM / 2
  return (
    <Card className="pointer-events-auto absolute bottom-4 left-4 right-4 z-30 mx-auto max-w-4xl p-4 md:left-6 md:right-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="搜索全球地址（Photon 地理编码）"
              value={props.query}
              onChange={(e) => props.onQueryChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && props.onSearch()}
            />
            {props.suggestions.length > 0 && (
              <div className="absolute bottom-full left-0 mb-1 w-full rounded-lg border bg-popover p-1 shadow-md">
                {props.suggestions.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    className="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                    onClick={() => props.onPickSuggestion(s)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button onClick={props.onSearch} disabled={props.loading}>
            飞到此处
          </Button>
          <Button variant="outline" onClick={props.onToggleRecording}>
            <Film className="size-4" />
            {props.recording ? '停止录制' : '录制模式'}
          </Button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {LANDMARKS.map((lm) => (
            <Button
              key={lm.id}
              size="sm"
              variant="secondary"
              disabled={props.loading}
              onClick={() => props.onPickLandmark(lm.id)}
            >
              <MapPin className="size-3.5" />
              {lm.nameZh}
            </Button>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <Label>沙盘范围（米）</Label>
            <Slider
              min={600}
              max={2000}
              step={100}
              value={[props.extentM]}
              onValueChange={(v) => props.onExtentChange(v[0])}
            />
            <p className="text-xs text-muted-foreground">{props.extentM}m × {props.extentM}m</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1">
                <Scissors className="size-3.5" /> 剖切
              </Label>
              <Switch checked={props.clipEnabled} onCheckedChange={props.onClipEnabled} />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>仅切建筑</span>
              <Switch checked={props.buildingsOnlyClip} onCheckedChange={props.onBuildingsOnlyClip} />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={props.sectionAxis === 'x' ? 'default' : 'outline'}
                onClick={() => props.onSectionAxis('x')}
              >
                X 轴
              </Button>
              <Button
                size="sm"
                variant={props.sectionAxis === 'z' ? 'default' : 'outline'}
                onClick={() => props.onSectionAxis('z')}
              >
                Z 轴
              </Button>
            </div>
            <Slider
              min={-half}
              max={half}
              step={5}
              value={[props.sectionPos]}
              onValueChange={(v) => props.onSectionPos(v[0])}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>画幅</Label>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={props.aspect === '16:9' ? 'default' : 'outline'}
                onClick={() => props.onAspect('16:9')}
              >
                16:9
              </Button>
              <Button
                size="sm"
                variant={props.aspect === '9:16' ? 'default' : 'outline'}
                onClick={() => props.onAspect('9:16')}
              >
                9:16
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge>{props.phaseLabel}</Badge>
              {props.loading && <Badge>{props.loadMessage}</Badge>}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

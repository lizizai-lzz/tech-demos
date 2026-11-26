import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { SettingsSheet } from '@/components/settings-sheet'
import type { EventLogEntry } from '@/hooks/use-live-room'
import type { PipelineConfig } from '@/pipeline/types'

interface WorkbenchProps {
  config: PipelineConfig
  updateConfig: (patch: Partial<PipelineConfig>) => void
  dryRun: boolean
  onDryRunChange: (v: boolean) => void
  eventLog: EventLogEntry[]
}

export function Workbench({
  config,
  updateConfig,
  dryRun,
  onDryRunChange,
  eventLog,
}: WorkbenchProps) {
  const pacingSec = Math.round((config.msPerChar * 20) / 1000)

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">控制台</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={dryRun ? 'destructive' : 'default'}
              onClick={() => onDryRunChange(!dryRun)}
            >
              {dryRun ? '停止空跑' : '开始空跑'}
            </Button>
            <SettingsSheet config={config} updateConfig={updateConfig} />
          </div>

          <div className="space-y-2">
            <Label>语速节奏（约 {pacingSec}s / 20 字）</Label>
            <Slider
              min={60}
              max={200}
              value={[config.msPerChar]}
              onValueChange={(v) => {
                const n = Array.isArray(v) ? v[0] : v
                if (typeof n === 'number') updateConfig({ msPerChar: n })
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>暖场空闲阈值（{config.idleWarmupSeconds} 秒）</Label>
            <Slider
              min={4}
              max={20}
              value={[config.idleWarmupSeconds]}
              onValueChange={(v) => {
                const n = Array.isArray(v) ? v[0] : v
                if (typeof n === 'number')
                  updateConfig({ idleWarmupSeconds: n })
              }}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            人设：{config.persona.name} — {config.persona.description}
          </p>
        </CardContent>
      </Card>

      <Card className="min-h-0 flex-1">
        <CardHeader>
          <CardTitle className="text-base">事件日志</CardTitle>
        </CardHeader>
        <CardContent className="max-h-64 overflow-y-auto font-mono text-xs text-muted-foreground">
          {eventLog.length === 0 && <p>暂无事件</p>}
          {eventLog.map((e) => (
            <p key={e.id} className="border-b border-border/40 py-1">
              [{new Date(e.at).toLocaleTimeString('zh-CN')}] {e.message}
            </p>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

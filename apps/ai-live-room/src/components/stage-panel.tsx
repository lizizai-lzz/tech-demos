import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { AvatarPlaceholder } from '@/components/avatar-placeholder'
import type { Persona, StreamerViewState } from '@/pipeline/types'

interface StagePanelProps {
  streamer: StreamerViewState
  persona: Persona
}

const FEATURES = [
  { label: '聊天', ok: true },
  { label: '换装', ok: true },
  { label: '小动作', ok: true },
  { label: '唱歌', ok: false },
  { label: '带货', ok: false },
]

export function StagePanel({ streamer, persona }: StagePanelProps) {
  return (
    <div className="mx-auto w-full max-w-[360px]">
      <div
        className="relative flex flex-col overflow-hidden rounded-2xl border border-border bg-zinc-950 shadow-2xl"
        style={{ aspectRatio: '9 / 16' }}
      >
        <div className="flex-1 p-3">
          <div
            className="relative h-full w-full overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950"
            style={{ aspectRatio: '1.2 / 1', maxHeight: '58%' }}
          >
            <AvatarPlaceholder
              outfitColor={streamer.currentOutfitColor}
              mode={streamer.mode}
              actionName={streamer.actionName}
              personaName={persona.name}
            />
          </div>
        </div>

        <div className="absolute left-4 top-4 z-10">
          <Badge variant="secondary" className="bg-black/50 text-white">
            {persona.name}
          </Badge>
        </div>

        <Card
          size="sm"
          className="absolute right-3 top-4 w-[9.5rem] border-white/10 bg-black/55 text-white ring-white/10"
        >
          <CardContent className="space-y-1 py-2 text-xs">
            <p className="font-medium text-white/90">功能清单</p>
            {FEATURES.map((f) => (
              <p key={f.label} className="text-white/80">
                {f.label} {f.ok ? '✅' : '✗'}
              </p>
            ))}
          </CardContent>
        </Card>

        <div className="mt-auto space-y-2 bg-gradient-to-t from-black via-black/85 to-transparent p-4 pt-8">
          <div className="flex items-center justify-between text-xs text-white/70">
            <span>
              队列 {streamer.queueLength} ·{' '}
              {streamer.mode === 'warmup'
                ? '暖场'
                : streamer.mode === 'idle'
                  ? '待机'
                  : streamer.mode === 'outfit-changing'
                    ? '换装'
                    : streamer.mode === 'action'
                      ? '动作'
                      : '回复中'}
            </span>
            <span>{streamer.currentOutfit}</span>
          </div>
          <p className="min-h-[3.5rem] text-sm leading-relaxed text-white">
            {streamer.subtitle}
          </p>
        </div>
      </div>
    </div>
  )
}

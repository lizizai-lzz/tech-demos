import type { DemoData, Episode } from "@/types"
import { demoData } from "@/data/demo"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { EpisodeCover } from "@/components/EpisodeCover"
import { statusBadgeVariant, statusLabel } from "@/lib/episode-status"

interface CalendarViewProps {
  data?: DemoData
  onOpenEpisode: (id: string) => void
}

function formatSlot(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

function groupByWeek(episodes: Episode[]) {
  return [...episodes].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  )
}

export function CalendarView({ data = demoData, onOpenEpisode }: CalendarViewProps) {
  const items = groupByWeek(data.episodes)

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        上周至未来两周排期（演示）。点击卡片进入单期复盘。
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((ep) => (
          <button
            key={ep.id}
            type="button"
            className="text-left"
            onClick={() => onOpenEpisode(ep.id)}
          >
            <Card className="transition hover:ring-foreground/20">
              <div className="flex gap-3">
                <EpisodeCover title={ep.title} seed={ep.coverSeed} className="w-28 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-2 py-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={statusBadgeVariant(ep.status)}>{statusLabel(ep.status)}</Badge>
                    <span className="text-xs text-muted-foreground">{formatSlot(ep.scheduledAt)}</span>
                  </div>
                  <h3 className="line-clamp-2 font-medium leading-snug">{ep.title}</h3>
                  <p className="text-xs text-muted-foreground">{ep.id}</p>
                </div>
              </div>
            </Card>
          </button>
        ))}
      </div>
    </div>
  )
}
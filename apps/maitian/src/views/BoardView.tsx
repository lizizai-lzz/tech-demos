import type { DemoData } from "@/types"
import { demoData } from "@/data/demo"
import {
  buildInsights,
  latestEpisode,
  netGainForWindow,
  totalFollowers,
  totalInteractions,
  totalPlays,
} from "@/lib/analytics"
import { formatCompact, formatSigned } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EpisodeCover } from "@/components/EpisodeCover"
import { StackedFollowerChart } from "@/components/StackedFollowerChart"
import { PlatformCard } from "@/components/PlatformCard"

interface BoardViewProps {
  data?: DemoData
  onOpenEpisode: (id: string) => void
}

export function BoardView({ data = demoData, onOpenEpisode }: BoardViewProps) {
  const episode = latestEpisode(data)
  const insights = buildInsights(data, episode)

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Card className="overflow-hidden p-0">
          <div className="grid md:grid-cols-[240px_1fr]">
            <EpisodeCover
              title={episode.title}
              seed={episode.coverSeed}
              className="h-full w-full min-h-[140px]"
            />
            <CardContent className="flex flex-col justify-center gap-3 py-5">
              <h2 className="text-xl font-semibold leading-snug">{episode.title}</h2>
              <div className="flex flex-wrap gap-6">
                <div>
                  <p className="text-xs text-muted-foreground">总播放</p>
                  <p className="stat-num text-3xl font-semibold">{formatCompact(totalPlays(episode))}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">总互动</p>
                  <p className="stat-num text-3xl font-semibold">{formatCompact(totalInteractions(episode))}</p>
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => onOpenEpisode(episode.id)}>
                打开单期复盘
              </Button>
            </CardContent>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">粉丝汇总</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="stat-num text-4xl font-semibold tracking-tight">
              {formatCompact(totalFollowers(data))}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div className="rounded-lg bg-muted/60 p-2">
                <div className="text-xs text-muted-foreground">今日净增</div>
                <div className="stat-num font-semibold">{formatSigned(netGainForWindow(data, 1))}</div>
              </div>
              <div className="rounded-lg bg-muted/60 p-2">
                <div className="text-xs text-muted-foreground">7 日净增</div>
                <div className="stat-num font-semibold">{formatSigned(netGainForWindow(data, 7))}</div>
              </div>
              <div className="rounded-lg bg-muted/60 p-2">
                <div className="text-xs text-muted-foreground">30 日净增</div>
                <div className="stat-num font-semibold">{formatSigned(netGainForWindow(data, 30))}</div>
              </div>
            </div>
            <StackedFollowerChart data={data} />
          </CardContent>
        </Card>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">数据分析（本地规则）</h3>
        <ul className="grid gap-2 md:grid-cols-3">
          {insights.map((line) => (
            <li key={line.id} className="rounded-xl border border-border/60 bg-card p-4 text-sm leading-relaxed">
              {line.text}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">七平台卡片</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.platforms.map((id) => (
            <PlatformCard
              key={id}
              data={data}
              platformId={id}
              episodePlays={episode.platforms[id].plays}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
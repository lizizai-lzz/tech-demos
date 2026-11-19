import type { DemoData, PlatformId } from "@/types"
import { demoData } from "@/data/demo"
import {
  findPreviousPublished,
  sameAgePlayRatio,
  totalPlays,
  type AgeDay,
} from "@/lib/analytics"
import { formatCompact } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EpisodeCover } from "@/components/EpisodeCover"
import { Sparkline } from "@/components/Sparkline"
import { statusBadgeVariant, statusLabel } from "@/lib/episode-status"

interface EpisodeReviewViewProps {
  episodeId: string
  data?: DemoData
  onBack: () => void
}

const AGE_DAYS: AgeDay[] = [1, 3, 7]

export function EpisodeReviewView({
  episodeId,
  data = demoData,
  onBack,
}: EpisodeReviewViewProps) {
  const episode = data.episodes.find((e) => e.id === episodeId)
  if (!episode) {
    return (
      <Card>
        <CardContent>未找到该期（演示 ID：{episodeId}）</CardContent>
      </Card>
    )
  }

  const previous = findPreviousPublished(data, episode.id)
  const published = episode.status === "published"

  return (
    <div className="space-y-6">
      <div>
        <Button type="button" variant="ghost" size="sm" onClick={onBack}>
          ← 返回
        </Button>
      </div>

      <Card>
        <div className="flex flex-col gap-4 md:flex-row">
          <EpisodeCover title={episode.title} seed={episode.coverSeed} className="w-full max-w-xs rounded-lg" />
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={statusBadgeVariant(episode.status)}>{statusLabel(episode.status)}</Badge>
              <span className="text-sm text-muted-foreground">
                {new Date(episode.scheduledAt).toLocaleString("zh-CN")}
              </span>
            </div>
            <h2 className="text-2xl font-semibold">{episode.title}</h2>
            {published && (
              <p className="stat-num text-muted-foreground">
                全平台播放合计 {formatCompact(totalPlays(episode))}
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>各平台表现</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-muted-foreground">
              <tr>
                <th className="pb-2 font-medium">平台</th>
                <th className="pb-2 font-medium">播放</th>
                <th className="pb-2 font-medium">点赞</th>
                <th className="pb-2 font-medium">评论</th>
                <th className="pb-2 font-medium">转发</th>
              </tr>
            </thead>
            <tbody>
              {data.platforms.map((pid: PlatformId) => {
                const s = episode.platforms[pid]
                return (
                  <tr key={pid} className="border-t border-border/50">
                    <td className="py-2 font-medium">{data.platformMeta[pid].name}</td>
                    <td className="stat-num py-2">{formatCompact(s.plays)}</td>
                    <td className="stat-num py-2">{formatCompact(s.likes)}</td>
                    <td className="stat-num py-2">{formatCompact(s.comments)}</td>
                    <td className="stat-num py-2">{formatCompact(s.shares)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {published && previous && (
        <Card>
          <CardHeader>
            <CardTitle>同龄对比（相对上一期 {previous.title.slice(0, 12)}…）</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="pb-2 text-left font-medium">平台</th>
                  {AGE_DAYS.map((d) => (
                    <th key={d} className="pb-2 text-left font-medium">
                      第 {d} 天倍率
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.platforms.map((pid: PlatformId) => (
                  <tr key={pid} className="border-t border-border/50">
                    <td className="py-2">{data.platformMeta[pid].short}</td>
                    {AGE_DAYS.map((day) => {
                      const ratio = sameAgePlayRatio(episode, previous, pid, day)
                      return (
                        <td key={day} className="stat-num py-2">
                          {ratio == null ? "—" : `${ratio.toFixed(2)}×`}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {published && (
        <Card>
          <CardHeader>
            <CardTitle>发布后 7 日播放走势</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.platforms.map((pid: PlatformId) => (
              <div key={pid} className="rounded-lg border border-border/50 p-3">
                <div className="mb-2 text-sm font-medium">{data.platformMeta[pid].short}</div>
                <Sparkline
                  values={episode.playTrend[pid]}
                  color={data.platformMeta[pid].color}
                  height={48}
                  width={160}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
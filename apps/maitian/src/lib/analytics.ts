import type {
  AgeSnapshot,
  DemoData,
  Episode,
  PlatformId,
} from "@/types"

export function totalFollowers(data: DemoData): number {
  return data.platforms.reduce(
    (sum, id) => sum + data.followers[id].followers,
    0,
  )
}

export function netGainForWindow(
  data: DemoData,
  days: number,
  platform?: PlatformId,
): number {
  const ids = platform ? [platform] : data.platforms
  return ids.reduce((sum, id) => {
    const slice = data.followers[id].dailyNet.slice(-days)
    return sum + slice.reduce((a, b) => a + b, 0)
  }, 0)
}

export interface StackedDay {
  index: number
  label: string
  total: number
  byPlatform: Record<PlatformId, number>
}

export function buildStackedFollowerDays(data: DemoData): StackedDay[] {
  const len = data.followers[data.platforms[0]!].dailyNet.length
  return Array.from({ length: len }, (_, index) => {
    const byPlatform = Object.fromEntries(
      data.platforms.map((id) => [id, data.followers[id].dailyNet[index]!]),
    ) as Record<PlatformId, number>
    const total = Object.values(byPlatform).reduce((a, b) => a + b, 0)
    return {
      index,
      label: `D${index + 1}`,
      total,
      byPlatform,
    }
  })
}

export function engagementRate(stat: {
  plays: number
  likes: number
  comments: number
  shares: number
}): number {
  if (stat.plays <= 0) return 0
  return (stat.likes + stat.comments + stat.shares) / stat.plays
}

export function platformWithHighestNetGain(
  data: DemoData,
  days = 7,
): PlatformId {
  let best: PlatformId = data.platforms[0]!
  let bestVal = -Infinity
  for (const id of data.platforms) {
    const val = netGainForWindow(data, days, id)
    if (val > bestVal) {
      bestVal = val
      best = id
    }
  }
  return best
}

export function publishDayBroughtExtraFollowers(data: DemoData): boolean {
  const publishNet = netGainOnDate(data, data.lastPublishDate)
  const avgDaily =
    netGainForWindow(data, 30) /
    data.followers[data.platforms[0]!].dailyNet.length
  return publishNet > avgDaily * 1.15
}

function netGainOnDate(data: DemoData, isoDate: string): number {
  // 演示：用最近一天净增代表「发布日」，与 30 日均值比较
  void isoDate
  return netGainForWindow(data, 1)
}

export function highestEngagementPlatform(episode: Episode): PlatformId {
  let best: PlatformId = "bilibili"
  let bestRate = -1
  for (const [id, stat] of Object.entries(episode.platforms) as [
    PlatformId,
    Episode["platforms"][PlatformId],
  ][]) {
    const rate = engagementRate(stat)
    if (rate > bestRate) {
      bestRate = rate
      best = id
    }
  }
  return best
}

export type AgeDay = 1 | 3 | 7

function ageValue(snapshot: AgeSnapshot, day: AgeDay): number {
  if (day === 1) return snapshot.day1
  if (day === 3) return snapshot.day3
  return snapshot.day7
}

export function sameAgePlayRatio(
  current: Episode,
  previous: Episode | undefined,
  platform: PlatformId,
  day: AgeDay,
): number | null {
  if (!previous) return null
  const prev = ageValue(previous.agePlays[platform], day)
  const curr = ageValue(current.agePlays[platform], day)
  if (prev <= 0) return null
  return curr / prev
}

export function findPreviousPublished(
  data: DemoData,
  episodeId: string,
): Episode | undefined {
  const ordered = [...data.episodes]
    .filter((e) => e.status === "published")
    .sort(
      (a, b) =>
        new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
    )
  const idx = ordered.findIndex((e) => e.id === episodeId)
  if (idx < 0 || idx >= ordered.length - 1) return undefined
  return ordered[idx + 1]
}

export interface InsightLine {
  id: string
  text: string
}

export function buildInsights(data: DemoData, latest: Episode): InsightLine[] {
  const top = platformWithHighestNetGain(data, 7)
  const topName = data.platformMeta[top].name
  const boost = publishDayBroughtExtraFollowers(data)
  const engage = highestEngagementPlatform(latest)
  const engageName = data.platformMeta[engage].name
  const engageRate = (
    engagementRate(latest.platforms[engage]) * 100
  ).toFixed(1)

  return [
    {
      id: "top-gain",
      text: `近 7 日净增最高的是${topName}（+${netGainForWindow(data, 7, top)} 粉，演示数据）。`,
    },
    {
      id: "publish-boost",
      text: boost
        ? "最近发布日当天全站净增高于 30 日均值，像是发布带动了一波关注（空跑规则判定）。"
        : "最近发布日净增未明显高于均值，主要靠日常内容托底（空跑规则判定）。",
    },
    {
      id: "engage",
      text: `当期互动率最高的是${engageName}（约 ${engageRate}%），适合作为二次剪辑首发站。`,
    },
  ]
}

export function latestEpisode(data: DemoData): Episode {
  return (
    data.episodes.find((e) => e.id === data.latestEpisodeId) ??
    data.episodes[0]!
  )
}

export function totalPlays(episode: Episode): number {
  return Object.values(episode.platforms).reduce((s, p) => s + p.plays, 0)
}

export function totalInteractions(episode: Episode): number {
  return Object.values(episode.platforms).reduce(
    (s, p) => s + p.likes + p.comments + p.shares,
    0,
  )
}
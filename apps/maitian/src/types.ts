export type PlatformId =
  | "bilibili"
  | "douyin"
  | "xiaohongshu"
  | "wechat"
  | "youtube"
  | "x"
  | "course"

export type EpisodeStatus = "published" | "scheduled" | "ready" | "planned"

export interface PlatformMeta {
  name: string
  short: string
  color: string
}

export interface PlatformFollowers {
  followers: number
  /** 最近 30 天净增，索引 0 = 最早一天 */
  dailyNet: number[]
}

export interface EpisodePlatformStat {
  plays: number
  likes: number
  comments: number
  shares: number
  publishState: "live" | "scheduled" | "draft" | "planned"
}

export interface AgeSnapshot {
  day1: number
  day3: number
  day7: number
}

export interface Episode {
  id: string
  title: string
  scheduledAt: string
  status: EpisodeStatus
  coverSeed: number
  platforms: Record<PlatformId, EpisodePlatformStat>
  agePlays: Record<PlatformId, AgeSnapshot>
  playTrend: Record<PlatformId, number[]>
}

export interface ConversionChannel {
  platform: PlatformId
  signups: number
  members: number
  orders: number
  revenue: number
}

export interface EpisodeFunnel {
  plays: number
  signups: number
  members: number
  revenue: number
}

export interface ArchiveEntry {
  episodeId: string
  synopsis: string
  links: { platform: PlatformId; label: string }[]
}

export interface DemoData {
  generatedAt: string
  latestEpisodeId: string
  lastPublishDate: string
  platforms: PlatformId[]
  platformMeta: Record<PlatformId, PlatformMeta>
  followers: Record<PlatformId, PlatformFollowers>
  episodes: Episode[]
  conversion: {
    channels: ConversionChannel[]
    byEpisode: Record<string, EpisodeFunnel>
  }
  archive: ArchiveEntry[]
}

export type AppView = "board" | "traffic" | "calendar" | "conversion" | "archive"
import type { EpisodeStatus } from "@/types"

export function statusLabel(status: EpisodeStatus): string {
  switch (status) {
    case "published":
      return "已发布"
    case "scheduled":
      return "已定时"
    case "ready":
      return "等你点发布"
    case "planned":
      return "计划中"
  }
}

export function statusBadgeVariant(
  status: EpisodeStatus,
): "success" | "warn" | "secondary" | "muted" {
  switch (status) {
    case "published":
      return "success"
    case "scheduled":
      return "secondary"
    case "ready":
      return "warn"
    case "planned":
      return "muted"
  }
}
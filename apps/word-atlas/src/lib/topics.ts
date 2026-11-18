import type { TopicId } from '@/types'

export type TopicMeta = {
  id: TopicId
  label: string
  color: string
  accent: string
}

export const TOPICS: TopicMeta[] = [
  { id: 'travel', label: '旅行', color: '#0ea5e9', accent: '#38bdf8' },
  { id: 'academic', label: '学术', color: '#6366f1', accent: '#818cf8' },
  { id: 'emotion', label: '情感', color: '#ec4899', accent: '#f472b6' },
  { id: 'tech', label: '科技', color: '#10b981', accent: '#34d399' },
  { id: 'nature', label: '自然', color: '#84cc16', accent: '#a3e635' },
  { id: 'daily', label: '日常', color: '#f59e0b', accent: '#fbbf24' },
]

export function topicMeta(id: TopicId): TopicMeta {
  return TOPICS.find((t) => t.id === id) ?? TOPICS[0]
}

export function isMastered(p: { stability: number; reps: number } | undefined): boolean {
  if (!p) return false
  return p.reps >= 2 && p.stability >= 7
}

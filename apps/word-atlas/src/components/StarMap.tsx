import type { TopicId, Word, WordProgress } from '@/types'
import { TOPICS, isMastered, topicMeta } from '@/lib/topics'
import { cn } from '@/lib/utils'

type Props = {
  words: Word[]
  progress: Record<string, WordProgress>
  onSelectTopic: (topic: TopicId) => void
}

function topicStats(words: Word[], progress: Record<string, WordProgress>, topic: TopicId) {
  const subset = words.filter((w) => w.topic === topic)
  const mastered = subset.filter((w) => isMastered(progress[w.id])).length
  return { total: subset.length, mastered, ratio: subset.length ? mastered / subset.length : 0 }
}

export function StarMap({ words, progress, onSelectTopic }: Props) {
  return (
    <div className="rounded-xl border bg-card/80 p-4">
      <h2 className="mb-1 text-sm font-medium">话题星图</h2>
      <p className="mb-4 text-xs text-muted-foreground">亮度 = 已掌握比例 · 点击查看词表</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {TOPICS.map((t) => {
          const { total, mastered, ratio } = topicStats(words, progress, t.id)
          const glow = 0.25 + ratio * 0.75
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelectTopic(t.id)}
              className={cn(
                'relative flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition hover:scale-[1.02]',
                'focus-visible:ring-2 focus-visible:ring-ring',
              )}
              style={{
                borderColor: `${t.color}55`,
                boxShadow: `0 0 ${12 + ratio * 24}px ${t.color}${Math.round(glow * 99)
                  .toString(16)
                  .padStart(2, '0')}`,
                background: `linear-gradient(145deg, ${t.color}${Math.round(0.12 * 255)
                  .toString(16)
                  .padStart(2, '0')}, transparent)`,
              }}
            >
              <span
                className="flex size-10 items-center justify-center rounded-full text-lg"
                style={{
                  background: t.color,
                  opacity: 0.35 + ratio * 0.65,
                  boxShadow: `0 0 16px ${t.accent}`,
                }}
                aria-hidden
              >
                ✦
              </span>
              <span className="text-sm font-medium">{t.label}</span>
              <span className="text-xs text-muted-foreground">
                {mastered}/{total} 掌握
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function TopicWordList({
  topic,
  words,
  progress,
}: {
  topic: TopicId
  words: Word[]
  progress: Record<string, WordProgress>
}) {
  const meta = topicMeta(topic)
  const list = words.filter((w) => w.topic === topic)
  return (
    <ul className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
      {list.map((w) => {
        const p = progress[w.id]
        const done = isMastered(p)
        return (
          <li
            key={w.id}
            className="flex items-start justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
          >
            <div>
              <p className="font-medium">{w.lemma}</p>
              <p className="text-muted-foreground">{w.zh}</p>
            </div>
            <span
              className="shrink-0 text-xs"
              style={{ color: done ? meta.color : undefined }}
            >
              {done ? '已掌握' : p?.reps ? '学习中' : '未学'}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

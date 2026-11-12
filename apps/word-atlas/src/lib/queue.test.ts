import { describe, expect, test } from 'bun:test'
import wordsData from '@/data/words.json'
import type { Word } from '@/types'
import {
  MAX_NEW_PER_SESSION,
  MAX_QUEUE_SIZE,
  buildTodayQueue,
  countQueueStats,
} from '@/lib/queue'
import { initialProgress } from '@/lib/fsrs'

const words = wordsData as Word[]

describe('词库', () => {
  test('id 唯一', () => {
    const ids = words.map((w) => w.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  test('约 24–36 词且覆盖多话题', () => {
    expect(words.length).toBeGreaterThanOrEqual(24)
    expect(words.length).toBeLessThanOrEqual(36)
    const topics = new Set(words.map((w) => w.topic))
    expect(topics.size).toBeGreaterThanOrEqual(4)
  })
})

describe('今日队列', () => {
  test('队列长度不超过上限', () => {
    const progress = Object.fromEntries(
      words.map((w, i) => [
        w.id,
        i < 10 ? { ...initialProgress(), due: 0, reps: 2 } : initialProgress(),
      ]),
    )
    const q = buildTodayQueue(words, progress, Date.now())
    expect(q.length).toBeLessThanOrEqual(MAX_QUEUE_SIZE)
  })

  test('新词切片受 MAX_NEW_PER_SESSION 限制', () => {
    const progress = {}
    const q = buildTodayQueue(words, progress, Date.now())
    const newInQueue = q.filter((item) => {
      const p = progress[item.wordId as keyof typeof progress]
      return !p
    })
    expect(newInQueue.length).toBeLessThanOrEqual(MAX_NEW_PER_SESSION)
  })

  test('统计与队列长度一致（空进度）', () => {
    const stats = countQueueStats(words, {}, Date.now())
    const q = buildTodayQueue(words, {}, Date.now())
    expect(stats.queueLength).toBe(q.length)
  })
})

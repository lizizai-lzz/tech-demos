import type { QueueItem, Word, WordProgress } from '@/types'
import { isDue } from '@/lib/fsrs'

export const MAX_NEW_PER_SESSION = 8
export const MAX_QUEUE_SIZE = 24

export type QueueCounts = {
  dueReview: number
  newAvailable: number
  queueLength: number
}

export function countQueueStats(
  words: Word[],
  progress: Record<string, WordProgress>,
  now = Date.now(),
): QueueCounts {
  let dueReview = 0
  let newAvailable = 0
  for (const w of words) {
    const p = progress[w.id]
    if (!p || p.reps === 0) {
      newAvailable += 1
    } else if (isDue(p, now)) {
      dueReview += 1
    }
  }
  return {
    dueReview,
    newAvailable,
    queueLength: Math.min(
      MAX_QUEUE_SIZE,
      dueReview + Math.min(MAX_NEW_PER_SESSION, newAvailable),
    ),
  }
}

/** 构建今日学习队列：优先到期复习，再补新词；交替 card / quiz */
export function buildTodayQueue(
  words: Word[],
  progress: Record<string, WordProgress>,
  now = Date.now(),
): QueueItem[] {
  const due: Word[] = []
  const fresh: Word[] = []

  for (const w of words) {
    const p = progress[w.id]
    if (!p || p.reps === 0) {
      fresh.push(w)
    } else if (isDue(p, now)) {
      due.push(w)
    }
  }

  due.sort((a, b) => (progress[a.id]?.due ?? 0) - (progress[b.id]?.due ?? 0))
  fresh.sort((a, b) => a.lemma.localeCompare(b.lemma))

  const pickedNew = fresh.slice(0, MAX_NEW_PER_SESSION)
  const merged = [...due, ...pickedNew].slice(0, MAX_QUEUE_SIZE)

  return merged.map((w, index) => ({
    wordId: w.id,
    kind: index % 3 === 2 ? 'quiz' : 'card',
  }))
}

export function pickQuizOptions(
  target: Word,
  all: Word[],
  count = 4,
): Word[] {
  const pool = all.filter((w) => w.id !== target.id)
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  const distractors = shuffled.slice(0, count - 1)
  const options = [...distractors, target].sort(() => Math.random() - 0.5)
  return options
}

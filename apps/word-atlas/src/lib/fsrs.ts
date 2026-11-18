import type { ReviewRating, WordProgress } from '@/types'

const MS_DAY = 86_400_000
const MS_MIN = 60_000

export function initialProgress(now = Date.now()): WordProgress {
  return {
    stability: 0.5,
    difficulty: 5,
    due: now,
    reps: 0,
  }
}

/** 简化 FSRS：根据回忆质量更新 stability / difficulty / due */
export function applyReview(
  prev: WordProgress | undefined,
  rating: ReviewRating,
  targetRetention: number,
  now = Date.now(),
): WordProgress {
  const base = prev ?? initialProgress(now)
  const retentionFactor = 0.75 + (targetRetention - 0.8) * 1.5
  let { stability, difficulty, reps } = base

  difficulty = Math.min(10, Math.max(1, difficulty))

  if (rating === 'forgot') {
    stability = Math.max(0.25, stability * 0.45)
    difficulty = Math.min(10, difficulty + 0.8)
    reps = Math.max(0, reps - 1)
    return {
      ...base,
      stability,
      difficulty,
      reps,
      due: now + 10 * MS_MIN,
      lastRating: rating,
    }
  }

  reps += 1

  if (rating === 'fuzzy') {
    stability = Math.max(0.5, stability * 1.15 + 0.3)
    difficulty = Math.min(10, difficulty + 0.2)
  } else {
    stability = Math.max(1, stability * 2.1 + 0.6)
    difficulty = Math.max(1, difficulty - 0.15)
  }

  const intervalDays = Math.max(
    rating === 'fuzzy' ? 0.35 : 1,
    stability * retentionFactor,
  )
  const due = now + intervalDays * MS_DAY

  return {
    stability,
    difficulty,
    reps,
    due,
    lastRating: rating,
  }
}

export function isDue(progress: WordProgress | undefined, now = Date.now()): boolean {
  if (!progress) return true
  return progress.due <= now
}

export { MS_DAY }

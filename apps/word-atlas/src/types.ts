export type TopicId = 'travel' | 'academic' | 'emotion' | 'tech' | 'nature' | 'daily'

export type Word = {
  id: string
  lemma: string
  phonetic: string
  zh: string
  gloss: string
  example: string
  topic: TopicId
}

export type ReviewRating = 'remember' | 'fuzzy' | 'forgot'

export type WordProgress = {
  stability: number
  difficulty: number
  due: number
  reps: number
  lastRating?: ReviewRating
}

export type AppSettings = {
  targetRetention: number
}

export type StoredState = {
  version: 1
  settings: AppSettings
  progress: Record<string, WordProgress>
}

export type QueueItemKind = 'card' | 'quiz'

export type QueueItem = {
  wordId: string
  kind: QueueItemKind
}

import type { ClassifiedIntent, QueuedDanmaku } from './types'

/** 用于去重的文本规范化 */
export function normalizeDanmakuText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[，。！？、~～!?,.\-_*]+/g, '')
}

export function isNearDuplicate(a: string, b: string): boolean {
  const na = normalizeDanmakuText(a)
  const nb = normalizeDanmakuText(b)
  if (!na || !nb) return false
  if (na === nb) return true
  if (na.length >= 4 && nb.length >= 4) {
    if (na.includes(nb) || nb.includes(na)) return true
  }
  return false
}

export interface EnqueueResult {
  queue: QueuedDanmaku[]
  merged: boolean
  itemId: string
}

/**
 * 入队：FIFO，礼物不插队；与队列中已有项近重复则合并计数。
 */
export function enqueueDanmaku(
  queue: QueuedDanmaku[],
  params: {
    id: string
    text: string
    intent: ClassifiedIntent
    now?: number
  }
): EnqueueResult {
  const normalizedText = normalizeDanmakuText(params.text)
  const now = params.now ?? Date.now()

  const existingIndex = queue.findIndex((q) =>
    isNearDuplicate(q.text, params.text)
  )

  if (existingIndex >= 0) {
    const next = queue.map((item, idx) =>
      idx === existingIndex
        ? { ...item, duplicateCount: item.duplicateCount + 1 }
        : item
    )
    return {
      queue: next,
      merged: true,
      itemId: queue[existingIndex].id,
    }
  }

  const item: QueuedDanmaku = {
    id: params.id,
    text: params.text.trim(),
    normalizedText,
    intent: params.intent,
    duplicateCount: 1,
    enqueuedAt: now,
  }

  return {
    queue: [...queue, item],
    merged: false,
    itemId: params.id,
  }
}

/** 礼物永不插队：始终追加到队尾（与 enqueueDanmaku 一致，供测试断言） */
export function giftQueuePosition(
  queue: QueuedDanmaku[],
  _gift: QueuedDanmaku
): number {
  return queue.length
}

export function dequeueNext(queue: QueuedDanmaku[]): {
  queue: QueuedDanmaku[]
  item: QueuedDanmaku | null
} {
  if (queue.length === 0) {
    return { queue: [], item: null }
  }
  const [item, ...rest] = queue
  return { queue: rest, item }
}

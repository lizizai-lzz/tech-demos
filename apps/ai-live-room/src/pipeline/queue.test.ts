import { describe, expect, test } from 'bun:test'
import {
  enqueueDanmaku,
  giftQueuePosition,
  dequeueNext,
  isNearDuplicate,
} from './queue'
import type { QueuedDanmaku } from './types'

const chatItem = (id: string, text: string): QueuedDanmaku => ({
  id,
  text,
  normalizedText: text,
  intent: { kind: 'chat' },
  duplicateCount: 1,
  enqueuedAt: 0,
})

describe('queue', () => {
  test('近重复弹幕合并', () => {
    let q: QueuedDanmaku[] = []
    const a = enqueueDanmaku(q, {
      id: '1',
      text: '主播好！',
      intent: { kind: 'chat' },
    })
    q = a.queue
    const b = enqueueDanmaku(q, {
      id: '2',
      text: '主播好!',
      intent: { kind: 'chat' },
    })
    expect(b.merged).toBe(true)
    expect(b.queue).toHaveLength(1)
    expect(b.queue[0].duplicateCount).toBe(2)
  })

  test('礼物不插队，排在队尾', () => {
    const q = [chatItem('a', '长聊天1'), chatItem('b', '长聊天2')]
    const gift = chatItem('g', '送火箭')
    gift.intent = { kind: 'gift' }
    expect(giftQueuePosition(q, gift)).toBe(2)
    const enq = enqueueDanmaku(q, {
      id: 'g',
      text: '送火箭',
      intent: { kind: 'gift' },
    })
    expect(enq.queue.map((x) => x.id)).toEqual(['a', 'b', 'g'])
  })

  test('FIFO 一次只处理一条', () => {
    let q = [chatItem('1', 'a'), chatItem('2', 'b')]
    const { item, queue } = dequeueNext(q)
    expect(item?.id).toBe('1')
    expect(queue).toHaveLength(1)
    const next = dequeueNext(queue)
    expect(next.item?.id).toBe('2')
    expect(next.queue).toHaveLength(0)
  })

  test('isNearDuplicate', () => {
    expect(isNearDuplicate('你好主播', '你好 主播！')).toBe(true)
    expect(isNearDuplicate('完全不同', '另一句')).toBe(false)
  })
})

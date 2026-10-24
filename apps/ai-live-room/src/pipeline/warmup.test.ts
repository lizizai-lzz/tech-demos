import { describe, expect, test } from 'bun:test'
import {
  pickWarmupTopic,
  createWarmupState,
  allTopicsUsed,
} from './warmup'

describe('warmup', () => {
  const topics = ['A', 'B', 'C']

  test('暖场话题不重复直到耗尽', () => {
    let state = createWarmupState()
    const seen: string[] = []

    for (let i = 0; i < topics.length; i++) {
      const r = pickWarmupTopic(topics, state)
      expect(r).not.toBeNull()
      seen.push(r!.topic)
      state = r!.nextState
    }

    expect(new Set(seen).size).toBe(topics.length)
    expect(allTopicsUsed(topics, state)).toBe(true)
  })

  test('池子耗尽后重置可继续选取', () => {
    let state = createWarmupState()
    for (let i = 0; i < topics.length; i++) {
      const r = pickWarmupTopic(topics, state)!
      state = r.nextState
    }
    const again = pickWarmupTopic(topics, state)
    expect(again).not.toBeNull()
    expect(topics).toContain(again!.topic)
  })
})

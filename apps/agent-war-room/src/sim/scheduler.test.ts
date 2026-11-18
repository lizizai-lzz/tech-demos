import { describe, expect, test } from 'bun:test'
import { AGENTS, EDGES } from '../data/mesh'
import {
  createInitialState,
  pickEdgeForAgent,
  simTick,
  type SimConfig,
} from './scheduler'

describe('pickEdgeForAgent', () => {
  test('returns edge belonging to agent', () => {
    const agentId = AGENTS[0]!.id
    const edge = pickEdgeForAgent(agentId, () => 0)
    expect(edge).not.toBeNull()
    expect(edge!.agentId).toBe(agentId)
    const allowed = EDGES.filter((e) => e.agentId === agentId).map((e) => e.id)
    expect(allowed).toContain(edge!.id)
  })
})

describe('simTick', () => {
  const running: SimConfig = { speed: 1, paused: false, sourceBias: null }
  let seed = 99
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }

  test('paused does not append logs', () => {
    const s0 = createInitialState()
    const paused: SimConfig = { speed: 1, paused: true, sourceBias: null }
    const s1 = simTick(s0, paused, 1000, rand)
    expect(s1.logs.length).toBe(s0.logs.length)
  })

  test('running increases verified or rejected', () => {
    const s0 = createInitialState()
    let s = s0
    for (let i = 0; i < 20; i++) {
      s = simTick(s, running, 1000 + i * 16, rand)
    }
    const total =
      s.counters.verified + s.counters.rejected - (s0.counters.verified + s0.counters.rejected)
    expect(total).toBeGreaterThan(0)
  })

  test('source bias prefers clustered agents', () => {
    const biased: SimConfig = { speed: 2, paused: false, sourceBias: 'internet' }
    const hits = new Set<string>()
    let s = createInitialState()
    for (let i = 0; i < 60; i++) {
      s = simTick(s, biased, 2000 + i * 16, rand)
      const last = s.logs[s.logs.length - 1]
      if (last) hits.add(last.agentSlug)
    }
    expect(hits.has('web_researcher') || hits.has('lead_finder')).toBe(true)
  })
})

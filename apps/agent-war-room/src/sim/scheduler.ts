import type { SourceId } from '@/data/mesh'
import { AGENTS, EDGES, LOG_ACTIONS, TOOLS } from '@/data/mesh'

export type SimSpeed = 0 | 1 | 2

export type ToolRuntimeState = {
  status: 'idle' | 'ok' | 'fail'
  flashUntil: number
}

export type Pulse = {
  id: string
  edgeId: string
  progress: number
  ok: boolean
  agentId: string
  toolId: string
}

export type LogLine = {
  id: string
  ts: string
  agentSlug: string
  message: string
  code: number
  error: boolean
}

export type Counters = {
  agentsOnline: number
  tasksPerSec: number
  verified: number
  rejected: number
}

export type SimState = {
  counters: Counters
  toolStates: Record<string, ToolRuntimeState>
  agentActiveUntil: Record<string, number>
  pulses: Pulse[]
  logs: LogLine[]
  tickIndex: number
}

export type SimConfig = {
  speed: SimSpeed
  paused: boolean
  sourceBias: SourceId | null
}

const agentById = new Map(AGENTS.map((a) => [a.id, a]))
const edgesByAgent = new Map<string, typeof EDGES>()
for (const e of EDGES) {
  const list = edgesByAgent.get(e.agentId) ?? []
  list.push(e)
  edgesByAgent.set(e.agentId, list)
}

let pulseSeq = 0
let logSeq = 0

function formatTs(d: Date) {
  return d.toISOString().slice(11, 23)
}

function pickAgent(bias: SourceId | null, rand: () => number): string {
  if (bias && rand() < 0.55) {
    const pool = AGENTS.filter((a) =>
      (
        {
          internet: ['web_researcher', 'lead_finder', 'market_scanner', 'seo_auditor', 'social_writer'],
          task: ['qa_verifier', 'code_runner', 'data_analyst', 'risk_checker'],
          memory: ['memory_keeper', 'data_analyst', 'fact_checker', 'social_writer'],
          files: ['pdf_reader', 'cms_publisher', 'email_drafter', 'code_runner'],
        } as Record<SourceId, string[]>
      )[bias].includes(a.id),
    )
    if (pool.length) {
      return pool[Math.floor(rand() * pool.length)]!.id
    }
  }
  return AGENTS[Math.floor(rand() * AGENTS.length)]!.id
}

export function createInitialState(): SimState {
  const toolStates: Record<string, ToolRuntimeState> = {}
  for (const t of TOOLS) {
    toolStates[t.id] = { status: 'idle', flashUntil: 0 }
  }
  // 预置几个失败工具
  toolStates['tool_88'] = { status: 'fail', flashUntil: 0 } // email.index
  return {
    counters: {
      agentsOnline: AGENTS.length,
      tasksPerSec: 128,
      verified: 400,
      rejected: 2,
    },
    toolStates,
    agentActiveUntil: {},
    pulses: [],
    logs: seedLogs(),
    tickIndex: 0,
  }
}

function seedLogs(): LogLine[] {
  const lines: LogLine[] = []
  for (let i = 0; i < 8; i++) {
    lines.push(makeLogLine(i * 0.7, false))
  }
  lines.push({
    id: 'seed_err',
    ts: formatTs(new Date()),
    agentSlug: 'fact_checker',
    message: 'x email.index source missing + retry',
    code: 403,
    error: true,
  })
  return lines
}

function makeLogLine(offsetSec: number, forceError: boolean): LogLine {
  const agent = AGENTS[Math.floor(Math.random() * AGENTS.length)]!
  const action = LOG_ACTIONS[Math.floor(Math.random() * LOG_ACTIONS.length)]!
  const tool = TOOLS[Math.floor(Math.random() * TOOLS.length)]!
  const error = forceError || Math.random() < 0.08
  const code = error ? (Math.random() < 0.5 ? 403 : 502) : 200
  logSeq += 1
  const d = new Date(Date.now() - offsetSec * 1000)
  return {
    id: `log_${logSeq}`,
    ts: formatTs(d),
    agentSlug: agent.id,
    message: `${action} → ${tool.name}${error ? ' + retry' : ''}`,
    code,
    error,
  }
}

export function pickEdgeForAgent(agentId: string, rand: () => number) {
  const list = edgesByAgent.get(agentId)
  if (!list?.length) return null
  return list[Math.floor(rand() * list.length)]!
}

/** 单帧模拟步进（纯函数，便于测试） */
export function simTick(
  state: SimState,
  config: SimConfig,
  now: number,
  rand: () => number,
): SimState {
  if (config.paused || config.speed === 0) {
    return advancePulses(state, now, 0)
  }

  const speedMul = config.speed === 2 ? 2 : 1
  let next = advancePulses(state, now, 0.012 * speedMul)

  const burst = 1 + Math.floor(rand() * 3 * speedMul)
  for (let i = 0; i < burst; i++) {
    const agentId = pickAgent(config.sourceBias, rand)
    const edge = pickEdgeForAgent(agentId, rand)
    if (!edge) continue

    const fail = edge.toolId === 'tool_88' ? rand() < 0.7 : rand() < 0.06
    pulseSeq += 1
    const pulse: Pulse = {
      id: `p_${pulseSeq}`,
      edgeId: edge.id,
      progress: 0,
      ok: !fail,
      agentId,
      toolId: edge.toolId,
    }

    next = {
      ...next,
      pulses: [...next.pulses, pulse].slice(-40),
      agentActiveUntil: {
        ...next.agentActiveUntil,
        [agentId]: now + 420,
      },
      toolStates: {
        ...next.toolStates,
        [edge.toolId]: {
          status: fail ? 'fail' : 'ok',
          flashUntil: now + 380,
        },
      },
      counters: {
        ...next.counters,
        verified: next.counters.verified + (fail ? 0 : 1),
        rejected: next.counters.rejected + (fail ? 1 : 0),
      },
    }

    logSeq += 1
    const agent = agentById.get(agentId)
    const tool = TOOLS.find((t) => t.id === edge.toolId)
    const line: LogLine = {
      id: `log_${logSeq}`,
      ts: formatTs(new Date()),
      agentSlug: agent?.id ?? agentId,
      message: `${LOG_ACTIONS[Math.floor(rand() * LOG_ACTIONS.length)]} → ${tool?.name ?? 'unknown'}${fail ? ' + retry' : ''}`,
      code: fail ? 403 : 200,
      error: fail,
    }
    next = {
      ...next,
      logs: [...next.logs, line].slice(-120),
    }
  }

  next = {
    ...next,
    tickIndex: next.tickIndex + 1,
    counters: {
      ...next.counters,
      tasksPerSec: Math.max(
        40,
        Math.min(
          320,
          Math.round(next.counters.tasksPerSec + (rand() - 0.5) * 18 * speedMul),
        ),
      ),
    },
  }

  return next
}

function advancePulses(state: SimState, now: number, delta: number): SimState {
  if (delta <= 0 && state.pulses.every((p) => p.progress >= 1)) {
    return state
  }
  const pulses = state.pulses
    .map((p) => ({ ...p, progress: Math.min(1, p.progress + delta) }))
    .filter((p) => p.progress < 1)

  const agentActiveUntil = { ...state.agentActiveUntil }
  for (const [id, until] of Object.entries(agentActiveUntil)) {
    if (until < now) delete agentActiveUntil[id]
  }

  const toolStates = { ...state.toolStates }
  for (const [id, st] of Object.entries(toolStates)) {
    if (st.flashUntil < now && st.status !== 'fail') {
      toolStates[id] = { ...st, status: 'idle' }
    }
  }
  // keep persistent fail on email.index
  if (toolStates['tool_88'] && toolStates['tool_88'].status === 'idle') {
    toolStates['tool_88'] = { status: 'fail', flashUntil: 0 }
  }

  return { ...state, pulses, agentActiveUntil, toolStates }
}

export function agentSlugDisplay(slug: string) {
  return slug.replace(/_/g, ' ')
}

export function getEdgesForAgent(agentId: string) {
  return edgesByAgent.get(agentId) ?? []
}

export function getConnectedToolIds(agentId: string) {
  return new Set(getEdgesForAgent(agentId).map((e) => e.toolId))
}

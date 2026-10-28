import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity,
  Bot,
  Circle,
  Pause,
  Play,
  Radio,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import { AgentDetailSheet } from '@/components/AgentDetailSheet'
import { MeshEdges } from '@/components/MeshEdges'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AGENTS,
  PROJECT_ID,
  SOURCES,
  TOOLS,
  type AgentDef,
} from '@/data/mesh'
import { useMeshSimulation } from '@/hooks/useMeshSimulation'
import { useNodePositions } from '@/hooks/useNodePositions'
import { agentSlugDisplay, getConnectedToolIds } from '@/sim/scheduler'
import type { SimSpeed } from '@/sim/scheduler'

const TABS = ['Global', 'Agents', 'Runs', 'Logs'] as const

export function WarRoomDashboard() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const logRef = useRef<HTMLDivElement>(null)
  const { positions } = useNodePositions(canvasRef)
  const { state, config, setSpeed, setPaused, togglePause, setSourceBias } = useMeshSimulation()
  const [hoverAgentId, setHoverAgentId] = useState<string | null>(null)
  const [selectedAgent, setSelectedAgent] = useState<AgentDef | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('Global')
  const now = performance.now()

  useEffect(() => {
    const el = logRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [state.logs.length])

  const connectedSet = useMemo(() => {
    if (!hoverAgentId) return null
    return getConnectedToolIds(hoverAgentId)
  }, [hoverAgentId])

  return (
    <div className="mesh-grid-bg flex h-full min-h-0 flex-col bg-[#050810]">
      <header className="flex shrink-0 items-center justify-between border-b border-cyan-500/15 bg-[#070b14]/90 px-4 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Radio className="size-4 text-cyan-400" />
            <span className="text-sm font-semibold tracking-[0.2em] text-cyan-300">
              AGENT MESH
            </span>
            <span className="text-[10px] text-slate-500">智能体网格 · 干跑作战室</span>
          </div>
          <nav className="flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded px-2.5 py-1 text-[10px] uppercase tracking-wide transition-colors ${
                  activeTab === tab
                    ? 'bg-cyan-500/15 text-cyan-300'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4 text-[10px]">
          <Stat label="在线 Agent" value={String(state.counters.agentsOnline)} />
          <Stat label="tasks/s" value={String(state.counters.tasksPerSec)} accent />
          <Stat label="verified" value={String(state.counters.verified)} ok />
          <Stat label="rejected" value={String(state.counters.rejected)} bad />
        </div>
      </header>

      <div className="flex items-center gap-2 border-b border-white/5 px-4 py-1.5 text-[10px] text-slate-400">
        <Circle className="size-2 fill-orange-400 text-orange-400 live-dot" />
        <span>{PROJECT_ID}</span>
        <span className="text-slate-600">|</span>
        <span>{activeTab} 视图 · 模拟数据流</span>
        <div className="ml-auto flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 border-white/10 bg-black/40 px-2 text-[10px]"
            onClick={togglePause}
          >
            {config.paused ? <Play className="size-3" /> : <Pause className="size-3" />}
            {config.paused ? '继续' : '暂停'}
          </Button>
          {([0, 1, 2] as SimSpeed[]).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={
                (s === 0 ? config.paused : config.speed === s && !config.paused)
                  ? 'default'
                  : 'outline'
              }
              className="h-7 min-w-8 border-white/10 bg-black/40 px-2 text-[10px]"
              onClick={() => {
                if (s === 0) {
                  setSpeed(0)
                  setPaused(true)
                } else {
                  setSpeed(s)
                  setPaused(false)
                }
              }}
            >
              {s === 0 ? '0x' : `${s}x`}
            </Button>
          ))}
        </div>
      </div>

      <div ref={canvasRef} className="relative min-h-0 flex-1 overflow-hidden">
        <MeshEdges
          positions={positions}
          hoverAgentId={hoverAgentId}
          pulses={state.pulses}
        />

        <div className="relative z-10 flex h-full min-h-0">
          {/* Sources + hub */}
          <div className="flex w-[200px] shrink-0 flex-col justify-center gap-3 border-r border-white/5 py-4 pl-3 pr-2">
            {SOURCES.map((src) => (
              <button
                key={src.id}
                type="button"
                data-mesh-node={`source:${src.id}`}
                data-mesh-side="right"
                onClick={() =>
                  setSourceBias(config.sourceBias === src.id ? null : src.id)
                }
                className={`group flex items-center gap-2 rounded-full border px-2 py-1 text-left transition-all ${
                  config.sourceBias === src.id
                    ? 'border-orange-400/60 bg-orange-500/10 text-orange-200'
                    : 'border-white/10 bg-black/30 text-slate-300 hover:border-cyan-500/40'
                }`}
              >
                <span className="size-2 rounded-full bg-slate-200 shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                <span>
                  <span className="block text-[10px] font-semibold">{src.label}</span>
                  <span className="text-[9px] text-slate-500">{src.labelZh}</span>
                </span>
              </button>
            ))}
            <div
              data-mesh-node="core:hub"
              data-mesh-side="right"
              className="mx-auto mt-2 flex size-20 flex-col items-center justify-center rounded-full border border-cyan-400/30 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 shadow-[0_0_30px_rgba(34,211,238,0.15)]"
            >
              <Bot className="size-6 text-cyan-300" />
              <span className="mt-1 text-[9px] font-bold tracking-widest text-cyan-200">
                MESH
              </span>
            </div>
          </div>

          {/* Leadership */}
          <div className="flex w-[190px] shrink-0 flex-col justify-center gap-3 px-2 py-4">
            <LeadCard
              title="Chief of Staff"
              titleZh="幕僚长"
              enabled
              items={['Planning 规划', 'Delegation 委派', '→ PM · 15 agents']}
            />
            <LeadCard
              title="Project Manager"
              titleZh="项目经理"
              enabled
              items={['Scheduling 排期', 'Review 审查', '→ QA Verifier']}
            />
          </div>

          {/* Agents */}
          <div className="flex w-[210px] shrink-0 flex-col gap-1.5 overflow-y-auto py-3 pr-1">
            {AGENTS.map((agent) => {
              const active = (state.agentActiveUntil[agent.id] ?? 0) > now
              const dim =
                hoverAgentId !== null && hoverAgentId !== agent.id
              return (
                <button
                  key={agent.id}
                  type="button"
                  data-mesh-node={`agent:${agent.id}`}
                  data-mesh-side="right"
                  onMouseEnter={() => setHoverAgentId(agent.id)}
                  onMouseLeave={() => setHoverAgentId(null)}
                  onClick={() => {
                    setSelectedAgent(agent)
                    setSheetOpen(true)
                  }}
                  className={`agent-pill-glow flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-left ${
                    dim ? 'mesh-dim' : 'mesh-highlight'
                  } ${active ? 'shadow-[0_0_16px_rgba(34,211,238,0.35)]' : ''}`}
                  style={{
                    borderColor: `${agent.accent}55`,
                    backgroundColor: active ? `${agent.accent}18` : 'rgba(0,0,0,0.35)',
                  }}
                >
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: agent.accent, boxShadow: `0 0 6px ${agent.accent}` }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[10px] font-medium text-slate-100">
                      {agent.name}
                    </span>
                    <span className="block truncate text-[9px] text-slate-500">{agent.nameZh}</span>
                  </span>
                  {active && <Zap className="size-3 shrink-0 text-cyan-300" />}
                </button>
              )
            })}
          </div>

          {/* Tools grid */}
          <div className="min-w-0 flex-1 overflow-y-auto border-l border-white/5 py-2 pr-2">
            <div
              className="grid gap-[3px]"
              style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}
            >
              {TOOLS.map((tool) => {
                const st = state.toolStates[tool.id]
                const dimTool =
                  connectedSet !== null && !connectedSet.has(tool.id)
                const flash = (st?.flashUntil ?? 0) > now
                return (
                  <div
                    key={tool.id}
                    data-mesh-node={`tool:${tool.id}`}
                    data-mesh-side="left"
                    className={`flex items-center gap-1 rounded px-1 py-[3px] font-mono text-[8px] leading-tight text-slate-400 transition-all ${
                      dimTool ? 'mesh-dim' : ''
                    } ${flash ? 'bg-white/5 text-slate-200' : 'bg-black/20'} ${
                      st?.status === 'ok' ? 'tool-chip-ok' : ''
                    } ${st?.status === 'fail' ? 'tool-chip-fail text-red-300/90' : ''}`}
                  >
                    <span
                      className={`size-1.5 shrink-0 rounded-full ${
                        st?.status === 'fail'
                          ? 'bg-red-500 shadow-[0_0_6px_#f87171]'
                          : st?.status === 'ok'
                            ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]'
                            : 'border border-slate-600 bg-transparent'
                      }`}
                    />
                    <span className="truncate">{tool.name}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <footer className="shrink-0 border-t border-cyan-500/10 bg-black/60">
        <div className="flex items-center gap-2 border-b border-white/5 px-3 py-1 text-[9px] uppercase tracking-widest text-slate-500">
          <Activity className="size-3" />
          Live Console · 实时日志（模拟）
        </div>
        <div
          ref={logRef}
          className="h-[120px] overflow-y-auto px-3 py-2 font-mono text-[10px] leading-relaxed"
        >
          {state.logs.map((line) => (
            <div
              key={line.id}
              className={`flex gap-3 ${line.error ? 'text-red-400/90' : 'text-slate-400'}`}
            >
              <span className="shrink-0 text-slate-600">{line.ts}</span>
              <span className="shrink-0 text-cyan-700/80">{agentSlugDisplay(line.agentSlug)}</span>
              <span className="min-w-0 flex-1 truncate">{line.message}</span>
              <span
                className={`shrink-0 ${line.error ? 'text-red-400' : 'text-emerald-500/80'}`}
              >
                {line.code}
              </span>
            </div>
          ))}
        </div>
      </footer>

      <AgentDetailSheet
        agent={selectedAgent}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  )
}

function Stat({
  label,
  value,
  ok,
  bad,
  accent,
}: {
  label: string
  value: string
  ok?: boolean
  bad?: boolean
  accent?: boolean
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-slate-500">{label}</span>
      <span
        className={
          bad
            ? 'text-red-400'
            : ok
              ? 'text-emerald-400'
              : accent
                ? 'text-cyan-300'
                : 'text-slate-200'
        }
      >
        {value}
      </span>
    </div>
  )
}

function LeadCard({
  title,
  titleZh,
  enabled,
  items,
}: {
  title: string
  titleZh: string
  enabled: boolean
  items: string[]
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#0d1324]/80 p-2.5 backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold text-slate-200">{title}</p>
          <p className="text-[9px] text-slate-500">{titleZh}</p>
        </div>
        <Badge
          variant="outline"
          className="border-emerald-500/30 bg-emerald-500/10 text-[9px] text-emerald-300"
        >
          <ShieldCheck className="mr-1 size-3" />
          {enabled ? 'Enabled' : 'Off'}
        </Badge>
      </div>
      <ul className="space-y-0.5 text-[9px] text-slate-500">
        {items.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <button
        type="button"
        className="mt-2 text-[9px] text-cyan-600 hover:text-cyan-400"
      >
        + Connect
      </button>
    </div>
  )
}

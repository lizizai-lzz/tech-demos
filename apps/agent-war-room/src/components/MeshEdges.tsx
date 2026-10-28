import { EDGES } from '@/data/mesh'
import { buildCurvePath, type NodePositions } from '@/hooks/useNodePositions'
import { getConnectedToolIds, type Pulse } from '@/sim/scheduler'

type Props = {
  positions: NodePositions
  hoverAgentId: string | null
  pulses: Pulse[]
}

export function MeshEdges({ positions, hoverAgentId, pulses }: Props) {
  const connectedTools = hoverAgentId ? getConnectedToolIds(hoverAgentId) : null

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      aria-hidden
    >
      <defs>
        <filter id="mesh-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {EDGES.map((edge) => {
        const from = positions[`agent:${edge.agentId}`]
        const to = positions[`tool:${edge.toolId}`]
        if (!from || !to) return null

        const highlighted =
          hoverAgentId === null ||
          (hoverAgentId === edge.agentId && connectedTools?.has(edge.toolId))

        const activePulse = pulses.find(
          (p) => p.edgeId === edge.id && p.progress < 1,
        )

        const d = buildCurvePath(from, to)
        const baseOpacity = highlighted ? 0.22 : 0.04
        const stroke = activePulse
          ? activePulse.ok
            ? '#34d399'
            : '#f87171'
          : highlighted
            ? '#22d3ee'
            : '#64748b'

        return (
          <path
            key={edge.id}
            d={d}
            fill="none"
            stroke={stroke}
            strokeWidth={activePulse ? 1.4 : 0.6}
            opacity={activePulse ? 0.85 : baseOpacity}
            filter={activePulse ? 'url(#mesh-glow)' : undefined}
          />
        )
      })}
      {pulses.map((p) => {
        const edge = EDGES.find((e) => e.id === p.edgeId)
        if (!edge) return null
        const from = positions[`agent:${edge.agentId}`]
        const to = positions[`tool:${edge.toolId}`]
        if (!from || !to) return null
        const t = p.progress
        const x = cubicPoint(from.x, to.x, t)
        const y = cubicPoint(from.y, to.y, t)
        return (
          <circle
            key={p.id}
            cx={x}
            cy={y}
            r={2.5}
            fill={p.ok ? '#34d399' : '#f87171'}
            opacity={1 - t * 0.3}
            filter="url(#mesh-glow)"
          />
        )
      })}
    </svg>
  )
}

function cubicPoint(a: number, b: number, t: number) {
  const dx = b - a
  const cx1 = a + dx * 0.35
  const cx2 = a + dx * 0.65
  const u = 1 - t
  return u * u * u * a + 3 * u * u * t * cx1 + 3 * u * t * t * cx2 + t * t * t * b
}

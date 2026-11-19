import type { DemoData, PlatformId } from "@/types"
import { buildStackedFollowerDays } from "@/lib/analytics"

interface StackedFollowerChartProps {
  data: DemoData
}

export function StackedFollowerChart({ data }: StackedFollowerChartProps) {
  const days = buildStackedFollowerDays(data)
  const max = Math.max(...days.map((d) => d.total), 1)
  const barW = 10
  const gap = 4
  const height = 120

  return (
    <div className="w-full overflow-x-auto">
      <svg
        width={days.length * (barW + gap)}
        height={height + 24}
        role="img"
        aria-label="近 30 天净增堆叠柱"
      >
        {days.map((day, i) => {
          let yOffset = height
          return (
            <g key={day.index} transform={`translate(${i * (barW + gap)}, 0)`}>
              {data.platforms.map((pid: PlatformId) => {
                const seg = day.byPlatform[pid]
                const segH = (seg / max) * height
                yOffset -= segH
                return (
                  <rect
                    key={pid}
                    x={0}
                    y={yOffset}
                    width={barW}
                    height={Math.max(segH, 0)}
                    fill={data.platformMeta[pid].color}
                    opacity={0.85}
                    rx={2}
                  />
                )
              })}
            </g>
          )
        })}
      </svg>
      <p className="text-xs text-muted-foreground">近 30 天每日净增（七平台堆叠，演示数据）</p>
    </div>
  )
}
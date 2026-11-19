import type { DemoData, PlatformId } from "@/types"
import { demoData } from "@/data/demo"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCompact } from "@/lib/utils"

interface TrafficViewProps {
  data?: DemoData
}

export function TrafficView({ data = demoData }: TrafficViewProps) {
  const published = data.episodes.filter((e) => e.status === "published")

  return (
    <Card>
      <CardHeader>
        <CardTitle>各期 × 平台播放矩阵</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-muted-foreground">
            <tr>
              <th className="pb-2 pr-4 font-medium">期次</th>
              {data.platforms.map((pid: PlatformId) => (
                <th key={pid} className="pb-2 font-medium">
                  {data.platformMeta[pid].short}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {published.map((ep) => (
              <tr key={ep.id} className="border-t border-border/50">
                <td className="max-w-[200px] py-2 pr-4 text-xs leading-snug">{ep.title}</td>
                {data.platforms.map((pid: PlatformId) => {
                  const plays = ep.platforms[pid].plays
                  const max = Math.max(
                    ...published.map((p) => p.platforms[pid].plays),
                    1,
                  )
                  const intensity = plays / max
                  return (
                    <td key={pid} className="py-2">
                      <div
                        className="stat-num rounded px-2 py-1 text-xs"
                        style={{
                          backgroundColor: `color-mix(in oklch, ${data.platformMeta[pid].color} ${Math.round(intensity * 45)}%, transparent)`,
                        }}
                      >
                        {formatCompact(plays)}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
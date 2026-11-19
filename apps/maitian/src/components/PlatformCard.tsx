import type { DemoData, PlatformId } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCompact, formatSigned } from "@/lib/utils"
import { netGainForWindow } from "@/lib/analytics"
import { Sparkline } from "@/components/Sparkline"

interface PlatformCardProps {
  data: DemoData
  platformId: PlatformId
  episodePlays: number
}

export function PlatformCard({ data, platformId, episodePlays }: PlatformCardProps) {
  const meta = data.platformMeta[platformId]
  const followers = data.followers[platformId]
  const d1 = netGainForWindow(data, 1, platformId)
  const d7 = netGainForWindow(data, 7, platformId)

  return (
    <Card className="gap-3">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium">{meta.name}</CardTitle>
        <span
          className="size-2.5 rounded-full"
          style={{ backgroundColor: meta.color }}
          aria-hidden
        />
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="stat-num text-2xl font-semibold">
          {formatCompact(followers.followers)}
        </div>
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span>日 {formatSigned(d1)}</span>
          <span>周 {formatSigned(d7)}</span>
        </div>
        <Sparkline
          values={followers.dailyNet.slice(-14)}
          color={meta.color}
          width={120}
        />
        <div className="border-t border-border/60 pt-2 text-xs text-muted-foreground">
          当期播放 <span className="stat-num font-medium text-foreground">{formatCompact(episodePlays)}</span>
        </div>
      </CardContent>
    </Card>
  )
}
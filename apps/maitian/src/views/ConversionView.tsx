import type { DemoData } from "@/types"
import { demoData } from "@/data/demo"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCompact } from "@/lib/utils"

interface ConversionViewProps {
  data?: DemoData
}

export function ConversionView({ data = demoData }: ConversionViewProps) {
  const episodes = data.episodes.filter((e) => data.conversion.byEpisode[e.id])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>渠道汇总（演示）</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-muted-foreground">
              <tr>
                <th className="pb-2 font-medium">平台</th>
                <th className="pb-2 font-medium">注册</th>
                <th className="pb-2 font-medium">会员</th>
                <th className="pb-2 font-medium">订单</th>
                <th className="pb-2 font-medium">收入（元）</th>
              </tr>
            </thead>
            <tbody>
              {data.conversion.channels.map((row) => (
                <tr key={row.platform} className="border-t border-border/50">
                  <td className="py-2 font-medium">{data.platformMeta[row.platform].name}</td>
                  <td className="stat-num py-2">{row.signups}</td>
                  <td className="stat-num py-2">{row.members}</td>
                  <td className="stat-num py-2">{row.orders}</td>
                  <td className="stat-num py-2">{formatCompact(row.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>每期漏斗：播放 → 注册 → 会员 → 收入</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {episodes.map((ep) => {
            const funnel = data.conversion.byEpisode[ep.id]!
            const max = funnel.plays || 1
            const steps = [
              { label: "播放", value: funnel.plays, pct: 100 },
              { label: "注册", value: funnel.signups, pct: (funnel.signups / max) * 100 },
              { label: "会员", value: funnel.members, pct: (funnel.members / max) * 100 },
              { label: "收入", value: funnel.revenue, pct: (funnel.revenue / max) * 100, isMoney: true },
            ]
            return (
              <div key={ep.id} className="space-y-2">
                <h3 className="text-sm font-medium">{ep.title}</h3>
                <div className="space-y-2">
                  {steps.map((step) => (
                    <div key={step.label} className="flex items-center gap-3 text-sm">
                      <span className="w-12 text-muted-foreground">{step.label}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary/70"
                          style={{ width: `${Math.min(step.pct, 100)}%` }}
                        />
                      </div>
                      <span className="stat-num w-24 text-right text-xs">
                        {step.isMoney ? `¥${formatCompact(step.value)}` : formatCompact(step.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
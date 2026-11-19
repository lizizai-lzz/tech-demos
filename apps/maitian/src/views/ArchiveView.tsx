import type { DemoData } from "@/types"
import { demoData } from "@/data/demo"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ArchiveViewProps {
  data?: DemoData
}

export function ArchiveView({ data = demoData }: ArchiveViewProps) {
  return (
    <div className="space-y-4">
      {data.archive.map((entry) => {
        const ep = data.episodes.find((e) => e.id === entry.episodeId)
        return (
          <Card key={entry.episodeId}>
            <CardHeader>
              <CardTitle className="text-base">{ep?.title ?? entry.episodeId}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="leading-relaxed text-muted-foreground">{entry.synopsis}</p>
              <ul className="grid gap-1 sm:grid-cols-2">
                {entry.links.map((link) => (
                  <li
                    key={`${entry.episodeId}-${link.platform}`}
                    className="rounded-md border border-dashed border-border/80 px-3 py-2 text-xs text-muted-foreground"
                  >
                    {link.label}（占位，无外链）
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
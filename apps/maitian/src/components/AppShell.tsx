import { useEffect, useState } from "react"
import type { AppView } from "@/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const NAV: { id: AppView; label: string }[] = [
  { id: "board", label: "大屏" },
  { id: "traffic", label: "流量" },
  { id: "calendar", label: "日历" },
  { id: "conversion", label: "转化" },
  { id: "archive", label: "档案" },
]

interface AppShellProps {
  view: AppView
  onViewChange: (v: AppView) => void
  children: React.ReactNode
}

export function AppShell({ view, onViewChange, children }: AppShellProps) {
  const [clock, setClock] = useState(() => new Date())

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const time = clock.toLocaleString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
  const date = clock.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  })

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-border/70 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold tracking-tight">麦田 · 演示工作台</span>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
              空跑 / 不接平台
            </span>
          </div>
          <nav className="flex flex-wrap gap-1">
            {NAV.map((item) => (
              <Button
                key={item.id}
                type="button"
                size="sm"
                variant={view === item.id ? "default" : "ghost"}
                className={cn(view !== item.id && "text-muted-foreground")}
                onClick={() => onViewChange(item.id)}
              >
                {item.label}
              </Button>
            ))}
          </nav>
          <div className="text-right text-sm tabular-nums text-muted-foreground">
            <div className="font-medium text-foreground">{time}</div>
            <div className="text-xs">{date}</div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  )
}
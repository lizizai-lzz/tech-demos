import { useState } from 'react'
import { AgentTimeline } from '@/components/AgentTimeline'
import { UniverSheet, type UniverAPI } from '@/components/UniverSheet'
import { Badge } from '@/components/ui/badge'

export default function App() {
  const [univerAPI, setUniverAPI] = useState<UniverAPI | null>(null)

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <p className="text-xs text-muted-foreground">Univer 开源表格 · 本地空跑</p>
          <h1 className="text-lg font-semibold tracking-tight">内容周报工作台</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Apache-2.0 核心</Badge>
          <Badge variant="outline">无 LLM</Badge>
        </div>
      </header>

      <main className="flex min-h-0 flex-1">
        <section className="flex min-w-0 flex-1 flex-col p-2">
          <UniverSheet onReady={setUniverAPI} />
        </section>
        <AgentTimeline univerAPI={univerAPI} />
      </main>
    </div>
  )
}
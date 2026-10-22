import { StagePanel } from '@/components/stage-panel'
import { DanmakuFeed } from '@/components/danmaku-feed'
import { Workbench } from '@/components/workbench'
import { useLiveRoom } from '@/hooks/use-live-room'

export default function App() {
  const room = useLiveRoom()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-4 py-3">
        <h1 className="text-lg font-semibold">AI 直播间弹幕调度台</h1>
        <p className="text-sm text-muted-foreground">
          浏览器空跑演示 · 过滤 → 分类 → 排队 → 调度（无真实 Vidu / 模型 API）
        </p>
      </header>

      <main className="mx-auto grid max-w-6xl gap-4 p-4 lg:grid-cols-[minmax(0,360px)_1fr_320px]">
        <section aria-label="直播舞台">
          <StagePanel streamer={room.streamer} persona={room.config.persona} />
        </section>

        <section className="min-h-[480px] lg:min-h-[640px]" aria-label="弹幕区">
          <DanmakuFeed feed={room.feed} onSubmit={room.submitDanmaku} />
        </section>

        <section aria-label="工作台">
          <Workbench
            config={room.config}
            updateConfig={room.updateConfig}
            dryRun={room.dryRun}
            onDryRunChange={room.setDryRun}
            eventLog={room.eventLog}
          />
        </section>
      </main>
    </div>
  )
}

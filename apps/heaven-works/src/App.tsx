import { SimulationProvider } from '@/context/SimulationContext'
import { LeftColumn } from '@/components/LeftColumn'
import { RightColumn } from '@/components/RightColumn'
import { TopBar } from '@/components/TopBar'
import { WarRoomCanvas } from '@/components/WarRoomCanvas'

function App() {
  return (
    <SimulationProvider>
      <div className="flex h-full flex-col bg-[var(--fui-bg)]">
        <TopBar />
        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(232px,248px)_1fr_minmax(248px,272px)]">
          <div className="hidden min-h-0 lg:block">
            <LeftColumn />
          </div>
          <main className="relative min-h-[50vh] min-w-0 border-y border-cyan-500/10 lg:border-y-0">
            <WarRoomCanvas />
          </main>
          <div className="hidden min-h-0 lg:block">
            <RightColumn />
          </div>
        </div>
        <footer className="fui-panel shrink-0 px-3 py-1 text-center text-[8px] text-slate-600 lg:hidden">
          缩窄窗口请放大至桌面宽度以查看侧栏 · HEAVEN WORKS dry-run
        </footer>
      </div>
    </SimulationProvider>
  )
}

export default App

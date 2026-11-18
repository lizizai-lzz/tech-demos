import { useSimulation } from '@/context/SimulationContext'
import { projectMeta } from '@/data/simulation'

export function TopBar() {
  const {
    metrics,
    cycleCameraPreset,
    toggleThemeStub,
    toggleFullscreenStub,
  } = useSimulation()

  return (
    <header className="fui-panel grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-slate-700/40 px-3 py-1.5">
      <div className="min-w-0">
        <p className="text-[8px] tracking-[0.22em] text-slate-500">
          AGENT OPS · CACHE 01 · ORBITAL BUILD
        </p>
        <h1 className="fui-title text-base font-semibold text-white md:text-lg">
          HEAVEN WORKS <span className="text-slate-300">天工开物</span>
        </h1>
        <p className="text-[8px] text-slate-500">{projectMeta.subtitle} · dry-run</p>
      </div>

      <div className="flex items-center justify-center gap-1.5 text-[9px]">
        <button
          type="button"
          onClick={cycleCameraPreset}
          className="rounded border border-slate-600/60 bg-black/30 px-2 py-0.5 text-slate-200 hover:border-slate-400"
        >
          视角切换
        </button>
        <button
          type="button"
          onClick={toggleThemeStub}
          className="rounded border border-slate-600/60 bg-black/30 px-2 py-0.5 text-slate-200 hover:border-slate-400"
        >
          主题
        </button>
        <button
          type="button"
          onClick={toggleFullscreenStub}
          className="rounded border border-slate-600/60 bg-black/30 px-2 py-0.5 text-slate-200 hover:border-slate-400"
        >
          退出全屏
        </button>
      </div>

      <div className="text-right text-[8px] leading-snug text-slate-300">
        <div>MASTER SAT · UNITS {metrics.unitsActive}/{metrics.unitsTotal}</div>
        <div>
          POWER {metrics.heartbeat} hz · NODES {metrics.knots.toLocaleString()} · SILK{' '}
          {metrics.silkKh} kh
        </div>
        <div className="text-slate-400">FPS {metrics.fps}</div>
      </div>
    </header>
  )
}

import { useSimulation } from '@/context/SimulationContext'
import { projectMeta } from '@/data/simulation'

export function TopBar() {
  const {
    metrics,
    cycleCameraPreset,
    toggleThemeStub,
    toggleFullscreenStub,
    themeStub,
  } = useSimulation()

  return (
    <header className="fui-panel flex shrink-0 items-center justify-between gap-3 border-b border-cyan-500/20 px-3 py-2">
      <div className="min-w-0">
        <p className="text-[9px] tracking-[0.25em] text-slate-500">
          AGENT OPS · CACHE 01 · ORBITAL BUILD
        </p>
        <h1 className="fui-title truncate text-lg font-semibold text-white md:text-xl">
          HEAVEN WORKS <span className="text-cyan-300">天工开物</span>
        </h1>
        <p className="hidden text-[9px] text-slate-500 sm:block">
          {projectMeta.subtitle} · dry-run 可视化 · 非真实卫星调度
        </p>
      </div>

      <div className="flex items-center gap-2 text-[10px]">
        <button
          type="button"
          onClick={cycleCameraPreset}
          className="fui-panel rounded border-cyan-500/30 px-2 py-1 text-cyan-100 transition hover:border-cyan-400 hover:text-white"
        >
          视角切换
        </button>
        <button
          type="button"
          onClick={toggleThemeStub}
          className="fui-panel rounded border-cyan-500/30 px-2 py-1 text-cyan-100 transition hover:border-cyan-400"
        >
          主题{themeStub === 'cyber' ? '' : '·琥珀'}
        </button>
        <button
          type="button"
          onClick={toggleFullscreenStub}
          className="fui-panel hidden rounded border-cyan-500/30 px-2 py-1 text-cyan-100 sm:inline hover:border-cyan-400"
        >
          退出全屏
        </button>
      </div>

      <div className="hidden text-right text-[9px] leading-tight text-cyan-100/90 lg:block">
        <div>
          UNITS {metrics.unitsActive}/{metrics.unitsTotal} · SILK {metrics.silkKh} kh
        </div>
        <div>
          KNOTS {metrics.knots.toLocaleString()} · HB {metrics.heartbeat} · FPS{' '}
          {metrics.fps}
        </div>
      </div>
    </header>
  )
}

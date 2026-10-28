import type { PreviewProps } from './types'

export function NewsPackagePreview({ theme }: PreviewProps) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-b from-slate-800 to-slate-900">
      <div className="absolute left-4 top-4 flex items-center gap-2">
        <div className="rounded bg-blue-700 px-2 py-0.5 text-[10px] font-bold text-white">
          {theme.tag}
        </div>
        <span className="text-[10px] text-slate-400">18:30 整点新闻</span>
      </div>
      <div className="absolute inset-x-8 top-[28%] flex justify-center">
        <div className="h-40 w-32 rounded-lg bg-slate-600/80 shadow-xl ring-2 ring-white/20" />
      </div>
      <div className="absolute bottom-0 left-0 right-0">
        <div className="h-1 bg-gradient-to-r from-blue-600 via-white to-red-600" />
        <div className="bg-blue-900/95 px-4 py-3">
          <p className="text-lg font-semibold text-white">{theme.headline}</p>
          <p className="mt-1 text-xs text-blue-100/80">{theme.subline}</p>
        </div>
        <div className="flex items-center justify-between bg-black/80 px-4 py-1.5 text-[10px] text-slate-400">
          <span>记者 · 演播室</span>
          <span className="animate-pulse text-red-400">● 直播中</span>
        </div>
      </div>
      <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-white/30 [writing-mode:vertical-rl]">
        NEWS PKG
      </div>
    </div>
  )
}

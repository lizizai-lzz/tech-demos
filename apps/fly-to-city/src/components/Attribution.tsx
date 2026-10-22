import { showAttribution } from '@/lib/attribution'

/** 彩色 Google 字标，放在白底署名条上。 */
export function GoogleLogo() {
  return (
    <svg viewBox="0 0 86 24" width="72" height="20" role="img" aria-label="Google">
      <text fontFamily="Arial, Helvetica, sans-serif" fontSize="20" fontWeight="700" y="18">
        <tspan fill="#4285F4">G</tspan>
        <tspan fill="#EA4335">o</tspan>
        <tspan fill="#FBBC05">o</tspan>
        <tspan fill="#4285F4">g</tspan>
        <tspan fill="#34A853">l</tspan>
        <tspan fill="#EA4335">e</tspan>
      </text>
    </svg>
  )
}

/**
 * 画面底部的署名条：Google 标志加上实际用到的数据来源。
 * 开关关闭时不渲染，录制和离线成片也不会带上它。
 */
export function Attribution() {
  if (!showAttribution()) return null
  return (
    <div className="pointer-events-none absolute bottom-3 left-3 z-30 flex max-w-[min(40rem,calc(100%-1.5rem))] items-center gap-2.5 rounded-md bg-white/92 px-2.5 py-1.5 shadow-sm">
      <GoogleLogo />
      <p className="text-[10px] leading-snug text-neutral-700">
        地图 ©{' '}
        <a
          className="pointer-events-auto hover:underline"
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
        >
          OpenStreetMap
        </a>{' '}
        贡献者 · OpenFreeMap ·{' '}
        <a
          className="pointer-events-auto hover:underline"
          href="https://overturemaps.org"
          target="_blank"
          rel="noreferrer"
        >
          Overture Maps
        </a>
        {' · '}
        影像{' '}
        <a
          className="pointer-events-auto hover:underline"
          href="https://s2maps.eu"
          target="_blank"
          rel="noreferrer"
        >
          Sentinel-2 cloudless
        </a>{' '}
        © EOX CC BY 4.0（含 Copernicus Sentinel 数据）
      </p>
    </div>
  )
}

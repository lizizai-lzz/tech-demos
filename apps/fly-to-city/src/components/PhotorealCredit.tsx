import { GoogleLogo } from '@/components/Attribution'
import { showAttribution } from '@/lib/attribution'

type Props = {
  visible: boolean
  lines: string[]
}

/** 和程序化署名用同一个开关，默认关闭。公开发布时再打开。 */
export function PhotorealCredit({ visible, lines }: Props) {
  if (!visible || !showAttribution()) return null
  const text = lines.length > 0 ? lines.join(' · ') : 'Google Photorealistic 3D Tiles'
  return (
    <div className="pointer-events-none absolute bottom-3 left-3 z-30 flex max-w-[min(42rem,calc(100%-1.5rem))] items-center gap-2.5 rounded-md bg-white/92 px-2.5 py-1.5 shadow-sm">
      <GoogleLogo />
      <p className="text-[10px] leading-snug text-neutral-700">{text}</p>
    </div>
  )
}

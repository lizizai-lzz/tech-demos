import { useCanvasLoop } from '@/hooks/use-canvas-loop'
import type { PreviewProps } from './types'

export function CaptionNewsPreview({ theme }: PreviewProps) {
  const ref = useCanvasLoop(
    (ctx, t, w, h) => {
      ctx.fillStyle = '#0f1419'
      ctx.fillRect(0, 0, w, h)

      const barH = h * 0.22
      ctx.fillStyle = 'rgba(0,0,0,0.75)'
      ctx.fillRect(0, h - barH, w, barH)

      const pulse = 0.85 + Math.sin(t * 2) * 0.05
      ctx.fillStyle = `rgba(40,120,255,${0.15 * pulse})`
      ctx.fillRect(w * 0.08, h * 0.2, w * 0.84, h * 0.45)

      ctx.strokeStyle = 'rgba(255,255,255,0.08)'
      for (let i = 0; i < 6; i++) {
        ctx.strokeRect(20 + i * 12, 20, w - 40 - i * 8, h - barH - 40)
      }

      const scroll = (t * 40) % (w + 200)
      ctx.fillStyle = '#fff'
      ctx.font = `bold ${Math.max(14, w * 0.035)}px sans-serif`
      ctx.fillText(theme.headline, w - scroll, h - barH / 2 + 6)

      ctx.font = `${Math.max(11, w * 0.022)}px sans-serif`
      ctx.fillStyle = '#9ecbff'
      const lines = theme.subline.slice(0, 28)
      ctx.fillText(lines, 24, h - barH + 28)

      ctx.fillStyle = '#ffcc00'
      ctx.fillRect(24, h - barH + 36, 64, 3)
      ctx.fillStyle = '#fff'
      ctx.font = '11px sans-serif'
      ctx.fillText(theme.tag, 24, h - 14)
    },
    [theme],
  )

  return <canvas ref={ref} className="h-full w-full" aria-label="字幕新闻预览" />
}

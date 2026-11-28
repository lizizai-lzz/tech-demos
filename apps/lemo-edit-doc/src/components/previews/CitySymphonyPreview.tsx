import { useCanvasLoop } from '@/hooks/use-canvas-loop'
import type { PreviewProps } from './types'

export function CitySymphonyPreview({ theme }: PreviewProps) {
  const ref = useCanvasLoop(
    (ctx, t, w, h) => {
      const sky = ctx.createLinearGradient(0, 0, 0, h)
      const hour = (t * 0.08) % 1
      const r = 30 + hour * 180
      const g = 40 + hour * 80
      const b = 90 + hour * 40
      sky.addColorStop(0, `rgb(${r},${g},${b})`)
      sky.addColorStop(1, '#1a1020')
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, w, h)

      const sunY = h * 0.25 + Math.sin(t * 0.3) * 20
      ctx.fillStyle = `rgba(255,220,120,${0.5 + hour * 0.5})`
      ctx.beginPath()
      ctx.arc(w * 0.75, sunY, 18 + hour * 10, 0, Math.PI * 2)
      ctx.fill()

      const baseY = h * 0.55
      for (let i = 0; i < 12; i++) {
        const bw = w / 14
        const x = i * (bw + 4) + ((t * 30 * (i % 3 + 1)) % (bw + 4))
        const bh = 40 + (i % 5) * 25
        ctx.fillStyle = `rgba(20,25,40,${0.7 + (i % 3) * 0.1})`
        ctx.fillRect(x % w, baseY - bh, bw, bh)
      }

      const streaks = 8
      for (let s = 0; s < streaks; s++) {
        const y = baseY + 30 + s * 8
        const speed = 80 + s * 40
        const x = ((t * speed + s * 50) % (w + 100)) - 50
        ctx.strokeStyle = `rgba(255,200,80,${0.2 + s * 0.05})`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x + 40, y)
        ctx.stroke()
      }

      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      ctx.font = `600 ${Math.max(12, w * 0.028)}px sans-serif`
      ctx.fillText(theme.headline, 16, h - 36)
      ctx.fillStyle = 'rgba(255,255,255,0.55)'
      ctx.font = '11px sans-serif'
      ctx.fillText(theme.tag + ' · 延时', 16, h - 16)
    },
    [theme],
  )

  return <canvas ref={ref} className="h-full w-full" aria-label="延时交响预览" />
}

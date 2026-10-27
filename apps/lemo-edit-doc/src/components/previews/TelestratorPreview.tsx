import { useCanvasLoop } from '@/hooks/use-canvas-loop'
import type { PreviewProps } from './types'

export function TelestratorPreview({ theme }: PreviewProps) {
  const ref = useCanvasLoop(
    (ctx, t, w, h) => {
      ctx.fillStyle = '#1a4d2e'
      ctx.fillRect(0, 0, w, h)

      ctx.strokeStyle = 'rgba(255,255,255,0.35)'
      ctx.lineWidth = 2
      ctx.strokeRect(w * 0.1, h * 0.15, w * 0.8, h * 0.7)
      ctx.beginPath()
      ctx.moveTo(w * 0.1, h * 0.5)
      ctx.lineTo(w * 0.9, h * 0.5)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(w * 0.5, h * 0.5, h * 0.12, 0, Math.PI * 2)
      ctx.stroke()

      const drawProgress = (t % 4) / 4
      const ax = w * 0.25
      const ay = h * 0.55
      const bx = w * 0.25 + drawProgress * w * 0.45
      const by = h * 0.35

      ctx.strokeStyle = '#ffeb3b'
      ctx.lineWidth = 4
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(ax, ay)
      ctx.lineTo(bx, by)
      ctx.stroke()

      if (drawProgress > 0.6) {
        const head = 12
        const angle = Math.atan2(by - ay, bx - ax)
        ctx.fillStyle = '#ffeb3b'
        ctx.beginPath()
        ctx.moveTo(bx, by)
        ctx.lineTo(bx - head * Math.cos(angle - 0.4), by - head * Math.sin(angle - 0.4))
        ctx.lineTo(bx - head * Math.cos(angle + 0.4), by - head * Math.sin(angle + 0.4))
        ctx.closePath()
        ctx.fill()

        ctx.strokeStyle = '#00e5ff'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(w * 0.62, h * 0.48, 22, 0, Math.PI * 2)
        ctx.stroke()
      }

      ctx.fillStyle = 'rgba(0,0,0,0.55)'
      ctx.fillRect(0, h - 36, w, 36)
      ctx.fillStyle = '#fff'
      ctx.font = '12px sans-serif'
      ctx.fillText(theme.headline, 12, h - 14)
    },
    [theme],
  )

  return <canvas ref={ref} className="h-full w-full" aria-label="战术板预览" />
}

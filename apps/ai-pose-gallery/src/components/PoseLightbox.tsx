import { useCallback, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Copy, X } from 'lucide-react'
import { toast } from 'sonner'
import { StickFigure } from '@/components/StickFigure'
import { Button } from '@/components/ui/button'
import { buildPosePrompt } from '@/lib/prompt'
import type { Pose } from '@/types'
import { cn } from '@/lib/utils'

type PoseLightboxProps = {
  pose: Pose
  angleIndex: number
  onAngleIndexChange: (index: number) => void
  onClose: () => void
}

export function PoseLightbox({
  pose,
  angleIndex,
  onAngleIndexChange,
  onClose,
}: PoseLightboxProps) {
  const view = pose.views[angleIndex]
  const angle = view?.angle ?? pose.views[0].angle

  const goPrev = useCallback(() => {
    onAngleIndexChange(
      (angleIndex - 1 + pose.views.length) % pose.views.length,
    )
  }, [angleIndex, onAngleIndexChange, pose.views.length])

  const goNext = useCallback(() => {
    onAngleIndexChange((angleIndex + 1) % pose.views.length)
  }, [angleIndex, onAngleIndexChange, pose.views.length])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goNext, goPrev, onClose])

  async function copyId() {
    await navigator.clipboard.writeText(pose.id)
    toast.success('已复制姿势 ID')
  }

  async function copyPrompt() {
    const text = buildPosePrompt(pose, angle, view.framing)
    await navigator.clipboard.writeText(text)
    toast.success('已复制中英提示词')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`${pose.name} 预览`}
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-card shadow-xl ring-1 ring-border"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b px-4 py-3">
          <div>
            <h2 className="text-lg font-semibold">{pose.name}</h2>
            <p className="text-sm text-muted-foreground">
              {pose.system} · {pose.category} · {pose.id}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="关闭">
            <X />
          </Button>
        </header>

        <div className="grid gap-4 p-4 md:grid-cols-[1fr_200px]">
          <div className="relative aspect-[3/4] max-h-[55vh] overflow-hidden rounded-xl bg-muted/30">
            <StickFigure
              angle={angle}
              system={pose.system}
              variant={view.variant}
              className="h-full"
            />
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-2 left-2"
              onClick={goPrev}
              aria-label="上一视角"
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-2 right-2"
              onClick={goNext}
              aria-label="下一视角"
            >
              <ChevronRight />
            </Button>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              当前视角：<span className="font-medium text-foreground">{angle}</span>
            </p>
            <p className="text-sm">{view.framing}</p>
            <div className="flex flex-wrap gap-1.5">
              {pose.views.map((v, i) => (
                <button
                  key={v.angle}
                  type="button"
                  onClick={() => onAngleIndexChange(i)}
                  className={cn(
                    'rounded-full border px-2.5 py-0.5 text-xs transition-colors',
                    i === angleIndex
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:bg-muted',
                  )}
                >
                  {v.angle}
                </button>
              ))}
            </div>
            <div className="mt-auto flex flex-col gap-2">
              <Button variant="outline" onClick={copyId}>
                <Copy className="size-4" />
                复制 ID
              </Button>
              <Button onClick={copyPrompt}>
                <Copy className="size-4" />
                复制提示词
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              快捷键：← → 切换视角，Esc 关闭
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

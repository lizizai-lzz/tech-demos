import { RotateCcw } from 'lucide-react'
import { motion, useInView } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { MotionParams, PreviewKind } from '@/types'
import { EntryPreview } from './EntryPreview'

type PreviewStageProps = {
  entryId: string
  kind: PreviewKind
  params: MotionParams
  replayKey: number
  size?: 'sm' | 'lg'
  layoutId?: string
  /** 画廊卡片：悬停循环 / 进入视口播放 */
  galleryMode?: boolean
  reduceMotion?: boolean
  showReplay?: boolean
  onManualReplay?: () => void
}

export function PreviewStage({
  entryId,
  kind,
  params,
  replayKey,
  size = 'lg',
  layoutId,
  galleryMode = false,
  reduceMotion = false,
  showReplay = true,
  onManualReplay,
}: PreviewStageProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const inView = useInView(rootRef, { amount: 0.45, once: false })
  const [hovered, setHovered] = useState(false)
  const [loopKey, setLoopKey] = useState(0)

  const shouldAnimate =
    !reduceMotion && (galleryMode ? hovered || inView : true)

  useEffect(() => {
    if (!galleryMode || reduceMotion || !hovered) return
    const interval = window.setInterval(
      () => setLoopKey((k) => k + 1),
      Math.max(params.duration + 400, 900),
    )
    return () => window.clearInterval(interval)
  }, [galleryMode, hovered, reduceMotion, params.duration])

  const effectiveReplayKey = galleryMode ? replayKey + loopKey + (inView ? 1 : 0) : replayKey

  const heightClass = size === 'sm' ? 'h-[7.5rem]' : 'h-[14rem] md:h-[16rem]'

  return (
    <div className="space-y-2">
      {showReplay && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">实时预览</span>
          <Button type="button" variant="outline" size="sm" onClick={onManualReplay}>
            <RotateCcw className="size-4" />
            重播 Replay
          </Button>
        </div>
      )}
      <motion.div
        ref={rootRef}
        layoutId={layoutId}
        data-entry-preview={entryId}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          'preview-stage relative flex items-center justify-center overflow-hidden rounded-xl border border-border/80 p-3',
          heightClass,
          galleryMode && 'cursor-pointer',
        )}
      >
        <div
          className={cn(
            'flex size-full items-center justify-center transition-opacity duration-300',
            galleryMode && !shouldAnimate && 'opacity-70',
          )}
        >
          <EntryPreview
            kind={kind}
            params={params}
            replayKey={effectiveReplayKey}
            compact={size === 'sm'}
          />
        </div>
      </motion.div>
    </div>
  )
}

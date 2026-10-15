import { RotateCcw } from 'lucide-react'
import { motion, useInView } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useCanHover } from '@/hooks/use-can-hover'
import {
  estimatePreviewDurationMs,
  GALLERY_HOLD_AFTER_MS,
  GALLERY_MIN_GAP_MS,
} from '@/lib/preview-duration'
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
  galleryMode?: boolean
  /** 详情打开时暂停画廊悬停循环 */
  gallerySuspended?: boolean
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
  gallerySuspended = false,
  reduceMotion = false,
  showReplay = true,
  onManualReplay,
}: PreviewStageProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const inView = useInView(rootRef, { amount: 0.5, margin: '-10% 0px' })
  const wasInView = useRef(false)
  const canHover = useCanHover()
  const [hovered, setHovered] = useState(false)
  const [galleryPlayKey, setGalleryPlayKey] = useState(0)

  // 画廊：悬停时完整播放 → 停留 → 再播；触屏仅进入视口播一次
  useEffect(() => {
    if (!galleryMode || reduceMotion || gallerySuspended) return

    if (!canHover) {
      if (inView && !wasInView.current) {
        setGalleryPlayKey((k) => k + 1)
      }
      wasInView.current = inView
      return
    }

    if (!hovered) return

    let cancelled = false
    let timeoutId = 0

    const scheduleNext = () => {
      if (cancelled || !hovered) return
      setGalleryPlayKey((k) => k + 1)
      const animMs = estimatePreviewDurationMs(kind, params)
      const wait = Math.max(animMs + GALLERY_HOLD_AFTER_MS, GALLERY_MIN_GAP_MS)
      timeoutId = window.setTimeout(scheduleNext, wait)
    }

    scheduleNext()

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [galleryMode, gallerySuspended, reduceMotion, canHover, hovered, inView, kind, params])

  const effectiveReplayKey = galleryMode ? galleryPlayKey : replayKey

  const heightClass =
    size === 'sm' ? 'h-[7.5rem]' : 'h-[15rem] sm:h-[17.5rem]'

  const idleGallery = galleryMode && !reduceMotion && canHover && !hovered

  return (
    <div className={cn('space-y-3', size === 'lg' && 'space-y-4')}>
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
          'preview-stage relative flex items-center justify-center overflow-hidden rounded-xl border border-border/60 p-4',
          heightClass,
          galleryMode && 'cursor-pointer',
        )}
      >
        <div
          className={cn(
            'flex size-full items-center justify-center transition-opacity duration-500',
            idleGallery && 'opacity-80',
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

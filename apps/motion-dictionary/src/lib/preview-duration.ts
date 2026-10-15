import type { MotionParams, PreviewKind } from '@/types'

/** 估算一次预览播放的时长（毫秒），用于画廊重播间隔 */
export function estimatePreviewDurationMs(kind: PreviewKind, params: MotionParams): number {
  switch (kind) {
    case 'spring':
    case 'micro-interaction':
      return 900 + params.delay
    case 'stagger':
      return params.duration + params.delay * 5 + 200
    case 'skeleton':
      return Math.max(params.duration, 1200)
    case 'page-transition':
      return params.duration * 2 + params.delay
    case 'easing':
      return params.duration + params.delay + 100
    default:
      return params.duration + params.delay + 150
  }
}

export const GALLERY_HOLD_AFTER_MS = 1200
export const GALLERY_MIN_GAP_MS = 1500

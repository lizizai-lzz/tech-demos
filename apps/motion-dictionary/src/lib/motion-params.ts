import type { MotionParams } from '@/types'

export const DEFAULT_MOTION_PARAMS: MotionParams = {
  duration: 800,
  delay: 0,
  easing: 'easeInOut',
  stiffness: 200,
  damping: 24,
}

export const EASING_OPTIONS: { value: string; label: string }[] = [
  { value: 'linear', label: 'linear（匀速）' },
  { value: 'easeIn', label: 'easeIn（慢入）' },
  { value: 'easeOut', label: 'easeOut（慢出）' },
  { value: 'easeInOut', label: 'easeInOut（慢入慢出）' },
  { value: 'circOut', label: 'circOut（圆形出）' },
  { value: 'backOut', label: 'backOut（回弹出）' },
]

export function mergeParams(partial?: Partial<MotionParams>): MotionParams {
  return { ...DEFAULT_MOTION_PARAMS, ...partial }
}

/** 将毫秒参数转为 Motion 使用的秒 */
export function seconds(ms: number): number {
  return ms / 1000
}

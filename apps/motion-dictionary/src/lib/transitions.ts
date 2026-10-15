import type { Transition } from 'motion/react'
import type { MotionParams } from '@/types'
import { seconds } from '@/lib/motion-params'

const EASING_MAP: Record<string, Transition['ease']> = {
  linear: 'linear',
  easeIn: 'easeIn',
  easeOut: 'easeOut',
  easeInOut: 'easeInOut',
  circOut: 'circOut',
  backOut: 'backOut',
}

export function tweenTransition(params: MotionParams, useSpring = false): Transition {
  if (useSpring) {
    return {
      type: 'spring',
      stiffness: params.stiffness,
      damping: params.damping,
      delay: seconds(params.delay),
    }
  }
  return {
    type: 'tween',
    duration: seconds(params.duration),
    ease: EASING_MAP[params.easing] ?? 'easeOut',
    delay: seconds(params.delay),
  }
}

export function easingOnly(params: MotionParams): Transition['ease'] {
  return EASING_MAP[params.easing] ?? 'easeOut'
}

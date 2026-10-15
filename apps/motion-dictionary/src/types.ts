export type ControlId = 'duration' | 'delay' | 'easing' | 'stiffness' | 'damping'

export type PreviewKind =
  | 'fade-in'
  | 'easing'
  | 'spring'
  | 'parallax'
  | 'stagger'
  | 'scroll-triggered'
  | 'hover'
  | 'page-transition'
  | 'skeleton'
  | 'micro-interaction'
  | 'scale'
  | 'slide-in'

export type MotionParams = {
  duration: number
  delay: number
  easing: string
  stiffness: number
  damping: number
}

export type DictionaryEntry = {
  id: string
  termZh: string
  termEn: string
  /** 卡片上的说明 */
  description: string
  /** 提示词中的口语化效果描述 */
  effectFeel: string
  category: string
  preview: PreviewKind
  controls: ControlId[]
  defaultParams?: Partial<MotionParams>
}

export type DanmakuFeedStatus =
  | 'filtered'
  | 'queued'
  | 'processing'
  | 'done'

export type IntentKind = 'chat' | 'outfit' | 'action' | 'gift' | 'unsupported'

export interface ClassifiedIntent {
  kind: IntentKind
  /** 换装名称或动作名称 */
  label?: string
}

export interface WardrobeItem {
  name: string
  color: string
}

export interface Persona {
  name: string
  description: string
  openingLine: string
}

export interface PipelineConfig {
  filterKeywords: string[]
  giftKeywords: string[]
  /** 动作名 -> 触发关键词 */
  actionKeywords: Record<string, string[]>
  unsupportedKeywords: string[]
  wardrobe: WardrobeItem[]
  persona: Persona
  /** 每个字符对应的毫秒数（语速） */
  msPerChar: number
  /** 队列空闲多久后触发暖场（秒） */
  idleWarmupSeconds: number
  warmupTopics: string[]
}

export interface QueuedDanmaku {
  id: string
  text: string
  normalizedText: string
  intent: ClassifiedIntent
  duplicateCount: number
  enqueuedAt: number
}

export type FilterResult =
  | { ok: true }
  | { ok: false; reason: string }

export type StreamerMode =
  | 'idle'
  | 'talking'
  | 'outfit-changing'
  | 'action'
  | 'warmup'

export interface StreamerViewState {
  mode: StreamerMode
  subtitle: string
  currentOutfit: string
  currentOutfitColor: string
  actionName?: string
  queueLength: number
}

export interface DispatchPlan {
  mode: StreamerMode
  subtitle: string
  durationMs: number
  outfitName?: string
  actionName?: string
  isWarmup?: boolean
}

export interface FeedItem {
  id: string
  text: string
  userLabel: string
  status: DanmakuFeedStatus
  filterReason?: string
  intent?: ClassifiedIntent
  createdAt: number
}

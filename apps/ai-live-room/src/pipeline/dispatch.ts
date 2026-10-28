import type { ClassifiedIntent, DispatchPlan, PipelineConfig } from './types'

const OUTFIT_TRANSITION_MS = 6000
const ACTION_DURATION_MS = 1500
const GIFT_THANK_EXTRA_MS = 800

export function utteranceDurationMs(text: string, msPerChar: number): number {
  const len = Math.max(text.length, 4)
  return Math.min(Math.max(len * msPerChar, 2000), 20000)
}

export function buildDispatchPlan(
  intent: ClassifiedIntent,
  text: string,
  config: PipelineConfig,
  options?: { isWarmup?: boolean; warmupLine?: string }
): DispatchPlan {
  const { persona, msPerChar } = config

  if (options?.isWarmup && options.warmupLine) {
    const line = options.warmupLine
    return {
      mode: 'warmup',
      subtitle: line,
      durationMs: utteranceDurationMs(line, msPerChar),
      isWarmup: true,
    }
  }

  switch (intent.kind) {
    case 'chat': {
      const reply = `「${persona.name}」：${text.replace(/^(.{0,20}).*/, '$1')}？收到啦～${persona.openingLine.slice(0, 12)}…`
      return {
        mode: 'talking',
        subtitle: reply,
        durationMs: utteranceDurationMs(reply, msPerChar),
      }
    }
    case 'gift': {
      const thanks = `谢谢宝贝的礼物「${text.slice(0, 16)}」！心意收到啦～（按队列顺序感谢，不会插队哦）`
      return {
        mode: 'talking',
        subtitle: thanks,
        durationMs: utteranceDurationMs(thanks, msPerChar) + GIFT_THANK_EXTRA_MS,
      }
    }
    case 'outfit': {
      const name = intent.label ?? config.wardrobe[0]?.name ?? '默认裙装'
      return {
        mode: 'outfit-changing',
        subtitle: `正在为您换上「${name}」…`,
        durationMs: OUTFIT_TRANSITION_MS,
        outfitName: name,
      }
    }
    case 'action': {
      const name = intent.label ?? '比心'
      return {
        mode: 'action',
        subtitle: `来啦～${name}！`,
        durationMs: ACTION_DURATION_MS,
        actionName: name,
      }
    }
    case 'unsupported':
    default: {
      const fallback = `这个暂时还不会呢～比如唱歌、带货、换背景。我们可以聊聊天或换装哦！`
      return {
        mode: 'talking',
        subtitle: fallback,
        durationMs: utteranceDurationMs(fallback, msPerChar),
      }
    }
  }
}

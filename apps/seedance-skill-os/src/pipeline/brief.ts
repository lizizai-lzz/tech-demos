import type { Brief, SeedKind } from './types'

function titleFromIdea(idea: string): string {
  const trimmed = idea.trim().replace(/\s+/g, ' ')
  if (trimmed.length <= 18) return trimmed
  return `${trimmed.slice(0, 16)}…`
}

export function compileBrief(
  idea: string,
  kind: SeedKind,
  answers: Record<string, string>
): Brief {
  const base = {
    title: titleFromIdea(idea),
    audience: '短视频平台泛用户',
    tone: '克制、有电影感',
    visualStyle: '浅景深、自然光、轻微颗粒',
    durationSec: 30,
    logline: idea.trim(),
    mustHave: ['主体清晰', '节奏有呼吸感'],
  }

  switch (kind) {
    case 'drama':
      return {
        ...base,
        audience: '短剧 / 情感向观众',
        tone: answers.emotion ?? '克制隐忍',
        visualStyle: '便利店荧光灯 + 面部特写，浅景深',
        durationSec: 28,
        mustHave: [
          '双人正反打',
          answers.ending ?? '开放式留白',
          '至少一处眼神特写',
        ],
      }
    case 'unbox':
      return {
        ...base,
        audience: '种草 / 数码爱好者',
        tone: '轻快、有爽感',
        visualStyle: '高调布光、产品微距、干净桌面',
        durationSec: 24,
        mustHave: [
          answers.highlight ?? '做工材质',
          answers.platform ?? '抖音竖屏 9:16',
          '开箱撕膜 ASMR 感',
        ],
      }
    case 'broll':
      return {
        ...base,
        audience: '片头 / Vlog 创作者',
        tone: answers.mood ?? '雨后清冷',
        visualStyle: '长焦压缩、慢门光轨、无对白',
        durationSec: 20,
        mustHave: [
          answers.pace ?? '慢镜铺陈',
          '城市天际线建立镜',
          '环境音层次（雨声 / 车流）',
        ],
      }
    default:
      return {
        ...base,
        durationSec: answers.duration?.includes('60') ? 60 : answers.duration?.includes('15') ? 15 : 30,
        visualStyle: answers.style ?? base.visualStyle,
        mustHave: [answers.style ?? '写实电影感', '单一清晰叙事线'],
      }
  }
}

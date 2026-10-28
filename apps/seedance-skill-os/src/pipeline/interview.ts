import type { InterviewQuestion, SeedKind } from './types'

const INTERVIEW_BY_KIND: Record<SeedKind, InterviewQuestion[]> = {
  drama: [
    {
      id: 'emotion',
      prompt: '这场戏的核心情绪更接近哪一种？',
      choices: ['克制隐忍', '爆发对峙', '温柔和解'],
    },
    {
      id: 'ending',
      prompt: '结尾希望观众带走什么？',
      choices: ['开放式留白', '明确反转', '金句落点'],
    },
  ],
  unbox: [
    {
      id: 'platform',
      prompt: '主要发布平台与画幅？',
      choices: ['抖音竖屏 9:16', '小红书 3:4', 'B站横屏 16:9'],
    },
    {
      id: 'highlight',
      prompt: '最想突出的卖点？',
      choices: ['降噪体验', '做工材质', '佩戴舒适度'],
    },
  ],
  broll: [
    {
      id: 'mood',
      prompt: '整体氛围关键词？',
      choices: ['赛博霓虹', '雨后清冷', '暖色治愈'],
    },
    {
      id: 'pace',
      prompt: '剪辑节奏？',
      choices: ['慢镜铺陈', '中等律动', '快切蒙太奇'],
    },
  ],
  generic: [
    {
      id: 'duration',
      prompt: '目标成片时长？',
      choices: ['15 秒内', '30 秒左右', '60 秒叙事'],
    },
    {
      id: 'style',
      prompt: '视觉风格偏好？',
      choices: ['写实电影感', '高饱和广告感', '纪录片手持'],
    },
  ],
}

export function buildInterviewQuestions(kind: SeedKind): InterviewQuestion[] {
  const qs = INTERVIEW_BY_KIND[kind]
  return qs.slice(0, 2)
}

import type { PipelineConfig } from './types'

export const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {
  filterKeywords: [
    '傻逼',
    '操你',
    '加微信',
    '微信',
    '加V',
    '私信',
    '引流',
    'http://',
    'https://',
    'www.',
    '.com',
  ],
  giftKeywords: ['礼物', '打赏', '火箭', '跑车', '小心心', '刷礼物'],
  actionKeywords: {
    比心: ['比心', '爱心', '比个心'],
    挥手: ['挥手', '招手', '挥挥手'],
    眨眼: ['眨眼', '眨眨眼', 'wink'],
  },
  unsupportedKeywords: [
    '唱歌',
    '来首歌',
    '带货',
    '下单',
    '换背景',
    '查天气',
    '天气预报',
  ],
  wardrobe: [
    { name: '默认裙装', color: '#f472b6' },
    { name: '校园制服', color: '#60a5fa' },
    { name: '运动套装', color: '#34d399' },
    { name: '晚礼服', color: '#a78bfa' },
    { name: '休闲卫衣', color: '#fbbf24' },
    { name: '古风汉服', color: '#f87171' },
  ],
  persona: {
    name: '小璃',
    description: '温柔耐心的 AI 主播，擅长聊天互动与换装展示。',
    openingLine: '欢迎来到空跑直播间～弹幕我都会慢慢回复的！',
  },
  msPerChar: 120,
  idleWarmupSeconds: 8,
  warmupTopics: [
    '大家今天过得怎么样呀？',
    '第一次来直播间的可以打个招呼～',
    '想看哪套衣服可以弹幕告诉我名字哦。',
    '支持比心、挥手、眨眼三个小动作～',
    '唱歌和带货暂时还不会，但可以聊聊天！',
    '队列里会按顺序回复，礼物也不会插队哦。',
  ],
}

export const SIMULATED_DANMAKU_POOL: string[] = [
  '主播好漂亮！',
  '今天心情怎么样？',
  '可以介绍一下自己吗？',
  '换校园制服看看',
  '我想看晚礼服',
  '来个古风汉服',
  '比心！',
  '挥挥手～',
  '眨眨眼',
  '送个火箭！谢谢主播',
  '刷礼物了',
  '唱首歌吧',
  '帮我查一下天气',
  '能不能带货？',
  '加微信私聊',
  'http://spam.example.com 来看',
  '傻逼主播',
  '引流加V',
]

export const STORAGE_KEY = 'ai-live-room-config-v1'

export type ConsoleToken =
  | { type: 'plain'; text: string }
  | { type: 'keyword'; text: string }
  | { type: 'string'; text: string }
  | { type: 'comment'; text: string }
  | { type: 'fn'; text: string }

export type ConsoleLine = {
  num: number
  tokens: ConsoleToken[]
}

export const loopPySeed: ConsoleLine[] = [
  {
    num: 41,
    tokens: [
      { type: 'comment', text: '# 天工开物 · 轨道构建调度' },
    ],
  },
  {
    num: 42,
    tokens: [
      { type: 'keyword', text: 'def' },
      { type: 'plain', text: ' ' },
      { type: 'fn', text: 'dispatch_orbital' },
      { type: 'plain', text: '(cache_id: ' },
      { type: 'string', text: '"CACHE-01"' },
      { type: 'plain', text: '):' },
    ],
  },
  {
    num: 43,
    tokens: [
      { type: 'plain', text: '    core = ' },
      { type: 'fn', text: 'HeavenCore' },
      { type: 'plain', text: '.connect()' },
    ],
  },
  {
    num: 44,
    tokens: [
      { type: 'plain', text: '    ' },
      { type: 'keyword', text: 'for' },
      { type: 'plain', text: ' unit ' },
      { type: 'keyword', text: 'in' },
      { type: 'plain', text: ' LOOP_UNITS:' },
    ],
  },
  {
    num: 45,
    tokens: [
      { type: 'plain', text: '        core.' },
      { type: 'fn', text: 'attach' },
      { type: 'plain', text: '(unit, silk=' },
      { type: 'string', text: '"master"' },
      { type: 'plain', text: ')' },
    ],
  },
  {
    num: 46,
    tokens: [
      { type: 'plain', text: '        unit.' },
      { type: 'fn', text: 'weave' },
      { type: 'plain', text: '(stage=' },
      { type: 'string', text: '"hologram"' },
      { type: 'plain', text: ')' },
    ],
  },
  {
    num: 47,
    tokens: [
      { type: 'plain', text: '    core.' },
      { type: 'fn', text: 'commit' },
      { type: 'plain', text: '(verify=' },
      { type: 'keyword', text: 'True' },
      { type: 'plain', text: ')' },
    ],
  },
  {
    num: 48,
    tokens: [{ type: 'comment', text: '# U04 REVIEWER → VERIFY beam active' }],
  },
]

export const loopPyExtra: ConsoleLine[] = [
  {
    num: 49,
    tokens: [
      { type: 'plain', text: '    log.' },
      { type: 'fn', text: 'emit' },
      { type: 'plain', text: '(' },
      { type: 'string', text: '"silk.knot +1"' },
      { type: 'plain', text: ')' },
    ],
  },
  {
    num: 50,
    tokens: [
      { type: 'plain', text: '    hologram.' },
      { type: 'fn', text: 'project' },
      { type: 'plain', text: '(targets=' },
      { type: 'string', text: '"desktop,tablet,mobile"' },
      { type: 'plain', text: ')' },
    ],
  },
  {
    num: 51,
    tokens: [
      { type: 'keyword', text: 'return' },
      { type: 'plain', text: ' core.status' },
    ],
  },
]

export const deliverySeed = [
  { id: 'JOB-0503', time: '21:51', text: '搜索中心报错修复' },
  { id: 'JOB-0502', time: '21:38', text: 'Hero 动效参数锁定' },
  { id: 'JOB-0501', time: '21:22', text: '组件 Story 快照通过' },
  { id: 'JOB-0500', time: '21:09', text: 'CDN 缓存策略草案' },
  { id: 'JOB-0499', time: '20:54', text: '平板断点栅格对齐' },
]

export const deliveryExtras = [
  'Footer 链接树校验',
  '表单校验文案统一',
  'Lighthouse 性能复测',
  '暗色模式对比度',
  'OpenGraph 预览图',
  '404 页面插画',
  '导航焦点环样式',
]

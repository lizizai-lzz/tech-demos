export type ExampleThemeId = 'ai-week' | 'city-day'

export type ExampleTheme = {
  id: ExampleThemeId
  label: string
  headline: string
  subline: string
  tag: string
}

export const exampleThemes: ExampleTheme[] = [
  {
    id: 'ai-week',
    label: '本周 AI',
    headline: '模型一周要闻速览',
    subline: '从开源权重到产品落地，用字幕把信息压成可扫读的节拍。',
    tag: '科技观察',
  },
  {
    id: 'city-day',
    label: '城市一天',
    headline: '从晨雾到霓虹的二十四小时',
    subline: '用延时与分屏，把街道、天际线与人群写成一首城市交响。',
    tag: '城市纪实',
  },
]

export function themeById(id: ExampleThemeId): ExampleTheme {
  return exampleThemes.find((t) => t.id === id) ?? exampleThemes[0]
}

import type { EditDocStyle } from '@/styles/registry'
import type { ExampleTheme } from '@/themes/example-themes'

export function buildBriefText(style: EditDocStyle, theme: ExampleTheme): string {
  return [
    '【剪辑与纪实 · Brief 模板】',
    `主题：${theme.headline}`,
    `风格：${style.nameZh}（${style.slug}）`,
    `时长建议：${style.brief.duration}`,
    `素材类型：${style.brief.materials}`,
    `旁白语气：${style.brief.voice}`,
    `画面要点：${theme.subline}`,
    '',
    '口诀备忘：',
    ...style.mantras.map((m, i) => `${i + 1}. ${m}`),
  ].join('\n')
}

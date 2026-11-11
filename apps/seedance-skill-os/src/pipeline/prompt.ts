import type { Brief, ShotRow } from './types'

export function compilePrompt(brief: Brief, shots: ShotRow[]): string {
  const shotLines = shots
    .map(
      (s) =>
        `镜${s.number} [${s.framing} | ${s.cameraMove} | ${s.durationSec}s] ${s.visualIntent}（声：${s.dialogueSfx}）`
    )
    .join('\n')

  return [
    '【Seedance 2.0 风格 · 空跑模板】',
    `片名：${brief.title}`,
    `受众：${brief.audience} | 调性：${brief.tone} | 时长约 ${brief.durationSec}s`,
    `视觉：${brief.visualStyle}`,
    `故事线：${brief.logline}`,
    `必现：${brief.mustHave.join('；')}`,
    '',
    '--- 分镜执行 ---',
    shotLines,
    '',
    '--- 生成约束 ---',
    '保持主体一致；运动平滑；避免文字水印；肤色自然；镜头间光线连续。',
    '若为多镜，按镜号顺序生成并在转场处保留 0.3s 呼吸。',
  ].join('\n')
}

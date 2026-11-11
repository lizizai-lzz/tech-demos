import type { TroubleshootIssue } from './types'

const TIPS: Record<TroubleshootIssue, { title: string; bullets: string[] }> = {
  blur: {
    title: '画面发糊 / 细节丢失',
    bullets: [
      '在提示词末尾加：「sharp focus, high detail, 4K texture, no motion blur on face」',
      '缩短单镜时长，减少大幅运镜；优先「固定机位 + 主体小幅度动作」',
      '检查是否同时描述过多运动（镜头推 + 主体跑 + 背景雨），拆成两镜',
    ],
  },
  shake: {
    title: '画面抖动 / 不稳定',
    bullets: [
      '将「手持」改为「稳定器平滑跟拍 / gimbal smooth」',
      '降低「fast whip pan」类描述，改用「slow dolly」',
      '排障镜单独生成 2s 稳定建立镜头，再续拍剧情镜',
    ],
  },
  off_topic: {
    title: '跑题 / 主体不一致',
    bullets: [
      '在每条分镜前重复主体外观锚点（服装、发型、场景道具）',
      '减少抽象形容词，改为可拍摄的具体动作与构图',
      '使用 JSON 导出中的 brief.mustHave 作为硬性约束复述进提示词',
    ],
  },
}

export function getTroubleshootAdvice(issue: TroubleshootIssue) {
  return TIPS[issue]
}

/** 修炼体系 + 校园黑道题材（空跑启发式） */
export function isCultivationCampus(sourceText: string): boolean {
  const cult = /修炼|灵力|境界|炼体|丹|禁灵|逼炼|堂口|黑市/.test(sourceText)
  const campus = /校园|高中|晚自习|寄宿|教学楼/.test(sourceText)
  const under = /黑道|帮派|校霸|堂口|地盘/.test(sourceText)
  return cult || (campus && under)
}

export const WEAK_TITLE_MARKERS = [
  "入局",
  "裂缝",
  "对峙",
  "余烬",
  "推进主线",
  "建立世界",
]

export const PUNCH_TITLE_MARKERS = [
  "逼炼",
  "反杀",
  "禁锢",
  "断骨",
  "夺丹",
  "血债",
  "地下",
  "堂口",
  "破境",
  "锁灵",
]

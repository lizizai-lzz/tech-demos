/** 成人高校 + 地下格斗圈黑道（范马刃牙式凡人肉体极限，非修真） */
export function isMartialCampusUnderworld(sourceText: string): boolean {
  const martial = /杀拳|半格|怪力|熟手|入门|地下拳|炼狱|禁闭|青龙|白虎|堂口|黑市/.test(
    sourceText
  )
  const campus = /校园|大学|高校|分院|大学城|夜课|寄宿|教学楼/.test(sourceText)
  const under = /黑道|帮派|地下|校霸|堂口|地盘/.test(sourceText)
  return martial || (campus && under)
}

/** @deprecated 使用 isMartialCampusUnderworld */
export const isCultivationCampus = isMartialCampusUnderworld

export const WEAK_TITLE_MARKERS = [
  "入局",
  "裂缝",
  "对峙",
  "余烬",
  "推进主线",
  "建立世界",
]

export const PUNCH_TITLE_MARKERS = [
  "炼狱",
  "反杀",
  "禁锢",
  "断骨",
  "抢场",
  "血债",
  "地下",
  "堂口",
  "杀拳",
  "禁闭",
]

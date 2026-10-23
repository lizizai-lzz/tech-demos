import type { WorldResult } from "./types"
import { isMartialCampusUnderworld } from "./genre"

const ERA_POOL = [
  "当代都市",
  "近未来",
  "千禧年校园",
  "架空东亚小城",
  "雨季沿海",
]

const TONE_POOL = [
  "克制现实主义",
  "青春热血",
  "悬疑低压",
  "黑色幽默",
  "温情治愈",
]

export function buildWorld(sourceText: string, seed = 0): WorldResult {
  const martialCampus = isMartialCampusUnderworld(sourceText)

  if (martialCampus) {
    const factions = ["青龙会", "白虎馆", "禁闭仓看守组"]
    return {
      era: "当代·地下格斗渗透的寄宿高校",
      setting:
        "大学城地下二层是旧体育馆改造的拳场与禁闭仓；青龙会、白虎馆占层划界，夜课后只有熟手以上敢走主楼梯。",
      tone: "极限肉体 · 地下黑道",
      martialSystem: "入门 → 熟手 → 杀拳 → 半格 → 怪力（人体极限，无灵气）",
      factions,
      rules: [
        "段位压制：高一段可当众折断指骨立威，但会欠地下拳场的血账。",
        "堂口规矩：抢地盘先亮会印，私斗禁用热武器与场外狙击。",
        "炼狱集训：失败者关禁闭仓加练，练不出杀拳架势就断肋骨。",
        "人体上限：怪力只是极少数人的肌肉神经异常，不是法术。",
      ],
    }
  }

  const hasSchool =
    /校园|操场|教室|放学|学生会|社团/.test(sourceText) || seed % 2 === 0
  const hasGang = /黑道|帮派|地盘|械斗|老大|校霸/.test(sourceText)

  const era = hasSchool
    ? ERA_POOL[(1 + seed) % ERA_POOL.length]
    : ERA_POOL[seed % ERA_POOL.length]

  const setting = hasGang
    ? "城郊高校城与后街灰区叠在一起，帮派与社团互抢夜场。"
    : sourceText.length > 20
      ? `故事主要发生在「${sourceText.slice(0, 12).replace(/\s/g, "")}…」所暗示的场景圈层。`
      : "一座日常与秘密交织的城市切片，角色在有限空间里做重大选择。"

  const tone = hasGang
    ? TONE_POOL[1]
    : TONE_POOL[(seed + 2) % TONE_POOL.length]

  const rules = [
    "力量有代价：每次越界都会留下可追溯的痕迹。",
    "信息不对称：旁观者知道的比主角少，读者略高于角色。",
    "情感锚点：每章至少一处具体物象（雨、灯、旧物）承载情绪。",
  ]
  if (hasGang) {
    rules.push("帮派冲突时，主角必须在公开场合站队。")
  }

  return { era, setting, tone, rules }
}

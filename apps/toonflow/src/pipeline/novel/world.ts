import type { WorldResult } from "./types"

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
  const hasSchool =
    /校园|操场|教室|放学|学生会|社团/.test(sourceText) || seed % 2 === 0
  const hasGang = /黑道|帮派|地盘|械斗|老大|校霸/.test(sourceText)

  const era = hasSchool
    ? ERA_POOL[(1 + seed) % ERA_POOL.length]
    : ERA_POOL[seed % ERA_POOL.length]

  const setting = hasGang
    ? "城郊重点高中与周边后街形成的灰色地带，校规与街头规则并行。"
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
    rules.push("校园秩序与街头义气冲突时，主角必须做公开选择。")
  }

  return { era, setting, tone, rules }
}

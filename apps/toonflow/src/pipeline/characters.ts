import type { CharacterCard } from "./types"

const ROLE_POOL = ["主角", "对手", "盟友", "旁观者", "导师"]
const LOOK_POOL = [
  "黑发",
  "短发",
  "风衣",
  "眼镜",
  "冷色调穿搭",
  "暖色围巾",
  "手持道具",
  "雨夜反光",
]

function extractNameCandidates(text: string): string[] {
  const matches = text.match(/[\u4e00-\u9fff]{2,4}/g) ?? []
  const stop = new Set([
    "还是",
    "没有",
    "如果",
    "可以",
    "我们",
    "他们",
    "一个",
    "不是",
    "今天",
    "明天",
    "剧本",
    "观众",
    "舞台",
    "霓虹",
    "雨巷",
    "旧书",
    "海上",
    "公司",
    "听众",
    "广播",
    "信号",
  ])
  const freq = new Map<string, number>()
  for (const m of matches) {
    if (stop.has(m)) continue
    freq.set(m, (freq.get(m) ?? 0) + 1)
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name)
}

export function identifyCharacters(sourceText: string, seed = 0): CharacterCard[] {
  const names = extractNameCandidates(sourceText)
  const unique: string[] = []
  for (const n of names) {
    if (!unique.includes(n)) unique.push(n)
    if (unique.length >= 4) break
  }

  while (unique.length < 2) {
    unique.push(unique.length === 0 ? "主角甲" : "主角乙")
  }

  const count = Math.min(4, Math.max(2, unique.length))
  const picked = unique.slice(0, count)

  return picked.map((name, i) => {
    const role = ROLE_POOL[(i + seed) % ROLE_POOL.length]
    const tagA = LOOK_POOL[(i + seed) % LOOK_POOL.length]
    const tagB = LOOK_POOL[(i + seed + 3) % LOOK_POOL.length]
    return {
      id: `char-${i}-${name}`,
      name,
      role,
      lookTags: [tagA, tagB],
    }
  })
}

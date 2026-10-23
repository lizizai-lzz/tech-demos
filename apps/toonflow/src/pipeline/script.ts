import type { CharacterCard, OutlineResult, SceneBeat } from "./types"

const LOCATIONS = ["雨巷", "旧书铺", "天台", "小馆角落", "霓虹街口", "钟楼广场"]

export function adaptScript(
  outline: OutlineResult,
  characters: CharacterCard[],
  sourceText: string,
  seed = 0
): SceneBeat[] {
  const lead = characters[0]?.name ?? "主角"
  const support = characters[1]?.name ?? "搭档"
  const beatCount = Math.min(5, Math.max(3, outline.bullets.length))

  const beats: SceneBeat[] = []
  for (let i = 0; i < beatCount; i++) {
    const bullet = outline.bullets[i % outline.bullets.length]
    const location = LOCATIONS[(i + seed) % LOCATIONS.length]
    const title = `第 ${i + 1} 场 · ${location}`
    const snippet = sourceText.slice(0, 24).replace(/\s/g, "")
    beats.push({
      id: `beat-${i}`,
      title,
      location,
      dialogue: [
        `${lead}：（${bullet.replace(/^事件 \d+：/, "")}）`,
        `${support}：如果镜头只给特写，观众能看见你眼里的犹豫。`,
        `旁白：【空跑台词】素材片段「${snippet}…」`,
      ],
    })
  }
  return beats
}

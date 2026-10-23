import type { CharacterCard } from "../types"
import type {
  ChapterOutlineItem,
  ChapterProseResult,
  ConsistencyFinding,
  ConsistencyReviewResult,
  WorldResult,
} from "./types"
import { flattenChapterProse, firstMatchingQuote } from "./prose-utils"
import { isCultivationCampus } from "./genre"

function beatCovered(text: string, beat: string): boolean {
  const tokens = beat
    .replace(/[「」『』，。！？、；：\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2)
  if (tokens.length === 0) return true
  const hit = tokens.filter((t) => text.includes(t)).length
  return hit >= Math.min(2, tokens.length) || text.includes(beat.slice(0, 6))
}

function checkCultivationWorld(
  text: string,
  world: WorldResult,
  findings: ConsistencyFinding[]
) {
  if (world.cultivationSystem && !text.includes(world.cultivationSystem.slice(0, 4))) {
    const kw = /境界|灵力|炼体|丹|禁灵|经脉/.test(text)
    if (!kw) {
      findings.push({
        severity: "warn",
        quote: firstMatchingQuote(text, /./),
        issue: `修炼体系「${world.cultivationSystem.slice(0, 24)}…」未在正文落地`,
        fix: "写清境界差、灵力压制或逼炼手段",
      })
    }
  }

  for (const faction of world.factions ?? []) {
    if (!text.includes(faction) && !text.includes(faction.slice(0, 2))) {
      findings.push({
        severity: "warn",
        quote: firstMatchingQuote(text, /./),
        issue: `帮派/堂口「${faction}」未在场景中出现`,
        fix: "让该势力名号出现在威胁、交易或地盘争夺中",
      })
    }
  }

  for (const rule of world.rules) {
    if (/校规|保卫科|家长|学生会公约|德育/.test(rule)) continue
    const anchor = rule.match(/境界|灵力|堂口|丹|逼炼|地盘|黑市/)?.[0]
    if (anchor && !text.includes(anchor)) {
      findings.push({
        severity: "warn",
        quote: firstMatchingQuote(text, /./),
        issue: `世界规则「${rule.slice(0, 22)}…」缺少关键词「${anchor}」`,
        fix: "用动作或对白回扣该规则，勿写成现实校规说教",
      })
    }
  }
}

export function runConsistencyReview(
  prose: ChapterProseResult,
  world: WorldResult,
  characters: CharacterCard[],
  chapter: ChapterOutlineItem,
  sourceText: string
): ConsistencyReviewResult {
  const text = flattenChapterProse(prose)
  const findings: ConsistencyFinding[] = []
  const cultCampus = isCultivationCampus(sourceText)

  for (const beat of chapter.keyBeats) {
    if (!beatCovered(text, beat)) {
      findings.push({
        severity: "warn",
        quote: firstMatchingQuote(text, /./),
        issue: `章纲节拍「${beat.slice(0, 24)}…」在正文呼应不足`,
        fix: cultCampus
          ? "用逼炼/反杀/堂口冲突点明该节拍"
          : "在对应场景增加动作或对白，点明该节拍",
      })
    }
  }

  if (cultCampus) {
    checkCultivationWorld(text, world, findings)
  } else {
    for (const rule of world.rules) {
      const keyword = rule.slice(0, 8)
      if (!text.includes(keyword) && !/代价|选择|锚点/.test(text)) {
        findings.push({
          severity: "warn",
          quote: firstMatchingQuote(text, /./),
          issue: `世界观规则「${rule.slice(0, 20)}…」未在样章显式体现`,
          fix: "用一句内心戏或物象回扣该规则",
        })
      }
    }
  }

  const missingChar = characters.filter((c) => !text.includes(c.name))
  if (missingChar.length > 0 && characters.length > 0) {
    findings.push({
      severity: missingChar.length === characters.length ? "fail" : "warn",
      quote: firstMatchingQuote(text, new RegExp(characters[0]?.name ?? ".")),
      issue: `角色卡未全部出场：${missingChar.map((c) => c.name).join("、")}`,
      fix: "让缺失角色在冲突或对白中至少露面一次",
    })
  }

  if (prose.chapterId !== chapter.id) {
    findings.push({
      severity: "fail",
      quote: prose.chapterTitle,
      issue: "样章 chapterId 与章纲首章不一致",
      fix: "对齐章纲 id 后重新生成样章",
    })
  }

  if (findings.length === 0) {
    findings.push({
      severity: "pass",
      quote: text.slice(0, 40),
      issue: cultCampus
        ? "修炼体系与帮派设定一致"
        : "未发现明显世界观或节拍冲突",
      fix: "保持当前写法，注意后续章节延续规则",
    })
  }

  const hasFail = findings.some((f) => f.severity === "fail")
  const hasWarn = findings.some((f) => f.severity === "warn")
  const summary = hasFail
    ? "存在硬性一致性问题，建议改写"
    : hasWarn
      ? "设定呼应可再加压"
      : "一致性通过"

  return { findings, summary }
}

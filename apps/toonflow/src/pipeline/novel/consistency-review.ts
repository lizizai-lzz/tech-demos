import type { CharacterCard } from "../types"
import type {
  ChapterOutlineItem,
  ChapterProseResult,
  ConsistencyFinding,
  ConsistencyReviewResult,
  WorldResult,
} from "./types"
import { flattenChapterProse, firstMatchingQuote } from "./prose-utils"
import { isMartialCampusUnderworld } from "./genre"

function beatCovered(text: string, beat: string): boolean {
  const tokens = beat
    .replace(/[「」『』，。！？、；：\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2)
  if (tokens.length === 0) return true
  const hit = tokens.filter((t) => text.includes(t)).length
  return hit >= Math.min(2, tokens.length) || text.includes(beat.slice(0, 6))
}

function checkMartialWorld(
  text: string,
  world: WorldResult,
  findings: ConsistencyFinding[]
) {
  if (world.martialSystem && !/入门|熟手|杀拳|半格|怪力|段位|拳场/.test(text)) {
    findings.push({
      severity: "warn",
      quote: firstMatchingQuote(text, /./),
      issue: `武学层级「${world.martialSystem.slice(0, 28)}…」未在正文落地`,
      fix: "写清段位差、肌肉极限或地下拳场规则（勿写成灵气法术）",
    })
  }

  if (/灵力|丹药|开脉|元婴|灵潮|修真|炼气/.test(text)) {
    findings.push({
      severity: "fail",
      quote: firstMatchingQuote(text, /灵力|丹药|开脉|元婴/),
      issue: "出现玄幻修真元素，与本设定凡人肉体极限冲突",
      fix: "改为杀拳/半格/怪力等人体标签与地下格斗描写",
    })
  }

  for (const faction of world.factions ?? []) {
    if (!text.includes(faction) && !text.includes(faction.slice(0, 2))) {
      findings.push({
        severity: "warn",
        quote: firstMatchingQuote(text, /./),
        issue: `帮派「${faction}」未在场景中出现`,
        fix: "让该势力名号出现在威胁、赌拳或地盘争夺中",
      })
    }
  }

  for (const rule of world.rules) {
    if (/校规|保卫科|家长|学生会公约|德育/.test(rule)) continue
    const anchor = rule.match(/段位|拳场|禁闭|堂口|黑市|杀拳|怪力/)?.[0]
    if (anchor && !text.includes(anchor)) {
      findings.push({
        severity: "warn",
        quote: firstMatchingQuote(text, /./),
        issue: `世界规则「${rule.slice(0, 22)}…」缺少关键词「${anchor}」`,
        fix: "用肉搏动作或地下规矩回扣，勿写成现实校规说教",
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
  const martialCampus = isMartialCampusUnderworld(sourceText)

  for (const beat of chapter.keyBeats) {
    if (!beatCovered(text, beat)) {
      findings.push({
        severity: "warn",
        quote: firstMatchingQuote(text, /./),
        issue: `章纲节拍「${beat.slice(0, 24)}…」在正文呼应不足`,
        fix: martialCampus
          ? "用禁闭/炼狱集训/反杀/堂口冲突点明该节拍"
          : "在对应场景增加动作或对白，点明该节拍",
      })
    }
  }

  if (martialCampus) {
    checkMartialWorld(text, world, findings)
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
      issue: martialCampus
        ? "武学层级与帮派设定一致（凡人极限）"
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

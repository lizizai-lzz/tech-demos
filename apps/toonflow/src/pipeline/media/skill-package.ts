import type { SkillMediaConfig } from "@/lib/media/media-settings"
import type { CharacterCard, SceneBeat, StoryboardCard } from "@/pipeline/types"

export type SkillMediaMode = "t2i" | "t2v" | "i2v"

export interface SkillMediaJobPackage {
  version: 1
  kind: "toonflow-skill-media-job"
  createdAt: string
  skillId: string
  mode: SkillMediaMode
  prompt: string
  aspectRatio: string
  shotType?: string
  beatId: string
  scene?: {
    title: string
    location: string
    dialogue: string[]
  }
  roleRefs: Array<{ id: string; name: string; role: string; lookTags: string[] }>
  frameHints: {
    placeholderColor?: string
    firstFrameNote?: string
    lastFrameNote?: string
  }
  continuityNotes: string[]
  skillRootHint?: string
  exportDirHint?: string
  agentInstruction: string
}

export interface BuildSkillPackageInput {
  mode: SkillMediaMode
  card: StoryboardCard
  beat?: SceneBeat
  characters: CharacterCard[]
  skill: SkillMediaConfig
  aspectRatio?: string
}

export function buildSkillMediaJobPackage(input: BuildSkillPackageInput): SkillMediaJobPackage {
  const { card, beat, characters, skill, mode } = input
  const aspectRatio = input.aspectRatio ?? "9:16"
  const skillId = skill.skillId.trim() || "seedance-20"
  const continuity: string[] = []
  if (beat) {
    continuity.push(`场次：${beat.location} · ${beat.title}`)
  }
  continuity.push(`镜头：${card.shotType}`)

  return {
    version: 1,
    kind: "toonflow-skill-media-job",
    createdAt: new Date().toISOString(),
    skillId,
    mode,
    prompt: card.promptText,
    aspectRatio,
    shotType: card.shotType,
    beatId: card.beatId,
    scene: beat
      ? {
          title: beat.title,
          location: beat.location,
          dialogue: beat.dialogue,
        }
      : undefined,
    roleRefs: characters.map((c) => ({
      id: c.id,
      name: c.name,
      role: c.role,
      lookTags: c.lookTags,
    })),
    frameHints: {
      placeholderColor: card.frameColor,
      firstFrameNote: "分镜首帧可参考占位色块与 prompt",
      lastFrameNote: mode === "t2v" ? "尾帧可延续下一镜开场" : undefined,
    },
    continuityNotes: continuity,
    skillRootHint: skill.skillRootHint,
    exportDirHint: skill.exportDirHint,
    agentInstruction: `用已安装的 ${skillId} 消费此任务包（勿调用付费 Seedance 云端 API，由本地 Agent Skill 出图/出片）。`,
  }
}

export function downloadSkillJobPackage(pkg: SkillMediaJobPackage, filename?: string) {
  const blob = new Blob([JSON.stringify(pkg, null, 2)], {
    type: "application/json;charset=utf-8",
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download =
    filename ??
    `toonflow-skill-${pkg.mode}-${pkg.beatId}-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

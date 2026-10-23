import { describe, expect, test } from "bun:test"
import { buildSkillMediaJobPackage } from "./skill-package"

describe("skill media job package", () => {
  test("stable shape for t2i", () => {
    const pkg = buildSkillMediaJobPackage({
      mode: "t2i",
      card: {
        beatId: "beat-1",
        shotType: "中景",
        promptText: "雨巷，重逢。",
        frameColor: "#abc",
      },
      beat: {
        id: "beat-1",
        title: "重逢",
        location: "雨巷",
        dialogue: ["你好"],
      },
      characters: [
        { id: "c1", name: "阿青", role: "女主", lookTags: ["风衣"] },
      ],
      skill: { skillId: "seedance-20", exportDirHint: "/tmp/out" },
    })

    expect(pkg.version).toBe(1)
    expect(pkg.kind).toBe("toonflow-skill-media-job")
    expect(pkg.mode).toBe("t2i")
    expect(pkg.skillId).toBe("seedance-20")
    expect(pkg.beatId).toBe("beat-1")
    expect(pkg.roleRefs).toHaveLength(1)
    expect(pkg.agentInstruction).toContain("seedance-20")
    expect(pkg.exportDirHint).toBe("/tmp/out")
    expect(JSON.parse(JSON.stringify(pkg))).toEqual(pkg)
  })
})

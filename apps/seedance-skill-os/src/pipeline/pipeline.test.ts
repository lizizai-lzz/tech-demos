import { describe, expect, test } from 'bun:test'
import { EXAMPLE_SEEDS } from './seeds'
import {
  buildInterviewQuestions,
  compileBrief,
  compileShots,
  runDirectorCompile,
  validateShotCount,
  WORKFLOW_STEPS,
} from './index'

describe('导演流水线', () => {
  test('步骤顺序包含想法到提示词', () => {
    const ids = WORKFLOW_STEPS.map((s) => s.id)
    expect(ids.indexOf('idea')).toBeLessThan(ids.indexOf('interview'))
    expect(ids.indexOf('interview')).toBeLessThan(ids.indexOf('brief'))
    expect(ids.indexOf('brief')).toBeLessThan(ids.indexOf('shots'))
    expect(ids.indexOf('shots')).toBeLessThan(ids.indexOf('prompt'))
  })

  test('澄清问答为 1–2 题', () => {
    for (const seed of EXAMPLE_SEEDS) {
      const qs = buildInterviewQuestions(seed.kind)
      expect(qs.length).toBeGreaterThanOrEqual(1)
      expect(qs.length).toBeLessThanOrEqual(2)
    }
  })

  test('每个示例种子产出 3–5 镜', () => {
    for (const seed of EXAMPLE_SEEDS) {
      const pkg = runDirectorCompile(seed.idea, {}, seed.id)
      expect(validateShotCount(pkg.shots)).toBe(true)
      expect(pkg.prompt).toContain('镜1')
    }
  })

  test('brief 与分镜镜号连续', () => {
    const brief = compileBrief(EXAMPLE_SEEDS[0].idea, 'drama', { emotion: '爆发对峙' })
    const shots = compileShots(brief, 'drama')
    expect(shots.map((s) => s.number)).toEqual([1, 2, 3, 4, 5])
  })
})

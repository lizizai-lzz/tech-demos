import { describe, expect, test } from 'bun:test'
import posesData from '@/data/poses.json'
import { buildPosePrompt } from '@/lib/prompt'
import type { Pose } from '@/types'

const sample = (posesData as Pose[])[0]

describe('buildPosePrompt', () => {
  test('包含中英双语与视角', () => {
    const view = sample.views[0]
    const text = buildPosePrompt(sample, view.angle, view.framing)
    expect(text).toContain(sample.name)
    expect(text).toContain(sample.nameEn)
    expect(text).toContain(view.angle)
    expect(text).toContain('---')
    expect(text).toContain('dry-run')
  })
})

import { describe, expect, test } from 'bun:test'
import posesData from '@/data/poses.json'
import {
  assertUniquePoseIds,
  filterPoses,
  poseMatchesAngles,
  poseMatchesQuery,
} from '@/lib/filter'
import type { Pose } from '@/types'

const poses = posesData as Pose[]

describe('poses 数据', () => {
  test('ID 唯一', () => {
    expect(() => assertUniquePoseIds(poses)).not.toThrow()
  })

  test('样例数量在 24–36 之间', () => {
    expect(poses.length).toBeGreaterThanOrEqual(24)
    expect(poses.length).toBeLessThanOrEqual(36)
  })
})

describe('filterPoses', () => {
  test('按体系筛选上半身', () => {
    const result = filterPoses(poses, {
      query: '',
      system: '上半身',
      angles: [],
    })
    expect(result.length).toBeGreaterThan(0)
    expect(result.every((p) => p.system === '上半身')).toBe(true)
  })

  test('搜索分类关键词', () => {
    const result = filterPoses(poses, {
      query: '瑜伽',
      system: 'all',
      angles: [],
    })
    expect(result.length).toBeGreaterThan(0)
    expect(result.every((p) => poseMatchesQuery(p, '瑜伽'))).toBe(true)
  })

  test('多选视角需命中任一视角', () => {
    const selected = ['正面', '俯视'] as const
    const expected = poses.filter((p) => poseMatchesAngles(p, [...selected]))
    const filtered = filterPoses(poses, {
      query: '',
      system: 'all',
      angles: [...selected],
    })
    expect(filtered.length).toBe(expected.length)
  })
})

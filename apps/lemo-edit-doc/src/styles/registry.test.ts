import { describe, expect, test } from 'bun:test'
import { EDIT_DOC_STYLES } from './registry'

describe('EDIT_DOC_STYLES 注册表', () => {
  test('包含 8 种剪辑与纪实风格', () => {
    expect(EDIT_DOC_STYLES.length).toBe(8)
  })

  test('slug 唯一且非空', () => {
    const slugs = EDIT_DOC_STYLES.map((s) => s.slug)
    const unique = new Set(slugs)
    expect(unique.size).toBe(slugs.length)
    for (const slug of slugs) {
      expect(slug.trim().length).toBeGreaterThan(0)
    }
  })
})

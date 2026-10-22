import { describe, expect, test } from 'bun:test'
import { hasPhotorealCoverage } from './photoreal-coverage'

describe('实景覆盖', () => {
  test('陆家嘴和国贸没有覆盖', () => {
    expect(hasPhotorealCoverage('shanghai-lujiazui', 121.5, 31.24)).toBe(false)
    expect(hasPhotorealCoverage('beijing-cbd', 116.46, 39.91)).toBe(false)
  })

  test('新宿、香港、纽约、巴黎有覆盖', () => {
    expect(hasPhotorealCoverage('tokyo-shinjuku', 139.7, 35.69)).toBe(true)
    expect(hasPhotorealCoverage('hongkong-central', 114.16, 22.28)).toBe(true)
    expect(hasPhotorealCoverage('nyc-midtown', -73.98, 40.75)).toBe(true)
    expect(hasPhotorealCoverage('paris-eiffel', 2.29, 48.86)).toBe(true)
  })

  test('搜索到的大陆城市没有覆盖，香港有', () => {
    expect(hasPhotorealCoverage('custom-121.5000-31.2300', 121.5, 31.23)).toBe(false)
    expect(hasPhotorealCoverage('custom-114.1600-22.2800', 114.16, 22.28)).toBe(true)
    expect(hasPhotorealCoverage('custom-139.7000-35.6900', 139.7, 35.69)).toBe(true)
  })
})

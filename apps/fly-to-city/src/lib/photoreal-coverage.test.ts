import { describe, expect, test } from 'bun:test'
import { coveragePolicy, hasPhotorealCoverage, isMainlandChina } from './photoreal-coverage'
import { LANDMARKS } from './landmarks'

describe('实景覆盖', () => {
  test('陆家嘴、国贸和海南不探测', () => {
    expect(isMainlandChina(121.5, 31.24)).toBe(true)
    expect(isMainlandChina(116.46, 39.91)).toBe(true)
    expect(isMainlandChina(110.32, 20.04)).toBe(true)
    expect(isMainlandChina(126.53, 45.8)).toBe(true)
    expect(isMainlandChina(87.62, 43.83)).toBe(true)
    expect(isMainlandChina(91.14, 29.65)).toBe(true)
    expect(isMainlandChina(113.26, 23.13)).toBe(true)
    expect(coveragePolicy(121.5, 31.24)).toBe('procedural')
  })

  test('首尔、河内、乌兰巴托不在大陆轮廓里', () => {
    expect(isMainlandChina(126.98, 37.57)).toBe(false)
    expect(isMainlandChina(105.85, 21.03)).toBe(false)
    expect(isMainlandChina(106.91, 47.92)).toBe(false)
  })

  test('香港、澳门、台湾和新宿会探测', () => {
    expect(isMainlandChina(114.16, 22.28)).toBe(false)
    expect(isMainlandChina(113.54, 22.19)).toBe(false)
    expect(isMainlandChina(121.56, 25.03)).toBe(false)
    expect(hasPhotorealCoverage('tokyo-shinjuku', 139.7, 35.69)).toBe(true)
    expect(hasPhotorealCoverage('custom-2.3000-48.8600', 2.29, 48.86)).toBe(true)
    expect(coveragePolicy(-73.98, 40.75)).toBe('probe')
  })

  test('预设里标了程序化的都在大陆，其余都不是', () => {
    for (const city of LANDMARKS) {
      expect(isMainlandChina(city.lng, city.lat)).toBe(Boolean(city.procedural))
    }
  })
})

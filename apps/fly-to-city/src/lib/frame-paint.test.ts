import { describe, expect, test } from 'bun:test'
import { frameColorSpread, frameIsFlat } from './frame-paint'

function fill(n: number, r: number, g: number, b: number) {
  const out = new Uint8Array(n * 3)
  for (let i = 0; i < n; i++) {
    out[i * 3] = r
    out[i * 3 + 1] = g
    out[i * 3 + 2] = b
  }
  return out
}

describe('实景画面是不是纯色', () => {
  test('天空灰 #E2E4E6 整片一样，算没画出来', () => {
    const grey = fill(64, 226, 228, 230)
    expect(frameColorSpread(grey)).toBe(0)
    expect(frameIsFlat(grey)).toBe(true)
  })

  test('只有几个灰阶的渐变仍然算纯色', () => {
    const soft = fill(32, 226, 228, 230)
    soft[0] = 232
    soft[1] = 233
    soft[2] = 234
    expect(frameIsFlat(soft)).toBe(true)
  })

  test('楼和地面的颜色差够大，算画出来了', () => {
    const city = fill(32, 186, 176, 160)
    for (let i = 0; i < 8; i++) {
      city[i * 3] = 42
      city[i * 3 + 1] = 48
      city[i * 3 + 2] = 52
    }
    expect(frameColorSpread(city)).toBeGreaterThan(100)
    expect(frameIsFlat(city)).toBe(false)
  })

  test('没有采样时宁可判失败', () => {
    expect(frameIsFlat(new Uint8Array(0))).toBe(true)
    expect(frameIsFlat([226, 228, 230])).toBe(true)
  })
})

/** 采样区域里通道跨度低于这个值，就当成没画进建筑。天空雾经过色调映射后几乎是纯色。 */
export const FLAT_FRAME_SPREAD = 12

/** 返回 RGB 采样里单个通道的最大跨度。采样应该来自建筑所在的画面中下部，不要带上 HTML 标题。 */
export function frameColorSpread(rgb: ArrayLike<number>) {
  const count = Math.floor(rgb.length / 3)
  if (count < 4) return 0
  let minR = 255
  let minG = 255
  let minB = 255
  let maxR = 0
  let maxG = 0
  let maxB = 0
  for (let i = 0; i < count; i++) {
    const r = rgb[i * 3] ?? 0
    const g = rgb[i * 3 + 1] ?? 0
    const b = rgb[i * 3 + 2] ?? 0
    if (r < minR) minR = r
    if (g < minG) minG = g
    if (b < minB) minB = b
    if (r > maxR) maxR = r
    if (g > maxG) maxG = g
    if (b > maxB) maxB = b
  }
  return Math.max(maxR - minR, maxG - minG, maxB - minB)
}

/** 一片纯色（包括 #E2E4E6 那种天空灰）返回 true。瓦片列表非空不能代替这个判断。 */
export function frameIsFlat(rgb: ArrayLike<number>) {
  return frameColorSpread(rgb) < FLAT_FRAME_SPREAD
}

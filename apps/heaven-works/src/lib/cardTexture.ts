import * as THREE from 'three'

const cache = new Map<string, THREE.CanvasTexture>()

export function createStageCardTexture(
  labelZh: string,
  labelEn: string,
  ok: boolean,
  progress: number,
): THREE.CanvasTexture {
  const key = `${labelZh}|${ok}|${progress}`
  const hit = cache.get(key)
  if (hit) return hit

  const canvas = document.createElement('canvas')
  canvas.width = 320
  canvas.height = 160
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#0a1018'
  ctx.fillRect(0, 0, 320, 160)
  ctx.strokeStyle = '#64748b'
  ctx.lineWidth = 2
  ctx.strokeRect(6, 6, 308, 148)

  ctx.fillStyle = '#f1f5f9'
  ctx.font = '600 26px "Noto Sans SC", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(labelZh, 160, 52)

  ctx.fillStyle = '#94a3b8'
  ctx.font = '500 16px ui-monospace, monospace'
  ctx.fillText(labelEn, 160, 82)

  if (ok) {
    ctx.fillStyle = '#22c55e'
    ctx.font = '700 22px sans-serif'
    ctx.fillText('OK ✓', 160, 125)
  } else {
    ctx.fillStyle = '#eab308'
    ctx.font = '600 20px monospace'
    ctx.fillText(`${Math.round(progress)}%`, 160, 125)
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter
  cache.set(key, tex)
  return tex
}

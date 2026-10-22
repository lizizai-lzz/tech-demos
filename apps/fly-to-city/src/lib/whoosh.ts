/** 呼啸声用 WebAudio 现场合成，没有采样文件。渲染模式不调用。 */

let ctx: AudioContext | null = null
let lastPlayed = -10

export function primeWhoosh() {
  if (typeof window === 'undefined') return
  const AC = window.AudioContext
  if (!AC) return
  ctx = ctx ?? new AC()
  void ctx.resume()
}

export function playWhoosh() {
  if (!ctx) return
  void ctx.resume()
  const t = ctx.currentTime
  if (t - lastPlayed < 0.45) return
  lastPlayed = t
  const dur = 1.45
  const rate = ctx.sampleRate
  const len = Math.floor(rate * dur)
  const buf = ctx.createBuffer(1, len, rate)
  const data = buf.getChannelData(0)
  let b0 = 0
  let b1 = 0
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1
    b0 = 0.97 * b0 + white * 0.08
    b1 = 0.8 * b1 + white * 0.25
    const u = i / len
    const env = Math.sin(Math.min(1, u) * Math.PI) ** 0.55
    data[i] = (b0 * 0.65 + b1 * 0.35) * env
  }
  const noise = ctx.createBufferSource()
  noise.buffer = buf
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(2200, t)
  filter.frequency.exponentialRampToValueAtTime(240, t + dur)
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(0.42, t + 0.1)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  noise.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)
  noise.start(t)
  noise.stop(t + dur + 0.02)

  const osc = ctx.createOscillator()
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(380, t)
  osc.frequency.exponentialRampToValueAtTime(70, t + dur)
  const og = ctx.createGain()
  og.gain.setValueAtTime(0.0001, t)
  og.gain.exponentialRampToValueAtTime(0.07, t + 0.08)
  og.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.9)
  osc.connect(og)
  og.connect(ctx.destination)
  osc.start(t)
  osc.stop(t + dur)
}

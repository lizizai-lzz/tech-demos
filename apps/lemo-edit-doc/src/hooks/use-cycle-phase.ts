import { useEffect, useState } from 'react'

/** 返回 0–1 循环相位，默认 10 秒一圈 */
export function useCyclePhase(durationMs = 10_000): number {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    let frame = 0
    const start = performance.now()
    const tick = () => {
      const elapsed = performance.now() - start
      setPhase((elapsed % durationMs) / durationMs)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [durationMs])

  return phase
}

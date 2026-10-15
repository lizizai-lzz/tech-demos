import { useEffect, useRef, useState } from 'react'

/** 参数变化后防抖触发 replayKey 递增 */
export function useDebouncedReplay(deps: unknown[], delayMs = 150): [number, () => void] {
  const [replayKey, setReplayKey] = useState(0)
  const isFirst = useRef(true)

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false
      return
    }
    const t = window.setTimeout(() => setReplayKey((k) => k + 1), delayMs)
    return () => window.clearTimeout(t)
  }, deps)

  const replay = () => setReplayKey((k) => k + 1)

  return [replayKey, replay]
}

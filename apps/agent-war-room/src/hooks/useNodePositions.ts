import { useCallback, useEffect, useState, type RefObject } from 'react'

export type Point = { x: number; y: number }

export type NodePositions = Record<string, Point>

export function useNodePositions(rootRef: RefObject<HTMLElement | null>) {
  const [positions, setPositions] = useState<NodePositions>({})

  const measure = useCallback(() => {
    const root = rootRef.current
    if (!root) return
    const rootRect = root.getBoundingClientRect()
    const nodes = root.querySelectorAll<HTMLElement>('[data-mesh-node]')
    const next: NodePositions = {}
    nodes.forEach((el) => {
      const id = el.dataset.meshNode
      if (!id) return
      const r = el.getBoundingClientRect()
      const side = el.dataset.meshSide ?? 'center'
      let x = r.left + r.width / 2 - rootRect.left
      const y = r.top + r.height / 2 - rootRect.top
      if (side === 'right') x = r.right - rootRect.left
      if (side === 'left') x = r.left - rootRect.left
      next[id] = { x, y }
    })
    setPositions(next)
  }, [rootRef])

  useEffect(() => {
    measure()
    const root = rootRef.current
    if (!root) return
    const ro = new ResizeObserver(() => measure())
    ro.observe(root)
    window.addEventListener('resize', measure)
    const id = window.setInterval(measure, 800)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
      window.clearInterval(id)
    }
  }, [measure, rootRef])

  return { positions, remeasure: measure }
}

export function buildCurvePath(from: Point, to: Point) {
  const dx = to.x - from.x
  const cx1 = from.x + dx * 0.35
  const cx2 = from.x + dx * 0.65
  return `M ${from.x} ${from.y} C ${cx1} ${from.y}, ${cx2} ${to.y}, ${to.x} ${to.y}`
}

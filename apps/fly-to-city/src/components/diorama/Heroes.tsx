import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { createHeroGroup } from '@/lib/heroes'
import type { CityData } from '@/lib/types'

export function Heroes({ data }: { data: CityData }) {
  const ref = useRef<THREE.Group>(null)
  const group = useMemo(
    () => createHeroGroup(data.id, data.center.lng, data.center.lat),
    [data],
  )

  useLayoutEffect(() => {
    const g = ref.current
    if (!g) return
    g.clear()
    g.add(group)
  }, [group])

  return <group ref={ref} />
}

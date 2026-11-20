import { useMemo, useState } from 'react'
import posesData from '@/data/poses.json'
import { filterPoses, type PoseFilters } from '@/lib/filter'
import type { Pose, PoseAngle, PoseSystem } from '@/types'

const ALL_POSES = posesData as Pose[]

export function usePoseFilters() {
  const [query, setQuery] = useState('')
  const [system, setSystem] = useState<PoseSystem | 'all'>('all')
  const [angles, setAngles] = useState<PoseAngle[]>([])

  const filters: PoseFilters = useMemo(
    () => ({ query, system, angles }),
    [query, system, angles],
  )

  const filtered = useMemo(
    () => filterPoses(ALL_POSES, filters),
    [filters],
  )

  function toggleAngle(angle: PoseAngle) {
    setAngles((prev) =>
      prev.includes(angle) ? prev.filter((a) => a !== angle) : [...prev, angle],
    )
  }

  function resetFilters() {
    setQuery('')
    setSystem('all')
    setAngles([])
  }

  return {
    allPoses: ALL_POSES,
    filtered,
    query,
    setQuery,
    system,
    setSystem,
    angles,
    toggleAngle,
    resetFilters,
  }
}

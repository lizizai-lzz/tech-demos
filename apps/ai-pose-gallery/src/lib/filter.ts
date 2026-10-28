import type { Pose, PoseAngle, PoseSystem } from '@/types'

export type PoseFilters = {
  query: string
  system: PoseSystem | 'all'
  angles: PoseAngle[]
}

export function poseMatchesQuery(pose: Pose, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const haystack = [
    pose.name,
    pose.nameEn,
    pose.category,
    pose.id,
    ...pose.tags,
  ]
    .join(' ')
    .toLowerCase()
  return haystack.includes(q)
}

export function poseMatchesAngles(pose: Pose, angles: PoseAngle[]): boolean {
  if (angles.length === 0) return true
  return pose.views.some((v) => angles.includes(v.angle))
}

export function filterPoses(poses: Pose[], filters: PoseFilters): Pose[] {
  return poses.filter((pose) => {
    if (filters.system !== 'all' && pose.system !== filters.system) return false
    if (!poseMatchesQuery(pose, filters.query)) return false
    if (!poseMatchesAngles(pose, filters.angles)) return false
    return true
  })
}

export function assertUniquePoseIds(poses: Pose[]): void {
  const seen = new Set<string>()
  for (const pose of poses) {
    if (seen.has(pose.id)) {
      throw new Error(`重复的姿势 ID: ${pose.id}`)
    }
    seen.add(pose.id)
  }
}

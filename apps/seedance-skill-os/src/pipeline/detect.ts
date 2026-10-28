import type { SeedKind } from './types'
import { EXAMPLE_SEEDS } from './seeds'

export function detectSeedKind(idea: string, exampleId?: string | null): SeedKind {
  if (exampleId) {
    const hit = EXAMPLE_SEEDS.find((s) => s.id === exampleId)
    if (hit) return hit.kind
  }
  if (/开箱|产品|耳机|种草|竖屏/.test(idea)) return 'unbox'
  if (/b-roll|夜景|霓虹|光轨|氛围|航拍/.test(idea)) return 'broll'
  if (/对白|短剧|摊牌|反转|剧情/.test(idea)) return 'drama'
  return 'generic'
}

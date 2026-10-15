import { mergeParams } from '@/lib/motion-params'
import type { DictionaryEntry, MotionParams } from '@/types'

export function initialParamsMap(entries: DictionaryEntry[]): Record<string, MotionParams> {
  return Object.fromEntries(entries.map((e) => [e.id, mergeParams(e.defaultParams)]))
}

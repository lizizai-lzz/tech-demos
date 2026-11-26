export interface WarmupState {
  usedIndices: number[]
}

export function createWarmupState(): WarmupState {
  return { usedIndices: [] }
}

/** 从话题池选取下一条暖场，已用过的不会重复，直到池子耗尽后重置 */
export function pickWarmupTopic(
  topics: string[],
  state: WarmupState
): { topic: string; nextState: WarmupState } | null {
  if (topics.length === 0) return null

  const used = new Set(state.usedIndices)
  const available = topics
    .map((t, i) => ({ t, i }))
    .filter(({ i }) => !used.has(i))

  if (available.length === 0) {
    const first = topics[0]
    return {
      topic: first,
      nextState: { usedIndices: [0] },
    }
  }

  const pick = available[Math.floor(Math.random() * available.length)]
  return {
    topic: pick.t,
    nextState: {
      usedIndices: [...state.usedIndices, pick.i],
    },
  }
}

export function allTopicsUsed(topics: string[], state: WarmupState): boolean {
  return state.usedIndices.length >= topics.length && topics.length > 0
}

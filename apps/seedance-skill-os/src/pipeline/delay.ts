export async function fakeAgentDelay(ms = 720, enabled = true): Promise<void> {
  if (!enabled) return
  await new Promise((resolve) => setTimeout(resolve, ms))
}

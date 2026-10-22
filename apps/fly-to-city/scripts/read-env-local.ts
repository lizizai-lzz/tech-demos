import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

/** 读取应用目录下的 .env.local。调用方不要打印返回值。 */
export function readEnvLocal(appDir: string) {
  const file = path.join(appDir, '.env.local')
  const out: Record<string, string> = {}
  if (!existsSync(file)) return out
  const text = readFileSync(file, 'utf8')
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    out[key] = value
  }
  return out
}

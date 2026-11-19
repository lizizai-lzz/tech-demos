export { cn } from "cn"

export function formatCompact(n: number): string {
  if (n >= 100_000) return `${(n / 10_000).toFixed(1)}万`
  if (n >= 10_000) return `${(n / 10_000).toFixed(2)}万`
  return n.toLocaleString("zh-CN")
}

export function formatSigned(n: number): string {
  const prefix = n > 0 ? "+" : ""
  return `${prefix}${formatCompact(n)}`
}
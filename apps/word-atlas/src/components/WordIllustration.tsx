import type { Word } from '@/types'
import { topicMeta } from '@/lib/topics'

function hash(n: string): number {
  let h = 0
  for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0
  return h
}

type Props = {
  word: Word
  className?: string
}

/** 几何 SVG 占位插画，按话题配色，非上游素材 */
export function WordIllustration({ word, className }: Props) {
  const meta = topicMeta(word.topic)
  const h = hash(word.id)
  const variant = h % 4
  const r1 = 28 + (h % 20)
  const r2 = 18 + ((h >> 3) % 16)

  return (
    <svg
      viewBox="0 0 200 160"
      className={className}
      role="img"
      aria-label={`${word.lemma} 插画占位`}
    >
      <defs>
        <linearGradient id={`g-${word.id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={meta.color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={meta.accent} stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <rect width="200" height="160" rx="16" fill={`url(#g-${word.id})`} />
      {variant === 0 && (
        <>
          <circle cx="100" cy="80" r={r1} fill="none" stroke={meta.color} strokeWidth="3" opacity="0.85" />
          <circle cx="100" cy="80" r={r2} fill={meta.accent} opacity="0.35" />
        </>
      )}
      {variant === 1 && (
        <polygon
          points="100,30 160,130 40,130"
          fill="none"
          stroke={meta.color}
          strokeWidth="3"
          opacity="0.8"
        />
      )}
      {variant === 2 && (
        <>
          <rect x="55" y="45" width="90" height="70" rx="8" fill="none" stroke={meta.color} strokeWidth="3" />
          <line x1="55" y1="80" x2="145" y2="80" stroke={meta.accent} strokeWidth="2" opacity="0.7" />
        </>
      )}
      {variant === 3 && (
        <>
          <ellipse cx="100" cy="85" rx="55" ry="35" fill="none" stroke={meta.color} strokeWidth="3" />
          <circle cx="70" cy="70" r="8" fill={meta.accent} opacity="0.6" />
          <circle cx="130" cy="95" r="5" fill={meta.color} opacity="0.5" />
        </>
      )}
    </svg>
  )
}

interface EpisodeCoverProps {
  title: string
  seed: number
  className?: string
}

function hue(seed: number) {
  return (seed * 47) % 360
}

export function EpisodeCover({ title, seed, className }: EpisodeCoverProps) {
  const h = hue(seed)
  const h2 = (h + 40) % 360
  return (
    <svg
      viewBox="0 0 320 180"
      className={className}
      role="img"
      aria-label={`${title} 封面`}
    >
      <defs>
        <linearGradient id={`g-${seed}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={`hsl(${h} 45% 78%)`} />
          <stop offset="100%" stopColor={`hsl(${h2} 50% 62%)`} />
        </linearGradient>
      </defs>
      <rect width="320" height="180" rx="12" fill={`url(#g-${seed})`} />
      <circle cx="52" cy="48" r="22" fill={`hsl(${h2} 60% 95% / 0.55)`} />
      <rect x="24" y="118" width="180" height="10" rx="4" fill="white" fillOpacity="0.35" />
      <rect x="24" y="136" width="120" height="8" rx="4" fill="white" fillOpacity="0.25" />
      <text
        x="24"
        y="98"
        fill={`hsl(${h} 35% 22%)`}
        fontSize="14"
        fontFamily="system-ui, sans-serif"
        fontWeight="600"
      >
        {title.slice(0, 14)}
        {title.length > 14 ? "…" : ""}
      </text>
    </svg>
  )
}
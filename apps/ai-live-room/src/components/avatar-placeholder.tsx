import { cn } from '@/lib/utils'

interface AvatarPlaceholderProps {
  outfitColor: string
  mode: string
  actionName?: string
  personaName: string
}

export function AvatarPlaceholder({
  outfitColor,
  mode,
  actionName,
  personaName,
}: AvatarPlaceholderProps) {
  const actionClass =
    actionName === '比心'
      ? 'action-heart'
      : actionName === '挥手'
        ? 'action-wave'
        : actionName === '眨眼'
          ? 'action-blink'
          : ''

  return (
    <div
      className={cn(
        'relative flex h-full w-full items-center justify-center',
        actionClass
      )}
    >
      <svg
        viewBox="0 0 200 240"
        className="h-[78%] w-auto drop-shadow-lg"
        aria-label={`${personaName} 占位形象`}
      >
        <defs>
          <linearGradient id="hair" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4c1d95" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
        <ellipse cx="100" cy="78" rx="52" ry="58" fill="url(#hair)" />
        <ellipse cx="100" cy="88" rx="42" ry="46" fill="#fde4d0" />
        <g className="avatar-eyes">
          <ellipse cx="84" cy="92" rx="6" ry="8" fill="#1f2937" />
          <ellipse cx="116" cy="92" rx="6" ry="8" fill="#1f2937" />
        </g>
        <path
          d="M88 108 Q100 118 112 108"
          fill="none"
          stroke="#e11d48"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M55 150 Q100 130 145 150 L135 220 Q100 235 65 220 Z"
          fill={outfitColor}
          opacity={mode === 'outfit-changing' ? 0.45 : 1}
        />
        <rect
          x="70"
          y="155"
          width="60"
          height="8"
          rx="4"
          fill="white"
          opacity="0.35"
        />
        {actionName === '比心' && (
          <text x="100" y="50" textAnchor="middle" fontSize="28" fill="#fb7185">
            ♥
          </text>
        )}
        {actionName === '挥手' && (
          <text x="155" y="120" fontSize="22">👋</text>
        )}
      </svg>
      {mode === 'outfit-changing' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm font-medium text-white backdrop-blur-[2px]">
          换装中…
        </div>
      )}
    </div>
  )
}

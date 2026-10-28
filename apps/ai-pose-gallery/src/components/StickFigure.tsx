import type { PoseAngle, PoseSystem } from '@/types'
import { cn } from '@/lib/utils'

type StickFigureProps = {
  angle: PoseAngle
  system: PoseSystem
  variant: number
  className?: string
  compact?: boolean
}

/** SVG 火柴人占位：不同视角与变体略有差异 */
export function StickFigure({
  angle,
  system,
  variant,
  className,
  compact,
}: StickFigureProps) {
  const isUpper = system === '上半身'
  const skew = angle === '斜侧' ? 8 : angle === '侧面' ? 14 : 0
  const scaleY = angle === '俯视' ? 0.88 : angle === '仰视' ? 1.08 : 1
  const armLift = (variant % 3) * 12
  const legSpread = variant % 2 === 0 ? 0 : 6
  const headRx = compact ? 7 : 9

  return (
    <svg
      viewBox="0 0 120 160"
      className={cn('h-full w-full text-foreground/80', className)}
      role="img"
      aria-label={`姿势示意 ${angle}`}
    >
      <rect
        width="120"
        height="160"
        className="fill-muted/40"
        rx="8"
      />
      <g
        transform={`translate(60 78) scale(1 ${scaleY}) skewX(${skew})`}
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      >
        <circle cx="0" cy={isUpper ? 28 : -42} r={headRx} />
        <line x1="0" y1={isUpper ? 37 : -33} x2="0" y2={isUpper ? 55 : 10} />
        {!isUpper && (
          <>
            <line x1="0" y1="10" x2={-14 - legSpread} y2="55" />
            <line x1="0" y1="10" x2={14 + legSpread} y2="55" />
            <line x1={-14 - legSpread} y1="55" x2={-18 - legSpread} y2="85" />
            <line x1={14 + legSpread} y1="55" x2={18 + legSpread} y2="85" />
          </>
        )}
        <line
          x1="0"
          y1={isUpper ? 45 : -5}
          x2={-22 - (variant % 2) * 4}
          y2={-8 - armLift}
        />
        <line
          x1="0"
          y1={isUpper ? 45 : -5}
          x2={22 + (variant % 2) * 4}
          y2={-5 - armLift * 0.6}
        />
        {variant % 4 === 0 && !isUpper && (
          <line x1="0" y1="10" x2="0" y2="30" strokeDasharray="4 4" opacity="0.35" />
        )}
      </g>
      <text
        x="8"
        y="150"
        className="fill-muted-foreground text-[9px] font-medium"
      >
        {angle}
      </text>
    </svg>
  )
}

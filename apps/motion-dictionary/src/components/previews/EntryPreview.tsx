import {
  AnimatePresence,
  motion,
  useScroll,
  useTransform,
} from 'motion/react'
import type React from 'react'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { easingOnly, tweenTransition } from '@/lib/transitions'
import { seconds } from '@/lib/motion-params'
import type { MotionParams, PreviewKind } from '@/types'

type EntryPreviewProps = {
  kind: PreviewKind
  params: MotionParams
  replayKey: number
  compact?: boolean
}

export function EntryPreview({ kind, params, replayKey, compact }: EntryPreviewProps) {
  const wrap = (node: React.ReactNode) => (
    <div className={compact ? 'scale-[0.82] origin-center' : undefined}>{node}</div>
  )

  switch (kind) {
    case 'fade-in':
      return wrap(<FadeInPreview params={params} replayKey={replayKey} />)
    case 'easing':
      return wrap(<EasingPreview params={params} replayKey={replayKey} />)
    case 'spring':
      return wrap(<SpringPreview params={params} replayKey={replayKey} />)
    case 'scale':
      return wrap(<ScalePreview params={params} replayKey={replayKey} />)
    case 'slide-in':
      return wrap(<SlideInPreview params={params} replayKey={replayKey} />)
    case 'stagger':
      return wrap(<StaggerPreview params={params} replayKey={replayKey} />)
    case 'parallax':
      return wrap(<ParallaxPreview params={params} replayKey={replayKey} />)
    case 'scroll-triggered':
      return wrap(<ScrollTriggeredPreview params={params} replayKey={replayKey} />)
    case 'hover':
      return wrap(<HoverPreview params={params} />)
    case 'micro-interaction':
      return wrap(<MicroInteractionPreview params={params} />)
    case 'skeleton':
      return wrap(<SkeletonPreview params={params} replayKey={replayKey} />)
    case 'page-transition':
      return wrap(<PageTransitionPreview params={params} />)
    default:
      return null
  }
}

function FadeInPreview({ params, replayKey }: { params: MotionParams; replayKey: number }) {
  return (
    <motion.div
      key={replayKey}
      className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={tweenTransition(params)}
    >
      淡入内容
    </motion.div>
  )
}

function EasingPreview({ params, replayKey }: { params: MotionParams; replayKey: number }) {
  return (
    <div className="relative h-16 w-full max-w-xs">
      <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded bg-border" />
      <motion.div
        key={replayKey}
        className="absolute top-1/2 size-8 -translate-y-1/2 rounded-full bg-primary shadow-md"
        initial={{ left: '0%' }}
        animate={{ left: 'calc(100% - 2rem)' }}
        transition={tweenTransition(params)}
      />
    </div>
  )
}

function SpringPreview({ params, replayKey }: { params: MotionParams; replayKey: number }) {
  return (
    <motion.div
      key={replayKey}
      className="size-16 rounded-2xl bg-primary shadow-lg"
      initial={{ scale: 0.2, rotate: -12 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{
        type: 'spring',
        stiffness: params.stiffness,
        damping: params.damping,
        delay: seconds(params.delay),
      }}
    />
  )
}

function ScalePreview({ params, replayKey }: { params: MotionParams; replayKey: number }) {
  return (
    <motion.div
      key={replayKey}
      className="flex size-20 items-center justify-center rounded-xl border-2 border-primary/30 bg-card text-xs font-medium"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={tweenTransition(params)}
    >
      缩放
    </motion.div>
  )
}

function SlideInPreview({ params, replayKey }: { params: MotionParams; replayKey: number }) {
  return (
    <motion.div
      key={replayKey}
      className="w-48 rounded-lg bg-primary px-4 py-2 text-center text-sm text-primary-foreground"
      initial={{ x: 80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={tweenTransition(params)}
    >
      从右侧滑入
    </motion.div>
  )
}

function StaggerPreview({ params, replayKey }: { params: MotionParams; replayKey: number }) {
  const items = [0, 1, 2, 3, 4]
  return (
    <motion.ul
      key={replayKey}
      className="flex gap-2"
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: seconds(params.delay > 0 ? params.delay : 80),
          },
        },
      }}
    >
      {items.map((i) => (
        <motion.li
          key={i}
          className="size-8 rounded-md bg-primary"
          variants={{
            hidden: { opacity: 0, y: 12 },
            visible: {
              opacity: 1,
              y: 0,
              transition: tweenTransition({ ...params, delay: 0 }),
            },
          }}
        />
      ))}
    </motion.ul>
  )
}

function ParallaxPreview({ params: _params, replayKey }: { params: MotionParams; replayKey: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    container: ref,
  })
  const backY = useTransform(scrollYProgress, [0, 1], ['0%', '-35%'])
  const frontY = useTransform(scrollYProgress, [0, 1], ['0%', '-70%'])

  return (
    <div
      key={replayKey}
      ref={ref}
      className="h-full w-full max-w-xs overflow-y-auto rounded-md border bg-background text-left"
    >
      <div className="relative h-[280px]">
        <motion.div
          style={{ y: backY }}
          className="absolute inset-x-4 top-4 h-24 rounded-lg bg-primary/25"
        />
        <motion.div
          style={{ y: frontY }}
          className="absolute inset-x-8 top-16 h-20 rounded-lg bg-primary shadow-md"
        />
        <p className="absolute bottom-2 left-2 right-2 text-center text-[10px] text-muted-foreground">
          在区域内上下滚动查看视差
        </p>
      </div>
    </div>
  )
}

function ScrollTriggeredPreview({
  params,
  replayKey,
}: {
  params: MotionParams
  replayKey: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  return (
    <div
      key={replayKey}
      ref={ref}
      className="h-full w-full max-w-xs overflow-y-auto rounded-md border bg-background"
    >
      <div className="h-24 shrink-0" />
      <motion.div
        className="mx-4 mb-4 rounded-lg bg-primary px-3 py-6 text-center text-sm text-primary-foreground"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ root: ref, once: false, amount: 0.6 }}
        transition={tweenTransition(params)}
      >
        滚到此处触发动画
      </motion.div>
      <div className="h-24 shrink-0" />
    </div>
  )
}

function HoverPreview({ params }: { params: MotionParams }) {
  return (
    <motion.div
      className="cursor-pointer rounded-xl border bg-card px-6 py-4 text-sm shadow-sm"
      whileHover={{ y: -6, boxShadow: '0 12px 24px rgba(0,0,0,0.12)' }}
      transition={tweenTransition({ ...params, delay: 0 })}
    >
      悬停我 Hover me
    </motion.div>
  )
}

function MicroInteractionPreview({ params }: { params: MotionParams }) {
  return (
    <motion.button
      type="button"
      className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
      whileTap={{ scale: 0.92 }}
      transition={{
        type: 'spring',
        stiffness: params.stiffness,
        damping: params.damping,
      }}
    >
      点按反馈
    </motion.button>
  )
}

function SkeletonPreview({ params, replayKey }: { params: MotionParams; replayKey: number }) {
  return (
    <div key={replayKey} className="w-48 space-y-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="h-3 rounded-full bg-muted-foreground/25"
          style={{ width: `${100 - i * 15}%` }}
          animate={{ opacity: [0.35, 0.85, 0.35] }}
          transition={{
            duration: seconds(params.duration),
            ease: easingOnly(params),
            repeat: Infinity,
            delay: i * 0.12,
          }}
        />
      ))}
    </div>
  )
}

function PageTransitionPreview({ params }: { params: MotionParams }) {
  const [page, setPage] = useState(0)

  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-3">
      <div className="relative h-24 w-full overflow-hidden rounded-lg border bg-card">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={page}
            className="absolute inset-0 flex items-center justify-center text-sm font-medium"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={tweenTransition(params)}
          >
            页面 {page + 1}
          </motion.div>
        </AnimatePresence>
      </div>
      <Button type="button" size="sm" variant="outline" onClick={() => setPage((p) => (p + 1) % 2)}>
        切换页面
      </Button>
    </div>
  )
}

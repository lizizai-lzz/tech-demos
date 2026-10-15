import { motion } from 'motion/react'
import { Badge } from '@/components/ui/badge'
import { PreviewStage } from '@/components/previews/PreviewStage'
import type { DictionaryEntry, MotionParams } from '@/types'

type GalleryCardProps = {
  entry: DictionaryEntry
  params: MotionParams
  reduceMotion: boolean
  gallerySuspended: boolean
  onOpen: () => void
}

export function GalleryCard({
  entry,
  params,
  reduceMotion,
  gallerySuspended,
  onOpen,
}: GalleryCardProps) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: reduceMotion ? 0 : 0.2 }}
      className="list-none"
    >
      <button
        type="button"
        onClick={onOpen}
        className="group flex h-full w-full flex-col gap-3 rounded-2xl border border-border/70 bg-card p-4 text-left shadow-sm transition-shadow hover:border-border hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium leading-snug">
              {entry.termZh}
              <span className="text-muted-foreground font-normal"> / {entry.termEn}</span>
            </p>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{entry.description}</p>
          </div>
          <Badge variant="secondary" className="shrink-0 text-[10px]">
            {entry.category}
          </Badge>
        </div>
        <PreviewStage
          entryId={entry.id}
          kind={entry.preview}
          params={params}
          replayKey={0}
          size="sm"
          galleryMode
          gallerySuspended={gallerySuspended}
          reduceMotion={reduceMotion}
          showReplay={false}
        />
        <span className="text-[11px] text-muted-foreground group-hover:text-foreground">
          点击查看详情与参数
        </span>
      </button>
    </motion.li>
  )
}

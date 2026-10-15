import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { useDebouncedReplay } from '@/hooks/use-debounced-replay'
import { cn } from '@/lib/utils'
import type { DictionaryEntry, MotionParams } from '@/types'
import { ParamControls } from './ParamControls'
import { PromptSnippet } from './PromptSnippet'
import { PreviewStage } from './previews/PreviewStage'

type EntryDetailSheetProps = {
  entry: DictionaryEntry | null
  params: MotionParams
  onParamsChange: (next: MotionParams) => void
  onClose: () => void
  reduceMotion: boolean
}

export function EntryDetailSheet({
  entry,
  params,
  onParamsChange,
  onClose,
  reduceMotion,
}: EntryDetailSheetProps) {
  const open = entry !== null
  const [replayKey, manualReplay] = useDebouncedReplay(
    entry ? [params, entry.id] : [],
    220,
  )

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        overlayClassName="bg-foreground/8 backdrop-blur-[2px] dark:bg-black/20"
        className={cn(
          'flex w-full flex-col gap-0 overflow-y-auto border-border/50 bg-popover p-0 shadow-xl',
          'sm:max-w-[560px]',
          'max-md:!inset-y-auto max-md:!top-[5%] max-md:!right-auto max-md:!left-1/2 max-md:!h-auto',
          'max-md:max-h-[min(88vh,760px)] max-md:w-[calc(100%-1.5rem)] max-md:max-w-[540px] max-md:-translate-x-1/2',
          'max-md:rounded-2xl max-md:border max-md:data-ending-style:translate-x-[-50%] max-md:data-starting-style:translate-x-[-50%]',
        )}
      >
        {entry && (
          <div className="space-y-10 px-6 py-8 sm:space-y-12 sm:px-9 sm:py-10">
            <SheetHeader className="space-y-3 p-0 text-left">
              <div className="flex flex-wrap items-center gap-2">
                <SheetTitle className="text-2xl font-semibold tracking-tight">
                  {entry.termZh}{' '}
                  <span className="text-muted-foreground text-lg font-normal">
                    / {entry.termEn}
                  </span>
                </SheetTitle>
                <Badge variant="secondary">{entry.category}</Badge>
              </div>
              <SheetDescription className="text-base leading-relaxed">
                {entry.description}
              </SheetDescription>
            </SheetHeader>

            <PreviewStage
              entryId={entry.id}
              kind={entry.preview}
              params={params}
              replayKey={replayKey}
              reduceMotion={reduceMotion}
              onManualReplay={manualReplay}
            />

            <section className="space-y-5">
              <h3 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
                参数调节
              </h3>
              <ParamControls controls={entry.controls} params={params} onChange={onParamsChange} />
            </section>

            <section className="pt-2">
              <PromptSnippet entry={entry} params={params} />
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

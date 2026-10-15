import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { useDebouncedReplay } from '@/hooks/use-debounced-replay'
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
    150,
  )

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        {entry && (
          <div className="space-y-8 pb-8">
            <SheetHeader className="text-left">
              <div className="flex flex-wrap items-center gap-2">
                <SheetTitle className="text-xl">
                  {entry.termZh}{' '}
                  <span className="text-muted-foreground font-normal">/ {entry.termEn}</span>
                </SheetTitle>
                <Badge variant="secondary">{entry.category}</Badge>
              </div>
              <SheetDescription className="text-sm leading-relaxed">
                {entry.description}
              </SheetDescription>
            </SheetHeader>

            <PreviewStage
              entryId={entry.id}
              kind={entry.preview}
              params={params}
              replayKey={replayKey}
              layoutId={`preview-${entry.id}`}
              reduceMotion={reduceMotion}
              onManualReplay={manualReplay}
            />

            <div className="space-y-3">
              <h3 className="text-sm font-medium">参数调节</h3>
              <ParamControls controls={entry.controls} params={params} onChange={onParamsChange} />
            </div>

            <PromptSnippet entry={entry} params={params} />
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

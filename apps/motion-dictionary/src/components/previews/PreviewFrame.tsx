import { RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { MotionParams } from '@/types'
import { EntryPreview } from './EntryPreview'

type PreviewFrameProps = {
  kind: import('@/types').PreviewKind
  params: MotionParams
}

export function PreviewFrame({ kind, params }: PreviewFrameProps) {
  const [replayKey, setReplayKey] = useState(0)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">实时预览</span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setReplayKey((k) => k + 1)}
        >
          <RotateCcw className="size-4" />
          重播 Replay
        </Button>
      </div>
      <div
        className="flex h-[180px] items-center justify-center overflow-hidden rounded-lg border bg-muted/30 p-4"
        data-preview={kind}
      >
        <EntryPreview kind={kind} params={params} replayKey={replayKey} />
      </div>
    </div>
  )
}

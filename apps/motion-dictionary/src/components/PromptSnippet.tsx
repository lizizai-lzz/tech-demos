import { Check, Copy } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { buildPromptSnippet } from '@/lib/prompt'
import { cn } from '@/lib/utils'
import type { ControlId, DictionaryEntry, MotionParams } from '@/types'

type PromptSnippetProps = {
  entry: DictionaryEntry
  params: MotionParams
}

function FlashValue({
  children,
  flash,
}: {
  children: React.ReactNode
  flash: boolean
}) {
  return (
    <span
      className={cn(
        'rounded px-0.5 transition-colors duration-300',
        flash && 'bg-primary/20 text-primary ring-1 ring-primary/30',
      )}
    >
      {children}
    </span>
  )
}

export function PromptSnippet({ entry, params }: PromptSnippetProps) {
  const prev = useRef<MotionParams | null>(null)
  const [flashIds, setFlashIds] = useState<ControlId[]>([])

  const snippet = useMemo(
    () => buildPromptSnippet(entry.effectFeel, params, entry.controls, entry.preview),
    [entry, params],
  )

  useEffect(() => {
    if (!prev.current) {
      prev.current = params
      return
    }
    const changed = entry.controls.filter((id) => prev.current![id] !== params[id])
    prev.current = params
    if (changed.length === 0) return
    setFlashIds(changed)
    const t = window.setTimeout(() => setFlashIds([]), 700)
    return () => window.clearTimeout(t)
  }, [params, entry.controls])

  async function handleCopy() {
    await navigator.clipboard.writeText(snippet.text)
    toast.success('提示词已复制', { icon: <Check className="size-4" /> })
  }

  const refLine = snippet.text.split('\n')[1] ?? ''

  return (
    <div className="space-y-2 rounded-xl border border-border/60 bg-muted/20 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">可复制提示词</span>
        <Button type="button" variant="secondary" size="sm" onClick={handleCopy}>
          <Copy className="size-4" />
          复制
        </Button>
      </div>
      <pre className="max-h-48 overflow-auto text-left text-xs leading-relaxed whitespace-pre-wrap text-foreground/90">
        <span className="block">{snippet.text.split('\n')[0]}</span>
        <span className="mt-2 block text-muted-foreground">
          {entry.controls.includes('duration') && (
            <>
              duration{' '}
              <FlashValue flash={flashIds.includes('duration')}>{params.duration}ms</FlashValue>
              {' · '}
            </>
          )}
          {entry.controls.includes('delay') && (
            <>
              delay{' '}
              <FlashValue flash={flashIds.includes('delay')}>{params.delay}ms</FlashValue>
              {' · '}
            </>
          )}
          {entry.controls.includes('easing') && (
            <>
              easing{' '}
              <FlashValue flash={flashIds.includes('easing')}>{params.easing}</FlashValue>
              {' · '}
            </>
          )}
          {entry.controls.includes('stiffness') && (
            <>
              stiffness{' '}
              <FlashValue flash={flashIds.includes('stiffness')}>{params.stiffness}</FlashValue>
              {' · '}
            </>
          )}
          {entry.controls.includes('damping') && (
            <>
              damping{' '}
              <FlashValue flash={flashIds.includes('damping')}>{params.damping}</FlashValue>
            </>
          )}
        </span>
        <code className="mt-2 block rounded-md bg-background/80 px-2 py-1 font-mono text-[11px]">
          {snippet.motionHint}
        </code>
        <span className="mt-2 block">{snippet.text.split('\n')[2]}</span>
      </pre>
      <p className="sr-only">{refLine}</p>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { mergeParams } from '@/lib/motion-params'
import { buildPromptSnippet } from '@/lib/prompt'
import type { DictionaryEntry, MotionParams } from '@/types'
import { ParamControls } from './ParamControls'
import { PromptSnippet } from './PromptSnippet'
import { PreviewFrame } from './previews/PreviewFrame'

type EntryCardProps = {
  entry: DictionaryEntry
}

export function EntryCard({ entry }: EntryCardProps) {
  const [params, setParams] = useState<MotionParams>(() => mergeParams(entry.defaultParams))

  const prompt = useMemo(
    () =>
      buildPromptSnippet(
        entry.termZh,
        entry.termEn,
        entry.description,
        params,
        entry.controls,
      ),
    [entry, params],
  )

  return (
    <Card className="text-left">
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-lg">
            {entry.termZh}{' '}
            <span className="text-muted-foreground font-normal">/ {entry.termEn}</span>
          </CardTitle>
          <Badge variant="secondary">{entry.category}</Badge>
        </div>
        <CardDescription>{entry.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <PreviewFrame kind={entry.preview} params={params} />
        <ParamControls controls={entry.controls} params={params} onChange={setParams} />
        <PromptSnippet text={prompt} />
      </CardContent>
    </Card>
  )
}

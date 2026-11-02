import { useMemo, useState } from 'react'
import type { Word } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { pickQuizOptions } from '@/lib/queue'
import { cn } from '@/lib/utils'

type Props = {
  word: Word
  allWords: Word[]
  onAnswer: (correct: boolean) => void
}

export function QuizPanel({ word, allWords, onAnswer }: Props) {
  const options = useMemo(
    () => pickQuizOptions(word, allWords, 4),
    [word, allWords],
  )
  const [picked, setPicked] = useState<string | null>(null)

  const choose = (id: string) => {
    if (picked) return
    setPicked(id)
    const correct = id === word.id
    onAnswer(correct)
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-base font-normal text-muted-foreground">
          看义选词
        </CardTitle>
        <p className="text-xl font-semibold">{word.zh}</p>
        <p className="text-sm text-muted-foreground">{word.gloss}</p>
      </CardHeader>
      <CardContent className="grid gap-2">
        {options.map((opt) => {
          const isCorrect = opt.id === word.id
          const show = picked !== null
          return (
            <Button
              key={opt.id}
              variant="outline"
              className={cn(
                'h-auto justify-start py-3 text-left',
                show && isCorrect && 'border-emerald-500 bg-emerald-500/10',
                show && picked === opt.id && !isCorrect && 'border-destructive bg-destructive/10',
              )}
              onClick={() => choose(opt.id)}
              disabled={picked !== null}
            >
              <span className="font-medium">{opt.lemma}</span>
              <span className="ml-2 text-xs text-muted-foreground">{opt.phonetic}</span>
            </Button>
          )
        })}
      </CardContent>
    </Card>
  )
}

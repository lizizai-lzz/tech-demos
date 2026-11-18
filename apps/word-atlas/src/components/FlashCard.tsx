import { useState } from 'react'
import type { Word } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { WordIllustration } from '@/components/WordIllustration'
import { topicMeta } from '@/lib/topics'
import { cn } from '@/lib/utils'

type Props = {
  word: Word
  onRate: (rating: 'remember' | 'fuzzy' | 'forgot') => void
}

export function FlashCard({ word, onRate }: Props) {
  const [flipped, setFlipped] = useState(false)
  const meta = topicMeta(word.topic)

  return (
    <Card className="mx-auto w-full max-w-md shadow-sm">
      <CardContent className="pt-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <Badge variant="secondary" style={{ borderColor: meta.color }}>
            {meta.label}
          </Badge>
          <span className="text-xs text-muted-foreground">点击卡片翻面</span>
        </div>
        <button
          type="button"
          className="w-full text-left"
          onClick={() => setFlipped((f) => !f)}
        >
          <div className="relative h-52 [perspective:1000px]">
            <div className={cn('card-flip-inner relative h-full w-full', flipped && 'is-flipped')}>
              <div className="card-flip-face absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl border bg-card p-4">
                <WordIllustration word={word} className="h-28 w-full max-w-[200px]" />
                <p className="text-2xl font-semibold tracking-tight">{word.lemma}</p>
                <p className="text-sm text-muted-foreground">{word.phonetic}</p>
              </div>
              <div className="card-flip-face card-flip-back absolute inset-0 flex flex-col justify-center gap-3 rounded-xl border bg-muted/30 p-5">
                <p className="text-lg font-medium">{word.zh}</p>
                <p className="text-sm text-muted-foreground">{word.gloss}</p>
                <p className="border-l-2 border-primary/40 pl-3 text-sm italic text-foreground/80">
                  {word.example}
                </p>
              </div>
            </div>
          </div>
        </button>
      </CardContent>
      {flipped && (
        <CardFooter className="flex flex-wrap gap-2 border-t bg-muted/20">
          <Button variant="secondary" className="flex-1" onClick={() => onRate('remember')}>
            记得
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => onRate('fuzzy')}>
            模糊
          </Button>
          <Button variant="destructive" className="flex-1" onClick={() => onRate('forgot')}>
            忘记
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { FeedItem } from '@/pipeline/types'
import { useState } from 'react'

const STATUS_LABEL: Record<FeedItem['status'], string> = {
  filtered: '已过滤',
  queued: '排队中',
  processing: '正在回复',
  done: '已完成',
}

const STATUS_VARIANT: Record<
  FeedItem['status'],
  'secondary' | 'outline' | 'default' | 'destructive'
> = {
  filtered: 'destructive',
  queued: 'outline',
  processing: 'default',
  done: 'secondary',
}

interface DanmakuFeedProps {
  feed: FeedItem[]
  onSubmit: (text: string) => void
}

export function DanmakuFeed({ feed, onSubmit }: DanmakuFeedProps) {
  const [draft, setDraft] = useState('')

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit(draft)
          setDraft('')
        }}
      >
        <Input
          placeholder="输入弹幕试玩…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="flex-1"
        />
        <Button type="submit">发送</Button>
      </form>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-border bg-card/40 p-2">
        <ul className="space-y-2">
          {feed.length === 0 && (
            <li className="px-2 py-6 text-center text-sm text-muted-foreground">
              暂无弹幕，开启空跑或手动发送一条吧
            </li>
          )}
          {feed.map((item) => (
            <li
              key={item.id}
              className={`rounded-lg border border-border/60 px-3 py-2 text-sm ${
                item.status === 'filtered' ? 'opacity-50' : ''
              }`}
            >
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {item.userLabel}
                </span>
                <Badge variant={STATUS_VARIANT[item.status]}>
                  {STATUS_LABEL[item.status]}
                </Badge>
                {item.intent && (
                  <Badge variant="outline">{item.intent.kind}</Badge>
                )}
              </div>
              <p>{item.text}</p>
              {item.filterReason && (
                <p className="mt-1 text-xs text-destructive">
                  {item.filterReason}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

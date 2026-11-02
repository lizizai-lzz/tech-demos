import { useCallback, useMemo, useState } from 'react'
import wordsData from '@/data/words.json'
import { FlashCard } from '@/components/FlashCard'
import { QuizPanel } from '@/components/QuizPanel'
import { StarMap, TopicWordList } from '@/components/StarMap'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Slider } from '@/components/ui/slider'
import { applyReview } from '@/lib/fsrs'
import { buildTodayQueue, countQueueStats } from '@/lib/queue'
import {
  clearState,
  exportStateJson,
  loadState,
  saveState,
} from '@/lib/storage'
import type { QueueItem, ReviewRating, StoredState, TopicId, Word } from '@/types'
import { topicMeta } from '@/lib/topics'
import { Sparkles, Download, Trash2, Play } from 'lucide-react'

const words = wordsData as Word[]

type Screen = 'home' | 'session' | 'done'

export default function App() {
  const [state, setState] = useState<StoredState>(() => loadState())
  const [screen, setScreen] = useState<Screen>('home')
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [index, setIndex] = useState(0)
  const [topicSheet, setTopicSheet] = useState<TopicId | null>(null)

  const stats = useMemo(
    () => countQueueStats(words, state.progress, Date.now()),
    [state.progress],
  )

  const persist = useCallback((next: StoredState) => {
    setState(next)
    saveState(next)
  }, [])

  const startToday = () => {
    const q = buildTodayQueue(words, state.progress, Date.now())
    setQueue(q)
    setIndex(0)
    setScreen(q.length ? 'session' : 'home')
  }

  const current = queue[index]
  const currentWord = current ? words.find((w) => w.id === current.wordId) : undefined

  const advance = () => {
    if (index + 1 >= queue.length) {
      setScreen('done')
    } else {
      setIndex((i) => i + 1)
    }
  }

  const record = (rating: ReviewRating) => {
    if (!currentWord) return
    const nextProgress = applyReview(
      state.progress[currentWord.id],
      rating,
      state.settings.targetRetention,
    )
    persist({
      ...state,
      progress: { ...state.progress, [currentWord.id]: nextProgress },
    })
    advance()
  }

  const onQuizAnswer = (correct: boolean) => {
    record(correct ? 'remember' : 'forgot')
  }

  const exportProgress = () => {
    const blob = new Blob([exportStateJson(state)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `word-atlas-progress-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const resetProgress = () => {
    if (!confirm('确定清空本地进度？此操作不可撤销。')) return
    persist(clearState())
    setScreen('home')
    setQueue([])
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/40 via-background to-background">
      <header className="border-b bg-card/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" aria-hidden />
            <div>
              <h1 className="text-lg font-semibold tracking-tight">词光 · Word Atlas</h1>
              <p className="text-xs text-muted-foreground">插画背词演示 · 本地空跑 · 无上游素材</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">待复习 {stats.dueReview}</Badge>
            <Badge variant="secondary">可学新词 {Math.min(stats.newAvailable, 8)}</Badge>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:grid-cols-[1fr_320px]">
        <section className="space-y-6">
          {screen === 'home' && (
            <div className="space-y-5 rounded-xl border bg-card p-6 shadow-sm">
              <p className="text-sm leading-relaxed text-muted-foreground">
                今日队列共 <strong>{stats.queueLength}</strong> 项（到期复习优先，再补新词）。
                每张词卡可翻面自评；部分题目为「看义选词」四选一。进度保存在浏览器 localStorage，可用简化 FSRS 排期。
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>目标记忆率</span>
                  <span className="font-mono tabular-nums">
                    {(state.settings.targetRetention * 100).toFixed(0)}%
                  </span>
                </div>
                <Slider
                  min={80}
                  max={95}
                  step={1}
                  value={[Math.round(state.settings.targetRetention * 100)]}
                  onValueChange={(v) => {
                    const arr = Array.isArray(v) ? v : [v]
                    const val = (arr[0] ?? 90) / 100
                    persist({
                      ...state,
                      settings: { ...state.settings, targetRetention: val },
                    })
                  }}
                />
                <p className="text-xs text-muted-foreground">影响复习间隔倍数（演示用简化公式）</p>
              </div>
              <Button size="lg" className="w-full sm:w-auto" onClick={startToday}>
                <Play className="size-4" data-icon="inline-start" />
                开始今日
              </Button>
            </div>
          )}

          {screen === 'session' && currentWord && current && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  进度 {index + 1} / {queue.length}
                </span>
                <span>{current.kind === 'card' ? '词卡回忆' : '测验'}</span>
              </div>
              {current.kind === 'card' ? (
                <FlashCard word={currentWord} onRate={record} />
              ) : (
                <QuizPanel word={currentWord} allWords={words} onAnswer={onQuizAnswer} />
              )}
              <Button variant="ghost" className="w-full" onClick={() => setScreen('home')}>
                暂停并返回
              </Button>
            </div>
          )}

          {screen === 'done' && (
            <div className="rounded-xl border bg-card p-8 text-center shadow-sm">
              <p className="text-lg font-medium">今日队列已完成</p>
              <p className="mt-2 text-sm text-muted-foreground">星图已更新，明天会按 due 时间再提醒复习。</p>
              <Button className="mt-6" onClick={() => setScreen('home')}>
                返回首页
              </Button>
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <StarMap
            words={words}
            progress={state.progress}
            onSelectTopic={setTopicSheet}
          />
          <div className="flex flex-col gap-2 rounded-xl border bg-card p-4">
            <p className="text-sm font-medium">进度数据</p>
            <Button variant="outline" size="sm" onClick={exportProgress}>
              <Download className="size-4" data-icon="inline-start" />
              导出 JSON
            </Button>
            <Button variant="destructive" size="sm" onClick={resetProgress}>
              <Trash2 className="size-4" data-icon="inline-start" />
              清空进度
            </Button>
          </div>
        </aside>
      </main>

      <Sheet open={topicSheet !== null} onOpenChange={(o) => !o && setTopicSheet(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          {topicSheet && (
            <>
              <SheetHeader>
                <SheetTitle>{topicMeta(topicSheet).label}</SheetTitle>
                <SheetDescription>该话题下全部演示词条</SheetDescription>
              </SheetHeader>
              <TopicWordList topic={topicSheet} words={words} progress={state.progress} />
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

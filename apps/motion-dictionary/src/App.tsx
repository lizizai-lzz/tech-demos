import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { CATEGORIES, dictionaryEntries } from '@/data/entries'
import { EntryCard } from '@/components/EntryCard'

export default function App() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('全部')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return dictionaryEntries.filter((entry) => {
      const matchCategory = category === '全部' || entry.category === category
      if (!matchCategory) return false
      if (!q) return true
      const haystack = `${entry.termZh} ${entry.termEn} ${entry.description}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [query, category])

  return (
    <div className="min-h-svh bg-background">
      <header className="border-b bg-card/50">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <h1 className="text-3xl font-semibold tracking-tight">网页动效词典</h1>
          <p className="mt-2 text-muted-foreground">
            每条术语配有可重播的 Motion 预览、可调参数，以及随参数更新的 Vibe Coding 提示词。
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <div className="space-y-3">
          <Input
            placeholder="搜索中文或英文术语…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="搜索术语"
          />
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className="focus-visible:outline-none"
              >
                <Badge variant={category === cat ? 'default' : 'outline'} className="cursor-pointer">
                  {cat}
                </Badge>
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground">没有匹配的词条，试试其他关键词或分类。</p>
        ) : (
          <div className="space-y-8">
            {filtered.map((entry) => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        Motion Dictionary · 使用 motion.dev 与 shadcn/ui 构建
      </footer>
    </div>
  )
}

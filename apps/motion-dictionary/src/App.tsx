import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { CATEGORIES, dictionaryEntries } from '@/data/entries'
import { GalleryCard } from '@/components/GalleryCard'
import { EntryDetailSheet } from '@/components/EntryDetailSheet'
import { ThemeToggle } from '@/components/ThemeToggle'
import { initialParamsMap } from '@/lib/entry-params-store'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import type { DictionaryEntry } from '@/types'

const THEME_KEY = 'motion-dictionary-theme'

export default function App() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('全部')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [paramsById, setParamsById] = useState(initialParamsMap(dictionaryEntries))
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false
    const stored = localStorage.getItem(THEME_KEY)
    if (stored === 'dark') return true
    if (stored === 'light') return false
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  const searchRef = useRef<HTMLInputElement>(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light')
  }, [dark])

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

  const selectedEntry: DictionaryEntry | null =
    selectedId ? dictionaryEntries.find((e) => e.id === selectedId) ?? null : null

  const closeDetail = useCallback(() => setSelectedId(null), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeDetail()
        return
      }
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target as HTMLElement)?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA') return
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeDetail])

  return (
      <div className="min-h-svh bg-background">
        <header className="border-b border-border/60 bg-card/40">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">网页动效词典</h1>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground leading-relaxed">
                画廊浏览术语，点进详情调参；提示词随参数更新，方便 Vibe Coding。按{' '}
                <kbd className="rounded border px-1 text-xs">/</kbd> 搜索，
                <kbd className="rounded border px-1 text-xs">Esc</kbd> 关闭详情。
              </p>
            </div>
            <ThemeToggle dark={dark} onDarkChange={setDark} />
          </div>
        </header>

        <main className="mx-auto max-w-6xl space-y-8 px-4 py-10">
          <div className="space-y-4">
            <Input
              ref={searchRef}
              placeholder="搜索中文或英文术语…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="搜索术语"
              className="max-w-md bg-background"
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
            <p className="py-16 text-center text-muted-foreground">没有匹配的词条，试试其他关键词或分类。</p>
          ) : (
            <motion.ul
              layout
              className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              <AnimatePresence mode="popLayout">
                {filtered.map((entry) => (
                  <GalleryCard
                    key={entry.id}
                    entry={entry}
                    params={paramsById[entry.id]}
                    reduceMotion={reduceMotion}
                    onOpen={() => setSelectedId(entry.id)}
                  />
                ))}
              </AnimatePresence>
            </motion.ul>
          )}
        </main>

        <footer className="border-t border-border/60 py-8 text-center text-xs text-muted-foreground">
          Motion Dictionary · Motion + shadcn/ui
        </footer>

        <EntryDetailSheet
          entry={selectedEntry}
          params={selectedEntry ? paramsById[selectedEntry.id] : paramsById['fade-in']}
          onParamsChange={(next) => {
            if (!selectedEntry) return
            setParamsById((map) => ({ ...map, [selectedEntry.id]: next }))
          }}
          onClose={closeDetail}
          reduceMotion={reduceMotion}
        />
      </div>
  )
}

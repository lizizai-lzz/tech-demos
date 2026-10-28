import { useMemo, useState } from 'react'
import { CopyIcon } from 'lucide-react'
import { toast } from 'sonner'
import { PreviewStage } from '@/components/previews/PreviewStage'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { buildBriefText } from '@/lib/brief'
import {
  DEFAULT_STYLE_SLUG,
  EDIT_DOC_STYLES,
  type StyleSlug,
  styleBySlug,
} from '@/styles/registry'
import {
  exampleThemes,
  type ExampleThemeId,
  themeById,
} from '@/themes/example-themes'

export default function App() {
  const [slug, setSlug] = useState<StyleSlug>(DEFAULT_STYLE_SLUG)
  const [themeId, setThemeId] = useState<ExampleThemeId>('ai-week')

  const style = useMemo(() => styleBySlug(slug), [slug])
  const theme = useMemo(() => themeById(themeId), [themeId])

  const copyBrief = async () => {
    const text = buildBriefText(style, theme)
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Brief 已复制到剪贴板')
    } catch {
      toast.error('复制失败，请手动选择文本')
    }
  }

  return (
    <div className="min-h-svh bg-background">
      <header className="border-b border-border/70 bg-card/50">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">剪辑与纪实 · 风格台</h1>
              <Badge variant="secondary">空跑预览</Badge>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              八种「剪辑与纪实」视觉语法，用 Canvas / CSS 循环演示气质；右侧可复制中文 brief，不连接视频模型。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="self-center text-xs text-muted-foreground">示例主题</span>
            {exampleThemes.map((t) => (
              <Button
                key={t.id}
                size="sm"
                variant={themeId === t.id ? 'default' : 'outline'}
                onClick={() => setThemeId(t.id)}
              >
                {t.label}
              </Button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[240px_1fr_300px]">
        <nav className="flex flex-col gap-1" aria-label="风格索引">
          <p className="mb-2 px-2 text-xs font-medium text-muted-foreground">八种风格</p>
          {EDIT_DOC_STYLES.map((item) => {
            const active = item.slug === slug
            return (
              <button
                key={item.slug}
                type="button"
                onClick={() => setSlug(item.slug)}
                className={`rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted text-foreground'
                }`}
              >
                <span className="block font-medium">{item.nameZh}</span>
                <span
                  className={`mt-0.5 block text-[11px] ${
                    active ? 'text-primary-foreground/80' : 'text-muted-foreground'
                  }`}
                >
                  {item.nameEn}
                </span>
                <span
                  className={`mt-1 block font-mono text-[10px] ${
                    active ? 'text-primary-foreground/70' : 'text-muted-foreground/80'
                  }`}
                >
                  {item.slug}
                </span>
              </button>
            )
          })}
        </nav>

        <section className="min-w-0">
          <PreviewStage slug={slug} theme={theme} />
          <p className="mt-3 text-center text-xs text-muted-foreground">
            当前主题：{theme.headline} · 预览约 8–10 秒循环
          </p>
        </section>

        <Card className="h-fit lg:sticky lg:top-6">
          <CardHeader>
            <CardTitle>{style.nameZh}</CardTitle>
            <CardDescription>{style.nameEn} · {style.slug}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed">{style.tagline}</p>
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">风格口诀</p>
              <ul className="space-y-1.5 text-sm">
                {style.mantras.map((m) => (
                  <li key={m} className="flex gap-2">
                    <span className="text-muted-foreground">·</span>
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={copyBrief}>
              <CopyIcon data-icon="inline-start" />
              复制 Brief 模板
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  )
}

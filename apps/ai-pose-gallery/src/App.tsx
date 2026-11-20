import { useEffect, useRef, useState } from 'react'
import { RotateCcw, Search } from 'lucide-react'
import { PoseGallery } from '@/components/PoseGallery'
import { PoseLightbox } from '@/components/PoseLightbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { usePoseFilters } from '@/hooks/use-pose-filters'
import type { Pose, PoseAngle, PoseSystem, ViewMode } from '@/types'
import { cn } from '@/lib/utils'

const SYSTEMS: { id: PoseSystem | 'all'; label: string }[] = [
  { id: 'all', label: '全部体系' },
  { id: '全身·标准系', label: '全身·标准系' },
  { id: '上半身', label: '上半身' },
]

const ANGLE_OPTIONS: PoseAngle[] = ['正面', '斜侧', '侧面', '俯视', '仰视']

export default function App() {
  const {
    filtered,
    query,
    setQuery,
    system,
    setSystem,
    angles,
    toggleAngle,
    resetFilters,
  } = usePoseFilters()

  const [viewMode, setViewMode] = useState<ViewMode>('group')
  const [lightbox, setLightbox] = useState<{
    pose: Pose
    angleIndex: number
  } | null>(null)

  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (
        e.key === '/' &&
        !e.metaKey &&
        !e.ctrlKey &&
        document.activeElement?.tagName !== 'INPUT'
      ) {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function openPose(pose: Pose, angleIndex = 0) {
    setLightbox({ pose, angleIndex })
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            AI 姿势参考台
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            空跑演示：SVG 火柴人占位 + 本地样例数据，不托管上游图片素材。
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <section className="space-y-4 rounded-xl border bg-card p-4 shadow-sm">
          <div className="relative">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索姿势名、分类或标签… 按 / 聚焦"
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">体系</span>
            {SYSTEMS.map((s) => (
              <Button
                key={s.id}
                size="sm"
                variant={system === s.id ? 'default' : 'outline'}
                onClick={() => setSystem(s.id)}
              >
                {s.label}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">视角</span>
            {ANGLE_OPTIONS.map((angle) => {
              const active = angles.includes(angle)
              return (
                <button
                  key={angle}
                  type="button"
                  onClick={() => toggleAngle(angle)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs transition-colors',
                    active
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:bg-muted',
                  )}
                >
                  {angle}
                </button>
              )
            })}
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <RotateCcw className="size-4" />
              重置
            </Button>
          </div>

          {(angles.length > 0 || system !== 'all' || query) && (
            <div className="flex flex-wrap gap-1.5">
              {query && <Badge variant="outline">关键词：{query}</Badge>}
              {system !== 'all' && <Badge variant="outline">{system}</Badge>}
              {angles.map((a) => (
                <Badge key={a} variant="secondary">{a}</Badge>
              ))}
            </div>
          )}
        </section>

        <PoseGallery
          poses={filtered}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onOpenPose={openPose}
        />
      </div>

      {lightbox && (
        <PoseLightbox
          pose={lightbox.pose}
          angleIndex={lightbox.angleIndex}
          onAngleIndexChange={(i) =>
            setLightbox((lb) => lb && { ...lb, angleIndex: i })
          }
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  )
}

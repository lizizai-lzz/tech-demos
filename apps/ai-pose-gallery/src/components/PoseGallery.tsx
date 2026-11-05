import { LayoutGrid, Rows3 } from 'lucide-react'
import { StickFigure } from '@/components/StickFigure'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { Pose, ViewMode } from '@/types'
import { cn } from '@/lib/utils'

type PoseGalleryProps = {
  poses: Pose[]
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  onOpenPose: (pose: Pose, angleIndex?: number) => void
}

export function PoseGallery({
  poses,
  viewMode,
  onViewModeChange,
  onOpenPose,
}: PoseGalleryProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          共 <span className="font-medium text-foreground">{poses.length}</span>{' '}
          个姿势
        </p>
        <div className="flex rounded-lg border p-0.5">
          <Button
            variant={viewMode === 'group' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('group')}
          >
            <Rows3 className="size-4" />
            按姿势分组
          </Button>
          <Button
            variant={viewMode === 'flat' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('flat')}
          >
            <LayoutGrid className="size-4" />
            逐张浏览
          </Button>
        </div>
      </div>

      {poses.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
          没有匹配的姿势，试试放宽筛选或重置条件。
        </div>
      ) : viewMode === 'group' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {poses.map((pose) => (
            <Card
              key={pose.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => onOpenPose(pose, 0)}
            >
              <CardHeader className="pb-2">
                <CardTitle>{pose.name}</CardTitle>
                <CardDescription>
                  {pose.category} · {pose.views.length} 个视角
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {pose.views.map((v, i) => (
                    <button
                      key={v.angle}
                      type="button"
                      className="h-24 w-20 shrink-0 overflow-hidden rounded-lg ring-1 ring-border transition hover:ring-primary/40"
                      onClick={(e) => {
                        e.stopPropagation()
                        onOpenPose(pose, i)
                      }}
                    >
                      <StickFigure
                        angle={v.angle}
                        system={pose.system}
                        variant={v.variant}
                        compact
                      />
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {pose.tags.slice(0, 3).map((t) => (
                    <Badge key={t} variant="secondary">{t}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {poses.flatMap((pose) =>
            pose.views.map((v, i) => (
              <button
                key={`${pose.id}-${v.angle}`}
                type="button"
                className={cn(
                  'overflow-hidden rounded-xl text-left ring-1 ring-border transition hover:ring-primary/50',
                )}
                onClick={() => onOpenPose(pose, i)}
              >
                <div className="aspect-[3/4] bg-muted/20">
                  <StickFigure
                    angle={v.angle}
                    system={pose.system}
                    variant={v.variant}
                  />
                </div>
                <div className="space-y-0.5 p-2">
                  <p className="truncate text-sm font-medium">{pose.name}</p>
                  <p className="text-xs text-muted-foreground">{v.angle}</p>
                </div>
              </button>
            )),
          )}
        </div>
      )}
    </div>
  )
}

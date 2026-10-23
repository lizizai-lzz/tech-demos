import { Handle, Position, type Node, type NodeProps } from "@xyflow/react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { StudioNodeData, StatusChipTone } from "@/lib/canvas-layout"
import { cn } from "@/lib/utils"

const KIND_LABEL: Record<StudioNodeData["kind"], string> = {
  source: "原文",
  outline: "大纲",
  character: "角色卡",
  script: "剧本场次",
  storyboard: "分镜卡",
  world: "世界观",
  chapterOutline: "章纲",
  chapterProse: "样章",
  consistencyReview: "一致性",
  sensitivityReview: "敏感",
  aiTasteGate: "去AI味",
  qualityVerdict: "裁定",
  rewrite: "改写",
  chapterProseRevised: "终稿",
}

const CHIP_VARIANT: Record<
  StatusChipTone,
  "default" | "secondary" | "outline" | "destructive"
> = {
  success: "default",
  warning: "secondary",
  destructive: "destructive",
  neutral: "outline",
}

export function StudioNode({ data, selected }: NodeProps<Node<StudioNodeData>>) {
  const preview = data.body.split("\n")[0]
  const visual = data.visualStatus ?? "done"

  return (
    <Card
      className={cn(
        "w-[220px] border shadow-sm transition-all duration-300",
        visual === "done" && "opacity-100",
        visual === "pending" && "opacity-45 border-dashed",
        visual === "generating" && "opacity-90 ring-2 ring-primary/25 animate-pulse",
        selected && "ring-2 ring-primary/40 shadow-md"
      )}
    >
      <Handle type="target" position={Position.Left} className="!bg-border" />
      <CardHeader className="gap-1 px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary" className="text-[10px] font-normal shrink-0">
            {KIND_LABEL[data.kind]}
          </Badge>
          {data.statusChip ? (
            <Badge
              variant={CHIP_VARIANT[data.statusChip.tone]}
              className="text-[10px] font-normal shrink-0 max-w-[100px] truncate"
            >
              {data.statusChip.label}
            </Badge>
          ) : (
            data.subtitle && (
              <span className="text-[10px] text-muted-foreground truncate max-w-[90px]">
                {data.subtitle}
              </span>
            )
          )}
        </div>
        <CardTitle className="text-sm leading-snug">{data.title}</CardTitle>
        {data.statusChip && data.subtitle && data.subtitle !== data.statusChip.label && (
          <p className="text-[10px] text-muted-foreground truncate">{data.subtitle}</p>
        )}
      </CardHeader>
      <CardContent className="px-3 pb-3 pt-0 space-y-2">
        {data.kind === "storyboard" && data.frameColor && (
          <div
            className="h-16 w-full rounded-md border border-border/60"
            style={{ backgroundColor: data.frameColor }}
            aria-hidden
          />
        )}
        <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap">
          {preview}
        </p>
      </CardContent>
      <Handle type="source" position={Position.Right} className="!bg-border" />
    </Card>
  )
}

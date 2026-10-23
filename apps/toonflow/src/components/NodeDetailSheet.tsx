import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import type { PipelineStageId } from "@/hooks/usePipelineRunner"
import type { SelectedNode } from "@/types/studio"
import { useEffect, useState } from "react"

interface NodeDetailSheetProps {
  node: SelectedNode | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (id: string, title: string, body: string, revisedBody?: string) => void
  onRegenerate?: (stage: PipelineStageId) => void
}

export function NodeDetailSheet({
  node,
  open,
  onOpenChange,
  onSave,
  onRegenerate,
}: NodeDetailSheetProps) {
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [revised, setRevised] = useState("")

  const hasCompare =
    node?.draftBody &&
    node?.revisedBody &&
    node.draftBody !== node.revisedBody

  useEffect(() => {
    if (node) {
      setTitle(node.title)
      setBody(node.body)
      setRevised(node.revisedBody ?? node.body)
    }
  }, [node])

  if (!node) return null

  const handleSave = () => {
    if (hasCompare) {
      onSave(node.id, title, body, revised)
    } else {
      onSave(node.id, title, body)
    }
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl lg:max-w-4xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>节点详情</SheetTitle>
          <SheetDescription>
            本地编辑仅影响画布展示，不会调用任何模型 API。
          </SheetDescription>
        </SheetHeader>
        {node.sheetExtras && node.sheetExtras.length > 0 && (
          <div className="mx-4 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground space-y-1">
            {node.sheetExtras.map((line, i) => (
              <p key={i} className="whitespace-pre-wrap">{line}</p>
            ))}
          </div>
        )}
        <div className="flex flex-col gap-4 px-4">
          <div className="space-y-2">
            <Label htmlFor="node-title">标题</Label>
            <Textarea
              id="node-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="min-h-[44px]"
            />
          </div>
          {hasCompare ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="node-draft">初稿（对照）</Label>
                <Textarea
                  id="node-draft"
                  value={node.draftBody}
                  readOnly
                  className="min-h-[min(50vh,320px)] bg-muted/40 font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="node-revised">终稿（可编辑）</Label>
                <Textarea
                  id="node-revised"
                  value={revised}
                  onChange={(e) => setRevised(e.target.value)}
                  className="min-h-[min(50vh,320px)] font-mono text-sm"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="node-body">正文</Label>
              <Textarea
                id="node-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="min-h-[min(50vh,360px)] font-mono text-sm"
              />
            </div>
          )}
        </div>
        <SheetFooter className="flex-row gap-2 justify-between">
          {node.stageId && onRegenerate && (
            <Button
              type="button"
              variant="outline"
              onClick={() => onRegenerate(node.stageId!)}
            >
              重新生成此节点
            </Button>
          )}
          <Button type="button" onClick={handleSave}>
            保存到画布
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

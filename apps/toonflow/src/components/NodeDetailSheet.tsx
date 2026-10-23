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
import type { PipelineStage } from "@/pipeline/types"
import type { SelectedNode } from "@/types/studio"
import { useEffect, useState } from "react"

interface NodeDetailSheetProps {
  node: SelectedNode | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (id: string, title: string, body: string) => void
  onRegenerate?: (stage: PipelineStage) => void
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

  useEffect(() => {
    if (node) {
      setTitle(node.title)
      setBody(node.body)
    }
  }, [node])

  if (!node) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>节点详情</SheetTitle>
          <SheetDescription>
            本地编辑仅影响画布展示，不会调用任何模型 API。
          </SheetDescription>
        </SheetHeader>
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
          <div className="space-y-2">
            <Label htmlFor="node-body">正文</Label>
            <Textarea
              id="node-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[200px]"
            />
          </div>
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
          <Button
            type="button"
            onClick={() => {
              onSave(node.id, title, body)
              onOpenChange(false)
            }}
          >
            保存到画布
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

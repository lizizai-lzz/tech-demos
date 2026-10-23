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
import {
  DEFAULT_MODEL_SETTINGS,
  type ModelSettings,
  type RunMode,
} from "@/lib/model-settings"
import { cn } from "@/lib/utils"
import { Settings2 } from "lucide-react"
import { useEffect, useState } from "react"

interface ModelSettingsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: ModelSettings
  onSave: (settings: ModelSettings) => void
  onClear: () => void
}

const inputClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"

export function ModelSettingsSheet({
  open,
  onOpenChange,
  settings,
  onSave,
  onClear,
}: ModelSettingsSheetProps) {
  const [draft, setDraft] = useState<ModelSettings>(settings)

  useEffect(() => {
    if (open) setDraft(settings)
  }, [open, settings])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings2 className="size-4" />
            模型设置
          </SheetTitle>
          <SheetDescription>
            API Key 仅存于本机浏览器 localStorage，不会写入导出 JSON 或提交到仓库。
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4">
          <div className="space-y-2">
            <Label>运行方式</Label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: "dry-run" as RunMode, label: "本地空跑" },
                  { id: "live" as RunMode, label: "真实模型" },
                ] as const
              ).map((opt) => (
                <Button
                  key={opt.id}
                  type="button"
                  size="sm"
                  variant={draft.runMode === opt.id ? "default" : "outline"}
                  onClick={() => setDraft((d) => ({ ...d, runMode: opt.id }))}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="base-url">Base URL</Label>
            <input
              id="base-url"
              className={inputClass}
              value={draft.baseUrl}
              onChange={(e) => setDraft((d) => ({ ...d, baseUrl: e.target.value }))}
              placeholder="https://api.deepseek.com/v1"
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <input
              id="api-key"
              type="password"
              className={inputClass}
              value={draft.apiKey}
              onChange={(e) => setDraft((d) => ({ ...d, apiKey: e.target.value }))}
              placeholder="sk-…"
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="model-id">Model id</Label>
            <input
              id="model-id"
              className={inputClass}
              value={draft.modelId}
              onChange={(e) => setDraft((d) => ({ ...d, modelId: e.target.value }))}
              placeholder="deepseek-chat / gpt-4o-mini"
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="temperature">
              Temperature（可选，{draft.temperature.toFixed(1)}）
            </Label>
            <input
              id="temperature"
              type="range"
              min={0}
              max={2}
              step={0.1}
              className={cn("w-full accent-primary")}
              value={draft.temperature}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  temperature: Number(e.target.value),
                }))
              }
            />
          </div>
        </div>
        <SheetFooter className="flex-row flex-wrap gap-2 justify-between">
          <Button
            type="button"
            variant="ghost"
            className="text-muted-foreground"
            onClick={() => {
              onClear()
              setDraft({ ...DEFAULT_MODEL_SETTINGS })
            }}
          >
            清除密钥与配置
          </Button>
          <Button
            type="button"
            onClick={() => {
              onSave(draft)
              onOpenChange(false)
            }}
          >
            保存设置
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

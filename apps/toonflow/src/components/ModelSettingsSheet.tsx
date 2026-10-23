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
  DEFAULT_JIMENG_CONFIG,
  DEFAULT_MEDIA_SETTINGS,
  mediaProviderLabel,
  normalizeMediaSettings,
  type MediaProvider,
  type MediaSettings,
} from "@/lib/media/media-settings"
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
  mediaSettings: MediaSettings
  onSave: (settings: ModelSettings, media: MediaSettings) => void
  onClear: () => void
}

const inputClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"

type SettingsTab = "text" | "image" | "video"

const MEDIA_PROVIDERS: MediaProvider[] = ["off", "skill", "jimeng"]

function ProviderPicker({
  value,
  onChange,
}: {
  value: MediaProvider
  onChange: (p: MediaProvider) => void
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {MEDIA_PROVIDERS.map((p) => (
        <Button
          key={p}
          type="button"
          size="sm"
          variant={value === p ? "default" : "outline"}
          onClick={() => onChange(p)}
        >
          {mediaProviderLabel(p)}
        </Button>
      ))}
    </div>
  )
}

export function ModelSettingsSheet({
  open,
  onOpenChange,
  settings,
  mediaSettings,
  onSave,
  onClear,
}: ModelSettingsSheetProps) {
  const [draft, setDraft] = useState<ModelSettings>(settings)
  const [mediaDraft, setMediaDraft] = useState<MediaSettings>(mediaSettings)
  const [tab, setTab] = useState<SettingsTab>("text")

  useEffect(() => {
    if (open) {
      setDraft(settings)
      setMediaDraft(mediaSettings)
    }
  }, [open, settings, mediaSettings])

  const updateMedia = (patch: Partial<MediaSettings>) => {
    setMediaDraft((m) => normalizeMediaSettings({ ...m, ...patch }))
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings2 className="size-4" />
            模型与媒资设置
          </SheetTitle>
          <SheetDescription>
            API Key / 即梦 AK·SK 仅存于本机 localStorage，不会写入导出 JSON 或提交仓库。
            即梦官方接口见{" "}
            <a
              className="underline"
              href="https://www.volcengine.com/docs/85621"
              target="_blank"
              rel="noreferrer"
            >
              火山引擎视觉文档
            </a>
            。
          </SheetDescription>
        </SheetHeader>

        <div className="flex gap-1 px-4">
          {(
            [
              { id: "text" as SettingsTab, label: "文本模型" },
              { id: "image" as SettingsTab, label: "生图" },
              { id: "video" as SettingsTab, label: "生视频" },
            ] as const
          ).map((t) => (
            <Button
              key={t.id}
              type="button"
              size="sm"
              variant={tab === t.id ? "default" : "outline"}
              className="flex-1"
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </Button>
          ))}
        </div>

        {tab === "text" && (
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
        )}

        {tab === "image" && (
          <div className="flex flex-col gap-4 px-4">
            <div className="space-y-2">
              <Label>生图提供方</Label>
              <ProviderPicker
                value={mediaDraft.imageProvider}
                onChange={(p) => updateMedia({ imageProvider: p })}
              />
            </div>
            {(mediaDraft.imageProvider === "skill" ||
              mediaDraft.videoProvider === "skill") && (
              <SkillFields
                skill={mediaDraft.skill}
                onChange={(skill) => updateMedia({ skill })}
              />
            )}
            {mediaDraft.imageProvider === "jimeng" && (
              <JimengFields
                jimeng={mediaDraft.jimeng}
                showImageKey
                onChange={(jimeng) => updateMedia({ jimeng })}
              />
            )}
            <p className="text-xs text-muted-foreground">
              关闭时使用色块占位；Skill 从分镜节点导出任务 JSON；即梦需本机{" "}
              <code className="text-[10px]">bun run dev</code> 代理签名。
            </p>
          </div>
        )}

        {tab === "video" && (
          <div className="flex flex-col gap-4 px-4">
            <div className="space-y-2">
              <Label>生视频提供方</Label>
              <ProviderPicker
                value={mediaDraft.videoProvider}
                onChange={(p) => updateMedia({ videoProvider: p })}
              />
            </div>
            {(mediaDraft.imageProvider === "skill" ||
              mediaDraft.videoProvider === "skill") && (
              <SkillFields
                skill={mediaDraft.skill}
                onChange={(skill) => updateMedia({ skill })}
              />
            )}
            {mediaDraft.videoProvider === "jimeng" && (
              <JimengFields
                jimeng={mediaDraft.jimeng}
                showVideoKey
                onChange={(jimeng) => updateMedia({ jimeng })}
              />
            )}
            <p className="text-xs text-muted-foreground">
              视频 req_key 示例：<code className="text-[10px]">jimeng_t2v_v30</code>（720p）；
              可改为文档中的 1080p / 图生视频 key。帧数 121≈5s，241≈10s。
            </p>
          </div>
        )}

        <SheetFooter className="flex-row flex-wrap gap-2 justify-between">
          <Button
            type="button"
            variant="ghost"
            className="text-muted-foreground"
            onClick={() => {
              onClear()
              setDraft({ ...DEFAULT_MODEL_SETTINGS })
              setMediaDraft(normalizeMediaSettings(DEFAULT_MEDIA_SETTINGS))
            }}
          >
            清除密钥与配置
          </Button>
          <Button
            type="button"
            onClick={() => {
              onSave(draft, normalizeMediaSettings(mediaDraft))
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

function SkillFields({
  skill,
  onChange,
}: {
  skill: MediaSettings["skill"]
  onChange: (skill: MediaSettings["skill"]) => void
}) {
  return (
    <div className="space-y-3 rounded-md border border-border p-3">
      <p className="text-xs font-medium">Skill 任务包</p>
      <div className="space-y-2">
        <Label htmlFor="skill-id">skillId</Label>
        <input
          id="skill-id"
          className={inputClass}
          value={skill.skillId}
          onChange={(e) => onChange({ ...skill, skillId: e.target.value })}
          placeholder="seedance-20"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="skill-root">skillRootHint（可选）</Label>
        <input
          id="skill-root"
          className={inputClass}
          value={skill.skillRootHint ?? ""}
          onChange={(e) =>
            onChange({ ...skill, skillRootHint: e.target.value || undefined })
          }
          placeholder="本地 skill 目录或说明"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="export-dir">exportDirHint（可选）</Label>
        <input
          id="export-dir"
          className={inputClass}
          value={skill.exportDirHint ?? ""}
          onChange={(e) =>
            onChange({ ...skill, exportDirHint: e.target.value || undefined })
          }
          placeholder="Agent 落盘目录提示"
        />
      </div>
    </div>
  )
}

function JimengFields({
  jimeng,
  onChange,
  showImageKey,
  showVideoKey,
}: {
  jimeng: MediaSettings["jimeng"]
  onChange: (j: MediaSettings["jimeng"]) => void
  showImageKey?: boolean
  showVideoKey?: boolean
}) {
  return (
    <div className="space-y-3 rounded-md border border-border p-3">
      <p className="text-xs font-medium">火山引擎即梦（AK/SK 签名）</p>
      <div className="space-y-2">
        <Label htmlFor="jimeng-ak">AccessKeyId</Label>
        <input
          id="jimeng-ak"
          className={inputClass}
          value={jimeng.accessKeyId}
          onChange={(e) => onChange({ ...jimeng, accessKeyId: e.target.value })}
          autoComplete="off"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="jimeng-sk">SecretAccessKey</Label>
        <input
          id="jimeng-sk"
          type="password"
          className={inputClass}
          value={jimeng.secretAccessKey}
          onChange={(e) => onChange({ ...jimeng, secretAccessKey: e.target.value })}
          autoComplete="off"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="jimeng-region">Region</Label>
        <input
          id="jimeng-region"
          className={inputClass}
          value={jimeng.region}
          onChange={(e) => onChange({ ...jimeng, region: e.target.value })}
          placeholder={DEFAULT_JIMENG_CONFIG.region}
        />
      </div>
      {showImageKey && (
        <div className="space-y-2">
          <Label htmlFor="jimeng-img-key">imageReqKey</Label>
          <input
            id="jimeng-img-key"
            className={inputClass}
            value={jimeng.imageReqKey}
            onChange={(e) => onChange({ ...jimeng, imageReqKey: e.target.value })}
            placeholder="jimeng_t2i_v40"
          />
        </div>
      )}
      {showVideoKey && (
        <>
          <div className="space-y-2">
            <Label htmlFor="jimeng-vid-key">videoReqKey</Label>
            <input
              id="jimeng-vid-key"
              className={inputClass}
              value={jimeng.videoReqKey}
              onChange={(e) => onChange({ ...jimeng, videoReqKey: e.target.value })}
              placeholder="jimeng_t2v_v30"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="jimeng-aspect">宽高比</Label>
            <input
              id="jimeng-aspect"
              className={inputClass}
              value={jimeng.aspectRatio ?? "16:9"}
              onChange={(e) => onChange({ ...jimeng, aspectRatio: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="jimeng-frames">帧数（121 或 241）</Label>
            <input
              id="jimeng-frames"
              type="number"
              className={inputClass}
              value={jimeng.frames ?? 121}
              onChange={(e) =>
                onChange({
                  ...jimeng,
                  frames: Number(e.target.value) === 241 ? 241 : 121,
                })
              }
            />
          </div>
        </>
      )}
    </div>
  )
}

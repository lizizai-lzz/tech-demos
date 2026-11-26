import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import type { PipelineConfig, WardrobeItem } from '@/pipeline/types'
import { useState } from 'react'

interface SettingsSheetProps {
  config: PipelineConfig
  updateConfig: (patch: Partial<PipelineConfig>) => void
}

export function SettingsSheet({ config, updateConfig }: SettingsSheetProps) {
  const [open, setOpen] = useState(false)
  const [newOutfit, setNewOutfit] = useState('')
  const [newColor, setNewColor] = useState('#f472b6')

  const updateWardrobe = (wardrobe: WardrobeItem[]) => {
    updateConfig({ wardrobe })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="outline">工作台设置</Button>} />
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>人设与规则</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-8">
          <section className="space-y-2">
            <Label>主播名</Label>
            <Input
              value={config.persona.name}
              onChange={(e) =>
                updateConfig({
                  persona: { ...config.persona, name: e.target.value },
                })
              }
            />
            <Label>简介</Label>
            <Input
              value={config.persona.description}
              onChange={(e) =>
                updateConfig({
                  persona: { ...config.persona, description: e.target.value },
                })
              }
            />
            <Label>开场白</Label>
            <Input
              value={config.persona.openingLine}
              onChange={(e) =>
                updateConfig({
                  persona: { ...config.persona, openingLine: e.target.value },
                })
              }
            />
          </section>

          <section className="space-y-2">
            <Label>过滤词（逗号分隔）</Label>
            <Input
              value={config.filterKeywords.join('，')}
              onChange={(e) =>
                updateConfig({
                  filterKeywords: e.target.value
                    .split(/[,，]/)
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
          </section>

          <section className="space-y-2">
            <Label>衣柜</Label>
            <ul className="space-y-1 text-sm">
              {config.wardrobe.map((w) => (
                <li
                  key={w.name}
                  className="flex items-center justify-between gap-2 rounded border border-border px-2 py-1"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block size-3 rounded-full"
                      style={{ background: w.color }}
                    />
                    {w.name}
                  </span>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() =>
                      updateWardrobe(
                        config.wardrobe.filter((x) => x.name !== w.name)
                      )
                    }
                  >
                    删除
                  </Button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <Input
                placeholder="新服装名"
                value={newOutfit}
                onChange={(e) => setNewOutfit(e.target.value)}
              />
              <Input
                className="w-24"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
              />
              <Button
                type="button"
                onClick={() => {
                  if (!newOutfit.trim()) return
                  updateWardrobe([
                    ...config.wardrobe,
                    { name: newOutfit.trim(), color: newColor },
                  ])
                  setNewOutfit('')
                }}
              >
                添加
              </Button>
            </div>
          </section>

          <section className="space-y-2">
            <Label>暖场话题（每行一条）</Label>
            <textarea
              className="min-h-24 w-full rounded-lg border border-input bg-transparent px-2 py-2 text-sm"
              value={config.warmupTopics.join('\n')}
              onChange={(e) =>
                updateConfig({
                  warmupTopics: e.target.value
                    .split('\n')
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}

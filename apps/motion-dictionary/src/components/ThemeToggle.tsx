import { Moon, Sun } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

type ThemeToggleProps = {
  dark: boolean
  onDarkChange: (dark: boolean) => void
}

export function ThemeToggle({ dark, onDarkChange }: ThemeToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <Sun className="size-4 text-muted-foreground" aria-hidden />
      <Switch checked={dark} onCheckedChange={onDarkChange} aria-label="深色模式" />
      <Moon className="size-4 text-muted-foreground" aria-hidden />
      <Label className="sr-only">深色模式</Label>
    </div>
  )
}

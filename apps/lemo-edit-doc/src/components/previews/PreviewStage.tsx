import type { StyleSlug } from '@/styles/registry'
import type { ExampleTheme } from '@/themes/example-themes'
import { CaptionNewsPreview } from './CaptionNewsPreview'
import { CitySymphonyPreview } from './CitySymphonyPreview'
import { CountdownPreview } from './CountdownPreview'
import { KinoMontagePreview } from './KinoMontagePreview'
import { NewsPackagePreview } from './NewsPackagePreview'
import { NewsreelPreview } from './NewsreelPreview'
import { TelestratorPreview } from './TelestratorPreview'
import { VisualInvestigationPreview } from './VisualInvestigationPreview'

type PreviewStageProps = {
  slug: StyleSlug
  theme: ExampleTheme
}

export function PreviewStage({ slug, theme }: PreviewStageProps) {
  const inner = (() => {
    switch (slug) {
      case 'caption-news':
        return <CaptionNewsPreview theme={theme} />
      case 'newsreel':
        return <NewsreelPreview theme={theme} />
      case 'countdown':
        return <CountdownPreview theme={theme} />
      case 'city-symphony':
        return <CitySymphonyPreview theme={theme} />
      case 'visual-investigation':
        return <VisualInvestigationPreview theme={theme} />
      case 'kino-montage':
        return <KinoMontagePreview theme={theme} />
      case 'telestrator':
        return <TelestratorPreview theme={theme} />
      case 'news-package':
        return <NewsPackagePreview theme={theme} />
      default:
        return null
    }
  })()

  return (
    <div className="preview-stage relative aspect-video w-full overflow-hidden rounded-xl ring-1 ring-border/80">
      {inner}
    </div>
  )
}

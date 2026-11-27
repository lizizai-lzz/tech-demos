import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core'
import UniverPresetSheetsCoreZhCN from '@univerjs/preset-sheets-core/locales/zh-CN'
import { createUniver, LocaleType, mergeLocales } from '@univerjs/presets'
import '@univerjs/preset-sheets-core/lib/index.css'
import '@univerjs/sheets/facade'
import '@univerjs/sheets-ui/facade'
import { useEffect, useRef } from 'react'
import { buildContentWeeklyWorkbook } from '@/data/workbook-fixture'

export type UniverAPI = ReturnType<typeof createUniver>['univerAPI']

type UniverSheetProps = {
  onReady: (api: UniverAPI) => void
}

export function UniverSheet({ onReady }: UniverSheetProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const onReadyRef = useRef(onReady)
  onReadyRef.current = onReady

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const container = document.createElement('div')
    container.className = 'univer-host'
    host.append(container)

    const { univer, univerAPI } = createUniver({
      locale: LocaleType.ZH_CN,
      locales: {
        [LocaleType.ZH_CN]: mergeLocales(UniverPresetSheetsCoreZhCN),
      },
      presets: [
        UniverSheetsCorePreset({
          container,
          header: true,
          toolbar: true,
          formulaBar: true,
        }),
      ],
    })

    univerAPI.createWorkbook(buildContentWeeklyWorkbook())
    onReadyRef.current(univerAPI)

    return () => {
      queueMicrotask(() => {
        univer.dispose()
        container.remove()
      })
    }
  }, [])

  return <div ref={hostRef} className="univer-host min-h-0 flex-1" />
}
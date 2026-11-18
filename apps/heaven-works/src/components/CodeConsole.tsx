import { useEffect, useRef } from 'react'
import { useSimulation } from '@/context/SimulationContext'
import type { ConsoleToken } from '@/data/console'

const tokenClass: Record<ConsoleToken['type'], string> = {
  plain: 'text-slate-300',
  keyword: 'text-fuchsia-300',
  string: 'text-amber-200',
  comment: 'text-slate-500 italic',
  fn: 'text-cyan-300',
}

export function CodeConsole() {
  const { consoleLines } = useSimulation()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (el) el.scrollTop = el.scrollHeight
  }, [consoleLines])

  return (
    <div
      ref={ref}
      className="scroll-thin min-h-0 flex-1 overflow-y-auto rounded bg-black/50 p-2 font-mono text-[9px] leading-relaxed"
    >
      {consoleLines.map((line) => (
        <div key={`${line.num}-${line.tokens[0]?.text}`} className="flex gap-2">
          <span className="w-6 shrink-0 text-right text-slate-600">{line.num}</span>
          <span>
            {line.tokens.map((tok, i) => (
              <span key={i} className={tokenClass[tok.type]}>
                {tok.text}
              </span>
            ))}
          </span>
        </div>
      ))}
    </div>
  )
}

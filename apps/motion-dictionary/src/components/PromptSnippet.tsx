import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

type PromptSnippetProps = {
  text: string
}

export function PromptSnippet({ text }: PromptSnippetProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">可复制提示词</span>
        <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? '已复制' : '复制'}
        </Button>
      </div>
      <pre className="max-h-40 overflow-auto rounded-lg border bg-muted/40 p-3 text-left text-xs leading-relaxed whitespace-pre-wrap">
        {text}
      </pre>
    </div>
  )
}

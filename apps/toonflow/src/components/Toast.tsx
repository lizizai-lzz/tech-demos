import { cn } from "@/lib/utils"
import { useEffect } from "react"

interface ToastProps {
  message: string | null
  onDismiss: () => void
  durationMs?: number
}

export function Toast({ message, onDismiss, durationMs = 2800 }: ToastProps) {
  useEffect(() => {
    if (!message) return
    const t = setTimeout(onDismiss, durationMs)
    return () => clearTimeout(t)
  }, [message, onDismiss, durationMs])

  if (!message) return null

  return (
    <div
      role="status"
      className={cn(
        "pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2",
        "rounded-lg border border-border bg-card px-4 py-2 text-sm shadow-lg",
        "animate-in fade-in slide-in-from-bottom-2"
      )}
    >
      {message}
    </div>
  )
}

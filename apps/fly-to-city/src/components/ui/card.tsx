import { cn } from '@/lib/utils'

export function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('rounded-xl border border-border bg-card/95 text-card-foreground shadow-sm backdrop-blur', className)}
      {...props}
    />
  )
}

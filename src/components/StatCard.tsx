import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'

export function StatCard({
  icon,
  label,
  value,
  hint,
  highlight = false,
}: {
  icon: React.ReactNode
  label: string
  value: string
  hint?: string
  highlight?: boolean
}) {
  return (
    <Card
      className={cn(
        'gap-0 py-0',
        highlight && 'border-primary/40 bg-primary/5',
      )}
    >
      <CardContent className="p-4">
        <div
          className={cn(
            'eyebrow flex items-center gap-1.5',
            highlight && 'text-primary',
          )}
        >
          <span className={highlight ? 'text-primary' : 'text-muted-foreground/70'}>
            {icon}
          </span>
          {label}
        </div>
        <div
          className={cn(
            'mt-2 font-mono text-2xl font-medium tracking-tight tabular-nums',
            highlight && 'text-primary',
          )}
        >
          {value}
        </div>
        {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  )
}

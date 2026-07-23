import { useEffect, useRef, useState } from 'react'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const pad = (n: number) => String(n).padStart(2, '0')
const HOURS = Array.from({ length: 24 }, (_, i) => pad(i))
const MINUTES = Array.from({ length: 60 }, (_, i) => pad(i))

/**
 * Time picker with scrollable hour/minute columns. Value is "HH:mm" (or "").
 * Selection applies live — no confirm step.
 */
export function TimePicker({
  id,
  value,
  onChange,
  placeholder = 'Set time',
  className,
}: {
  id?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [hh, mm] = value ? value.split(':') : ['', '']

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className={cn(
            'w-full justify-start font-normal tabular-nums',
            value ? 'font-mono' : 'text-muted-foreground',
            className,
          )}
        >
          <Clock className="size-4" />
          {value || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-1.5" align="start">
        <div className="flex gap-1">
          <Column
            label="Hr"
            items={HOURS}
            selected={hh}
            open={open}
            onSelect={(h) => onChange(`${h}:${mm || '00'}`)}
          />
          <Column
            label="Min"
            items={MINUTES}
            selected={mm}
            open={open}
            onSelect={(m) => onChange(`${hh || '00'}:${m}`)}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

function Column({
  label,
  items,
  selected,
  open,
  onSelect,
}: {
  label: string
  items: string[]
  selected: string
  open: boolean
  onSelect: (v: string) => void
}) {
  const selectedRef = useRef<HTMLButtonElement>(null)

  // Center the selected value when the popover opens.
  useEffect(() => {
    if (open) selectedRef.current?.scrollIntoView({ block: 'center' })
  }, [open])

  return (
    <div className="flex flex-col">
      <div className="eyebrow pb-1 text-center">{label}</div>
      <div className="thin-scroll h-44 w-12 overflow-y-auto">
        {items.map((it) => (
          <button
            key={it}
            ref={it === selected ? selectedRef : null}
            type="button"
            onClick={() => onSelect(it)}
            className={cn(
              'w-full rounded-md py-1 text-center font-mono text-sm tabular-nums transition-colors',
              it === selected
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent hover:text-accent-foreground',
            )}
          >
            {it}
          </button>
        ))}
      </div>
    </div>
  )
}

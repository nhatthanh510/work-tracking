import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { fmtDateLabel, todayISO } from '@/lib/time'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

/** Single-date picker using the same calendar as the range filter. Value is YYYY-MM-DD. */
export function DatePicker({
  id,
  value,
  onChange,
  className,
}: {
  id?: string
  value: string
  onChange: (v: string) => void
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const date = value ? new Date(`${value}T00:00:00`) : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className={cn(
            'w-full justify-start font-normal',
            !value && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarDays className="size-4" />
          {value ? fmtDateLabel(value) : 'Pick a date'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <Calendar
          mode="single"
          defaultMonth={date}
          selected={date}
          onSelect={(d) => {
            if (d) {
              onChange(todayISO(d))
              setOpen(false)
            }
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

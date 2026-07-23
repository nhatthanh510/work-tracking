import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { type DateRange as RdpRange } from 'react-day-picker'
import type { DateRange, RangePreset } from '@/lib/types'
import { presetRange, fmtRangeLabel, fmtDateLabel, todayISO } from '@/lib/time'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const PRESETS: { key: Exclude<RangePreset, 'custom'>; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'thisWeek', label: 'This week' },
  { key: 'lastWeek', label: 'Last week' },
  { key: 'thisMonth', label: 'This month' },
]

const toDate = (s: string) => new Date(`${s}T00:00:00`)

export function Filters({
  preset,
  range,
  onPreset,
  onRange,
}: {
  preset: RangePreset
  range: DateRange
  onPreset: (p: Exclude<RangePreset, 'custom'>, r: DateRange) => void
  onRange: (r: DateRange) => void
}) {
  const [open, setOpen] = useState(false)
  // The calendar's in-progress selection. Preloaded with the committed range
  // on open; the user can re-pick as many times as they like, then Apply.
  const [draft, setDraft] = useState<RdpRange | undefined>()

  const complete = !!(draft?.from && draft?.to)

  const draftLabel = draft?.from
    ? draft.to
      ? fmtRangeLabel({ from: todayISO(draft.from), to: todayISO(draft.to) })
      : `${fmtDateLabel(todayISO(draft.from))} → pick end`
    : 'Select a start and end date'

  function apply() {
    if (draft?.from && draft?.to) {
      onRange({ from: todayISO(draft.from), to: todayISO(draft.to) })
      setOpen(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <div className="bg-muted/60 inline-flex rounded-lg p-0.5">
        {PRESETS.map(({ key, label }) => {
          const active = preset === key
          return (
            <button
              key={key}
              onClick={() => onPreset(key, presetRange(key))}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
            </button>
          )
        })}
      </div>

      <Popover
        open={open}
        onOpenChange={(o) => {
          setOpen(o)
          // Preload the committed range so it's highlighted when reopened.
          if (o) setDraft({ from: toDate(range.from), to: toDate(range.to) })
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant={preset === 'custom' ? 'default' : 'outline'}
            className={cn(preset !== 'custom' && 'text-muted-foreground')}
          >
            <CalendarDays className="size-4" />
            {preset === 'custom' ? fmtRangeLabel(range) : 'Custom'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="start">
          <Calendar
            mode="range"
            min={1}
            resetOnSelect
            defaultMonth={toDate(range.from)}
            selected={draft}
            onSelect={setDraft}
          />
          <div className="mt-3 flex items-center justify-between gap-3 border-t pt-3">
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              {draftLabel}
            </span>
            <div className="flex gap-1.5">
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" disabled={!complete} onClick={apply}>
                Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

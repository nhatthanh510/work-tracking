import { minutesOfDay } from '@/lib/time'
import { cn } from '@/lib/utils'

// The working window the bar spans: 06:00 – 22:00 (16 hours).
const WIN_START = 6 * 60
const WIN_END = 22 * 60
const WIN = WIN_END - WIN_START

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))
const frac = (min: number) => clamp01((min - WIN_START) / WIN)

const TICKS = [6, 9, 12, 15, 18, 21]
const tickLabel = (h: number) =>
  h === 12 ? '12p' : h < 12 ? `${h}a` : `${h - 12}p`

/**
 * The signature element: a day's working window with check-in / check-out
 * placed on it and the worked span filled. `nowMs` (when checked in but not
 * out) grows the fill live to the current time.
 */
export function DayBar({
  checkIn,
  checkOut,
  nowMs,
  variant = 'hero',
  className,
}: {
  checkIn: string | null
  checkOut: string | null
  nowMs?: number | null
  variant?: 'hero' | 'mini'
  className?: string
}) {
  const startMin = checkIn ? minutesOfDay(checkIn) : null
  const endMin = checkOut
    ? minutesOfDay(checkOut)
    : nowMs != null && checkIn
      ? minutesOfDay(new Date(nowMs).toISOString())
      : null

  const left = startMin != null ? frac(startMin) : 0
  const right = endMin != null ? frac(endMin) : left
  const running = !!checkIn && !checkOut

  if (variant === 'mini') {
    return (
      <div
        className={cn('bg-track relative h-1.5 w-full overflow-hidden rounded-full', className)}
      >
        {startMin != null && endMin != null && (
          <div
            className="bg-primary absolute inset-y-0 rounded-full"
            style={{ left: `${left * 100}%`, width: `${Math.max(0, right - left) * 100}%` }}
          />
        )}
      </div>
    )
  }

  return (
    <div className={cn('select-none', className)}>
      <div className="daybar-ticks bg-track relative h-11 overflow-hidden rounded-md">
        {/* worked span */}
        {startMin != null && (
          <div
            className={cn(
              'bg-primary/85 absolute inset-y-0 transition-[width,left] duration-700 ease-out',
              running && 'bg-primary/80',
            )}
            style={{ left: `${left * 100}%`, width: `${Math.max(0, right - left) * 100}%` }}
          />
        )}
        {/* check-in marker */}
        {startMin != null && (
          <Marker frac={left} tone="in" />
        )}
        {/* check-out / now marker */}
        {endMin != null && (right - left > 0.001 || checkOut) && (
          <Marker frac={right} tone={checkOut ? 'out' : 'now'} pulse={running} />
        )}
      </div>
      <div className="mt-1.5 flex justify-between">
        {TICKS.map((h) => (
          <span key={h} className="font-mono text-[10px] text-muted-foreground/70">
            {tickLabel(h)}
          </span>
        ))}
      </div>
    </div>
  )
}

function Marker({
  frac,
  tone,
  pulse,
}: {
  frac: number
  tone: 'in' | 'out' | 'now'
  pulse?: boolean
}) {
  return (
    <div
      className="absolute inset-y-0 z-10 flex items-center"
      style={{ left: `${frac * 100}%`, transform: 'translateX(-50%)' }}
    >
      <div
        className={cn(
          'h-full w-0.5',
          tone === 'now' ? 'bg-foreground' : 'bg-background/70',
        )}
      />
      {tone === 'now' && pulse && (
        <span className="bg-foreground absolute top-1 left-1/2 size-1.5 -translate-x-1/2 rounded-full">
          <span className="bg-foreground/60 absolute inset-0 animate-ping rounded-full" />
        </span>
      )}
    </div>
  )
}

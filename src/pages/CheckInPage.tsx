import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CalendarRange, CalendarDays, ArrowRight } from 'lucide-react'
import {
  monthRange,
  sumHours,
  fmtHours,
  isoWeekKey,
  todayISO,
  fmtTime,
  fmtDateLabel,
  weekdayShort,
  hoursBetween,
} from '@/lib/time'
import { useEntries } from '@/lib/useEntries'
import { TodayPanel } from '@/components/TodayPanel'
import { StatCard } from '@/components/StatCard'
import { DayBar } from '@/components/DayBar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

export function CheckInPage() {
  const range = useMemo(() => monthRange(), [])
  const { entries, loading, error } = useEntries(range)

  const today = useMemo(
    () => entries.find((e) => e.work_date === todayISO()) ?? null,
    [entries],
  )
  const thisWeekKey = isoWeekKey(todayISO())
  const weekHours = sumHours(
    entries.filter((e) => isoWeekKey(e.work_date) === thisWeekKey),
  )
  const monthHours = sumHours(entries)
  const recent = entries.slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Check in / out</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          One tap to start the clock. The bar shows your day taking shape.
        </p>
      </div>

      {loading ? (
        <CheckInSkeleton />
      ) : error ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      ) : (
        <>
          <TodayPanel today={today} />

          <div className="grid grid-cols-2 gap-4">
            <StatCard
              icon={<CalendarRange className="size-4" />}
              label="This week"
              value={fmtHours(weekHours) || '0h 00m'}
            />
            <StatCard
              icon={<CalendarDays className="size-4" />}
              label="This month"
              value={fmtHours(monthHours) || '0h 00m'}
            />
          </div>

          <Card>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium">Recent days</h2>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/records">
                    View all
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
              {recent.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No entries yet this month.
                </p>
              ) : (
                <ul className="divide-y">
                  {recent.map((e) => {
                    const hrs = hoursBetween(e.check_in, e.check_out)
                    const incomplete = !e.check_in || !e.check_out
                    return (
                      <li
                        key={e.id}
                        className="flex items-center justify-between gap-4 py-2.5"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="text-sm font-medium tabular-nums">
                            {fmtDateLabel(e.work_date)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {weekdayShort(e.work_date)}
                          </span>
                          {incomplete && (
                            <Badge variant="warning" className="text-[11px]">
                              Incomplete
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 font-mono text-sm tabular-nums">
                          <DayBar
                            variant="mini"
                            checkIn={e.check_in}
                            checkOut={e.check_out}
                            className="hidden w-24 sm:block"
                          />
                          <span className="text-muted-foreground">
                            {fmtTime(e.check_in) || '—'} – {fmtTime(e.check_out) || '—'}
                          </span>
                          <span className="w-16 text-right font-medium">
                            {hrs == null ? '—' : fmtHours(hrs)}
                          </span>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

function CheckInSkeleton() {
  return (
    <>
      <Card>
        <CardContent className="flex flex-col gap-6 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-9 w-40" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-11 w-32 rounded-md" />
          </div>
          <Skeleton className="h-11 w-full rounded-md" />
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-[4.75rem] w-full rounded-xl" />
        <Skeleton className="h-[4.75rem] w-full rounded-xl" />
      </div>
      <Card>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-24" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between py-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-40" />
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  )
}

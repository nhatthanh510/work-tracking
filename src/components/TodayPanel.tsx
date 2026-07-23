import { useEffect, useState } from 'react'
import { LogIn, LogOut, Loader2, Check } from 'lucide-react'
import type { TimeEntry } from '@/lib/types'
import {
  fmtTime,
  fmtHours,
  fmtHMS,
  hoursBetween,
  fmtDateLabel,
  weekdayShort,
  todayISO,
} from '@/lib/time'
import { useEntryMutations } from '@/lib/useEntryMutations'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DayBar } from '@/components/DayBar'

/** `today` comes from the page's entries list so we don't fetch it twice. */
export function TodayPanel({ today }: { today: TimeEntry | null }) {
  const { checkIn, checkOut } = useEntryMutations()
  const [now, setNow] = useState(() => Date.now())

  const running = !!today?.check_in && !today?.check_out
  const busy = checkIn.isPending || checkOut.isPending
  const mutError = checkIn.error ?? checkOut.error
  const error = mutError instanceof Error ? mutError.message : null

  // Tick every second only while the clock is running.
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [running])

  const checkedIn = today?.check_in ?? null
  const checkedOut = today?.check_out ?? null
  const elapsedMs = checkedIn ? now - new Date(checkedIn).getTime() : 0
  const doneHours = hoursBetween(checkedIn, checkedOut)

  return (
    <Card className="overflow-hidden py-0">
      <CardContent className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="eyebrow">
              Today · {fmtDateLabel(todayISO())} {weekdayShort(todayISO())}
            </p>

            {!checkedIn && (
              <p className="font-display text-3xl font-medium tracking-tight">
                Off the clock
              </p>
            )}
            {running && (
              <div>
                <p className="font-mono text-4xl font-medium tabular-nums text-primary">
                  {fmtHMS(elapsedMs)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Running since {fmtTime(checkedIn)}
                </p>
              </div>
            )}
            {checkedIn && checkedOut && (
              <div>
                <p className="font-mono text-4xl font-medium tabular-nums">
                  {fmtHours(doneHours)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {fmtTime(checkedIn)} — {fmtTime(checkedOut)}
                </p>
              </div>
            )}
          </div>

          <div className="shrink-0">
            {!checkedIn && (
              <Button size="lg" disabled={busy} onClick={() => checkIn.mutate()}>
                {busy ? <Loader2 className="animate-spin" /> : <LogIn />}
                Check in
              </Button>
            )}
            {running && (
              <Button
                size="lg"
                variant="destructive"
                disabled={busy}
                onClick={() => checkOut.mutate()}
              >
                {busy ? <Loader2 className="animate-spin" /> : <LogOut />}
                Check out
              </Button>
            )}
            {checkedIn && checkedOut && (
              <div className="border-success/30 bg-success/10 text-success flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium">
                <Check className="size-4" />
                Logged for today
              </div>
            )}
          </div>
        </div>

        <DayBar
          checkIn={checkedIn}
          checkOut={checkedOut}
          nowMs={running ? now : null}
        />

        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Download, Timer, CalendarDays, TrendingUp, FileText } from 'lucide-react'
import type { DateRange, RangePreset } from '@/lib/types'
import { presetRange, sumHours, fmtHours } from '@/lib/time'
import { toCSV, downloadCSV } from '@/lib/csv'
import { useEntries } from '@/lib/useEntries'
import { StatCard } from '@/components/StatCard'
import { Filters } from '@/components/Filters'
import { EntryTable, EntryTableSkeleton } from '@/components/EntryTable'
import { ManualEntryForm } from '@/components/ManualEntryForm'
import { TablePagination } from '@/components/TablePagination'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const PAGE_SIZE = 8

export function RecordsPage() {
  const [preset, setPreset] = useState<RangePreset>('all')
  const [range, setRange] = useState<DateRange>(() => presetRange('all'))
  const [page, setPage] = useState(1)
  const { entries, loading, error } = useEntries(range)

  // Reset to the first page whenever the range changes.
  useEffect(() => {
    setPage(1)
  }, [range.from, range.to])

  const total = useMemo(() => sumHours(entries), [entries])
  const daysTracked = entries.filter((e) => e.check_in && e.check_out).length
  const avgPerDay = daysTracked ? total / daysTracked : 0

  const paged = useMemo(
    () => entries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [entries, page],
  )

  function exportCsv() {
    const name =
      preset === 'all'
        ? 'timesheet-all'
        : `timesheet-${range.from}_to_${range.to}`
    downloadCSV(`${name}.csv`, toCSV(entries))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Records</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Review, filter, fix a forgotten punch, and export your hours.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading ? (
          [0, 1, 2, 3].map((i) => (
            <Card key={i} className="gap-0 py-0">
              <CardContent className="p-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="mt-2 h-8 w-16" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <StatCard
              icon={<Timer className="size-4" />}
              label="Total working hours"
              value={fmtHours(total) || '0h 00m'}
              highlight
            />
            <StatCard
              icon={<CalendarDays className="size-4" />}
              label="Days tracked"
              value={String(daysTracked)}
            />
            <StatCard
              icon={<TrendingUp className="size-4" />}
              label="Avg / day"
              value={fmtHours(avgPerDay) || '—'}
            />
            <StatCard
              icon={<Clock className="size-4" />}
              label="Entries"
              value={String(entries.length)}
            />
          </>
        )}
      </div>

      <Card>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Filters
              preset={preset}
              range={range}
              onPreset={(p, r) => {
                setPreset(p)
                setRange(r)
              }}
              onRange={(r) => {
                setPreset('custom')
                setRange(r)
              }}
            />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="flex-1 sm:flex-none"
                onClick={exportCsv}
                disabled={!entries.length}
              >
                <Download className="size-4" />
                Export CSV
              </Button>
              <Button asChild className="flex-1 sm:flex-none">
                <Link to={`/report?from=${range.from}&to=${range.to}`}>
                  <FileText className="size-4" />
                  Report
                </Link>
              </Button>
            </div>
          </div>

          {error ? (
            <div className="py-10 text-center text-sm text-destructive">{error}</div>
          ) : loading ? (
            <EntryTableSkeleton />
          ) : (
            <>
              <EntryTable entries={paged} />
              <TablePagination
                page={page}
                pageSize={PAGE_SIZE}
                total={entries.length}
                onPage={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      <ManualEntryForm />
    </div>
  )
}

import type { TimeEntry, PeriodTotal, DateRange, RangePreset } from './types'

// Pure time / date helpers. All dates are handled in the browser's local timezone.

const pad = (n: number) => String(n).padStart(2, '0')

/** Local YYYY-MM-DD for a Date (or today if omitted). */
export function todayISO(date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** First / last day of the current month as local YYYY-MM-DD. */
export function monthRange(date = new Date()): DateRange {
  const from = new Date(date.getFullYear(), date.getMonth(), 1)
  const to = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  return { from: todayISO(from), to: todayISO(to) }
}

/** Monday of the week containing `date`, `offsetWeeks` weeks away. */
function mondayOf(date: Date, offsetWeeks = 0): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = (d.getDay() + 6) % 7 // Mon=0 .. Sun=6
  d.setDate(d.getDate() - day + offsetWeeks * 7)
  return d
}

/** Mon–Sun range for the week `offsetWeeks` from the current week. */
export function weekRange(offsetWeeks = 0, date = new Date()): DateRange {
  const mon = mondayOf(date, offsetWeeks)
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  return { from: todayISO(mon), to: todayISO(sun) }
}

// Sentinel bounds for the "All" preset (covers every possible entry date).
export const ALL_FROM = '1900-01-01'
export const ALL_TO = '9999-12-31'

/** True when the range is the "All" sentinel (not a real user-picked span). */
export function isUnboundedRange(range: DateRange): boolean {
  return range.from <= ALL_FROM || range.to >= ALL_TO
}

/** Resolve a named preset to a concrete date range. */
export function presetRange(preset: Exclude<RangePreset, 'custom'>): DateRange {
  switch (preset) {
    case 'all':
      return { from: ALL_FROM, to: ALL_TO }
    case 'thisWeek':
      return weekRange(0)
    case 'lastWeek':
      return weekRange(-1)
    case 'thisMonth':
      return monthRange()
  }
}

/** Numeric "DD-MM" for a YYYY-MM-DD string. */
function ddmm(dateStr: string): string {
  const [, m, d] = dateStr.split('-')
  return `${d}-${m}`
}

/** Numeric "DD-MM-YYYY" for a YYYY-MM-DD string. */
export function fmtDateFull(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${d}-${m}-${y}`
}

/** "15-07-2026 → 23-07-2026" style label for a range (numeric, no month names). */
export function fmtRangeLabel({ from, to }: DateRange): string {
  if (from === to) return fmtDateFull(from)
  return `${fmtDateFull(from)} → ${fmtDateFull(to)}`
}

/**
 * Period label for a report. If the range is unbounded ("All"), use the actual
 * span of the entries instead of the sentinel dates; falls back to "All time".
 */
export function reportPeriodLabel(range: DateRange, entries: TimeEntry[]): string {
  if (!isUnboundedRange(range)) return fmtRangeLabel(range)
  if (!entries.length) return 'All time'
  const dates = entries.map((e) => e.work_date)
  const from = dates.reduce((a, b) => (a < b ? a : b))
  const to = dates.reduce((a, b) => (a > b ? a : b))
  return fmtRangeLabel({ from, to })
}

/**
 * Decimal hours between two ISO timestamps, or null if either is missing/invalid.
 * Both ends are floored to the minute so the total always matches the HH:MM the
 * UI displays (e.g. 15:21 → 15:22 is exactly 1 minute, regardless of seconds).
 */
export function hoursBetween(
  checkIn: string | null,
  checkOut: string | null,
): number | null {
  if (!checkIn || !checkOut) return null
  const floorToMinute = (iso: string) => {
    const d = new Date(iso)
    d.setSeconds(0, 0)
    return d.getTime()
  }
  const ms = floorToMinute(checkOut) - floorToMinute(checkIn)
  if (Number.isNaN(ms) || ms < 0) return null
  return ms / 3_600_000
}

/** "7h 30m" from decimal hours; "" for null. */
export function fmtHours(dec: number | null): string {
  if (dec == null) return ''
  const totalMin = Math.round(dec * 60)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return `${h}h ${pad(m)}m`
}

/** Local HH:mm for an ISO timestamp, or "" if missing. */
export function fmtTime(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Local minutes since midnight for an ISO timestamp. */
export function minutesOfDay(iso: string): number {
  const d = new Date(iso)
  return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60
}

/** "H:MM:SS" from a millisecond span (for the live running clock). */
export function fmtHMS(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${h}:${pad(m)}:${pad(sec)}`
}

/** Numeric day label "DD-MM" (no month-name translation). */
export function fmtDateLabel(dateStr: string): string {
  return ddmm(dateStr)
}

/** Short weekday for a YYYY-MM-DD string, e.g. "Thu". */
export function weekdayShort(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
  })
}

/**
 * Validate a same-day check-in / check-out pair ("HH:mm" strings).
 * Returns an error message, or null when valid. Empty sides are allowed
 * (an entry may be missing a punch); only a set pair is compared.
 */
export function timeRangeError(
  checkIn: string,
  checkOut: string,
): string | null {
  if (checkIn && checkOut && checkOut <= checkIn) {
    return 'Check-out must be after check-in.'
  }
  return null
}

/** ISO string from a "YYYY-MM-DDTHH:mm" local datetime string. */
export function fromDatetimeLocal(value: string): string | null {
  if (!value) return null
  return new Date(value).toISOString()
}

/** ISO-8601 week key like "2026-W30" for a local YYYY-MM-DD string. */
export function isoWeekKey(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`)
  const day = (d.getDay() + 6) % 7 // Mon=0 .. Sun=6
  d.setDate(d.getDate() - day + 3) // Thursday of this week
  const firstThursday = new Date(d.getFullYear(), 0, 4)
  const firstDay = (firstThursday.getDay() + 6) % 7
  firstThursday.setDate(firstThursday.getDate() - firstDay + 3)
  const week =
    1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * 24 * 3_600_000))
  return `${d.getFullYear()}-W${pad(week)}`
}

/** Month key like "2026-07" for a local YYYY-MM-DD string. */
export function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7)
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

function monthLabel(key: string): string {
  const [y, m] = key.split('-')
  return `${MONTHS[Number(m) - 1]} ${y}`
}

/** Week label like "Wk of 14-07" (the Monday of that date's week). */
function weekLabelOf(dateStr: string): string {
  const mon = mondayOf(new Date(`${dateStr}T00:00:00`))
  return `Wk of ${pad(mon.getDate())}-${pad(mon.getMonth() + 1)}`
}

/**
 * Group entries into period totals for weekly/monthly views.
 * Returns totals sorted newest-first.
 */
export function groupTotals(
  entries: TimeEntry[],
  mode: 'week' | 'month',
): PeriodTotal[] {
  const map = new Map<string, PeriodTotal>()
  for (const e of entries) {
    const key = mode === 'week' ? isoWeekKey(e.work_date) : monthKey(e.work_date)
    const hours = hoursBetween(e.check_in, e.check_out) ?? 0
    const cur =
      map.get(key) ??
      ({
        key,
        label: mode === 'week' ? weekLabelOf(e.work_date) : monthLabel(key),
        totalHours: 0,
        days: 0,
      } as PeriodTotal)
    cur.totalHours += hours
    cur.days += 1
    map.set(key, cur)
  }
  return [...map.values()].sort((a, b) => (a.key < b.key ? 1 : -1))
}

/** Sum of decimal hours across entries. */
export function sumHours(entries: TimeEntry[]): number {
  return entries.reduce(
    (acc, e) => acc + (hoursBetween(e.check_in, e.check_out) ?? 0),
    0,
  )
}

export interface TimeEntry {
  id: string
  /** Local calendar day, YYYY-MM-DD */
  work_date: string
  /** ISO timestamp or null if not recorded */
  check_in: string | null
  check_out: string | null
  note: string | null
}

/** Shape used when creating / updating an entry (id assigned by the store). */
export interface EntryInput {
  work_date: string
  check_in: string | null
  check_out: string | null
  note: string | null
}

export type ViewMode = 'entries' | 'week' | 'month'

export type RangePreset =
  | 'all'
  | 'today'
  | 'thisWeek'
  | 'lastWeek'
  | 'thisMonth'
  | 'custom'

export interface DateRange {
  from: string
  to: string
}

export interface PeriodTotal {
  key: string
  label: string
  totalHours: number
  days: number
}

export interface Profile {
  full_name: string | null
  employer_name: string | null
  role: string | null
}

/** Immutable snapshot stored behind a shareable link. */
export interface ReportPayload {
  profile: Profile
  range: DateRange
  generatedAt: string
  entries: TimeEntry[]
  totalHours: number
  daysTracked: number
}

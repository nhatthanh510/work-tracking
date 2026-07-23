import type { TimeEntry } from './types'
import { hoursBetween, fmtTime, fmtHours, sumHours, fmtDateLabel } from './time'

const escape = (val: unknown): string => {
  const s = val == null ? '' : String(val)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/**
 * CSV matching what the Records table shows:
 *   Date, Check-in, Check-out, Working hours, Note
 * The overall total is placed at the top as a summary, above the table.
 */
export function toCSV(entries: TimeEntry[]): string {
  const summary = ['TOTAL WORKING HOURS', fmtHours(sumHours(entries)) || '0h 00m']
    .map(escape)
    .join(',')

  const header = ['Date', 'Check-in', 'Check-out', 'Working hours', 'Note']

  const rows = entries.map((e) => {
    const hrs = hoursBetween(e.check_in, e.check_out)
    return [
      fmtDateLabel(e.work_date),
      fmtTime(e.check_in) || '—',
      fmtTime(e.check_out) || '—',
      hrs == null ? '—' : fmtHours(hrs),
      e.note ?? '',
    ]
      .map(escape)
      .join(',')
  })

  // Summary, blank spacer row, then the table.
  return [summary, '', header.join(','), ...rows].join('\n')
}

/** Trigger a browser download of the given text as filename. */
export function downloadCSV(filename: string, text: string): void {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

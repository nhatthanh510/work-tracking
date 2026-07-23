import type { ReportPayload } from '@/lib/types'
import { cn } from '@/lib/utils'
import { CONTACT_EMAIL } from '@/lib/config'
import {
  fmtDateLabel,
  weekdayShort,
  fmtTime,
  fmtHours,
  hoursBetween,
  reportPeriodLabel,
  fmtDateFull,
  todayISO,
  groupTotals,
} from '@/lib/time'

/**
 * A print-ready timesheet document. Deliberately styled with fixed light
 * colours (not theme tokens) so the on-screen preview, the shared link, and
 * the printed PDF all look identical and ink-friendly.
 *
 * `fixed` forces the full desktop layout regardless of viewport — used for the
 * off-screen PDF capture so the exported document never picks up the narrow
 * mobile arrangement.
 */
export function ReportView({
  report,
  fixed = false,
}: {
  report: ReportPayload
  fixed?: boolean
}) {
  const { profile, range, generatedAt, entries, totalHours, daysTracked } = report
  const name = profile.full_name?.trim() || 'Employee'
  const weeks = groupTotals(entries, 'week')
  const generated = fmtDateFull(todayISO(new Date(generatedAt)))

  return (
    <div
      data-report
      className={cn(
        'mx-auto w-full max-w-3xl rounded-xl border border-neutral-200 bg-white text-neutral-900 shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none',
        fixed ? 'p-8' : 'p-5 sm:p-8',
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'flex border-b border-neutral-200 pb-5',
          fixed
            ? 'flex-row items-start justify-between gap-6'
            : 'flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6',
        )}
      >
        <div>
          <p className="font-mono text-[11px] font-medium tracking-[0.18em] text-[#0e6e62] uppercase">
            Timesheet
          </p>
          <h1
            className={cn(
              'font-display mt-1 font-bold tracking-tight',
              fixed ? 'text-2xl' : 'text-xl sm:text-2xl',
            )}
          >
            {reportPeriodLabel(range, entries)}
          </h1>
        </div>
        <div className={cn('text-sm', fixed ? 'text-right' : 'sm:text-right')}>
          <p className="font-semibold">{name}</p>
          {profile.role && <p className="text-neutral-500">{profile.role}</p>}
          {profile.employer_name && (
            <p className="mt-1 text-neutral-500">
              For <span className="text-neutral-700">{profile.employer_name}</span>
            </p>
          )}
        </div>
      </div>

      {/* Summary strip */}
      <div
        className={cn(
          'my-6 grid',
          fixed ? 'grid-cols-3 gap-4' : 'grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4',
        )}
      >
        <Stat label="Total working hours" value={fmtHours(totalHours) || '0h 00m'} accent />
        <Stat label="Days worked" value={String(daysTracked)} />
        <Stat label="Generated" value={generated} />
      </div>

      {/* Weekly summary (only when the period spans multiple weeks) */}
      {weeks.length > 1 && (
        <div className="mb-6">
          <p className="mb-2 font-mono text-[11px] font-medium tracking-[0.12em] text-neutral-500 uppercase">
            Weekly summary
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {weeks.map((w) => (
              <div
                key={w.key}
                className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-1.5 text-sm"
              >
                <span className="text-neutral-500">{w.label}</span>
                <span className="font-mono tabular-nums">{fmtHours(w.totalHours)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Entries */}
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-neutral-300 text-left">
            <Th>Date</Th>
            <Th>Check-in</Th>
            <Th>Check-out</Th>
            <Th className="text-right">Hours</Th>
            <Th>Note</Th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => {
            const hrs = hoursBetween(e.check_in, e.check_out)
            return (
              <tr key={e.id} className="border-b border-neutral-100">
                <Td className="font-medium tabular-nums">
                  {fmtDateLabel(e.work_date)}{' '}
                  <span className="font-normal text-neutral-400">
                    {weekdayShort(e.work_date)}
                  </span>
                </Td>
                <Td className="font-mono tabular-nums">{fmtTime(e.check_in) || '—'}</Td>
                <Td className="font-mono tabular-nums">{fmtTime(e.check_out) || '—'}</Td>
                <Td className="text-right font-mono tabular-nums">
                  {hrs == null ? '—' : fmtHours(hrs)}
                </Td>
                <Td className="text-neutral-600">{e.note}</Td>
              </tr>
            )
          })}
          {!entries.length && (
            <tr>
              <Td className="py-6 text-center text-neutral-400" colSpan={5}>
                No entries in this period.
              </Td>
            </tr>
          )}
          <tr className="border-t-2 border-neutral-300 font-semibold">
            <Td colSpan={3}>Total</Td>
            <Td className="text-right font-mono tabular-nums text-[#0e6e62]">
              {fmtHours(totalHours) || '0h 00m'}
            </Td>
            <Td />
          </tr>
        </tbody>
      </table>

      {/* Confirmation / signature */}
      <div
        className={cn(
          'mt-8 flex text-sm',
          fixed
            ? 'flex-row items-end justify-between gap-8'
            : 'flex-col gap-6 sm:flex-row sm:items-end sm:justify-between sm:gap-8',
        )}
      >
        <p className="max-w-xs text-neutral-500">
          I confirm the hours recorded above are accurate.
        </p>
        <div className={fixed ? 'text-right' : 'sm:text-right'}>
          <div className="mb-1 h-8 w-full max-w-56 border-b border-neutral-400" />
          <p className="text-neutral-500">
            {name}
            {profile.employer_name ? ` · ${profile.employer_name}` : ''}
          </p>
        </div>
      </div>

      {/* Credit */}
      <p className="mt-6 border-t border-neutral-100 pt-3 text-center text-[11px] text-neutral-400">
        © {new Date(generatedAt).getFullYear()} {CONTACT_EMAIL} · Timesheet
      </p>
    </div>
  )
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="rounded-lg border border-neutral-200 p-3">
      <p className="font-mono text-[10px] font-medium tracking-[0.1em] text-neutral-500 uppercase">
        {label}
      </p>
      <p
        className={`mt-1 font-mono text-xl font-semibold tabular-nums ${
          accent ? 'text-[#0e6e62]' : 'text-neutral-900'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

function Th({
  children,
  className = '',
}: {
  children?: React.ReactNode
  className?: string
}) {
  return (
    <th className={`py-2 pr-3 font-medium text-neutral-500 ${className}`}>
      {children}
    </th>
  )
}

function Td({
  children,
  className = '',
  colSpan,
}: {
  children?: React.ReactNode
  className?: string
  colSpan?: number
}) {
  return (
    <td colSpan={colSpan} className={`py-2 pr-3 align-top ${className}`}>
      {children}
    </td>
  )
}

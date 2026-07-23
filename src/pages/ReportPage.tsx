import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Printer, FileDown, Link2, ClipboardCopy, Loader2, Check } from 'lucide-react'
import { getProfile, createSharedReport } from '@/lib/api'
import { useEntries } from '@/lib/useEntries'
import { savePdf } from '@/lib/pdf'
import type { DateRange, ReportPayload } from '@/lib/types'
import { monthRange, sumHours, fmtHours, reportPeriodLabel } from '@/lib/time'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ReportView } from '@/components/ReportView'

export function ReportPage() {
  const [params] = useSearchParams()
  const fallback = monthRange()
  const range: DateRange = {
    from: params.get('from') || fallback.from,
    to: params.get('to') || fallback.to,
  }

  const { entries, loading } = useEntries(range)
  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: getProfile })

  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [sharing, setSharing] = useState(false)
  const [savingPdf, setSavingPdf] = useState(false)
  const [copied, setCopied] = useState<'link' | 'summary' | null>(null)

  const report: ReportPayload = useMemo(
    () => ({
      profile: profile ?? { full_name: null, employer_name: null, role: null },
      range,
      generatedAt: new Date().toISOString(),
      entries,
      totalHours: sumHours(entries),
      daysTracked: entries.filter((e) => e.check_in && e.check_out).length,
    }),
    // range is derived from params each render; key on its primitives
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profile, entries, range.from, range.to],
  )

  async function copy(text: string, which: 'link' | 'summary') {
    await navigator.clipboard.writeText(text)
    setCopied(which)
    setTimeout(() => setCopied(null), 2000)
  }

  async function createLink() {
    setSharing(true)
    try {
      const token = await createSharedReport(report)
      const url = `${window.location.origin}/r/${token}`
      setShareUrl(url)
      await copy(url, 'link')
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to create link.')
    } finally {
      setSharing(false)
    }
  }

  function copySummary() {
    const name = report.profile.full_name?.trim()
    const who = name ? `${name} — ` : ''
    const text = `${who}${reportPeriodLabel(range, entries)}: ${fmtHours(report.totalHours) || '0h 00m'} across ${report.daysTracked} day(s).`
    copy(text, 'summary')
  }

  function fileBase() {
    const name = report.profile.full_name
      ?.trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
    return `timesheet-${name ? name + '-' : ''}${range.from}_${range.to}`
  }

  async function downloadPdf() {
    const el = document.querySelector<HTMLElement>('[data-report]')
    if (!el) return
    setSavingPdf(true)
    try {
      await savePdf(el, `${fileBase()}.pdf`)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to create PDF.')
    } finally {
      setSavingPdf(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Toolbar (hidden when printing) */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button asChild variant="ghost" size="sm">
          <Link to="/records">
            <ArrowLeft className="size-4" />
            Back to records
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={copySummary}>
            {copied === 'summary' ? <Check className="size-4" /> : <ClipboardCopy className="size-4" />}
            Copy summary
          </Button>
          <Button variant="outline" onClick={createLink} disabled={sharing}>
            {sharing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : copied === 'link' ? (
              <Check className="size-4" />
            ) : (
              <Link2 className="size-4" />
            )}
            {shareUrl ? 'Link copied' : 'Create share link'}
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="size-4" />
            Print
          </Button>
          <Button onClick={downloadPdf} disabled={savingPdf}>
            {savingPdf ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileDown className="size-4" />
            )}
            Save PDF
          </Button>
        </div>
      </div>

      {shareUrl && (
        <div className="rounded-lg border bg-muted/40 p-3 text-sm print:hidden">
          <p className="text-muted-foreground mb-1 text-xs">
            Read-only link — send it to your employer (no login needed):
          </p>
          <code className="break-all">{shareUrl}</code>
        </div>
      )}

      {loading ? (
        <Skeleton className="mx-auto h-96 w-full max-w-3xl rounded-xl" />
      ) : (
        <ReportView report={report} />
      )}
    </div>
  )
}

import { useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Clock, Printer, FileDown, Loader2 } from 'lucide-react'
import { getSharedReport } from '@/lib/api'
import { savePdf } from '@/lib/pdf'
import { reportPeriodSlug } from '@/lib/time'
import { Button } from '@/components/ui/button'
import { ReportView } from '@/components/ReportView'

export function SharedReportPage() {
  const { token } = useParams<{ token: string }>()
  const [savingPdf, setSavingPdf] = useState(false)
  const pdfRef = useRef<HTMLDivElement>(null)
  const { data, isPending, isError } = useQuery({
    queryKey: ['shared-report', token],
    queryFn: () => getSharedReport(token!),
    enabled: !!token,
    retry: false,
  })

  async function downloadPdf() {
    const el = pdfRef.current
    if (!el) return
    setSavingPdf(true)
    try {
      const slug = data ? reportPeriodSlug(data.range, data.entries) : 'report'
      await savePdf(el, `timesheet-${slug}.pdf`)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to create PDF.')
    } finally {
      setSavingPdf(false)
    }
  }

  return (
    <div className="min-h-svh bg-muted/30">
      <header className="flex items-center justify-between gap-3 border-b bg-card px-4 py-3 print:hidden">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Clock className="size-4" />
          </div>
          <span className="font-display text-sm font-semibold">Timesheet</span>
        </div>
        {data && (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => window.print()}>
              <Printer className="size-4" />
              <span className="hidden sm:inline">Print</span>
            </Button>
            <Button size="sm" onClick={downloadPdf} disabled={savingPdf}>
              {savingPdf ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FileDown className="size-4" />
              )}
              <span className="hidden sm:inline">Save PDF</span>
            </Button>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {isPending ? (
          <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading report…
          </div>
        ) : isError || !data ? (
          <div className="rounded-xl border bg-card p-10 text-center">
            <p className="font-medium">Report not found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              This link may be invalid or the report was removed.
            </p>
          </div>
        ) : (
          <ReportView report={data} />
        )}
      </main>

      {/* Off-screen fixed-width copy captured for the PDF (desktop layout). */}
      {data && (
        <div
          ref={pdfRef}
          aria-hidden
          className="pointer-events-none fixed top-0 left-[-9999px] w-[800px] bg-white print:hidden"
        >
          <ReportView report={data} fixed />
        </div>
      )}
    </div>
  )
}

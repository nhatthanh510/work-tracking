import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function TablePagination({
  page,
  pageSize,
  total,
  onPage,
}: {
  page: number
  pageSize: number
  total: number
  onPage: (p: number) => void
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (total <= pageSize) return null

  const start = (page - 1) * pageSize + 1
  const end = Math.min(total, page * pageSize)

  return (
    <div className="flex items-center justify-between pt-1">
      <p className="font-mono text-xs text-muted-foreground tabular-nums">
        {start}–{end} of {total}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="font-mono text-xs text-muted-foreground tabular-nums px-1">
          {page} / {pages}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}

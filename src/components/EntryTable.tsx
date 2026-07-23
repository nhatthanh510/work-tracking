import { useEffect, useState } from 'react'
import { Pencil, Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import type { TimeEntry } from '@/lib/types'
import {
  fmtTime,
  fmtHours,
  hoursBetween,
  fmtDateLabel,
  weekdayShort,
  fromDatetimeLocal,
  timeRangeError,
} from '@/lib/time'
import { useEntryMutations } from '@/lib/useEntryMutations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { TimePicker } from '@/components/ui/time-picker'
import { DayBar } from '@/components/DayBar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const COLS: { label: string; align?: 'right' }[] = [
  { label: 'Date' },
  { label: 'Check-in' },
  { label: 'Check-out' },
  { label: 'Working hours', align: 'right' },
  { label: 'Note' },
  { label: 'Actions', align: 'right' },
]

function HeaderRow() {
  return (
    <TableHeader>
      <TableRow>
        {COLS.map((c) => (
          <TableHead key={c.label} className={c.align === 'right' ? 'text-right' : undefined}>
            {c.label}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  )
}

export function EntryTable({ entries }: { entries: TimeEntry[] }) {
  if (!entries.length) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        No entries in this range. Try a wider range, or add one below.
      </div>
    )
  }

  return (
    <>
      {/* Mobile: card list (no horizontal scroll) */}
      <div className="space-y-2 sm:hidden">
        {entries.map((e) => (
          <EntryCard key={e.id} entry={e} />
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden sm:block">
        <Table>
          <HeaderRow />
          <TableBody>
            {entries.map((e) => (
              <EntryRow key={e.id} entry={e} />
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}

/** Shared edit-dialog + delete wiring for a row / card. */
function useRowActions(entry: TimeEntry) {
  const { remove } = useEntryMutations()
  const [editing, setEditing] = useState(false)

  function onDelete() {
    remove.mutate(entry.id, {
      onError: (e) =>
        alert(e instanceof Error ? e.message : 'Failed to delete entry.'),
    })
  }

  return { editing, setEditing, onDelete, deleting: remove.isPending }
}

function DateLabel({ entry }: { entry: TimeEntry }) {
  const incomplete = !entry.check_in || !entry.check_out
  return (
    <div className="flex items-center gap-2">
      <span className="font-medium tabular-nums">{fmtDateLabel(entry.work_date)}</span>
      <span className="text-xs font-normal text-muted-foreground">
        {weekdayShort(entry.work_date)}
      </span>
      {incomplete && (
        <Badge variant="warning" className="gap-1">
          <AlertTriangle className="size-3" />
          Incomplete
        </Badge>
      )}
    </div>
  )
}

function RowActions({
  onEdit,
  onDelete,
  deleting,
}: {
  onEdit: () => void
  onDelete: () => void
  deleting: boolean
}) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  return (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="sm" onClick={onEdit}>
        <Pencil className="size-4" />
        Edit
      </Button>
      <Popover open={confirmOpen} onOpenChange={setConfirmOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            aria-label="Delete"
          >
            <Trash2 className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-60">
          <p className="text-sm font-medium">Delete this entry?</p>
          <p className="mt-1 text-xs text-muted-foreground">
            This can’t be undone.
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={deleting}
              onClick={() => {
                onDelete()
                setConfirmOpen(false)
              }}
            >
              {deleting && <Loader2 className="animate-spin" />}
              Delete
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

function EntryCard({ entry }: { entry: TimeEntry }) {
  const { editing, setEditing, onDelete, deleting } = useRowActions(entry)
  const hrs = hoursBetween(entry.check_in, entry.check_out)

  return (
    <div className="rounded-lg border p-3">
      <DateLabel entry={entry} />

      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Check-in</dt>
          <dd className="font-mono tabular-nums">{fmtTime(entry.check_in) || '—'}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Check-out</dt>
          <dd className="font-mono tabular-nums">{fmtTime(entry.check_out) || '—'}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Hours</dt>
          <dd className="font-mono font-medium tabular-nums">
            {hrs == null ? '—' : fmtHours(hrs)}
          </dd>
        </div>
      </dl>

      {entry.note && (
        <p className="mt-2 text-sm text-muted-foreground">{entry.note}</p>
      )}

      <div className="mt-3 border-t pt-2">
        <RowActions
          onEdit={() => setEditing(true)}
          onDelete={onDelete}
          deleting={deleting}
        />
      </div>

      <EditEntryDialog entry={entry} open={editing} onOpenChange={setEditing} />
    </div>
  )
}

function EntryRow({ entry }: { entry: TimeEntry }) {
  const { editing, setEditing, onDelete, deleting } = useRowActions(entry)
  const hrs = hoursBetween(entry.check_in, entry.check_out)

  return (
    <TableRow>
      <TableCell className="font-medium">
        <DateLabel entry={entry} />
        <DayBar
          variant="mini"
          checkIn={entry.check_in}
          checkOut={entry.check_out}
          className="mt-2 w-32"
        />
      </TableCell>
      <TableCell className="font-mono tabular-nums">
        {fmtTime(entry.check_in) || <span className="text-destructive">—</span>}
      </TableCell>
      <TableCell className="font-mono tabular-nums">
        {fmtTime(entry.check_out) || <span className="text-destructive">—</span>}
      </TableCell>
      <TableCell className="text-right font-mono font-medium tabular-nums">
        {hrs == null ? '—' : fmtHours(hrs)}
      </TableCell>
      <TableCell className="max-w-[14rem] truncate text-muted-foreground">
        {entry.note}
      </TableCell>
      <TableCell>
        <RowActions
          onEdit={() => setEditing(true)}
          onDelete={onDelete}
          deleting={deleting}
        />
      </TableCell>

      <EditEntryDialog entry={entry} open={editing} onOpenChange={setEditing} />
    </TableRow>
  )
}

function EditEntryDialog({
  entry,
  open,
  onOpenChange,
}: {
  entry: TimeEntry
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const { save } = useEntryMutations()
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [note, setNote] = useState('')

  // Seed fields when the dialog opens (fires for external opens too, unlike
  // Radix's onOpenChange). Missing check-in/out simply seed to "".
  useEffect(() => {
    if (!open) return
    setCheckIn(fmtTime(entry.check_in))
    setCheckOut(fmtTime(entry.check_out))
    setNote(entry.note ?? '')
  }, [open, entry])

  const timeToIso = (t: string) =>
    t ? fromDatetimeLocal(`${entry.work_date}T${t}`) : null
  const previewHours = hoursBetween(timeToIso(checkIn), timeToIso(checkOut))
  const rangeError = timeRangeError(checkIn, checkOut)

  function submit() {
    if (rangeError) return
    save.mutate(
      {
        work_date: entry.work_date,
        check_in: timeToIso(checkIn),
        check_out: timeToIso(checkOut),
        note: note || null,
      },
      {
        onSuccess: () => onOpenChange(false),
        onError: (e) =>
          alert(e instanceof Error ? e.message : 'Failed to save entry.'),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit entry</DialogTitle>
          <DialogDescription>{fmtDateLabel(entry.work_date)}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="e-in">Check-in</Label>
            <TimePicker id="e-in" value={checkIn} onChange={setCheckIn} placeholder="check-in" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="e-out">Check-out</Label>
            <TimePicker id="e-out" value={checkOut} onChange={setCheckOut} placeholder="check-out" />
          </div>
        </div>

        {rangeError ? (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {rangeError}
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Working hours</span>
            <span className="font-mono font-medium tabular-nums">
              {fmtHours(previewHours) || '—'}
            </span>
          </div>
        )}

        <div className="grid gap-1.5">
          <Label htmlFor="e-note">Note</Label>
          <Input
            id="e-note"
            placeholder="optional"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={save.isPending || !!rangeError}>
            {save.isPending && <Loader2 className="animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Placeholder that mirrors EntryTable's structure so swapping in real rows
 * doesn't shift the layout.
 */
export function EntryTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <>
      {/* Mobile card skeletons */}
      <div className="space-y-2 sm:hidden">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="rounded-lg border p-3">
            <Skeleton className="h-5 w-24" />
            <div className="mt-3 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table skeleton */}
      <div className="hidden sm:block">
        <Table>
          <HeaderRow />
          <TableBody>
            {Array.from({ length: rows }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="mt-2 h-1.5 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-12" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-12" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="ml-auto h-5 w-14" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="ml-auto h-5 w-16" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}

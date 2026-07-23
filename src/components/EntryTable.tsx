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
    <Table>
      <HeaderRow />
      <TableBody>
        {entries.map((e) => (
          <EntryRow key={e.id} entry={e} />
        ))}
      </TableBody>
    </Table>
  )
}

function EntryRow({ entry }: { entry: TimeEntry }) {
  const { remove } = useEntryMutations()
  const [editing, setEditing] = useState(false)

  function onDelete() {
    if (!window.confirm(`Delete entry for ${entry.work_date}?`)) return
    remove.mutate(entry.id, {
      onError: (e) =>
        alert(e instanceof Error ? e.message : 'Failed to delete entry.'),
    })
  }

  const incomplete = !entry.check_in || !entry.check_out
  const hrs = hoursBetween(entry.check_in, entry.check_out)

  return (
    <TableRow>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          <span className="tabular-nums">{fmtDateLabel(entry.work_date)}</span>
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
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="size-4" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
            disabled={remove.isPending}
            aria-label="Delete"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
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
  )
}

import { useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { todayISO, fromDatetimeLocal, timeRangeError } from '@/lib/time'
import { useEntryMutations } from '@/lib/useEntryMutations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { TimePicker } from '@/components/ui/time-picker'

const empty = { work_date: todayISO(), check_in: '', check_out: '', note: '' }

export function ManualEntryForm() {
  const { save } = useEntryMutations()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty)
  const busy = save.isPending

  const setField = (k: keyof typeof form) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }))

  const rangeError = timeRangeError(form.check_in, form.check_out)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (rangeError) return
    const timeOf = (t: string) => (t ? `${form.work_date}T${t}` : '')
    save.mutate(
      {
        work_date: form.work_date,
        check_in: fromDatetimeLocal(timeOf(form.check_in)),
        check_out: fromDatetimeLocal(timeOf(form.check_out)),
        note: form.note || null,
      },
      {
        onSuccess: () => {
          setForm(empty)
          setOpen(false)
        },
        onError: (err) =>
          alert(err instanceof Error ? err.message : 'Failed to save entry.'),
      },
    )
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        className="w-full border-dashed"
        onClick={() => setOpen(true)}
      >
        <Plus className="size-4" />
        Add or backfill an entry
      </Button>
    )
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <h3 className="font-medium">Add / backfill entry</h3>
            <p className="text-sm text-muted-foreground">
              Forgot to check in or out? Set the times for any day. Saving
              overwrites an existing entry for that date.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="grid gap-1.5">
              <Label htmlFor="m-date">Date</Label>
              <DatePicker
                id="m-date"
                value={form.work_date}
                onChange={setField('work_date')}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="m-in">Check-in</Label>
              <TimePicker
                id="m-in"
                value={form.check_in}
                onChange={setField('check_in')}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="m-out">Check-out</Label>
              <TimePicker
                id="m-out"
                value={form.check_out}
                onChange={setField('check_out')}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="m-note">Note</Label>
              <Input
                id="m-note"
                type="text"
                placeholder="optional"
                value={form.note}
                onChange={(e) => setField('note')(e.target.value)}
              />
            </div>
          </div>
          {rangeError && (
            <p className="text-sm text-destructive">{rangeError}</p>
          )}
          <div className="flex gap-2">
            <Button type="submit" disabled={busy || !!rangeError}>
              {busy && <Loader2 className="animate-spin" />}
              Save entry
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setOpen(false)
                setForm(empty)
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

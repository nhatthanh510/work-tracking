import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Check } from 'lucide-react'
import { getProfile, saveProfile } from '@/lib/api'
import type { Profile } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const emptyProfile: Profile = { full_name: '', employer_name: '', role: '' }

export function SettingsPage() {
  const qc = useQueryClient()
  const { data, isPending } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  })
  const [form, setForm] = useState<Profile>(emptyProfile)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (data) {
      setForm({
        full_name: data.full_name ?? '',
        employer_name: data.employer_name ?? '',
        role: data.role ?? '',
      })
    }
  }, [data])

  const save = useMutation({
    mutationFn: () =>
      saveProfile({
        full_name: form.full_name || null,
        employer_name: form.employer_name || null,
        role: form.role || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
    onError: (e) =>
      alert(e instanceof Error ? e.message : 'Failed to save profile.'),
  })

  const set = (k: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Your name and employer appear on reports you share or print.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4">
          {isPending ? (
            <>
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault()
                save.mutate()
              }}
            >
              <div className="grid gap-1.5">
                <Label htmlFor="name">Your name</Label>
                <Input
                  id="name"
                  value={form.full_name ?? ''}
                  onChange={set('full_name')}
                  placeholder="Jane Doe"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="role">Role / title</Label>
                <Input
                  id="role"
                  value={form.role ?? ''}
                  onChange={set('role')}
                  placeholder="Software Engineer"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="employer">Employer / company</Label>
                <Input
                  id="employer"
                  value={form.employer_name ?? ''}
                  onChange={set('employer_name')}
                  placeholder="Acme Inc."
                />
              </div>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? (
                  <Loader2 className="animate-spin" />
                ) : saved ? (
                  <Check />
                ) : null}
                {saved ? 'Saved' : 'Save'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

import { useState } from 'react'
import { Clock, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ThemeToggle } from '@/components/ThemeToggle'

export function Login() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        // On success, App's onAuthStateChange swaps to the dashboard.
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (!data.session) {
          setNotice('Account created. Check your email to confirm, then sign in.')
          setMode('signin')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-muted/40 to-background" />
      <div className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Clock className="size-6" />
          </div>
          <p className="eyebrow">Timesheet · Chronograph</p>
          <CardTitle className="mt-0.5 text-2xl">
            {mode === 'signin' ? 'Punch in' : 'Create account'}
          </CardTitle>
          <CardDescription>
            {mode === 'signin'
              ? 'Sign in to log your hours'
              : 'Set up your account to get started'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {notice && <p className="text-sm text-primary">{notice}</p>}
            <Button type="submit" className="mt-1 w-full" disabled={busy}>
              {busy && <Loader2 className="animate-spin" />}
              {mode === 'signin' ? 'Sign in' : 'Sign up'}
            </Button>
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin')
                setError(null)
                setNotice(null)
              }}
            >
              {mode === 'signin'
                ? 'No account? Sign up'
                : 'Already have an account? Sign in'}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

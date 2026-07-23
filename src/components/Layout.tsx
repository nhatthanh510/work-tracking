import { NavLink, Outlet, Link } from 'react-router-dom'
import { Clock, LogOut, Timer, Table2, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CONTACT_EMAIL } from '@/lib/config'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ThemeToggle'

const nav = [
  { to: '/', label: 'Check in / out', icon: Timer, end: true },
  { to: '/records', label: 'Records', icon: Table2, end: false },
  { to: '/settings', label: 'Settings', icon: Settings, end: false },
]

export function Layout({
  email,
  onSignOut,
}: {
  email: string
  onSignOut: () => void
}) {
  const links = (
    <nav className="flex gap-1 md:flex-col">
      {nav.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              'group flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )
          }
        >
          <Icon className="size-4" />
          <span className="hidden md:inline">{label}</span>
        </NavLink>
      ))}
    </nav>
  )

  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r bg-card px-3 py-5 md:flex print:hidden">
        <div className="px-2 pb-6">
          <Link to="/" className="flex items-center gap-2.5" aria-label="Home">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Clock className="size-4.5" />
            </div>
            <span className="font-display text-lg leading-none font-semibold tracking-tight">
              Timesheet
            </span>
          </Link>
          <div className="mt-2 pl-0.5">
            <span className="eyebrow">Chronograph</span>
          </div>
        </div>

        {links}

        <div className="mt-auto space-y-2 border-t pt-3">
          <div className="flex items-center justify-between gap-2 px-2">
            <span className="truncate text-xs text-muted-foreground">{email}</span>
            <ThemeToggle />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={onSignOut}
          >
            <LogOut className="size-4" />
            Sign out
          </Button>
          <p className="px-2 pt-1 text-[10px] leading-tight text-muted-foreground/60">
            © {new Date().getFullYear()}{' '}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="hover:text-foreground hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
        </div>
      </aside>

      {/* Top bar (mobile) */}
      <header className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b bg-card/90 px-4 py-2.5 backdrop-blur md:hidden print:hidden">
        <Link to="/" className="flex items-center gap-2" aria-label="Home">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Clock className="size-4" />
          </div>
          <span className="font-display text-sm font-semibold">Timesheet</span>
        </Link>
        <div className="flex items-center gap-1">
          {links}
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={onSignOut} aria-label="Sign out">
            <LogOut className="size-4" />
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-6 md:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

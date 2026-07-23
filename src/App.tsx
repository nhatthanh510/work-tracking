import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Clock, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { Login } from '@/components/Login'
import { Layout } from '@/components/Layout'
import { CheckInPage } from '@/pages/CheckInPage'
import { RecordsPage } from '@/pages/RecordsPage'
import { ReportPage } from '@/pages/ReportPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { SharedReportPage } from '@/pages/SharedReportPage'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Apply persisted theme preference on mount.
  useEffect(() => {
    const dark = localStorage.getItem('tt.theme') === 'dark'
    document.documentElement.classList.toggle('dark', dark)
  }, [])

  // Track the Supabase auth session.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        {/* Public: employers open shared reports without logging in. */}
        <Route path="/r/:token" element={<SharedReportPage />} />

        {loading ? (
          <Route path="*" element={<FullPageLoader />} />
        ) : session ? (
          <Route
            element={
              <Layout
                email={session.user.email ?? ''}
                onSignOut={() => supabase.auth.signOut()}
              />
            }
          >
            <Route index element={<CheckInPage />} />
            <Route path="records" element={<RecordsPage />} />
            <Route path="report" element={<ReportPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        ) : (
          <Route path="*" element={<Login />} />
        )}
      </Routes>
    </BrowserRouter>
  )
}

function FullPageLoader() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4">
      <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <Clock className="size-6" />
      </div>
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
    </div>
  )
}

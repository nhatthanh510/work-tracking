import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error(
    'Missing Supabase env vars. Copy .env.example to .env.local and set ' +
      'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then restart `yarn dev`.',
  )
}

export const supabase = createClient(url, anonKey, {
  auth: {
    // Keep the user signed in across refreshes / browser restarts.
    // These are the library defaults; set explicitly to make intent clear.
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

import { supabase } from './supabaseClient'
import { todayISO } from './time'
import type {
  TimeEntry,
  EntryInput,
  DateRange,
  Profile,
  ReportPayload,
} from './types'

// Real data layer backed by Supabase. RLS scopes every query to the signed-in
// user; the DB defaults user_id to auth.uid(), but we also send it explicitly
// so upserts resolve the (user_id, work_date) conflict reliably.

const TABLE = 'time_entries'

async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw new Error('Not signed in.')
  return data.user.id
}

export async function listEntries({ from, to }: DateRange): Promise<TimeEntry[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .gte('work_date', from)
    .lte('work_date', to)
    .order('work_date', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as TimeEntry[]
}

export async function getDay(workDate: string): Promise<TimeEntry | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('work_date', workDate)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return (data as TimeEntry | null) ?? null
}

async function upsert(row: Partial<TimeEntry> & { work_date: string }): Promise<TimeEntry> {
  const user_id = await currentUserId()
  const { data, error } = await supabase
    .from(TABLE)
    .upsert({ ...row, user_id }, { onConflict: 'user_id,work_date' })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as TimeEntry
}

/** Stamp check-in for today; keeps any existing check_out. */
export async function checkInToday(): Promise<TimeEntry> {
  return upsert({ work_date: todayISO(), check_in: new Date().toISOString() })
}

/** Stamp check-out for today; keeps any existing check_in. */
export async function checkOutToday(): Promise<TimeEntry> {
  return upsert({ work_date: todayISO(), check_out: new Date().toISOString() })
}

/** Insert or update an entry for an explicit date (edit / backfill). */
export async function saveEntry(input: EntryInput): Promise<TimeEntry> {
  return upsert(input)
}

export async function deleteEntry(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// --- Profile ---------------------------------------------------------------

export async function getProfile(): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, employer_name, role')
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data ?? { full_name: null, employer_name: null, role: null }
}

export async function saveProfile(profile: Profile): Promise<Profile> {
  const user_id = await currentUserId()
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: user_id, ...profile }, { onConflict: 'id' })
    .select('full_name, employer_name, role')
    .single()
  if (error) throw new Error(error.message)
  return data as Profile
}

// --- Shareable reports -----------------------------------------------------

/** Snapshot a report and return its share token (the row id). */
export async function createSharedReport(payload: ReportPayload): Promise<string> {
  const user_id = await currentUserId()
  const { data, error } = await supabase
    .from('shared_reports')
    .insert({ user_id, payload })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return data.id as string
}

/** Public read of a shared report by token (works without a session). */
export async function getSharedReport(token: string): Promise<ReportPayload | null> {
  const { data, error } = await supabase.rpc('get_shared_report', {
    p_token: token,
  })
  if (error) throw new Error(error.message)
  return (data as ReportPayload | null) ?? null
}

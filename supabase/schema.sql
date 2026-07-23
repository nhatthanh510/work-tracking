-- ============================================================================
-- Time Tracker — Supabase schema
-- Run this once in your Supabase project: Dashboard → SQL Editor → New query.
-- ============================================================================

-- One work session per user per day.
create table if not exists public.time_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  work_date  date not null,
  check_in   timestamptz,
  check_out  timestamptz,
  note       text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, work_date)
);

-- Fast lookups for the date-range queries the app runs.
create index if not exists time_entries_user_date_idx
  on public.time_entries (user_id, work_date desc);

-- ----------------------------------------------------------------------------
-- Row Level Security: each user can only see and change their own rows.
-- ----------------------------------------------------------------------------
alter table public.time_entries enable row level security;

drop policy if exists "own rows - select" on public.time_entries;
create policy "own rows - select" on public.time_entries
  for select using (auth.uid() = user_id);

drop policy if exists "own rows - insert" on public.time_entries;
create policy "own rows - insert" on public.time_entries
  for insert with check (auth.uid() = user_id);

drop policy if exists "own rows - update" on public.time_entries;
create policy "own rows - update" on public.time_entries
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows - delete" on public.time_entries;
create policy "own rows - delete" on public.time_entries
  for delete using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Keep updated_at fresh on every update.
-- ----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch on public.time_entries;
create trigger trg_touch
  before update on public.time_entries
  for each row execute function public.touch_updated_at();

-- ----------------------------------------------------------------------------
-- Create your login account:
--   Dashboard → Authentication → Users → "Add user" (email + password),
--   or enable email sign-up and use the app's sign-up form.
-- The app never sends user_id — the column defaults to auth.uid() and RLS
-- enforces ownership.
-- ============================================================================

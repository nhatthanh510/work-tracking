-- ============================================================================
-- Reporting: profile identity + shareable report links.
-- Run this in Supabase → SQL Editor after schema.sql.
-- ============================================================================

-- Employee / employer identity used on report headers.
create table if not exists public.profiles (
  id            uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  full_name     text,
  employer_name text,
  role          text,
  updated_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "own profile - select" on public.profiles;
create policy "own profile - select" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "own profile - insert" on public.profiles;
create policy "own profile - insert" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "own profile - update" on public.profiles;
create policy "own profile - update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- Shareable report snapshots. The payload is an immutable copy of the report
-- at creation time, so the employer always sees what was shared even if the
-- employee later edits their entries. The row id is the (unguessable) token.
-- ----------------------------------------------------------------------------
create table if not exists public.shared_reports (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  payload    jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.shared_reports enable row level security;

-- Owners can list / create / revoke their own links.
drop policy if exists "own reports - select" on public.shared_reports;
create policy "own reports - select" on public.shared_reports
  for select using (auth.uid() = user_id);

drop policy if exists "own reports - insert" on public.shared_reports;
create policy "own reports - insert" on public.shared_reports
  for insert with check (auth.uid() = user_id);

drop policy if exists "own reports - delete" on public.shared_reports;
create policy "own reports - delete" on public.shared_reports
  for delete using (auth.uid() = user_id);

-- Public read is ONLY by exact token, via a security-definer function.
-- This deliberately avoids a broad "select using (true)" policy, which would
-- let anyone enumerate all shared reports.
create or replace function public.get_shared_report(p_token uuid)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select payload from public.shared_reports where id = p_token;
$$;

grant execute on function public.get_shared_report(uuid) to anon, authenticated;

-- 幸福人生觉察卡 · Portal schema
-- Run in Supabase SQL editor. Auth is handled by Supabase Auth (auth.users).

create extension if not exists "pgcrypto";

create table if not exists public.readings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  mode        int  not null,                 -- 1 | 3 | 4
  spread_key  text,                           -- SPREAD3 index, 'inner', or 'single'
  question    text,
  cards       jsonb not null,                 -- [{ n, position_cn, position_en }]
  created_at  timestamptz not null default now()
);

create table if not exists public.deep_reports (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  reading_id  uuid references public.readings(id) on delete cascade,
  model       text,
  content     text not null,
  created_at  timestamptz not null default now()
);

create index if not exists readings_user_idx on public.readings(user_id, created_at desc);
create index if not exists reports_user_idx  on public.deep_reports(user_id, created_at desc);

-- Data API grants are explicit. RLS below still decides which rows are reachable.
revoke all on table public.readings from anon, authenticated;
revoke all on table public.deep_reports from anon, authenticated;
grant select, insert on table public.readings to authenticated;
grant select, insert, delete on table public.deep_reports to authenticated;

-- Row Level Security: every signed-in user sees only their own rows.
alter table public.readings     enable row level security;
alter table public.deep_reports enable row level security;

drop policy if exists "own readings" on public.readings;
drop policy if exists "read own readings" on public.readings;
drop policy if exists "insert own readings" on public.readings;
create policy "read own readings" on public.readings
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "insert own readings" on public.readings
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "own reports" on public.deep_reports;
drop policy if exists "read own reports" on public.deep_reports;
drop policy if exists "insert own reports" on public.deep_reports;
drop policy if exists "delete own reports" on public.deep_reports;
create policy "read own reports" on public.deep_reports
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "insert own reports" on public.deep_reports
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "delete own reports" on public.deep_reports
  for delete to authenticated
  using ((select auth.uid()) = user_id);

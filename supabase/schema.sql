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

-- Row Level Security: every user sees only their own rows.
alter table public.readings     enable row level security;
alter table public.deep_reports enable row level security;

drop policy if exists "own readings" on public.readings;
create policy "own readings" on public.readings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own reports" on public.deep_reports;
create policy "own reports" on public.deep_reports
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Optional plan gate. Apply after 2_share.sql.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free',
  created_at timestamptz not null default now()
);

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;

alter table public.profiles enable row level security;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

-- Keep the privileged trigger function outside the exposed public schema.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke execute on function private.create_profile_for_new_user() from public, anon, authenticated;

drop trigger if exists create_profile_after_signup on auth.users;
create trigger create_profile_after_signup
  after insert on auth.users
  for each row execute function private.create_profile_for_new_user();

-- Backfill users who existed before this migration.
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

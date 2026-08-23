-- Awareness mini-application schema for the shared AiEdu Supabase project.
-- Authentication identities remain in auth.users. Application data is isolated
-- in this schema and protected with Row Level Security.

create schema if not exists awareness;
create schema if not exists awareness_private;

revoke all on schema awareness from public;
revoke all on schema awareness_private from public, anon, authenticated;
grant usage on schema awareness to anon, authenticated, service_role;

do $$
begin
  create type awareness.account_role as enum ('user', 'educator');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type awareness.link_status as enum ('active', 'revoked');
exception
  when duplicate_object then null;
end
$$;

grant usage on type awareness.account_role, awareness.link_status
  to authenticated, service_role;

create table if not exists awareness.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role awareness.account_role not null default 'user',
  plan text not null default 'free',
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint awareness_profiles_plan_length
    check (char_length(plan) between 1 and 40),
  constraint awareness_profiles_display_name_length
    check (display_name is null or char_length(display_name) between 1 and 120)
);

create table if not exists awareness.educator_user_links (
  educator_id uuid not null references awareness.profiles(id) on delete cascade,
  user_id uuid not null references awareness.profiles(id) on delete cascade,
  status awareness.link_status not null default 'active',
  created_by uuid not null references auth.users(id) on delete cascade
    default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (educator_id, user_id),
  constraint awareness_link_distinct_accounts check (educator_id <> user_id)
);

create table if not exists awareness.readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode integer not null check (mode in (1, 3, 4)),
  spread_key text not null,
  question text,
  cards jsonb not null,
  created_at timestamptz not null default now(),
  constraint awareness_readings_question_length
    check (question is null or char_length(question) <= 2000),
  constraint awareness_readings_cards_array
    check (jsonb_typeof(cards) = 'array')
);

create table if not exists awareness.deep_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reading_id uuid references awareness.readings(id) on delete cascade,
  model text,
  content text not null,
  share_token uuid,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists awareness_profiles_role_idx
  on awareness.profiles(role);
create index if not exists awareness_links_user_idx
  on awareness.educator_user_links(user_id, status);
create index if not exists awareness_links_educator_idx
  on awareness.educator_user_links(educator_id, status);
create index if not exists awareness_readings_user_idx
  on awareness.readings(user_id, created_at desc);
create index if not exists awareness_reports_user_idx
  on awareness.deep_reports(user_id, created_at desc);
create index if not exists awareness_reports_reading_idx
  on awareness.deep_reports(reading_id);
create unique index if not exists awareness_reports_share_token_idx
  on awareness.deep_reports(share_token)
  where share_token is not null;

revoke all on all tables in schema awareness from anon, authenticated;
grant select on awareness.profiles to authenticated;
grant update (display_name) on awareness.profiles to authenticated;
grant select, insert, update (status), delete
  on awareness.educator_user_links to authenticated;
grant select, insert on awareness.readings to authenticated;
grant select, insert, delete on awareness.deep_reports to authenticated;
grant update (share_token, is_public) on awareness.deep_reports to authenticated;
grant all on all tables in schema awareness to service_role;
grant all on all sequences in schema awareness to service_role;

alter table awareness.profiles enable row level security;
alter table awareness.educator_user_links enable row level security;
alter table awareness.readings enable row level security;
alter table awareness.deep_reports enable row level security;

create policy "read own or linked profiles"
  on awareness.profiles
  for select
  to authenticated
  using (
    id = (select auth.uid())
    or id in (
      select link.user_id
      from awareness.educator_user_links as link
      where link.educator_id = (select auth.uid())
        and link.status = 'active'
    )
  );

create policy "update own display profile"
  on awareness.profiles
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "read own educator links"
  on awareness.educator_user_links
  for select
  to authenticated
  using (
    educator_id = (select auth.uid())
    or user_id = (select auth.uid())
  );

-- Linking is learner-controlled: an educator cannot attach an arbitrary user.
create policy "users create their educator links"
  on awareness.educator_user_links
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and created_by = (select auth.uid())
  );

create policy "users update their educator links"
  on awareness.educator_user_links
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "users delete their educator links"
  on awareness.educator_user_links
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

create policy "users read own readings"
  on awareness.readings
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "educators read linked readings"
  on awareness.readings
  for select
  to authenticated
  using (
    exists (
      select 1
      from awareness.educator_user_links as link
      where link.educator_id = (select auth.uid())
        and link.user_id = readings.user_id
        and link.status = 'active'
    )
    and exists (
      select 1
      from awareness.profiles as educator
      where educator.id = (select auth.uid())
        and educator.role = 'educator'
    )
  );

create policy "users insert own readings"
  on awareness.readings
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "users read own reports"
  on awareness.deep_reports
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "educators read linked reports"
  on awareness.deep_reports
  for select
  to authenticated
  using (
    exists (
      select 1
      from awareness.educator_user_links as link
      where link.educator_id = (select auth.uid())
        and link.user_id = deep_reports.user_id
        and link.status = 'active'
    )
    and exists (
      select 1
      from awareness.profiles as educator
      where educator.id = (select auth.uid())
        and educator.role = 'educator'
    )
  );

create policy "users insert own reports"
  on awareness.deep_reports
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "users delete own reports"
  on awareness.deep_reports
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

create policy "users update own report sharing"
  on awareness.deep_reports
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create or replace function awareness.get_public_report(token uuid)
returns table (content text, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select report.content, report.created_at
  from awareness.deep_reports as report
  where report.share_token = token
    and report.is_public is true
  limit 1;
$$;

revoke execute on function awareness.get_public_report(uuid) from public;
revoke execute on function awareness.get_public_report(uuid) from anon, authenticated;
grant execute on function awareness.get_public_report(uuid)
  to anon, authenticated, service_role;

create or replace function awareness_private.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into awareness.profiles (id, display_name)
  values (
    new.id,
    nullif(coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    ), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke execute on function awareness_private.create_profile_for_new_user()
  from public, anon, authenticated;

create or replace function awareness_private.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function awareness_private.touch_updated_at()
  from public, anon, authenticated;

drop trigger if exists create_awareness_profile_after_signup on auth.users;
create trigger create_awareness_profile_after_signup
  after insert on auth.users
  for each row execute function awareness_private.create_profile_for_new_user();

drop trigger if exists touch_awareness_profiles_updated_at
  on awareness.profiles;
create trigger touch_awareness_profiles_updated_at
  before update on awareness.profiles
  for each row execute function awareness_private.touch_updated_at();

drop trigger if exists touch_awareness_links_updated_at
  on awareness.educator_user_links;
create trigger touch_awareness_links_updated_at
  before update on awareness.educator_user_links
  for each row execute function awareness_private.touch_updated_at();

insert into awareness.profiles (id, display_name)
select
  account.id,
  nullif(coalesce(
    account.raw_user_meta_data ->> 'full_name',
    account.raw_user_meta_data ->> 'name'
  ), '')
from auth.users as account
on conflict (id) do nothing;

alter default privileges for role postgres in schema awareness
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema awareness
  revoke all on routines from public, anon, authenticated;
alter default privileges for role postgres in schema awareness
  grant all on tables to service_role;
alter default privileges for role postgres in schema awareness
  grant all on routines to service_role;
alter default privileges for role postgres in schema awareness
  grant all on sequences to service_role;

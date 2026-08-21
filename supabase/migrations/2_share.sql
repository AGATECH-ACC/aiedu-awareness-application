-- Shareable, read-only report links.
alter table public.deep_reports
  add column if not exists share_token uuid,
  add column if not exists is_public boolean not null default false;

create unique index if not exists deep_reports_share_token_idx
  on public.deep_reports (share_token)
  where share_token is not null;

-- Only the two sharing fields may be updated through the authenticated Data API.
grant update (share_token, is_public) on table public.deep_reports to authenticated;

drop policy if exists "update own report sharing" on public.deep_reports;
create policy "update own report sharing" on public.deep_reports
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Intentional RLS bypass for an unguessable, explicitly-public token. The return
-- type contains no owner, reading, model, email, or other account information.
create or replace function public.get_public_report(token uuid)
returns table (content text, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select report.content, report.created_at
  from public.deep_reports as report
  where report.share_token = token
    and report.is_public is true
  limit 1;
$$;

revoke execute on function public.get_public_report(uuid) from public;
revoke execute on function public.get_public_report(uuid) from anon, authenticated;
grant execute on function public.get_public_report(uuid) to anon, authenticated;

-- Keep existing Awareness users working, while ensuring that future accounts
-- created elsewhere in the shared Supabase project cannot access this app.
update auth.users as account
set raw_app_meta_data = coalesce(account.raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object('awareness_access', true)
where exists (
  select 1
  from awareness.profiles as profile
  where profile.id = account.id
)
and coalesce(account.raw_app_meta_data -> 'awareness_access', 'null'::jsonb)
  is distinct from 'true'::jsonb;

-- Restrictive policies are ANDed with each table's ownership/educator policy.
-- The application claim is server-managed app_metadata, never user_metadata.
create policy "invited accounts only"
  on awareness.profiles
  as restrictive
  for all
  to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'awareness_access') = 'true')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'awareness_access') = 'true');

create policy "invited accounts only"
  on awareness.educator_user_links
  as restrictive
  for all
  to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'awareness_access') = 'true')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'awareness_access') = 'true');

create policy "invited accounts only"
  on awareness.readings
  as restrictive
  for all
  to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'awareness_access') = 'true')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'awareness_access') = 'true');

create policy "invited accounts only"
  on awareness.deep_reports
  as restrictive
  for all
  to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'awareness_access') = 'true')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'awareness_access') = 'true');

create policy "invited accounts only"
  on awareness.recipient_verifications
  as restrictive
  for all
  to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'awareness_access') = 'true')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'awareness_access') = 'true');

create policy "invited accounts only"
  on awareness.educator_report_deliveries
  as restrictive
  for all
  to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'awareness_access') = 'true')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'awareness_access') = 'true');

create policy "invited accounts only"
  on awareness.educator_clients
  as restrictive
  for all
  to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'awareness_access') = 'true')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'awareness_access') = 'true');

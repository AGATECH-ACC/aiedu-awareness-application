create index if not exists awareness_links_created_by_idx
  on awareness.educator_user_links(created_by);

drop policy if exists "users read own readings" on awareness.readings;
drop policy if exists "educators read linked readings" on awareness.readings;
create policy "users or linked educators read readings"
  on awareness.readings
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or (
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
    )
  );

drop policy if exists "users read own reports" on awareness.deep_reports;
drop policy if exists "educators read linked reports" on awareness.deep_reports;
create policy "users or linked educators read reports"
  on awareness.deep_reports
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or (
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
    )
  );

alter table awareness.educator_clients
  add column if not exists phone text;

alter table awareness.recipient_verifications
  add column if not exists recipient_phone text;

alter table awareness.educator_report_deliveries
  add column if not exists recipient_phone text;

alter table awareness.educator_clients
  add constraint educator_clients_phone_format
  check (phone is null or phone ~ '^\+?[0-9]{7,20}$');

alter table awareness.recipient_verifications
  add constraint recipient_verifications_phone_format
  check (recipient_phone is null or recipient_phone ~ '^\+?[0-9]{7,20}$');

alter table awareness.educator_report_deliveries
  add constraint educator_report_deliveries_phone_format
  check (recipient_phone is null or recipient_phone ~ '^\+?[0-9]{7,20}$');

grant select (phone) on awareness.educator_clients to authenticated;
grant select (recipient_phone) on awareness.educator_report_deliveries to authenticated;

create or replace function awareness.educator_qualifying_report_count()
returns bigint
language sql
stable
security invoker
set search_path = ''
as $$
  select count(*)
  from awareness.educator_report_deliveries as delivery
  join awareness.deep_reports as report on report.id = delivery.report_id
  join awareness.readings as reading on reading.id = report.reading_id
  where delivery.educator_id = (select auth.uid())
    and report.user_id = delivery.educator_id
    and delivery.recipient_phone is not null
    and pg_catalog.jsonb_array_length(reading.cards) > 0;
$$;

revoke all on function awareness.educator_qualifying_report_count() from public, anon;
grant execute on function awareness.educator_qualifying_report_count() to authenticated, service_role;

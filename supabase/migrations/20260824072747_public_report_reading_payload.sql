-- Recipient report pages need the safe reading payload in order to render the
-- physical card artwork. Keep the original RPC intact for compatibility and
-- expose a versioned function that still omits account, report, and reading IDs.
create or replace function awareness.get_public_report_v2(token uuid)
returns table (
  content text,
  created_at timestamptz,
  mode integer,
  spread_key text,
  question text,
  cards jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    report.content,
    report.created_at,
    reading.mode,
    reading.spread_key,
    reading.question,
    reading.cards
  from awareness.deep_reports as report
  left join awareness.readings as reading
    on reading.id = report.reading_id
   and reading.user_id = report.user_id
  where report.share_token = token
    and report.is_public is true
  limit 1;
$$;

revoke execute on function awareness.get_public_report_v2(uuid)
  from public, anon, authenticated;
grant execute on function awareness.get_public_report_v2(uuid)
  to anon, authenticated, service_role;

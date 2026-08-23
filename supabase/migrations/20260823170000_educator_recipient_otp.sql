-- One-time recipient consent and educator-created report delivery.
-- OTP digests are never granted to browser roles. Trusted Next.js routes use
-- a Supabase secret key, while educators receive read-only delivery history.

create table if not exists awareness.recipient_verifications (
  id uuid primary key default gen_random_uuid(),
  educator_id uuid not null references awareness.profiles(id) on delete cascade,
  recipient_name text not null,
  recipient_email text not null,
  code_digest text not null,
  attempts smallint not null default 0,
  expires_at timestamptz not null,
  verified_at timestamptz,
  authorization_expires_at timestamptz,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  constraint awareness_recipient_verification_name_length
    check (char_length(recipient_name) between 1 and 120),
  constraint awareness_recipient_verification_email_length
    check (char_length(recipient_email) between 3 and 320),
  constraint awareness_recipient_verification_digest_length
    check (char_length(code_digest) = 64),
  constraint awareness_recipient_verification_attempts
    check (attempts between 0 and 5),
  constraint awareness_recipient_verification_expiry_order
    check (expires_at > created_at),
  constraint awareness_recipient_authorization_expiry_order
    check (
      authorization_expires_at is null
      or (verified_at is not null and authorization_expires_at > verified_at)
    )
);

create table if not exists awareness.educator_report_deliveries (
  id uuid primary key default gen_random_uuid(),
  educator_id uuid not null references awareness.profiles(id) on delete cascade,
  report_id uuid not null unique references awareness.deep_reports(id) on delete cascade,
  verification_id uuid not null unique references awareness.recipient_verifications(id) on delete restrict,
  recipient_name text not null,
  recipient_email text not null,
  status text not null default 'pending',
  email_provider_id text,
  emailed_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint awareness_delivery_name_length
    check (char_length(recipient_name) between 1 and 120),
  constraint awareness_delivery_email_length
    check (char_length(recipient_email) between 3 and 320),
  constraint awareness_delivery_status
    check (status in ('pending', 'sent', 'failed')),
  constraint awareness_delivery_error_length
    check (last_error is null or char_length(last_error) <= 500)
);

create index if not exists awareness_recipient_verification_resend_idx
  on awareness.recipient_verifications(educator_id, recipient_email, created_at desc);
create index if not exists awareness_recipient_verification_expiry_idx
  on awareness.recipient_verifications(expires_at);
create index if not exists awareness_delivery_educator_idx
  on awareness.educator_report_deliveries(educator_id, created_at desc);

revoke all on awareness.recipient_verifications from public, anon, authenticated;
revoke all on awareness.educator_report_deliveries from public, anon, authenticated;
grant select (
  id,
  educator_id,
  report_id,
  recipient_name,
  recipient_email,
  status,
  emailed_at,
  created_at,
  updated_at
) on awareness.educator_report_deliveries to authenticated;
grant all on awareness.recipient_verifications, awareness.educator_report_deliveries to service_role;

alter table awareness.recipient_verifications enable row level security;
alter table awareness.educator_report_deliveries enable row level security;

create policy "educators read own report deliveries"
  on awareness.educator_report_deliveries
  for select
  to authenticated
  using (
    educator_id = (select auth.uid())
    and exists (
      select 1
      from awareness.profiles as educator
      where educator.id = (select auth.uid())
        and educator.role = 'educator'
    )
  );

drop trigger if exists touch_awareness_report_deliveries_updated_at
  on awareness.educator_report_deliveries;
create trigger touch_awareness_report_deliveries_updated_at
  before update on awareness.educator_report_deliveries
  for each row execute function awareness_private.touch_updated_at();

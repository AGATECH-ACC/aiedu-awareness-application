-- Educator-owned client directory.
-- Clients are contacts, not Supabase Auth users. A verified email can belong to
-- one client row per educator, and all client reports keep that ownership.

create table if not exists awareness.educator_clients (
  id uuid primary key default gen_random_uuid(),
  educator_id uuid not null references awareness.profiles(id) on delete cascade,
  display_name text not null,
  email text not null,
  email_verified_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint awareness_educator_client_name_length
    check (char_length(display_name) between 1 and 120),
  constraint awareness_educator_client_email_length
    check (char_length(email) between 3 and 320),
  constraint awareness_educator_client_owner_id_unique
    unique (educator_id, id)
);

create unique index if not exists awareness_educator_client_email_unique_idx
  on awareness.educator_clients(educator_id, lower(email));
create index if not exists awareness_educator_client_owner_idx
  on awareness.educator_clients(educator_id, created_at desc);

revoke all on awareness.educator_clients from public, anon, authenticated;
grant select (
  id,
  educator_id,
  display_name,
  email,
  email_verified_at,
  created_at,
  updated_at
) on awareness.educator_clients to authenticated;
grant all on awareness.educator_clients to service_role;

alter table awareness.educator_clients enable row level security;

create policy "educators read own clients"
  on awareness.educator_clients
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

drop trigger if exists touch_awareness_educator_clients_updated_at
  on awareness.educator_clients;
create trigger touch_awareness_educator_clients_updated_at
  before update on awareness.educator_clients
  for each row execute function awareness_private.touch_updated_at();

alter table awareness.recipient_verifications
  add column if not exists client_id uuid;
alter table awareness.educator_report_deliveries
  add column if not exists client_id uuid;

-- Preserve any reports created before the client directory was introduced.
insert into awareness.educator_clients (
  educator_id,
  display_name,
  email,
  email_verified_at,
  created_at
)
select distinct on (verification.educator_id, lower(verification.recipient_email))
  verification.educator_id,
  verification.recipient_name,
  lower(verification.recipient_email),
  verification.verified_at,
  verification.created_at
from awareness.recipient_verifications as verification
where verification.verified_at is not null
order by
  verification.educator_id,
  lower(verification.recipient_email),
  verification.verified_at desc;

update awareness.recipient_verifications as verification
set client_id = client.id
from awareness.educator_clients as client
where verification.verified_at is not null
  and verification.client_id is null
  and client.educator_id = verification.educator_id
  and lower(client.email) = lower(verification.recipient_email);

update awareness.educator_report_deliveries as delivery
set client_id = verification.client_id
from awareness.recipient_verifications as verification
where delivery.verification_id = verification.id
  and delivery.client_id is null;

alter table awareness.recipient_verifications
  add constraint awareness_recipient_verification_client_owner_fkey
  foreign key (educator_id, client_id)
  references awareness.educator_clients(educator_id, id)
  on delete restrict;
alter table awareness.recipient_verifications
  add constraint awareness_recipient_verification_verified_client
  check (verified_at is null or client_id is not null);

alter table awareness.educator_report_deliveries
  alter column client_id set not null;
alter table awareness.educator_report_deliveries
  add constraint awareness_delivery_client_owner_fkey
  foreign key (educator_id, client_id)
  references awareness.educator_clients(educator_id, id)
  on delete restrict;

create index if not exists awareness_recipient_verification_client_idx
  on awareness.recipient_verifications(client_id);
create index if not exists awareness_delivery_client_idx
  on awareness.educator_report_deliveries(client_id, created_at desc);

grant select (client_id) on awareness.educator_report_deliveries to authenticated;

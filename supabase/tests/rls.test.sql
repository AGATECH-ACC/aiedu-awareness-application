begin;

select plan(20);

insert into auth.users (id, email)
values
  ('11111111-1111-4111-8111-111111111111', 'owner@example.test'),
  ('22222222-2222-4222-8222-222222222222', 'other@example.test'),
  ('33333333-3333-4333-8333-333333333333', 'educator@example.test'),
  ('44444444-4444-4444-8444-444444444444', 'not-invited@example.test'),
  ('55555555-5555-4555-8555-555555555555', 'other-educator@example.test');

update awareness.profiles
set role = 'educator'
where id in (
  '33333333-3333-4333-8333-333333333333',
  '55555555-5555-4555-8555-555555555555'
);

insert into awareness.readings (id, user_id, mode, spread_key, cards)
values
  ('aaaaaaaa-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 1, 'single', '[{"n": 1}]'),
  ('aaaaaaaa-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', 1, 'single', '[{"n": 2}]');

insert into awareness.deep_reports (user_id, reading_id, model, content)
values
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-1111-4111-8111-111111111111', 'test-model', 'owner report'),
  ('22222222-2222-4222-8222-222222222222', 'aaaaaaaa-2222-4222-8222-222222222222', 'test-model', 'other report');

insert into awareness.educator_user_links (educator_id, user_id, created_by)
values (
  '33333333-3333-4333-8333-333333333333',
  '11111111-1111-4111-8111-111111111111',
  '11111111-1111-4111-8111-111111111111'
);

insert into awareness.educator_clients (id, educator_id, display_name, email, phone, email_verified_at)
values (
  'cccccccc-3333-4333-8333-333333333333',
  '33333333-3333-4333-8333-333333333333',
  '合格个案客户',
  'client@example.test',
  '+60123456789',
  now()
);

do $$
declare
  sequence_number integer;
  reading_id uuid;
  report_id uuid;
  verification_id uuid;
  phone_value text;
begin
  for sequence_number in 1..30 loop
    phone_value := case when sequence_number = 30 then null else '+60123456789' end;
    insert into awareness.readings (user_id, mode, spread_key, cards)
    values ('33333333-3333-4333-8333-333333333333', 1, 'single', '[{"n": 1}]')
    returning id into reading_id;

    insert into awareness.deep_reports (user_id, reading_id, model, content)
    values ('33333333-3333-4333-8333-333333333333', reading_id, 'test-model', 'qualifying report')
    returning id into report_id;

    insert into awareness.recipient_verifications (
      educator_id, client_id, recipient_name, recipient_email, recipient_phone,
      code_digest, expires_at, verified_at, authorization_expires_at, used_at
    ) values (
      '33333333-3333-4333-8333-333333333333',
      'cccccccc-3333-4333-8333-333333333333',
      '合格个案客户',
      'client@example.test',
      phone_value,
      repeat('a', 64),
      now() + interval '10 minutes',
      now(),
      now() + interval '1 hour',
      now()
    ) returning id into verification_id;

    insert into awareness.educator_report_deliveries (
      educator_id, client_id, report_id, verification_id,
      recipient_name, recipient_email, recipient_phone, status
    ) values (
      '33333333-3333-4333-8333-333333333333',
      'cccccccc-3333-4333-8333-333333333333',
      report_id,
      verification_id,
      '合格个案客户',
      'client@example.test',
      phone_value,
      case when sequence_number % 2 = 0 then 'sent' else 'failed' end
    );
  end loop;
end
$$;

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","app_metadata":{"awareness_access":true}}';

select is((select count(*)::int from awareness.readings), 1, 'owner sees only their reading');
select is((select count(*)::int from awareness.deep_reports), 1, 'owner sees only their report');
select is((select count(*)::int from awareness.profiles), 1, 'owner sees only their profile');
select throws_ok(
  $$insert into awareness.readings (user_id, mode, spread_key, cards)
    values ('22222222-2222-4222-8222-222222222222', 1, 'single', '[{"n": 3}]')$$,
  '42501',
  null,
  'owner cannot create another user reading'
);
select lives_ok(
  $$insert into awareness.readings (user_id, mode, spread_key, cards)
    values ('11111111-1111-4111-8111-111111111111', 2, 'protection-lesson-v1', '[{"n": 1}, {"n": 11}]')$$,
  'owner can create a supported two-card reading'
);
select throws_ok(
  $$insert into awareness.readings (user_id, mode, spread_key, cards)
    values ('11111111-1111-4111-8111-111111111111', 5, 'unsupported', '[{"n": 1}]')$$,
  '23514',
  null,
  'unsupported reading mode is rejected'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","app_metadata":{"awareness_access":true}}';

select is((select count(*)::int from awareness.deep_reports), 1, 'other user sees only their report');
select is((select count(*)::int from awareness.profiles), 1, 'other user sees only their profile');

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"33333333-3333-4333-8333-333333333333","app_metadata":{"awareness_access":true}}';

select is((select count(*)::int from awareness.readings), 32, 'educator sees their own and linked user readings only');
select is((select count(*)::int from awareness.deep_reports), 31, 'educator sees their own and linked user reports only');
select is((select count(*)::int from awareness.profiles), 2, 'educator sees self and linked user profiles');
select is(
  (select phone from awareness.educator_clients where id = 'cccccccc-3333-4333-8333-333333333333'),
  '+60123456789',
  'educator sees their client phone'
);
select is(
  (select awareness.educator_qualifying_report_count())::int,
  29,
  'only deliveries with phone and saved cards count toward the milestone'
);
select throws_ok(
  $$insert into awareness.educator_user_links (educator_id, user_id, created_by)
    values (
      '33333333-3333-4333-8333-333333333333',
      '22222222-2222-4222-8222-222222222222',
      '33333333-3333-4333-8333-333333333333'
    )$$,
  '42501',
  null,
  'educator cannot attach an arbitrary user'
);

reset role;
update awareness.educator_report_deliveries
set recipient_phone = '+60123456789'
where verification_id = (
  select id
  from awareness.recipient_verifications
  where educator_id = '33333333-3333-4333-8333-333333333333'
    and recipient_phone is null
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"33333333-3333-4333-8333-333333333333","app_metadata":{"awareness_access":true}}';

select is(
  (select awareness.educator_qualifying_report_count())::int,
  30,
  'the 30th qualifying delivery reaches the advanced tier threshold'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"55555555-5555-4555-8555-555555555555","app_metadata":{"awareness_access":true}}';

select is((select count(*)::int from awareness.educator_report_deliveries), 0, 'other educators cannot read private deliveries');
select is((select awareness.educator_qualifying_report_count())::int, 0, 'other educators cannot count another educator cases');

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"44444444-4444-4444-8444-444444444444","app_metadata":{}}';

select is((select count(*)::int from awareness.profiles), 0, 'non-invited account cannot read an Awareness profile');
select is((select awareness.educator_qualifying_report_count())::int, 0, 'non-invited account cannot count educator cases');
select throws_ok(
  $$insert into awareness.readings (user_id, mode, spread_key, cards)
    values ('44444444-4444-4444-8444-444444444444', 1, 'single', '[{"n": 4}]')$$,
  '42501',
  null,
  'non-invited account cannot create an Awareness reading'
);

select * from finish();
rollback;

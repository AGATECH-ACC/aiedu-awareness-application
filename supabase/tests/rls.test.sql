begin;

select plan(10);

insert into auth.users (id, email)
values
  ('11111111-1111-4111-8111-111111111111', 'owner@example.test'),
  ('22222222-2222-4222-8222-222222222222', 'other@example.test'),
  ('33333333-3333-4333-8333-333333333333', 'educator@example.test');

update awareness.profiles
set role = 'educator'
where id = '33333333-3333-4333-8333-333333333333';

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

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';

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

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';

select is((select count(*)::int from awareness.deep_reports), 1, 'other user sees only their report');
select is((select count(*)::int from awareness.profiles), 1, 'other user sees only their profile');

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-4333-8333-333333333333';

select is((select count(*)::int from awareness.readings), 1, 'educator sees the linked user reading');
select is((select count(*)::int from awareness.deep_reports), 1, 'educator sees the linked user report');
select is((select count(*)::int from awareness.profiles), 2, 'educator sees self and linked user profiles');
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

select * from finish();
rollback;

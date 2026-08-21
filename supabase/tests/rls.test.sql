begin;

select plan(8);

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'owner@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'other@example.test');

insert into public.readings (id, user_id, mode, spread_key, cards)
values
  ('aaaaaaaa-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 1, 'single', '[{"n": 1}]'),
  ('aaaaaaaa-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 1, 'single', '[{"n": 2}]');

insert into public.deep_reports (user_id, reading_id, model, content)
values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-1111-1111-1111-111111111111', 'test-model', 'owner report'),
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-2222-2222-2222-222222222222', 'test-model', 'other report');

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select is((select count(*)::int from public.readings), 1, 'owner sees only their reading');
select is((select count(*)::int from public.deep_reports), 1, 'owner sees only their report');
select is((select count(*)::int from public.profiles), 1, 'owner sees only their profile');
select throws_ok(
  $$insert into public.readings (user_id, mode, spread_key, cards)
    values ('22222222-2222-2222-2222-222222222222', 1, 'single', '[{"n": 3}]')$$,
  '42501',
  null,
  'owner cannot create another user reading'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

select is((select count(*)::int from public.readings), 1, 'other user sees only their reading');
select is((select count(*)::int from public.deep_reports), 1, 'other user sees only their report');
select is((select count(*)::int from public.profiles), 1, 'other user sees only their profile');
select throws_ok(
  $$insert into public.deep_reports (user_id, reading_id, model, content)
    values (
      '11111111-1111-1111-1111-111111111111',
      'aaaaaaaa-1111-1111-1111-111111111111',
      'test-model',
      'forbidden report'
    )$$,
  '42501',
  null,
  'other user cannot create an owner report'
);

select * from finish();
rollback;

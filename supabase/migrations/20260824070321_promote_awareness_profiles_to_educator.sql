-- The private Awareness invitation flow now creates educator accounts. Promote
-- every profile that exists at rollout time while retaining the `user` enum
-- value and the table's `user` default for other shared-project accounts.
update awareness.profiles
set role = 'educator'
where role is distinct from 'educator'::awareness.account_role;

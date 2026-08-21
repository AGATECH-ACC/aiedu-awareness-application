# Deploy checklist · 幸福人生觉察卡

## 1. Toolchain and build

- [ ] Use Node.js 24 and run `npm ci`.
- [ ] Upgrade the Vercel CLI if needed: `npm i -g vercel@latest` (59.3.0+).
- [ ] Run `npm run build`; do not deploy a failed or warning-regressed build.
- [ ] Confirm `git status --short` contains only intentional files.

## 2. Supabase SQL and RLS

Run these files in order against the target project:

1. [Base schema](supabase/schema.sql)
2. [Public sharing](supabase/migrations/2_share.sql)
3. [Profiles / optional plan gate](supabase/migrations/3_profiles.sql)

- [ ] Confirm RLS is enabled on `readings`, `deep_reports`, and `profiles`.
- [ ] Run `supabase test db` with `supabase/tests/rls.test.sql`; both test
      identities must see only their own reading, report, and profile.
- [ ] Verify `anon` has no direct table privileges on user data.
- [ ] Verify `get_public_report(uuid)` returns only `content` and `created_at`,
      returns no row for private/wrong tokens, and has an empty function search path.
- [ ] Confirm the Data API exposes the explicitly granted tables/function for the
      intended roles in the project’s Data API settings.

## 3. Supabase Auth

- [ ] Set Site URL to `https://awareness.aiedu.academy`.
- [ ] Add `https://awareness.aiedu.academy/auth/callback`.
- [ ] Add `http://localhost:3000/auth/callback` for local development.
- [ ] Add the exact callback URL for every approved Vercel Preview domain (or a
      narrowly scoped Supabase-supported preview wildcard).
- [ ] Test an expired magic link: it must return to
      `/login?error=expired` with bilingual guidance.
- [ ] If Google is enabled, configure its OAuth client/secret in Supabase first,
      then set `NEXT_PUBLIC_ENABLE_GOOGLE_AUTH=true` and test the full callback.

## 4. Vercel environment variables

Set the correct values in both Production and Preview unless intentionally scoped:

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `NEXT_PUBLIC_ENABLE_GOOGLE_AUTH=false` (or `true` only after provider setup)
- [ ] `ANTHROPIC_API_KEY` — server-only secret; never use a `NEXT_PUBLIC_` prefix
- [ ] `REPORT_MODEL` (defaults safely to `claude-sonnet-5`)
- [ ] `REPORT_DAILY_LIMIT=5`
- [ ] `NEXT_PUBLIC_REQUIRE_PLAN=false` until paid access is intentionally enabled
- [ ] `NEXT_PUBLIC_SITE_URL=https://awareness.aiedu.academy`

After changing a `NEXT_PUBLIC_` value, redeploy because it is embedded at build time.

## 5. Domain and DNS

- [ ] Add `awareness.aiedu.academy` in Vercel Project → Settings → Domains.
- [ ] At the `aiedu.academy` DNS provider, create the CNAME target shown by
      Vercel for host `awareness` (use the displayed value, not an assumed target).
- [ ] Wait for Vercel’s domain verification and TLS certificate.
- [ ] Reconfirm Supabase Site URL/callbacks and `NEXT_PUBLIC_SITE_URL` use HTTPS.

## 6. Post-deploy smoke test

- [ ] Signed out: `/` draws single, three-card, and Inner Child readings.
- [ ] “全部 40” shows 40 cards and opens a selected card as a single reading.
- [ ] At ~380px there is no horizontal scroll; keyboard focus remains visible;
      reduced-motion preference disables nonessential motion.
- [ ] Signed out: `/portal` redirects to `/login?next=/portal`, then returns after login.
- [ ] Sign out from the nav and portal; the session clears and returns to `/`.
- [ ] Authenticated invalid report payload returns `400`; no DB rows are written.
- [ ] Successful report creates one `readings` row and one `deep_reports` row.
- [ ] Simulated model failure returns `502` plus `readingId`, stores no empty report,
      and the retry uses that same reading.
- [ ] Daily cap returns `429`; rapid IP burst also returns `429` with `Retry-After`.
- [ ] History shows card summaries; delete confirms and removes without a reload.
- [ ] Share creates `/r/<uuid>`; an incognito browser can open it, while a private,
      disabled, malformed, or wrong token returns `404`.
- [ ] With plan flag off, reporting is unchanged. With it on, a free user sees the
      upgrade prompt and receives API `403`; test this only after profiles migration.
- [ ] `/opengraph-image` returns `image/png`; `/` and public report links preview
      with the expected bilingual title/description.
- [ ] Check browser console and Vercel Function logs for new errors.
- [ ] Run `rg -n "ANTHROPIC|service_role" app components lib`; Anthropic references
      must remain in server route code, and no service-role key may appear.

# Deploy checklist · 幸福人生觉察卡

## 1. Toolchain and build

- [ ] Use Node.js 24 and run `npm ci`.
- [ ] Upgrade the Vercel CLI if needed: `npm i -g vercel@latest`.
- [ ] Run `npm run build`; do not deploy a failed or warning-regressed build.
- [ ] Confirm `git status --short` contains only intentional files.

## 2. Supabase SQL and RLS

Apply these files in order against the target project:

1. [Awareness schema](supabase/migrations/20260823112927_create_awareness_schema.sql)
2. [Expose Awareness Data API](supabase/migrations/20260823113313_expose_awareness_schema.sql)
3. [Optimize Awareness policies](supabase/migrations/20260823113410_optimize_awareness_policies.sql)
4. [Educator recipient OTP](supabase/migrations/20260823170000_educator_recipient_otp.sql)
5. [Educator client directory](supabase/migrations/20260823173000_educator_clients.sql)
6. [Optimize educator client indexes](supabase/migrations/20260823174500_optimize_educator_client_indexes.sql)

- [ ] Confirm `awareness` is in the Data API exposed-schema list.
- [ ] Confirm RLS is enabled on `awareness.profiles`,
      `awareness.educator_user_links`, `awareness.readings`, and
      `awareness.deep_reports`, `awareness.educator_clients`,
      `awareness.recipient_verifications`, and
      `awareness.educator_report_deliveries`.
- [ ] Confirm `authenticated` has no privileges on `recipient_verifications`;
      educators receive select-only access to their own delivery history.
- [ ] Run `supabase test db` with `supabase/tests/rls.test.sql`; both test
      users must remain isolated and the educator must see only the linked user.
- [ ] Verify `anon` has no direct table privileges on user data.
- [ ] Verify `get_public_report(uuid)` returns only `content` and `created_at`,
      returns no row for private/wrong tokens, and has an empty function search path.
- [ ] Confirm the Data API exposes the explicitly granted tables/function for the
      intended roles in the project’s Data API settings.

## 3. Supabase Auth

- [ ] Preserve the shared AiEdu Supabase project's existing Site URL.
- [ ] Add `https://app.aiedu.academy/auth/callback`.
- [ ] Add `http://localhost:3100/auth/callback` for local development.
- [ ] Add the exact callback URL for every approved Vercel Preview domain (or a
      narrowly scoped Supabase-supported preview wildcard).
- [ ] Test an expired magic link: it must return to
      `/login?error=expired` with bilingual guidance.
- [ ] Enable custom SMTP in Supabase Auth using the existing Resend account:
      host `smtp.resend.com`, port `465`, username `resend`, and the Resend API
      key as the SMTP password. Keep email confirmation enabled.
- [ ] Use a sender address on a Resend-verified domain, such as
      `no-reply@aiedu.academy`, and set the sender name to `AiEDU Awareness`.
- [ ] Verify both paths: `/login` must not create an unknown user, while
      `/signup` must create the Auth user and its `awareness.profiles` row.
- [ ] If Google is enabled, configure its OAuth client/secret in Supabase first,
      then set `NEXT_PUBLIC_ENABLE_GOOGLE_AUTH=true` and test the full callback.

## 4. Vercel environment variables

Set the correct values in both Production and Preview unless intentionally scoped:

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (preferred), or the existing
      `NEXT_PUBLIC_SUPABASE_ANON_KEY` fallback
- [ ] `NEXT_PUBLIC_ENABLE_GOOGLE_AUTH=false` (or `true` only after provider setup)
- [ ] `SUPABASE_SECRET_KEY` — server-only `sb_secret_` key for OTP/delivery writes
- [ ] `RESEND_API_KEY` — server-only key from the existing Resend account
- [ ] `RESEND_FROM_EMAIL` — sender address on the verified Resend domain
- [ ] Optional `RECIPIENT_OTP_SECRET` — 32+ random characters; when omitted,
      OTP signing derives a domain-separated key from `SUPABASE_SECRET_KEY`
- [ ] `REPORT_DAILY_LIMIT=5`
- [ ] `NEXT_PUBLIC_REQUIRE_PLAN=false` until paid access is intentionally enabled
- [ ] `NEXT_PUBLIC_SITE_URL=https://app.aiedu.academy`

After changing a `NEXT_PUBLIC_` value, redeploy because it is embedded at build time.

## 5. Domain and DNS

- [ ] Add `app.aiedu.academy` in Vercel Project → Settings → Domains.
- [ ] At the `aiedu.academy` DNS provider, create the CNAME target shown by
      Vercel for host `app` (use the displayed value, not an assumed target).
- [ ] Wait for Vercel’s domain verification and TLS certificate.
- [ ] Reconfirm Supabase Site URL/callbacks and `NEXT_PUBLIC_SITE_URL` use HTTPS.

## 6. Post-deploy smoke test

- [ ] Signed out: `/` loads the public landing page and can complete a single-card reading.
- [ ] Public `/` does not expose the three-card or Inner Child mode controls.
- [ ] Signed in: `/portal` loads the full deck, report creation, and report history.
- [ ] Approved educator: `/portal` shows “Client reading” and “My reports”; a
      normal user must never see the educator workflow.
- [ ] Client reading sends a six-digit OTP, rejects wrong/expired/reused codes,
      enforces the 60-second resend window, and reveals the deck only after verification.
- [ ] A verified client report creates one delivery row, emails one private
      `/r/<uuid>` link, and supports retrying a failed Resend delivery.
- [ ] A verified client has one `educator_clients` row per educator and does not
      require a Supabase Auth account.
- [ ] “全部 40” shows 40 cards and opens a selected card as a single reading.
- [ ] At ~380px there is no horizontal scroll; keyboard focus remains visible;
      reduced-motion preference disables nonessential motion.
- [ ] Signed out: `/portal` redirects to `/login?next=/portal`, then returns after login.
- [ ] Sign out from the nav and portal; the session clears and returns to `/`.
- [ ] Authenticated invalid report payload returns `400`; no DB rows are written.
- [ ] Successful report creates one `readings` row and one `deep_reports` row.
- [ ] Generate the same saved spread twice in an isolated test and confirm the
      fixed report content is deterministic and contains no external AI request.
- [ ] Daily cap returns `429`; rapid IP burst also returns `429` with `Retry-After`.
- [ ] History shows card summaries; delete confirms and removes without a reload.
- [ ] Share creates `/r/<uuid>`; an incognito browser can open it, while a private,
      disabled, malformed, or wrong token returns `404`.
- [ ] With plan flag off, reporting is unchanged. With it on, a free user sees the
      upgrade prompt and receives API `403`; test this only after profiles migration.
- [ ] `/opengraph-image` returns `image/png`; `/` and public report links preview
      with the expected bilingual title/description.
- [ ] Check browser console and Vercel Function logs for new errors.
- [ ] Run `rg -n "ANTHROPIC|service_role" app components lib`; no Anthropic
      runtime reference and no service-role key may appear.

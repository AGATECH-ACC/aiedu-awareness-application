# 幸福人生觉察卡 · Awareness Portal

A bilingual public card experience with an authenticated portal for the Happy
Life Awareness Cards deck at `app.aiedu.academy`.

- **Public landing page:** `/` lets anyone play a single-card reading without signing in.
- **Signed-in user portal:** draw cards, save readings, generate fixed-content bilingual Deep Reports,
  review/delete history, and create read-only public report links.
- **Educator data layer:** an educator can read reports belonging only to users
  who have actively linked that educator. Links are unlimited and many-to-many.
- **Verified client readings:** approved educators can send a six-digit consent
  code, draw for a recipient, and email one private report link after verification.
- **Public sharing:** only an explicitly shared `/r/<uuid>` report is public.
- **Optional plan gate:** disabled by default; payment processing remains a
  deliberate TODO.

Stack: **Next.js 14 App Router · Supabase Auth/Postgres/RLS · Resend · Vercel**.
The project targets **Node.js 24** for parity with Vercel.

## Project map

```text
lib/cards.js                         40 cards + spreads; the only card-data source
lib/db.js                            RLS-scoped Supabase data helpers
lib/supabase-browser.js              browser client
lib/supabase-server.js               cookie-bound server client
middleware.js                        refreshes auth and gates /portal
components/CardDeck.jsx              shared public/portal drawing UI
components/Markdownish.jsx           minimal safe report renderer
app/page.jsx                         public landing + single-card draw
app/login/*                          invite-only email/password sign-in
app/forgot-password/*                password reset email request
app/auth/set-password/*              invitation/recovery password creation
app/portal/accounts/new/*            educator-only account invitations
app/portal/*                         authenticated draw → report → history flow
app/portal/client-reports/[id]       educator-only client report detail page
app/api/report/route.js              validation, plan/cap gates, fixed report persistence
app/api/recipient-verification/*     educator-only recipient OTP request + verify
app/api/report-delivery/[id]         resend a failed recipient report email
app/r/[token]/page.jsx               public read-only report via narrow RPC
supabase/migrations/20260823112927_create_awareness_schema.sql
                                      Auth-linked awareness schema + RLS
supabase/migrations/20260823113313_expose_awareness_schema.sql
                                      exposes awareness through the Data API
supabase/migrations/20260823113410_optimize_awareness_policies.sql
                                      indexes + consolidated access policies
supabase/migrations/20260823170000_educator_recipient_otp.sql
                                      hidden OTP records + educator delivery history
supabase/migrations/20260823173000_educator_clients.sql
                                      educator-owned verified client directory
supabase/migrations/20260823174500_optimize_educator_client_indexes.sql
                                      composite ownership indexes
supabase/migrations/20260824055230_restrict_awareness_to_invited_accounts.sql
                                      invite-only app claim + restrictive RLS
supabase/tests/rls.test.sql           access/ownership/educator policy checks
```

Do not copy card meanings into another file. Both drawing and report generation
must continue importing from `lib/cards.js`.

## Local setup

1. Use Node.js 24 and install the locked dependencies:

   ```bash
   npm ci
   ```

2. Create local environment values:

   ```bash
   cp .env.example .env.local
   ```

   Placeholder values let the UI build, but real Supabase and Resend values
   are required for authentication, persistence, sharing, and email delivery.

3. Apply the Awareness migrations in this order:

   1. `20260823112927_create_awareness_schema.sql`
   2. `20260823113313_expose_awareness_schema.sql`
   3. `20260823113410_optimize_awareness_policies.sql`
   4. `20260823170000_educator_recipient_otp.sql`
   5. `20260823173000_educator_clients.sql`
   6. `20260823174500_optimize_educator_client_indexes.sql`
   7. `20260824055230_restrict_awareness_to_invited_accounts.sql`

   These migrations create `awareness.profiles`, `awareness.educator_user_links`,
   `awareness.readings`, and `awareness.deep_reports`. Every profile references
   `auth.users`; every application table has RLS. The public sharing function is a
   narrow `SECURITY DEFINER` RPC returning only `content` and `created_at` for an
   unguessable token whose report is explicitly public.

4. Configure Supabase Auth URL settings:

   - Keep the shared AiEdu project's existing Site URL unchanged.
   - Add `http://localhost:3100/auth/set-password` to Redirect URLs for local work.
   - Add `https://app.aiedu.academy/auth/set-password` to Redirect URLs for production.
   - Also add the set-password path for each approved Vercel preview domain.
   - Keep email/password authentication enabled. This is a shared Supabase
     project, so project-wide signup may remain enabled for other apps; the
     final Awareness migration and server-issued `awareness_access` claim keep
     this app invitation-only.
   - Keep the Invite user and Reset password templates pointed at
     `{{ .ConfirmationURL }}` so Supabase sends the client-only implicit link
     directly to `/auth/set-password`.

5. Start the app:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3100](http://localhost:3100).

## Environment variables

| Variable | Exposure | Default / purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser + server | Supabase publishable API key; RLS remains mandatory |
| `SUPABASE_SECRET_KEY` | **Server only** | Trusted recipient OTP/delivery writes; prefer a modern `sb_secret_` key |
| `RESEND_API_KEY` | **Server only** | Existing Resend account key for recipient OTP and report emails |
| `RESEND_FROM_EMAIL` | **Server only** | Sender on a domain verified in Resend |
| `RECIPIENT_OTP_SECRET` | **Server only** | Optional 32+ character OTP signing secret; derives from Supabase secret when omitted |
| `REPORT_DAILY_LIMIT` | Server only | `5`; per authenticated user from 00:00 UTC |
| `NEXT_PUBLIC_REQUIRE_PLAN` | Browser + server | `false`; when true, `profiles.plan='free'` is gated |
| `NEXT_PUBLIC_SITE_URL` | Browser + server | Canonical origin for metadata and links |

Version 2 reports are generated locally from `lib/cards.js` and the reviewed
bilingual deep-meaning data in `lib/card-insights.js`; no AI model or AI API key
is used. AI-enhanced reports are intentionally reserved for a later version.
The report endpoint also applies a fixed best-effort IP burst limit of 10
requests per minute. It is in memory, so it resets on deploy/cold start and is
not shared across Vercel instances. The user-scoped database daily cap is the
authoritative usage control.

## Authentication and data behavior

- `/` is public and limits the deck to single-card readings.
- Accounts are invitation-only. There is no public signup route and the browser
  never calls `signUp()`, `signInWithOtp()`, or an OAuth provider.
- An educator can open `/portal/accounts/new`; its server-authorized API calls
  `inviteUserByEmail()`, grants server-only `awareness_access` app metadata, and
  sends the recipient to `/auth/set-password`.
- Restrictive RLS policies require that server-managed claim in addition to the
  existing ownership policies. Existing Awareness users are backfilled by the
  migration; future accounts created by other apps in the shared project cannot
  use Awareness routes or tables unless invited here.
- Invite and recovery links use Supabase's client-only implicit flow. Normal
  sign-in uses email/password and stores its session in the SSR cookie client.
- `/forgot-password` does not reveal whether an email address has an account.
- `/portal` is checked in middleware and again in its Server Component.
- `/api/report` independently verifies the user before any user data is read or
  written. Middleware is defense in depth, not the sole authorization layer.
- Every insert carries `user_id`; reads, updates, and deletes are constrained by
  the cookie-bound session and RLS. Linked educators receive read-only access.
- Learners control educator links. An educator cannot attach an arbitrary user.
- Role changes are admin-only. Promote an approved educator from trusted SQL or
  backend administration; browser clients have no permission to update `role`.
- Recipient OTP digests are not selectable by browser roles. A verified code
  authorizes one report for one educator/recipient pair and expires after one hour.
- Recipients are contacts, not Auth users. Successful OTP verification creates or
  refreshes one educator-owned `awareness.educator_clients` row.
- Client reports remain owned by the educator, while recipients receive an
  unguessable read-only `/r/<uuid>` link. Recipient verification creates no account.
- Fixed reports are deterministic: the same spread, cards, positions, and
  reflection context produce the same report content.
- Reports are reflective, not diagnostic. Keep the visible disclaimer intact.

Run the two-user RLS suite against a configured local Supabase stack:

```bash
supabase test db
```

## Optional plan gate

The `awareness.profiles` table is included in the main Awareness migration. With
`NEXT_PUBLIC_REQUIRE_PLAN=false`, behavior is unchanged and no profile lookup is
required. With it set to `true`, free/missing profiles receive `403` from the API
and see an upgrade prompt. `startCheckout()` in `app/portal/PortalClient.jsx` is
intentionally a TODO; no real Curlec/Stripe flow is included.

## Build and deploy

```bash
npm run build
```

Import the repository into Vercel, add the environment variables for Production
and Preview, and attach `app.aiedu.academy`. Follow
`DEPLOY_CHECKLIST.md` for the complete database, Auth, DNS, and smoke-test order.

For CLI deployment work, use the current Vercel CLI:

```bash
npm i -g vercel@latest
```

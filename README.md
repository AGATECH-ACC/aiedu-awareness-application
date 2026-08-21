# 幸福人生觉察卡 · Awareness Portal

A bilingual, two-layer web app for the Happy Life Awareness Cards deck at
`awareness.aiedu.academy`.

- **Public layer:** draw one card, a three-card spread, or the four-card Inner
  Child spread without an account.
- **Signed-in portal:** save readings, generate reflective AI Deep Reports,
  review/delete history, and create read-only public report links.
- **Optional plan gate:** disabled by default; payment processing remains a
  deliberate TODO.

Stack: **Next.js 14 App Router · Supabase Auth/Postgres/RLS · Anthropic SDK · Vercel**.
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
app/page.jsx                         public deck
app/login/*                          magic-link and optional Google sign-in
app/auth/callback/route.js            PKCE callback and expired-link handling
app/portal/*                         authenticated draw → report → history flow
app/api/report/route.js              validation, plan/cap gates, Claude, persistence
app/r/[token]/page.jsx               public read-only report via narrow RPC
supabase/schema.sql                  base readings/reports schema and RLS
supabase/migrations/2_share.sql      sharing columns + public RPC
supabase/migrations/3_profiles.sql   profiles, signup trigger, optional plan data
supabase/tests/rls.test.sql          two-identity ownership policy checks
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

   Placeholder values let the UI build, but real Supabase and Anthropic values
   are required for authentication, persistence, sharing, and report generation.

3. In a fresh Supabase project, run SQL in this order:

   1. `supabase/schema.sql`
   2. `supabase/migrations/2_share.sql`
   3. `supabase/migrations/3_profiles.sql`

   The SQL explicitly grants only the Data API privileges the app needs and
   enables ownership RLS on every public table. The public sharing function is a
   narrow `SECURITY DEFINER` RPC returning only `content` and `created_at` for an
   unguessable token whose report is explicitly public.

4. Configure Supabase Auth URL settings:

   - Site URL: `http://localhost:3000` locally; the production domain when live.
   - Redirect URL: `http://localhost:3000/auth/callback`.
   - Also add the production callback and each approved Vercel preview callback.
   - Enable Google in Supabase and set `NEXT_PUBLIC_ENABLE_GOOGLE_AUTH=true` only
     after its OAuth client is configured.

5. Start the app:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Exposure | Default / purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + server | Supabase anon/publishable API key; RLS remains mandatory |
| `NEXT_PUBLIC_ENABLE_GOOGLE_AUTH` | Browser + server | `false`; enables the Google button only after provider setup |
| `ANTHROPIC_API_KEY` | **Server only** | Required for Deep Reports; never prefix with `NEXT_PUBLIC_` |
| `REPORT_MODEL` | Server only | `claude-sonnet-5` fallback; never hardcoded elsewhere |
| `REPORT_DAILY_LIMIT` | Server only | `5`; per authenticated user from 00:00 UTC |
| `NEXT_PUBLIC_REQUIRE_PLAN` | Browser + server | `false`; when true, `profiles.plan='free'` is gated |
| `NEXT_PUBLIC_SITE_URL` | Browser + server | Canonical origin for metadata and links |

The report endpoint also applies a fixed best-effort IP burst limit of 10
requests per minute. It is in memory, so it resets on deploy/cold start and is
not shared across Vercel instances. The user-scoped database daily cap is the
authoritative cost control.

## Authentication and data behavior

- `/portal` is checked in middleware and again in its Server Component.
- `/api/report` independently verifies the user before any user data is read or
  written. Middleware is defense in depth, not the sole authorization layer.
- Every insert carries `user_id`; reads, updates, and deletes are constrained by
  the cookie-bound session and RLS.
- A generation failure keeps the reading and returns `readingId`. Retrying uses
  that saved reading and does not redraw or insert a second reading.
- Reports are reflective, not diagnostic. Keep the system prompt and visible
  disclaimer intact.

Run the two-user RLS suite against a configured local Supabase stack:

```bash
supabase test db
```

## Optional plan gate

Apply `3_profiles.sql` before enabling the flag. With
`NEXT_PUBLIC_REQUIRE_PLAN=false`, behavior is unchanged and no profile lookup is
required. With it set to `true`, free/missing profiles receive `403` from the API
and see an upgrade prompt. `startCheckout()` in `app/portal/PortalClient.jsx` is
intentionally a TODO; no real Curlec/Stripe flow is included.

## Build and deploy

```bash
npm run build
```

Import the repository into Vercel, add the environment variables for Production
and Preview, and attach `awareness.aiedu.academy`. Follow
`DEPLOY_CHECKLIST.md` for the complete database, Auth, DNS, and smoke-test order.

For CLI deployment work, use a current Vercel CLI (59.3.0 or newer):

```bash
npm i -g vercel@latest
```

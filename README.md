# 幸福人生觉察卡 · Awareness Portal

A two-layer web app for the Happy Life Awareness Cards deck, on
**awareness.aiedu.academy**.

- **Layer 1 — Open draw (public):** single / three-card / Inner Child spreads,
  each card with its meaning and "how it affects you." No login.
- **Layer 2 — Portal (sign in):** save readings + generate an AI **Deep Report**
  (overview, card-by-card, inner patterns, integrated guidance, a 7-day practice,
  and a closing affirmation), with per-user history.

Stack: **Next.js 14 (App Router) · Supabase (Auth + Postgres, RLS) · Claude API · Vercel.**

---

## File map

```
lib/cards.js              40-card dataset + spreads (single source of truth)
lib/supabase-browser.js   client Supabase
lib/supabase-server.js    server Supabase (cookies)
middleware.js             session refresh + gates /portal
components/CardDeck.jsx    the draw UI (emits each reading via onReading)
components/Markdownish.jsx report renderer
components/TopNav.jsx
app/page.jsx              Layer 1 (public draw)
app/login/page.jsx        magic-link + Google sign in
app/auth/callback/route.js
app/portal/page.jsx       Layer 2 (server: auth + history)
app/portal/PortalClient.jsx  draw → deep report → history
app/api/report/route.js   auth-gated: saves reading, calls Claude, stores report
supabase/schema.sql       tables + RLS
```

The card content lives **only** in `lib/cards.js`. Edit it there and both the
deck and the report update.

---

## 1. Create the repo & install

```bash
# in this folder
git init && git add . && git commit -m "init awareness portal"
# create an empty GitHub repo, then:
git remote add origin git@github.com:AGA-Ventures/awareness-aiedu.git
git push -u origin main

npm install
```

## 2. Supabase

1. Create a new Supabase project (portal-only — keep it separate from other data).
2. **SQL editor → run** `supabase/schema.sql`.
3. **Authentication → URL Configuration:**
   - Site URL: `https://awareness.aiedu.academy`
   - Redirect URLs: add `https://awareness.aiedu.academy/auth/callback`
     and `http://localhost:3000/auth/callback` for local dev.
4. (Optional) **Authentication → Providers → Google** to enable the Google button.
5. Copy the Project URL + anon key into env (below).

## 3. Environment

Copy `.env.example` → `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
ANTHROPIC_API_KEY=sk-ant-...
REPORT_MODEL=claude-sonnet-5      # or claude-opus-4-8 / claude-haiku-4-5
NEXT_PUBLIC_SITE_URL=https://awareness.aiedu.academy
```

Local dev: `npm run dev` → http://localhost:3000

## 4. Deploy on Vercel

1. **New Project → import the GitHub repo.** Framework auto-detects Next.js.
2. Add the same env vars in **Project → Settings → Environment Variables**
   (Production + Preview). Keep `ANTHROPIC_API_KEY` server-only (no `NEXT_PUBLIC_`).
3. Deploy.

## 5. Domain: awareness.aiedu.academy

1. Vercel **Project → Settings → Domains → Add** `awareness.aiedu.academy`.
2. In your `aiedu.academy` DNS, add the record Vercel shows — usually:
   `CNAME  awareness  →  cname.vercel-dns.com`
3. Wait for the cert. Then set `NEXT_PUBLIC_SITE_URL` and the Supabase
   Site/Redirect URLs to the final domain (step 2.3 above).

---

## How the two layers connect

`CardDeck` is used by both pages. In the portal it's passed an `onReading`
callback, so each draw is captured (mode, spread key, card numbers, positions).
The **Deep Report** button posts that to `/api/report`, which:

1. verifies the Supabase session (401 if signed out),
2. inserts the reading (RLS scopes it to the user),
3. calls Claude with the full card meanings + optional question,
4. stores and returns the bilingual report.

RLS guarantees each user only ever reads their own readings and reports.

## Notes / next steps

- **Cost control:** add a simple per-user daily cap in `app/api/report/route.js`
  (count today's `deep_reports` before generating).
- **Sharing:** add a public, read-only report page (`/r/[id]`) with a share token
  if you want users to share a reading.
- **i18n:** copy is bilingual inline; swap to next-intl if you add more languages.
- **Payments:** gate Deep Reports behind a plan (Curlec/Stripe) by checking a
  `profiles.plan` column in the report route.
- The report prompt is **not** therapy/diagnosis — the system prompt states this
  and the UI shows a reflection disclaimer.

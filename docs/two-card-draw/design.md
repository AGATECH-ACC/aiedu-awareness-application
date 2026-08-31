# Two-card awareness draw

> **Status:** Proposed for review

## 1. Executive summary

The authenticated portal currently offers one-, three-, and four-card draws, but it cannot run the requested two-card exercise. This change adds a fixed two-card spread that draws the first card from protection patterns, cards 1 through 10, and the second from life lessons, cards 11 through 20. It will use the existing draw ritual, report API, deterministic report builder, history, sharing, and educator-recipient flow. The main downside is that mode `2` becomes a permanent stored reading contract, so the database and every mode-aware reader must support it before the UI is enabled.

## 2. Context and scope

The current boundaries are documented in [ARCHITECTURE.md](../../ARCHITECTURE.md). `lib/cards.js` defines card facts, chapters, current spreads, position ranges, and display labels. `CardDeck` handles the browser draw ritual. `lib/reading-validation.js` is the server-side reading contract. `POST /api/report` persists a validated reading and its deterministic report in Supabase.

Today, `CardDeck`, server validation, report wording, helper labels, and the `awareness.readings.mode` database constraint recognize only modes 1, 3, and 4. Adding a UI button alone would create a value that the report path and database reject. This design therefore adds mode 2 across the full authenticated lifecycle.

Once shipped, signed-in users and educators can choose the two-card spread, draw randomly or enter physical card numbers, generate a report, revisit it, share it, and use it in the verified recipient flow. The public `/draw` route remains single-card only. Card meanings, authentication, RLS policies, report limits, sharing, recipient consent, email delivery, and the proposed credit system are outside the changed boundary.

## 3. System context

The new mode follows the current dependency direction and does not add an outside service.

```text
Authenticated user or educator
            |
            v
CardDeck selects mode 2
  random or manual input
            |
            v
lib/cards.js canonical spread
  position 1: cards 1-10
  position 2: cards 11-20
            |
            v
POST /api/report
  Auth + Awareness claim + rate limit
  + server validation
            |
            +----> deterministic Chinese report
            |
            v
Supabase reading + deep report
  existing RLS and sharing rules
```

The only database boundary change is the allowed `mode` value. The browser remains untrusted, and `POST /api/report` derives canonical positions and ranges from shared spread data before it persists an application-created reading. Existing authenticated clients retain direct owner-scoped insert access to `awareness.readings`, so the database does not guarantee every semantic spread rule by itself.

## 4. Proposed design

### How it works

A signed-in user selects `两张牌` in `CardDeck`. For a random draw, the deck selects one card from 1 through 10, reveals it as `防护模式`, then waits for the user's existing deliberate second click. It selects and reveals one card from 11 through 20 as `人生课题`. For manual entry, the two number fields show their own ranges and reject values outside them before display.

When both cards are revealed, `CardDeck` publishes mode `2`, spread key `protection-lesson-v1`, and the two card numbers to its portal container. It may retain canonical positions for local presentation, but the report request does not need to send them. The user may then submit the existing optional reflection question to `POST /api/report`.

The route authenticates the user and applies the existing access, plan, burst, and daily report checks. `normalizeNewReading()` accepts the request only when the mode, spread key, card count, and position ranges match the canonical two-card spread. It derives the position names from `lib/cards.js` and ignores any client-supplied position copy for current versioned spreads. The route writes the reading, builds a deterministic report whose system-generated copy is Chinese, and writes the report through the existing RLS-scoped data path. The user's optional question keeps its original script after the existing trim and inline-whitespace normalization. History, report pages, public sharing, recipient delivery, and retry use the stored mode and spread key without a separate two-card code path.

### Components and responsibilities

`lib/cards.js` owns the `TWO_CARD_AWARENESS` definition, its immutable key, position names, guides, ranges, display helpers, and the small pure position-draw helper used by `CardDeck`. The helper accepts an optional random-number function that defaults to `Math.random`, so its boundary choices can be checked deterministically. It does not own report prose, persistence, authorization, or drawing state.

`components/CardDeck.jsx` owns mode selection, client-side range feedback, progressive reveal, and completed-spread presentation. It calls the shared pure draw helper instead of maintaining a second random-selection path. It does not authorize the user, define the server contract, or persist a reading.

`lib/reading-validation.js` owns acceptance of fresh and saved mode-2 readings through the report route. It depends on the spread definition in `lib/cards.js`, treats positions as optional for current versioned spreads, ignores them when supplied, and returns canonical positions. It does not validate arbitrary direct database inserts, write to Supabase, or decide authorization.

`lib/fixed-report.js` owns the two-card report name, position meanings, connection, and transformation path. It depends on the canonical spread and existing card insights. It does not add card meanings or call an AI service.

`app/api/report/route.js` keeps its current ownership of authentication, limits, persistence sequencing, and error mapping. It consumes the expanded validator and report builder. It does not need a mode-2-only branch.

The new Supabase migration owns the database compatibility change from modes `(1, 3, 4)` to `(1, 2, 3, 4)`. Existing RLS policies continue to own row access. The migration does not change privileges, ownership rules, report data, or existing rows.

Display consumers such as `ReportDocument`, report email, report lists, and public report pages continue to use `readingSpreadLabel()` and `readingReportName()`. They do not define their own mode-2 wording.

### Decisions

**Use mode `2` as the card count.** Encoding the spread as a special three-card or legacy mode would avoid a database change but would make validation, count checks, and report metadata misleading. The cost is a schema migration and explicit compatibility work in mode-aware helpers.

**Use one fixed, versioned spread key.** The stored key is `protection-lesson-v1`. A generic `two-card` key would not identify the position contract if another two-card spread is added later. The versioned name is longer but lets saved readings retain a stable meaning.

**Name the positions from the existing chapters.** Position 1 is `防护模式 / Protection Pattern`, with guide `看见我当下正在用什么方式保护自己。` Position 2 is `人生课题 / Life Lesson`, with guide `看见这个模式邀请我学习和练习什么。` This follows the current card ranges instead of inventing another taxonomy. The spread is narrower than a general two-card draw.

**Support the complete authenticated lifecycle.** A UI-only draw would appear to work until report creation failed. Mode 2 therefore covers validation, storage, reports, labels, history, sharing, and educator recipient delivery. This touches more existing surfaces but avoids a split product contract.

**Keep the implementation local to existing patterns.** Add the new spread and the smallest mode-specific presentation and report branches. Do not introduce a spread registry abstraction, new component hierarchy, or dependency unless the existing structures cannot express mode 2. This keeps the diff small at the cost of retaining some explicit mode checks.

**Make canonical positions server-derived.** Current clients send position labels that validation shape-checks and then replaces. For current versioned spreads, `positions` becomes optional and is ignored when present. The server derives positions from mode and spread key. Existing clients remain compatible, while new clients stop duplicating data the server does not trust.

**Test the same random helper the UI calls.** Move the existing pure position-draw helper from `CardDeck` into `lib/cards.js` and inject `Math.random` by default. A deterministic callback can select the first and last eligible card in checks without creating another production path. This is one moved helper, not a general draw engine.

**Do not add point pricing.** The credit-gated usage design is proposed and is not current runtime behavior. This feature follows today's limits and plan gate. If credit gating is implemented later, it must classify mode 2 before that system is enabled.

## 5. Invariants and requirements

### Invariants

`INV-1` through `INV-6` apply to readings created or accepted by `POST /api/report`. Direct authenticated inserts into `awareness.readings` remain owner-scoped by RLS but are outside this semantic validation boundary.

- `INV-1`: A route-accepted mode-2 reading contains exactly two distinct cards in position order.
- `INV-2`: Its first card is always numbered 1 through 10.
- `INV-3`: Its second card is always numbered 11 through 20.
- `INV-4`: The route accepts mode 2 only with spread key `protection-lesson-v1`.
- `INV-5`: `lib/cards.js` is the only source of mode-2 positions and ranges.
- `INV-6`: Server validation rejects invalid mode-2 input before any reading or report write.
- `INV-7`: System-generated mode-2 report copy is Chinese-only and deterministic; the normalized user question is preserved without translation and excluded from that language claim.
- `INV-8`: Public `/draw` remains single-card only and writes no data.
- `INV-9`: Existing modes 1, 3, and 4 and legacy saved reports retain their current behavior.
- `INV-10`: Existing authentication, Awareness access checks, ownership, RLS, rate limits, and recipient consent apply unchanged to mode 2.

### Requirements

- The mode selector shows `两张牌` on every authenticated `CardDeck` surface.
- The spread uses the name `防护模式 · 人生课题`, short label `双卡觉察`, and report title `双卡觉察报告`.
- Random drawing reveals the two positions one at a time using the existing multi-card ritual.
- Manual entry shows the correct range for each position and gives the existing style of Chinese error feedback.
- The completed view shows both card artworks, position names, guides, and existing per-card interpretation content.
- A mode-2 report uses the path `防护模式 → 人生课题` and explains the move from seeing a protection pattern to recognizing the life lesson it invites.
- Saved, emailed, and shared surfaces show mode-2 labels through shared helpers.
- The layout remains usable without horizontal overflow at the repository's supported mobile widths.

## 6. Interfaces and data

The existing `POST /api/report` request shape gains one valid combination:

```json
{
  "mode": 2,
  "spreadKey": "protection-lesson-v1",
  "cardNumbers": [1, 11],
  "question": ""
}
```

For current versioned spreads, `positions` is optional. When an existing client supplies it, the validator ignores its value and returns the canonical positions from `lib/cards.js`. Omitting it is valid. Legacy saved-reading normalization keeps its current compatibility path. The response shape and HTTP status mapping do not change.

`awareness.readings.mode` changes from `check (mode in (1, 3, 4))` to `check (mode in (1, 2, 3, 4))` through a new timestamped migration. Historical migrations remain unchanged. The lightweight schema description and JavaScript mode annotation are updated to include 2. No new column, table, index, RLS policy, grant, environment variable, or external API is added.

### Naming and identity

`protection-lesson-v1` is the stored identity of this position and range contract. The implementation must reject a missing or different spread key for mode 2. If labels or guide copy change later, the key stays the same only when the position meanings and ranges are unchanged. A change to either range or position meaning requires a new versioned key.

Card numbers remain the stored card identities and resolve through `byNum`. Generated report content is stored as a snapshot, so later display-copy changes do not rewrite existing report content. History labels are resolved from current shared helpers and may adopt later copy changes while the stored spread identity remains stable.

## 7. Failure behavior and lifecycle

Invalid manual input stays in browser state, displays a Chinese error, and publishes no completed reading. Invalid direct API input returns the existing 400 response, creates no reading, and creates no report. Unknown mode-2 keys, wrong card counts, wrong ranges, non-integer cards, and duplicate cards all fail closed. Missing or malformed client `positions` do not affect a current versioned spread because the server ignores that field and derives canonical positions.

An authenticated client can still use its existing direct Supabase insert privilege to create an owner-scoped reading that violates application spread semantics. Such a row cannot create a report through the route: saved-reading normalization rejects it, the retry fails closed, and the route leaves the malformed row unchanged. This feature does not broaden direct write authority or add database enforcement for card semantics.

A database or report insert failure follows the current report lifecycle. The UI shows the existing error and does not pretend a report exists. If a reading was saved before a later report write failed, the existing reading-ID retry path is the recovery mechanism. This design adds no automatic retry or background work.

The database migration must deploy before the application exposes mode 2. Old application code remains compatible with the expanded database constraint. Deploying the application first is unsafe because Supabase would reject mode-2 inserts. If the application must roll back after mode-2 rows exist, keep the expanded constraint and keep server recognition of saved mode-2 readings; disable only new mode-2 selection. Existing reports and rows must remain readable.

Changing modes or draw methods clears the current local reading through the existing `CardDeck` lifecycle. A page close during progressive reveal loses only the unfinished local draw because persistence still begins when a report is requested. There is no queue, runtime configuration, startup loader, or shutdown drain to manage.

## 8. Security, privacy, and operations

The browser request is untrusted. Client range checks improve feedback, but `normalizeNewReading()` enforces mode, key, count, integer card IDs, uniqueness, and position ranges before route persistence. The report route continues to establish identity from the cookie-bound Supabase session, require the Awareness claim, and rely on RLS for owner-scoped writes. Educator recipient reports continue to require the existing role and one-time recipient authorization.

Authenticated browser roles retain the current direct `INSERT` grant on `awareness.readings`. RLS limits those inserts to the caller's own `user_id`, but the table does not enforce spread key, card count, ranges, order, or uniqueness. Application guarantees therefore apply only after route validation. Direct malformed rows expose no other user's data and cannot pass saved-reading normalization to produce a report.

Mode 2 stores the same personal data as other readings: card identities, optional question, ownership, and generated report content. It adds no secret, recipient field, tracking event, or new public data. Public sharing still requires the owner-controlled `is_public` flag and unguessable UUID token.

The draw itself uses only browser memory. Report generation consumes the existing per-IP allowance of 10 requests per minute and the user-scoped daily report allowance, default 5 from 00:00 UTC. At either limit, the existing 429 behavior applies and no report is created. Database connections, request duration, email delivery behavior, and cost remain unchanged.

## 9. Acceptance criteria

- `AC-1`: An authenticated ordinary user and educator can select `两张牌`; an anonymous visitor on `/draw` cannot.
- `AC-2`: The same pure position-draw helper called by `CardDeck` returns position 1 only from 1 through 10 and position 2 only from 11 through 20, including deterministic first- and last-card boundary selections.
- `AC-3`: Manual values `1/11` and `10/20` succeed, while `11/11`, `1/10`, and other cross-range values fail with position-specific Chinese feedback.
- `AC-4`: Random mode 2 reveals the first card, waits for a deliberate second action, reveals the second card, and then shows the complete two-card interpretation.
- `AC-5`: A valid mode-2 report request persists a reading with mode `2` and spread key `protection-lesson-v1`, then persists a deterministic report linked to it.
- `AC-6`: Invalid mode-2 API requests create neither a reading nor a report.
- `AC-7`: Report history, report detail, public share, report email, and educator recipient surfaces display `双卡觉察` or `双卡觉察报告` as appropriate.
- `AC-8`: A mode-2 report with an empty question contains no Latin-script system copy and describes `防护模式 → 人生课题`; a Latin-script user question is preserved without translation while all remaining system-generated copy stays Chinese-only.
- `AC-9`: The database accepts modes 1, 2, 3, and 4 and rejects any other mode.
- `AC-10`: Existing single-, three-, four-card, and legacy saved-report checks continue to pass.
- `AC-11`: Existing owner isolation, invited-account restriction, educator linkage, and recipient authorization behave identically for mode 2.
- `AC-12`: The mode selector, inputs, progressive reveal, and completed spread have no horizontal overflow at 320px viewport width and remain keyboard operable with visible status updates.

## 10. Test approach

Add a small Node `assert` check for a valid mode-2 payload, both valid boundaries, wrong key, wrong count, and both wrong-position cases. Also prove that omitted and malformed client `positions` are ignored and replaced with canonical positions for the current mode-2 key. This proves `INV-1` through `INV-6`, `AC-3`, and the server side of `AC-6` without adding a test framework.

Use the same exported position-draw helper that `CardDeck` calls with deterministic random values `0` and a value immediately below `1`. Assert results `[1, 11]` and `[10, 20]`, then assert every result from a repeated default-random sample stays within the two ranges. This proves `AC-2` without testing a duplicate random implementation.

Add a mode-2 `[1, 11]` scenario to `scripts/check-chinese-deep-report.mjs`. With an empty question, assert its spread name, path, and existing Chinese-only condition. With the question `My job`, assert that exact text remains, remove that user text from the checked string, and assert the remaining system-generated copy has no Latin script. This proves `INV-7` and `AC-8` without rejecting or rewriting user input.

Extend `supabase/tests/rls.test.sql` with an owner mode-2 insert and a database constraint rejection for an unsupported mode. Keep the existing cross-owner and uninvited insert assertions. This proves `INV-10`, `AC-9`, and `AC-11`.

Against a configured local stack, submit one valid authenticated mode-2 report and the invalid key, count, and range cases. Compare owner-scoped reading and report counts before and after each invalid request. The valid request must add one linked reading and report; every invalid request must add neither. This proves the persistence portion of `INV-6`, `AC-5`, and `AC-6`.

Run `npm run test:deep-report-copy`, the new Node validation check, `supabase test db`, `npm run build` under Node.js 24, and `git diff --check`. If the local Supabase stack or credentials are unavailable, report that check as blocked instead of passed.

Browser verification covers both selection methods, boundaries, invalid inputs, deliberate reveal, reduced motion, report creation, saved-history reload, public sharing, educator recipient delivery, 320px responsive layout, keyboard focus, status announcements, and the unchanged public `/draw` route. This proves `INV-8`, `INV-9`, and `AC-1`, `AC-4`, `AC-7`, `AC-10`, and `AC-12`.

## 11. Risks and tradeoffs

- A missed mode-aware helper could show a three- or four-card fallback label. Centralize names in the existing helpers and search every comparison against modes 1, 3, and 4 before implementation.
- Four mode buttons may become cramped on small screens. Verify at 320px and allow the existing selector to wrap or use shorter labels without changing the stored spread name.
- Application-first deployment would expose a mode the database rejects. Deploy the additive constraint migration first and verify it before enabling the selector.
- Rolling back to code that rejects mode 2 would break retries for already stored readings. Keep saved-reading compatibility and disable only new selection during a rollback.
- The second card is a life lesson, not necessarily a solution. Keep report wording reflective and avoid claiming that it resolves the first card.
- A future credit rollout has no price for mode 2. The credit design must settle that value before it can govern this spread.
- Direct authenticated inserts can create malformed owner-scoped readings because database enforcement remains intentionally narrow. Keep route invariants scoped accurately and prove malformed saved rows cannot produce reports.

## 12. Open questions

- What should mode 2 cost if the proposed credit-gated usage design is implemented? Recommended default: 1 point because it is a paid multi-card outcome but smaller than the four-card spread. This does not block implementation under current behavior.

There are no blocking questions.

## 13. Out of scope

- Public two-card drawing or anonymous report creation.
- New card meanings, rewritten card insight content, or AI-generated reports.
- Point balances, deductions, payment checkout, subscriptions, or pricing UI.
- New authentication, authorization, RLS, sharing, recipient-consent, or email-delivery behavior.
- A generic spread-builder UI or user-defined card ranges.
- Refactoring unrelated portal, report, database, or visual code.

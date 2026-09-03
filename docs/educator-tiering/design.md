# Educator Milestone and Tiering

## Delivered behavior

Each new client report now records a recipient name, email, phone number, and saved card reading. The educator dashboard derives its tier from qualifying report records:

- `基础教育者` for 0–29 qualifying reports.
- `高阶教育者` at 30 or more qualifying reports.

A qualifying report is one educator-owned delivery with a canonical phone number, saved report, and saved reading. Repeat reports for the same client each count. `pending`, `sent`, and `failed` delivery states count after the delivery row exists. Legacy rows without a phone stay visible but do not count.

The milestone card is on the client-report dashboard above the existing summary metrics. It displays the count, progress to 30, the remaining cases below the threshold, and the agreed achieved copy: `30 个案里程碑已达成` and `已符合基础课程毕业资格`. The sidebar mirrors the derived tier. Certificate generation is not included.

For `为他人抽牌`, basic educators can use only the single- and two-card modes. At 30 qualifying reports, advanced educators can use all current modes. The client UI limits the available controls, and `POST /api/report` repeats the check before it writes a reading, report, delivery, or consumes a recipient authorization. Self-draw and public report behavior are unchanged.

## Data and privacy

Phone is normalized server-side to an optional `+` and 7–20 digits. It is stored as:

- The current private contact value on `awareness.educator_clients.phone`.
- A private verification snapshot on `awareness.recipient_verifications.recipient_phone`.
- A private historical delivery snapshot on `awareness.educator_report_deliveries.recipient_phone`.

The phone is shown only in the educator's report cards, list, private detail page, and private search. It is not sent to either email template and is not added to the public report route.

`awareness.educator_qualifying_report_count()` is a stable `security invoker` function that counts the signed-in educator's evidence through the existing RLS boundary. It takes no educator ID, has no public or anonymous execution grant, and avoids using the browser's capped delivery list as a source of truth.

## Operational notes

Deploy the migration before the application. The new columns are nullable so the old application remains compatible with the migration, while legacy evidence remains non-qualifying. A pre-existing OTP without a phone must be restarted; no phone data is inferred.

Tier is derived from currently retained evidence. Removing qualifying evidence can lower the displayed tier. A permanent, awarded certificate or administrator override is a separate future feature.

## Checks

- `npm run check:educator-tiering` validates normalization and the 29/30 tier boundary.
- `supabase/tests/rls.test.sql` verifies threshold behavior and private educator isolation when run against a local Supabase stack.
- `npm run build` verifies the production application bundle.

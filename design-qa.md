# Homepage Design QA

## Evidence

- Source visual truth: `/var/folders/d8/t1mw66t10m5b3j173p40kqzc0000gn/T/codex-clipboard-66d117e8-ddac-419f-a189-90f4463da04d.png`
- Source pixels: `1536 × 1024`.
- Browser-rendered implementation: `tmp/design-qa/homepage-production-final.png`
- Implementation pixels: `1425 × 990` at a `1440 × 1000` CSS viewport, device scale factor `1`.
- Combined comparison: `tmp/design-qa/homepage-source-implementation-comparison.png`
- Mobile evidence: `tmp/design-qa/homepage-mobile-header-annotations-final.png`, `tmp/design-qa/homepage-mobile-story-final.png`, `tmp/design-qa/homepage-mobile-lower-final.png`, `tmp/design-qa/homepage-mobile-cta-final.png`.
- State: public, signed out, desktop and mobile light presentation.

## Findings

No actionable P0, P1, or P2 issues remain.

- Fonts and typography: the implementation preserves the source's high-contrast Songti-style Chinese display type, small-cap editorial English, generous tracking, and bilingual hierarchy. System Songti/Baskerville fallbacks are intentionally retained to match the existing card UI without adding a new font dependency.
- Spacing and layout rhythm: the desktop hero maintains the source's wide ivory canvas, slim gold rules, navy actions, and large right-weighted deck composition. Additional story sections use the same measured margins, fine borders, and serif rhythm. The `390px` layout has no horizontal overflow.
- Colors and visual tokens: ivory, midnight navy, antique gold, muted blue, and the card's restrained red outline match the source direction. Contrast remains strong in the navy information section and CTAs.
- Image quality and asset fidelity: all three generated editorial assets use the real card artwork as reference, render sharply through `next/image`, and share the same warm paper, navy, and gold art direction. All images report complete natural dimensions in the production browser.
- Copy and content: the homepage now clearly introduces the deck, explains why awareness matters, presents three benefits, teaches a three-minute ritual, and keeps Chinese/English support consistent.
- Interaction and accessibility: semantic headings, ordered lists, meaningful image alt text, focusable links, and reduced-motion handling are present. The primary CTA reaches `/draw`; the Discover link jumps to `#discover`; the sign-in and portal destinations remain unchanged.

## Comparison History

### Iteration 1

- [P2] Mobile header action wrapped and clipped at `390px`.
  - Initial fix: simplified the compact header and kept action labels on one line. The later annotation pass restored the requested logo while removing the redundant Draw navigation action.
  - Post-fix evidence: `tmp/design-qa/homepage-mobile-header-annotations-final.png`; measured document `scrollWidth` equals `clientWidth` at the annotated `478px` viewport.
- [P2] The Discover control did not perform an in-page jump when implemented with the router link.
  - Fix: changed it to a native hash anchor.
  - Post-fix evidence: browser URL becomes `/#discover` and scroll position moves to the story section.
- [P2] Supporting editorial images could appear blank after a direct hash jump while lazy loading.
  - Fix: loaded the two below-the-fold story images eagerly.
  - Post-fix evidence: both images report complete natural dimensions before the hash jump; `tmp/design-qa/homepage-mobile-story-final.png` shows the rendered image.

### Final pass

- Source and implementation were opened together in `tmp/design-qa/homepage-source-implementation-comparison.png`.
- Desktop production preview passed at `1440 × 1000` with all four visible images loaded and no browser console warnings or errors.
- Mobile passed at `390 × 844` with no horizontal overflow, readable navigation, stable image crops, and a usable stacked ritual/CTA layout.
- Primary interactions tested: Discover hash jump and homepage-to-draw navigation.
- Production build passed using the repository's declared Node 24 runtime and the isolated `.next-production` output.

### Mobile annotation pass

- Restored the AiEDU brand logo at widths up to `640px`; the rendered logo measures `62 × 28px` in the annotated `478 × 1354px` viewport.
- Hid the separate `抽牌 Draw` navigation action on mobile while preserving the primary in-page draw-card CTA.
- Confirmed no horizontal overflow at the annotated viewport and confirmed the desktop logo and Draw navigation action remain visible.
- Browser diagnostics are clear; production build and route generation pass.

## Follow-up Polish

- [P3] If a licensed brand font becomes available later, the display typography could be made identical across non-Apple platforms; current fallbacks are visually consistent and acceptable.

Homepage result: passed.

---

# Educator Client-Reading Button Design QA

## Evidence

- Source visual truth: browser annotation at `http://localhost:3100/portal#new-client-reading` and `/var/folders/d8/t1mw66t10m5b3j173p40kqzc0000gn/T/awareness-button-before.png`.
- Source pixels: `670 × 440`, captured from the authenticated portal at a `1033 × 964` CSS viewport before the stylesheet fix; browser-reported device scale factor `2`.
- Browser-rendered implementation: `/var/folders/d8/t1mw66t10m5b3j173p40kqzc0000gn/T/awareness-button-states-after-1033x964.png`.
- Implementation pixels and CSS viewport: `1033 × 964`, device scale factor `1`.
- Combined focused comparison: `/var/folders/d8/t1mw66t10m5b3j173p40kqzc0000gn/T/awareness-button-comparison.png`.
- State: shared primary actions for steps 1–4, including enabled controls for steps 1 and 4 and disabled controls for steps 2 and 3.
- Density normalization: the focused comparison displayed both native captures in the same `1033 × 964` browser surface, aligned at their top-left content regions. No comparison finding depends on browser chrome or density.

## Findings

No actionable P0, P1, or P2 issues remain.

- Fonts and typography: bilingual labels keep the existing shared button weight, size, centering, and line height; every label is visibly readable.
- Spacing and layout rhythm: all four controls retain the same full-width geometry, `50.5px` rendered height, padding, radius, and vertical rhythm.
- Colors and visual tokens: enabled controls now resolve to navy `#0e2c50`, cream text `#fff5dc`, and gold border `#b8771d` for a `12.94:1` text contrast ratio. Disabled controls use `#dce2e8` with `#455568` text for a `5.84:1` contrast ratio and no opacity washout.
- Image quality and asset fidelity: no raster or decorative asset is involved in this scoped control-state change; existing icon-library assets and surrounding UI remain unchanged.
- Copy and content: the step 1 send-code, step 2 verify, step 3 generate-and-email, and step 4 start-another-reading labels remain unchanged.
- Accessibility and interaction states: browser-computed state confirms steps 1 and 4 are enabled, steps 2 and 3 are natively disabled, disabled opacity is `1`, and the focused fixture produced no console warnings or errors.

## Comparison History

### Iteration 1

- [P1] Primary action background and active-step accents were transparent in the sidebar-based educator layout.
  - Cause: shared client-reading CSS referenced `--educator-*` custom properties scoped only to the retired `.educator-portal` wrapper, while the current `.educator-admin` wrapper exposed `--admin-*` properties.
  - Fix: mapped the shared educator properties to the current admin palette on `.educator-admin`.
  - Post-fix evidence: enabled steps 1 and 4 render navy with cream text, and the active step badge renders blue with white text.
- [P2] The generic `opacity: .5` disabled treatment made the future step actions unnecessarily faint.
  - Fix: gave disabled primary actions an explicit light slate background, dark slate text, visible border, no shadow, and full opacity.
  - Post-fix evidence: steps 2 and 3 render identically at `5.84:1` contrast in the combined comparison.

### Final pass

- The before capture and the step 1–4 implementation capture were opened together in the combined focused comparison.
- Browser-computed colors, dimensions, enabled/disabled semantics, and active-step styles match the intended admin palette.
- Console diagnostics are clear.
- The optimized Next.js production build completed successfully with all 17 routes generated.
- The authenticated portal session expired during the reload, so post-fix verification used a temporary local component fixture loading the repository's real `app/globals.css`; no form submission or backend behavior was changed or exercised.

## Follow-up Polish

No P3 visual follow-up is required for this scoped fix.

Educator button result: passed.

---

# Public Recipient Report Design QA

## Evidence

- Source visual truth: browser annotation at `http://localhost:3100/r/69d18ed3-84ca-4c99-b2e7-d0a62a853995` and `/var/folders/d8/t1mw66t10m5b3j173p40kqzc0000gn/T/public-report-before.png`.
- Source pixels: `1033 × 9863`, captured from the public four-card report before the data and presentation fix.
- Desktop implementation: `/var/folders/d8/t1mw66t10m5b3j173p40kqzc0000gn/T/public-report-after-desktop.png`, `1033 × 964` at a `1033 × 964` CSS viewport.
- Mobile implementation: `/var/folders/d8/t1mw66t10m5b3j173p40kqzc0000gn/T/public-report-after-mobile.png`, `390 × 844` at a `390 × 844` CSS viewport.
- Combined source/implementation comparison: `/var/folders/d8/t1mw66t10m5b3j173p40kqzc0000gn/T/public-report-comparison.png`.
- State: public recipient view, no portal authentication, four-card deep-awareness report.

## Findings

No actionable P0, P1, or P2 issues remain.

- Fonts and typography: the report keeps the existing Songti/Georgia editorial hierarchy, adds a mode-specific primary title and date, and clearly separates the card portrait from the full reading.
- Spacing and layout rhythm: the public shell now uses the available desktop width for a four-card spread while preserving a readable long-form text measure. At `390px`, the cards form a stable two-column grid with no horizontal overflow.
- Colors and visual tokens: warm paper, navy, muted chapter colors, fine gold borders, and soft card shadows remain consistent with the educator portal and source brand.
- Image quality and asset fidelity: the public report uses the repository's real `/cards/front-XX.png` artwork through `next/image`. All four annotated-report images completed at natural dimensions `170 × 285` in the desktop browser.
- Copy and content: single-, three-, and four-card records receive distinct bilingual report names. The email subject, title, spread summary, and card count are generated from the same reading mode and payload as the public page.
- Privacy and accessibility: the new public RPC returns only report presentation fields, requires an unguessable share token, omits internal IDs and recipient data, and has an empty security-definer search path with explicit execution grants. The page has one primary heading, meaningful image alt text, semantic figures, a private-link disclaimer, and `noindex, nofollow` metadata.

## Comparison History

### Iteration 1

- [P1] The public report could not display cards because the original public RPC returned only the generated report text and timestamp.
  - Fix: added a backward-compatible `awareness.get_public_report_v2(uuid)` RPC that safely joins the public report to its reading and returns `mode`, `spread_key`, `question`, and `cards` without exposing user IDs, emails, reading IDs, or report IDs.
  - Post-fix evidence: the annotated report renders card 01 Fear, 29 Fate Chains, 19 Choice, and 40 Abundance with the correct Pattern, Trigger, Need, and New Choice positions.
- [P2] The prior `720px` text-only page made the report feel like an unstructured export and used a generic title for every reading mode.
  - Fix: reused the product's report document and card-art components, widened the public shell to `920px`, added a visual reading portrait, mode-aware title, report date, privacy note, and clearer continuation into the full interpretation.
  - Post-fix evidence: the combined comparison shows the real four-card spread before the full reading and a substantially clearer visual hierarchy.

### Three report modes and email delivery

- Mode 1: a current public single-card record server-renders `单张觉察报告 · Single-Card Awareness Report` and its real card artwork.
- Mode 3: a current three-card database record returns three ordered cards; the shared renderer maps any three-card payload to the three-column desktop/two-column mobile presentation and `三卡觉察报告 · Three-Card Awareness Report`.
- Mode 4: the annotated public report renders all four real cards and `深度觉察报告 · Deep Awareness Report`.
- Initial sends and resends both pass the reading payload into the same branded Gmail/Resend template. The template uses a mode-specific subject/title plus the bilingual spread label and card count. No live test email was sent during QA, avoiding an unsolicited external message.

### Final pass

- Desktop: four loaded card images, computed four-column grid (`178.5px` each), and `scrollWidth === clientWidth === 1033`.
- Mobile: four loaded card images, computed two-column grid (`134px` each), and `scrollWidth === clientWidth === 390`.
- The source and final desktop implementation were opened together in the combined comparison before sign-off.
- Browser diagnostics are clear; the optimized production build generated all 17 routes; the 13 branded Supabase email templates passed validation.
- Post-migration Supabase advisors reported no issue against the new public report function. Pre-existing project-wide security and performance advisories remain outside this scoped report change.

## Follow-up Polish

No P3 visual follow-up is required for this report pass.

final result: passed

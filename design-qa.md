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

final result: passed

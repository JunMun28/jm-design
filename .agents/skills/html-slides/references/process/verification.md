# Verification

Verify rendered output before final.

## Basic command

```bash
python <skill-dir>/scripts/verify.py deck-topic.html --theme <id> --viewports 1280x720,375x667 --slides 10 --check-overview --fail-on-warnings
```

## Full theme matrix

When changing theme examples, scaffold output, runtime, overview behavior, or
verifier logic, run the full matrix:

```bash
python <skill-dir>/scripts/audit-theme-matrix.py --output tmp/html-slides-audit
```

This verifies both shipped examples and freshly scaffolded decks for every
stable theme in `themes/themes.json` across `1280x720`, `375x667`, and
`1127x1084`, and writes screenshots/logs under the output directory.

`--theme <id>` is **required** (the verifier errors without it) so the
per-theme brand lints run, not just universal lints. `--skip-brand` is the
explicit opt-out for universal-only. Use fewer slides if the deck is short.

If the active Python does not have Playwright, use Codex workspace dependencies
and run the same command with the bundled Python from `load_workspace_dependencies`.

## What to check

- HTML opens.
- No JavaScript page errors.
- Console is clean or warnings are understood.
- Every slide fits viewport.
- No text overlap.
- No internal slide scroll.
- Navigation works: keyboard, wheel, swipe/dots.
- Esc opens slide overview.
- Overview thumbnails are visible and clickable.
- Mobile/narrow viewport does not collapse critical content.
- Readable slide text is large enough for presentation distance; body/table
  copy should not be forced below the skill's font-size floors.
- Use `--fail-on-warnings` when warnings should block delivery.
- The verifier fails on DOM overflow, blank slide geometry, console errors, nav-dot mismatches, and overview-card mismatches.
- For fixed-stage dark engineering decks, transformed 16:9 stages are valid; verify visual fit, not raw unscaled scroll dimensions.

## Per-theme verify rules

`verify.py` reads each theme's verify block from `themes/themes.json`:

- `required_tokens` — CSS custom properties that must resolve on `:root`.
- `accent_rgb` + `accent_max_per_slide` — accent overuse threshold for that theme's signature colour.
- `logo_pattern` + `require_logo_on_content_slides` — brand mark check; null for unbranded themes.
- `forbid_chart_on_gradient` — Micron-style enforcement; most non-Micron themes leave this off.
- `headline_contrast_min` — WCAG ratio floor for first `<h1>/<h2>` on each slide.
- `palette_lock` — flag; informational only at this stage.
- `premium_corporate_checks` — stricter brand-quality lints for
  `micron-dark-executive`: approved photo cover, official logo images,
  no accent-colored headline/eyebrow/label text, sentence-case headlines,
  no headline end punctuation, no gradient text, and minimum label/body
  vertical rhythm.

`--theme <id>` is required and applies that theme's config. The verifier
errors out if it is omitted (so brand lints can never be silently skipped).
`--skip-brand` is the explicit, deliberate universal-only escape hatch.

Headline contrast resolves the *effective* background by walking ancestors
for the first opaque colour. When the headline sits on a gradient or image,
the ratio can't be computed automatically — the verifier emits a `Notes:`
line (not a failure) telling you to check that slide by eye.

## Universal lints (apply to every theme)

- First slide must be a title slide (`.title-slide` class or `data-slide-kind="cover"`).
- Nav-dot count must match `.slide` count (or be zero).
- ESC opens `#overview`; overview card count matches slide count.
- Overview contains one `.ov-thumb` thumbnail per slide; text-only overview
  cards fail verification.
- No DOM overflow per slide at any tested viewport.
- Interactive elements (`button`, `[role="button"]`, `a[href]`, `.ov-card`) carry `cursor: pointer`.
- Stylesheet contains at least one `@media (prefers-reduced-motion: reduce)` rule.
- Visible, meaningful slide text must meet the readable-type floor. The lint
  ignores decorative chrome such as nav, overview, footer, slide numbers,
  eyebrow/kicker labels, and intentionally tiny mock-UI details, but it fails
  body copy, bullets, table cells, and callouts that are too small for a room.
- Console must be free of `[error]` messages; `--fail-on-warnings` upgrades warnings to failures.

## Pre-delivery checklist

Mechanical lints are necessary but not sufficient. Before reporting done:

- [ ] First slide is a title slide; deck has at least one content slide.
- [ ] Each slide expresses one message with one visual protagonist.
- [ ] No invented stats, quotes, logos, products, or claims.
- [ ] Body, bullet, table, and callout text is readable from the back of a room;
      if it needs to be smaller than 24px, split the slide.
- [ ] Headlines pass contrast against the actual surface they sit on (verifier checks `<h1>/<h2>` only).
- [ ] Animations use composited properties (`transform`, `opacity`); reduced-motion variant exists.
- [ ] Interactive elements have visible focus rings, not just hover styles.
- [ ] Touch targets ≥ 44×44 CSS px (nav dots, overview cards).
- [ ] Charts pass the slide-distance test (shrink to 50%, still legible).
- [ ] Fixed-stage decks letterbox correctly at a non-16:9 viewport.

## If verification fails

- White screen: check console error first.
- Fonts wrong: wait for `document.fonts.ready`, check font URL/name.
- Layout overflow: split slide; do not shrink below readable type.
- Small readable text: raise the type scale, reduce content, or split the slide;
  do not hide the problem by marking audience-facing copy as chrome.
- Animation issue: prefer transform and opacity; avoid layout-thrashing properties.
- Navigation issue: confirm `.slide` elements exist and `SlidePresentation` initialized.
- Overview issue: confirm `#overview` exists, Escape toggles `aria-hidden`, and `.ov-card` elements are generated from slides.

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

## Skim test (mandatory)

Every run prints a **Title storyline** block — the slide titles in order
(also available standalone via `verify.py <deck>.html --print-titles`). Read
the dumped titles alone. Pass only if:

- (a) they read as one argument, from context to recommendation;
- (b) no two titles assert the same point;
- (c) for executive/decision decks, the recommendation appears in the first
  two titles.

If a listener could not retell the story and the ask from the titles alone,
retitle before delivery. When the deck was built from an approved brainstorm,
diff these titles against the brainstorm titles and explain any meaning
change in the delivery summary.

## Per-slide screenshot rubric

Mechanical lints pass ≠ the slide works. For each content-slide screenshot,
record pass/fail on:

1. **Glance** — can you state the slide's single point in one sentence within
   3 seconds of looking?
2. **Focal point** — where do the eyes land first, and is that element the
   evidence for the headline?
3. **Vertical logic** — name any body element that argues something other
   than the headline. Found one? The slide fails.
4. **Artifact tally** — count toward the existing trigger: if more than half
   the content slides are text rows, generic cards, or panels with no
   concrete visual artifact, revise before delivery.

Any fail = the mandatory revise trigger. Record the per-slide result (a short
list in the work log or HTML comment is enough); do not deliver on memory.

## Source honesty

Before delivery:

1. Extract every numeral and quoted string from the deck (grep the HTML or
   run `verify.py --source <file>` against the source material) and trace
   each to user-supplied material or the approved brainstorm. Orphans are
   listed as NOTES — resolve each one.
2. Illustrative values carry `data-illustrative="true"` (or
   `data-placeholder="true"`) **and** a visible "Illustrative" tag.
   `verify.py` fails a marked element with no visible label.
3. Every numeral is traced to source or visibly marked illustrative — there
   is no third state.

## Per-theme verify rules

`verify.py` reads each theme's verify block from `themes/themes.json`:

- `required_tokens` — CSS custom properties that must resolve on `:root`.
- `accent_rgb` + `accent_max_per_slide` — accent overuse threshold for that theme's signature colour.
- `logo_pattern` + `require_logo_on_content_slides` — brand mark check; null for unbranded themes.
- `forbid_chart_on_gradient` — Micron-style enforcement; most non-Micron themes leave this off.
- `headline_contrast_min` — WCAG ratio floor for first `<h1>/<h2>` on each slide.
- `palette_lock` — flag; informational only at this stage.
- `premium_corporate_checks` — stricter brand-quality lints for
  `micron-dark`: approved photo cover, official logo images,
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

### Content-quality lints (universal)

- **Density budgets** — fail: body words over the theme budget (90 default,
  60 executive, ×1.5 when `data-deck-mode="standalone"`), lists with >6
  items, >6 repeated card siblings, code blocks >10 lines, >3 exhibits per
  slide.
- **Assertion titles** — bare-label titles ("Overview", "Results"),
  ≤2-word titles, and template-meta titles ("…reads best as a metric wall")
  fail on themes with `require_assertion_titles`; elsewhere they are NOTES.
  Long titles (>16 words) and data-slide titles with no number are NOTES.
  Covers and `data-slide-kind="section"` dividers are exempt.
- **Chart integrity** — a chart with no adjacent takeaway (≥5 words at ≥20px
  outside the chart) is a NOTE in live mode, a failure in standalone mode. A
  "naked" chart (fewer than 2 visible digit texts in/beside it) fails unless
  marked `data-illustrative="true"` with a visible "Illustrative" label.
- **Executive summary** — on themes with `require_executive_summary_slide`,
  a deck marked `data-deck-kind="decision"` must mark slide 2
  `data-slide-kind="executive-summary"`.
- **Title storyline** — printed every run; judged by you via the Skim test.

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
- [ ] Every content headline is a full-sentence assertion; the Skim test
      passed on the printed title storyline.
- [ ] Groups (bullets, cards, zones) pass MECE: one named cutting dimension,
      2–6 non-overlapping items of one rhetorical type.
- [ ] Charts keep scale integrity: zero-baseline bars, no dual axes, no 3D,
      shared scales on comparable charts (see `runtime/svg-charts.md`).
- [ ] Every numeral traced to source or visibly marked "Illustrative".
- [ ] Final-deck content review ran; result recorded as a
      `FINAL DECK REVIEW:` comment and P0/P1 findings fixed.

## If verification fails

- White screen: check console error first.
- Fonts wrong: wait for `document.fonts.ready`, check font URL/name.
- Layout overflow: split slide; do not shrink below readable type.
- Small readable text: raise the type scale, reduce content, or split the slide;
  do not hide the problem by marking audience-facing copy as chrome.
- Animation issue: prefer transform and opacity; avoid layout-thrashing properties.
- Navigation issue: confirm `.slide` elements exist and `SlidePresentation` initialized.
- Overview issue: confirm `#overview` exists, Escape toggles `aria-hidden`, and `.ov-card` elements are generated from slides.

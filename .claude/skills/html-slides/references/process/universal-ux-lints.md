# Universal UX lints

Rules that apply to every theme. Theme-specific palette, gradient, and logo rules live in `themes/<id>/design.md`. These survive across themes because they're about *how slides behave*, not *how slides look*.

`scripts/verify.py` enforces a subset of these mechanically; the rest are author-time gates.

## Motion

| Rule | Do | Don't | Mechanically checked? |
|---|---|---|---|
| Respect motion preferences | Wrap non-essential animation in `@media (prefers-reduced-motion: reduce) { ... }` | Ship animation that ignores the system flag | Yes — `verify.py` fails if no `prefers-reduced-motion` rule is found in the stylesheet |
| Animate 1–2 elements per slide | One focal reveal plus optional subtle background motion | Animate every bullet, icon, and rule line at once | Author-time |
| 150–300 ms for micro-interactions | `transition: 200ms` on hover/cursor changes | Durations > 500 ms for routine UI motion | Author-time |
| Use `ease-out` for entry, `ease-in` for exit | Curves that feel responsive | `linear` on UI transitions — robotic | Author-time |
| Animate composited properties | `transform`, `opacity` | `top`/`left`/`width`/`height` — triggers layout | Author-time |
| Continuous animation only on loaders | A single spinner if loading | Looping decorative spin/bounce/pulse on icons or accents | Author-time |

## Contrast & color

| Rule | Do | Don't | Mechanically checked? |
|---|---|---|---|
| Headline contrast ≥ 4.5:1 (light/data themes ≥ 7:1) | Test text colour against actual slide background | Trust the colour token without checking the surface it lands on | Yes — `verify.py` computes WCAG ratio for first `<h1>/<h2>` per slide |
| Never rely on colour alone | Pair red/green with an icon or label | "Red text means error" with no icon | Author-time |
| Limit accent colour to N elements per slide | Theme-driven (`accent_max_per_slide` in manifest) | Spray the accent across every shape, border, and dot | Yes — `verify.py` counts elements whose computed colour/bg/border/fill/stroke contains the theme accent's RGB triplet |

## Interaction (nav dots, ESC overview, anything clickable)

| Rule | Do | Don't | Mechanically checked? |
|---|---|---|---|
| Visible focus rings | `:focus-visible { outline: 2px solid …; }` on nav dots and overview cards | `outline: none` with no replacement | Author-time |
| `cursor: pointer` on clickable elements | Nav dots, overview cards, links | Default cursor on interactive shapes | Yes — `verify.py` lints `button`, `[role="button"]`, `a[href]`, `.ov-card` |
| Tap target ≥ 44×44 CSS px | Nav dots padded to at least 44 px hit area | 12×12 dots — impossible on touch | Author-time |
| Don't depend on hover for primary info | All hover content also surfaces on focus/tap | Tooltips that only work with a mouse | Author-time |

## Layout

| Rule | Do | Don't | Mechanically checked? |
|---|---|---|---|
| Reserve space for late-loading content | `aspect-ratio` on images, fixed heights on chart wrappers | Let images push the slide layout when they load | Author-time |
| Avoid raw `100vh` on mobile | Use `100dvh` for fixed-stage canvases | `height: 100vh` on iOS Safari | Author-time |
| Z-index scale, not arbitrary | Define a 10/20/30/50/100 scale | `z-index: 9999` ad hoc | Author-time |
| Content max-width 65–75 ch for reading | Constrain body copy | Full-bleed paragraph text | Author-time |

## Headings

| Rule | Do | Don't |
|---|---|---|
| Sequential heading levels | `h1` on title slide; `h2` for slide headings; `h3` for sub-blocks | Skip levels for styling reasons |
| One `h1` per deck | Title slide owns the only `h1` | Every slide an `h1` |

## Content quality

| Rule | Do | Don't | Mechanically checked? |
|---|---|---|---|
| Action titles | Full-sentence assertion stating the takeaway, key number on data slides | "Overview", "Q3 results", titles about the template | Yes — `verify.py` flags bare-label/template-meta titles (fails on `require_assertion_titles` themes) |
| Titles tell the story | Read the printed "Title storyline" in order; it must retell the argument and the ask | Titles only a presenter can connect | Partly — `verify.py` prints the storyline; you judge it (Skim test) |
| Body word budget | ≤90 words/slide (60 executive, ×1.5 standalone) | Cramming; shrinking text to fit | Yes — `verify.py` counts visible non-chrome body words |
| Element budgets | ≤6 list items, ≤6 repeated cards, ≤10 code lines, ≤3 exhibits | 9-bullet lists, card walls | Yes — `verify.py` fails over-budget groups |
| Charts carry their proof | ≥2 visible values/axis digits + adjacent takeaway ≥5 words | Decorative valueless charts | Yes — naked-chart lint; takeaway is NOTE (live) / fail (standalone) |
| Illustrative data declares itself | `data-illustrative="true"` + visible "Illustrative" tag | Placeholder numbers styled as real data | Yes — `verify.py` fails unlabeled placeholders |
| Answer first (decision decks) | `data-deck-kind="decision"` + executive-summary slide 2 | Burying the ask on the last slide | Yes on `require_executive_summary_slide` themes |

## What this file is not

- It is **not** a chart selection guide — see `references/runtime/svg-charts.md`.
- It is **not** a theme rulebook — see `themes/<id>/design.md`.
- It is **not** a full WCAG audit. Decks aren't apps; many app-level a11y rules (form labels, ARIA live regions, keyboard traps in modals) don't apply. What's here is the slide-deck-relevant subset.

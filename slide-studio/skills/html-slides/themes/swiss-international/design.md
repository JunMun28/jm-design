# Swiss international

International Typographic Style (Swiss Style). White paper, near-black grotesque
type set flush-left on a strict baseline grid, generous white space, hairline
rules, and ONE rationed international-red accent reserved for data emphasis —
never on headlines. Quiet, rigorous, editorial. The grid does the work; the red
is the only voice raised, and only for a number.

Reference lineage: Müller-Brockmann grid systems, Helvetica-era corporate
identity manuals, Unimark/transit signage, Swiss editorial and annual-report
typography.

## When to choose this theme

- Operating reviews, quarterly business reviews, board read-outs, KPI decks.
- Data-dense reporting where tables and small charts carry the argument.
- Editorial, research, or policy decks that should read as rigorous and neutral.
- Any deck whose credibility comes from restraint, not decoration.

## When not

- Persuasion / vision / launch keynotes that want mood or spectacle (use
  aurora-glass).
- Brand-locked corporate decks (use a Micron theme).
- Warm workshop / training energy (use playful or guided-learning).
- Anywhere a second accent color, a gradient, or an illustration would help —
  this theme forbids all three.

## Tokens (frozen)

Paste `themes/swiss-international/tokens.css` first. Every visible color on
slide content must come from a token (`palette_lock` is ON — no ad-hoc hex in
slide markup or CSS, including SVG presentation attributes).

| Hex / value | Token | Role | Contrast on #FFFFFF |
|---|---|---|---|
| `#FFFFFF` | `--bg` | paper-white canvas | — |
| `#F4F4F2` | `--surface` | warm-grey solid surface — charts, tables, panels | — |
| `#111111` | `--ink` | primary text — headlines, body, figures | 18.9:1 |
| `#5E5E5A` | `--ink-muted` | secondary text, captions, metadata | 6.4:1 |
| `#E2231A` | `--accent` | international red — fills / rules / figures **only**, never headlines | 4.6:1 |
| `#E2E2DE` | `--rule` | hairline borders / gridlines | decorative |
| `#111111` | `--rule-strong` | heavy black rule (baseline bar) | — |
| `#111111` | `--chart-ink` | primary data series / bars | 18.9:1 |
| `#8A8A85` | `--chart-mid` | secondary / baseline data series | 3.2:1 (data only) |
| `#C9C9C4` | `--chart-light` | tertiary series / gridlines on surface | decorative |

The one red data series reuses `--accent`. There is no second accent.

```
--font-display: "Archivo"        (headlines, section heads, table row labels) — Hanken Grotesk is the sanctioned fallback
--font-body:    "Inter"          (body, subtitles, bullets)
--font-mono:    "IBM Plex Mono"  (eyebrows, indices, figures, axis labels, footers, every numeral)
```

All three load from Google Fonts via the `@import` at the top of tokens.css.
Do not reference any other family unless you also load it.

## Typography

- **Fixed px sizes only — never vw-clamped type.** Desktop scale: title 88px,
  section heads 84px, content h2 60px, body 24–25px, mono chrome 18–20px. Small
  screens get their own media query with smaller *fixed* px values.
- Archivo 700 for h1/h2/h3, tight tracking (−0.02em to −0.03em), line-height ~1.02.
- Inter 400 for body. Secondary copy in `--ink-muted`.
- IBM Plex Mono 500, uppercase, 0.06–0.14em tracking for every eyebrow, index,
  axis label, legend, footer — and **every numeral** (figures use `font-variant-numeric:
  tabular-nums`). Mono is the theme's connective tissue and signals "this is data."
- Readability floors at desktop: body/bullets/table cells ≥ 24px, labels/captions/
  axis text ≥ 20px, slide h1/h2 ≥ 60px. Footer/eyebrow chrome may run 15–19px.

## The accent rule (read this twice)

- `--accent` (#E2231A) is **fills, rules, and figures only — NEVER on headlines.**
  `h1`/`h2`/`h3` are always `--ink` (black). The verifier hard-fails red on
  `h1,h2,h3` (`forbid_accent_text_selectors`).
- Red is rationed: the eyebrow tick, the red data series in one chart, the
  variance column in one table, one red KPI figure, the closing CTA underline.
  Budget is `accent_max_per_slide = 6`; the example runs 1–4 per slide.
- Red marks the *one thing that matters* on a slide — a delta, a series, a
  threshold breach. If two things are red, nothing is.
- The verifier counts every element whose computed color/border/background/fill/
  stroke resolves to `rgb(226, 35, 26)`; all accent paint inside one `<svg>`
  counts as a single hit.

## Layout grammar

- Flush-left everything. Content is left-anchored at `--margin-outer` (104px),
  not centered. Generous right-hand white space is the point, not a defect.
- Strict structure per slide: mono **eyebrow on a red tick** → optional heavy
  black **baseline bar** → **black grotesque headline** → payload → mono footer
  strip (deck name left, slide label right, on a hairline).
- One message, one visual protagonist per slide. No slide-internal scrolling;
  split overflow into another slide.
- Density caps follow the universal limits: title = 1 head + meta row; content ≤
  1 head + 4–6 items (two columns of ticks is the default); data = 1 chart/table
  + 1 takeaway.
- Archetypes shipped in `example.html`: cover (mono meta row under a heavy
  rule), index/agenda (numbered rows on hairlines, red indices), two-column tick
  list, bar-strip data slide, data table, section divider (red index + heavy
  black bar), KPI metrics row, closing (red-underlined CTA).

## Chart / surface rule

- Charts and tables sit on the solid `--surface` (`#F4F4F2`) panel — **never on a
  gradient** and never on the bare canvas (`forbid_chart_on_gradient: true`; the
  verifier walks ancestors of `svg[role="img"]`). This theme has no gradients at
  all, so the rule is automatic — keep it that way.
- Inline SVG only, for tiny static primitives (one bar strip, one sparkline). The
  data series is greyscale (`--chart-mid`, `--chart-light`) with exactly **one red
  series** (`--accent`) carrying the story. Gridlines in `--rule`.
- **SVG paint comes from tokens, not hex.** Use CSS classes (`.grid`,
  `.bar-prior`, `.bar-now`, `.val`) that reference `var(--…)`, never `fill="#…"`
  in the markup — palette_lock applies to SVG attributes too.
- Axis labels, legends, value labels: IBM Plex Mono, ≥ 20px **rendered**. SVG
  text scales with the viewBox→width ratio, so set the in-SVG `font-size` larger
  (≈25 viewBox units here) to clear the 20px rendered floor.
- The chart **takeaway sentence must NOT carry `.reveal`** — the verifier reads
  the takeaway on the (inactive-in-lint) slide, and a `.reveal` element is
  opacity:0 there, so it reads as "no adjacent takeaway." Plain `<p class="takeaway">`.

## Illustrative data

Any invented figure is sample data. Mark it with `data-illustrative="true"` on
the surface/element **and** a visible "Illustrative" label (the `.illus` class —
mono, on a red tick). The example places the label in the chart's sheet-head and
the table caption, and tags every made-up number. The verifier fails unlabeled
placeholders.

## Anti-patterns

| Don't | Why |
|---|---|
| Red on a headline (`h1`/`h2`/`h3`) | Headlines are always black; red is data-only — hard verifier fail |
| A second accent color, or red used decoratively | The theme has exactly one rationed accent; a second voice kills the discipline |
| Any gradient (background, text, or chart) | This is a flat-ink Swiss theme; gradients break the style and the chart-surface lint |
| Centered headlines or centered body | Everything is flush-left; centering breaks the grid |
| Rounded corners, drop shadows, glows on content | Swiss surfaces are square hairline-bordered panels (`--radius: 0`) |
| Charts/tables on the bare canvas or on glass | They must sit on the solid `--surface` panel |
| `fill="#…"` / `stroke="#…"` in SVG markup | palette_lock — SVG paint must come from token-driven CSS classes |
| `.reveal` on the chart takeaway sentence | Lint can't see an opacity:0 takeaway → "no adjacent takeaway" failure |
| Title-cased headlines | Sentence case is enforced (`enforce_sentence_case_headlines`) |
| Topic-label titles ("Q3 results") | Action titles required (`require_assertion_titles`); data titles carry the key number |
| vw-clamped type | Type must be fixed px at each breakpoint |
| Cramming a tall table/chart so the takeaway collides with the footer | Trim row padding / headline margin or split the slide — never shrink below the floors |
| Decorative icons, photos, illustrations | None belong here; the grid and the red are the whole visual system |

## Verifier notes

- Run: `uv run scripts/verify.py themes/swiss-international/example.html --theme swiss-international --require-shell --check-overview --fail-on-warnings`
- The accent lint resolves `#E2231A` to `rgb(226, 35, 26)` and counts every
  element carrying it in any paint property; budget ≤ 6 per slide.
- Sentence-case and assertion-title lints are hard fails for this theme.
- Eyebrows use the `.eyebrow` class and footers use `.footer` (both exempt
  small-chrome). Keep decorative ticks/bars inside elements the audience does
  not need to read; footers are `aria-hidden="true"`.
- Readability floors are judged in present mode at the stage size — body/cells
  ≥ 24px, labels/axis ≥ 20px, headlines ≥ 60px.

## Verify config

```json
{
  "required_tokens": ["--bg","--ink","--ink-muted","--accent","--rule","--font-display","--font-body","--font-mono"],
  "accent_rgb": "226, 35, 26",
  "accent_max_per_slide": 6,
  "logo_pattern": null,
  "require_logo_on_content_slides": false,
  "forbid_chart_on_gradient": true,
  "headline_contrast_min": 4.5,
  "palette_lock": true,
  "forbid_accent_text_selectors": ["h1","h2","h3"],
  "enforce_sentence_case_headlines": true,
  "require_assertion_titles": true,
  "max_body_words_per_slide": 90
}
```

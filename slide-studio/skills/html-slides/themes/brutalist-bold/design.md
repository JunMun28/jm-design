# Brutalist bold

Raw brutalist statement style. A stark white canvas; oversized, heavy black grotesque type set in uppercase; thick black borders and hard-edged blocks; generous negative space; and ONE screaming electric-yellow accent used only as fills and highlight blocks. Loud, blunt, confrontational — a slide that stops the room.

Reference lineage: web brutalism, Swiss-poster scale pushed to extremes, risograph one-color posters, Off-White / streetwear type, protest-placard energy.

## When to choose this theme

- Brand or product manifestos — statements of belief, principles, taglines.
- Bold launches and announcements that should feel confident and aggressive.
- Internal "rally" decks, culture statements, or a single slide that must land hard.
- Anything where restraint is the wrong move and the message is a stance.

## When not

- Dense tabular reporting or multi-series dashboards (the blocks reward few, huge statements).
- Formal corporate / executive reporting (use a Micron or consulting theme).
- Warm, friendly, or reassuring content — onboarding, HR, condolence (use soft-pastel or seventies-sunset).
- Long-form narrative or thought-leadership prose (use editorial-serif).

## Tokens (frozen)

Paste `themes/brutalist-bold/tokens.css` first. Every visible color on slide content comes from a token — palette_lock is ON.

| Hex / value | Token | Role | Contrast on #FFFFFF |
|---|---|---|---|
| `#FFFFFF` | `--bg` | stark white canvas | — |
| `#F4F4F2` | `--surface` | off-white solid panel ground (charts, tables) | — |
| `#111111` | `--panel-dark` | black block background (eyebrow bars, dividers) | — |
| `#111111` | `--ink` | near-black primary type | 18.9:1 |
| `#FFFFFF` | `--ink-inverse` | text on black blocks | 18.9:1 on `--panel-dark` |
| `#555555` | `--ink-muted` | secondary type, descriptors | 7.4:1 |
| `#FFE600` | `--accent` | electric yellow — **fills / highlight blocks only, never text** | 1.1:1 (that is exactly why) |
| `#111111` | `--rule` | heavy black borders and rules | — |
| `#D6D6D2` | `--rule-soft` | hairline divider | decorative |
| `#111111` | `--chart-ink` | primary bar / data ink | 18.9:1 |
| `#FFE600` | `--chart-accent` | the one highlighted bar fill | — |
| `#888888` | `--chart-mid` | mid-weight comparison series | 3.5:1 (axis chrome only) |
| `#C9C9C4` | `--chart-light` | faint gridlines / background bars | decorative |

```
--font-display: "Archivo Black"  (headlines, statements, numbers — heavy grotesque)
--font-body:    "Archivo"        (body, subtitles, descriptors)
--font-mono:    "Space Mono"     (eyebrows, indices, axis chrome, footers, CTA)
```

All three load from Google Fonts via the `@import` at the top of tokens.css. `Anton` (display) and `Inter` (body) are acceptable substitutes if you also load them; do not reference an unloaded family.

## Typography

- **Fixed px sizes only — never vw-clamped type.** Desktop scale: cover title ~100px, section headline ~88px, content h2 ~62px, body 24–26px, mono chrome 14–22px. Small screens get their own media query with smaller *fixed* px values.
- Archivo Black for h1/h2/h3 — it is already heavy at weight 400, so headlines use `font-weight: 400`. Tight tracking (−0.01em to −0.02em), line-height ~0.96 so the lines stack into a solid block.
- **All-caps is applied in CSS (`text-transform: uppercase`), not typed.** Author headlines in sentence case in the DOM (they are assertion titles the verifier reads); the uppercase look is purely presentational.
- Archivo 500 for body. Secondary copy in `--ink-muted`.
- Space Mono 700, uppercase, 0.1–0.18em tracking for every eyebrow, index, axis label, footer, and the CTA. Mono is the theme's connective chrome.
- Readability floors at desktop: body/bullets/table cells ≥ 24px, labels/captions/axis ≥ 20px, slide h1/h2 ≥ 60px. Footer/nav chrome may run 12–16px. SVG chart text is authored at 24px so it stays ≥ 20px after the stage scales the chart down.

## Layout grammar

- Outer margins ~80px (`--margin-outer`); 56px top / 84px bottom padding leaves room for the footer rule.
- One message and one visual protagonist per slide. No slide-internal scrolling.
- Asymmetric, blocky composition: a left-anchored eyebrow bar → oversized headline → a payload of hard-bordered blocks, plus a mono footer strip on a 4px black top rule (deck name left, section right).
- Density caps: title = 1 heading + 1 subtitle. Content ≤ 1 heading + 3–4 blocks. Two-up = one oversized claim + one proof panel. Data slide = 1 chart + 1 takeaway.
- Archetypes shipped in `example.html`: cover (yellow eyebrow bar + yellow underline rule), manifesto blocks (stacked hard-bordered rows, one active row flooded yellow), two-up (asymmetric claim left + bordered proof panel right), data (bar chart on a solid `--surface` sheet, one yellow bar), quote (oversized statement in a thick black frame), section divider (full yellow flood + giant ghost index), closing (giant black statement + yellow CTA chip).

## Signature details

1. **Thick black borders.** `--border-thick` (7px) solid `--rule` around blocks, panels, proof cards, and the chart sheet. No rounded corners anywhere — hard edges only.
2. **Black eyebrow bar.** A solid black (`--panel-dark`) inline mono-caps bar above the headline; the `.fill` variant inverts to a black-on-yellow bar (cover and closing only).
3. **One yellow block per slide.** Yellow appears as exactly one large fill per slide — the active manifesto row, the highlighted bar, the section flood, or the CTA chip — never scattered. Black text always sits on the yellow; yellow never sits on white as text.
4. **Giant ghost index.** On the section divider, a ~320px display numeral at 8% opacity bleeds off the corner behind the headline.
5. **Mono chrome everywhere.** Eyebrows, indices, axis labels, footers, and the CTA are uppercase Space Mono — the theme's connective tissue.

## The accent rule (read this twice)

`--accent` (#FFE600) is **fills and highlight blocks only — never text.** Electric yellow on white is ~1.1:1; as text it is illegible and fails every contrast floor. The sanctioned pattern is **black text on a yellow fill** (`.hl` inline highlight, the active `.block`, the section flood, the `.illus-tag`, the CTA chip). Headlines and all prose are `--ink` black.

- `forbid_accent_text_selectors: [h1, h2, h3]` — the verifier fails any headline whose computed color is the accent.
- The accent lint counts **every element** whose computed color / border / background / fill / stroke contains `255, 230, 0`; all accent paint inside one `<svg>` counts as a single hit. Budget ≤ 6 per slide; the example runs 1–3 per slide (eyebrow bar fill, one yellow bar+tag+highlight on the data slide, the section flood, the CTA chip).
- Keep yellow as paint, not as ink: fills, highlight blocks, one chart bar. Never a headline color, never body text, never a thin yellow rule on white (it disappears).

## Chart / surface rule

- Charts sit on the opaque `.sheet` (`--surface`, a solid off-white) inside a thick black border — **never on a gradient, never on the white canvas directly** (the verifier walks ancestors of `svg[role="img"]` for any gradient background; `forbid_chart_on_gradient: true`).
- Inline SVG only for the small static bar strip. Comparison bars are `--chart-ink` black; exactly one bar — the one that carries the story — is filled `--chart-accent` yellow with a black stroke.
- Axis labels and value labels: Space Mono, authored at 24px in the SVG so they render ≥ 20px after the stage scales, `--ink` / `--ink-muted`. Gridlines in `--chart-light`, the zero baseline in heavy black.
- For axes / thresholds / multi-series / tooltips, reach for a real charting library on a solid `--surface` panel; keep inline SVG to one tiny bar strip, sparkline, or gauge.

## Anti-patterns

| Don't | Why |
|---|---|
| Yellow as text (headlines, stats, body, links) | ~1.1:1 on white — illegible; fails `forbid_accent_text_selectors`. Yellow is a fill behind black text, never ink |
| More than one yellow block per slide | The accent is rationed — one yellow block is a shout, two is noise. Max 6 accent hits, target 1–3 |
| A thin yellow rule or hairline on white | Disappears at 1.1:1; rules and borders are always `--rule` black |
| Rounded corners, soft shadows, gradients | Brutalism is hard-edged and flat; no `border-radius`, no blur, no gradient fills on content |
| Typing headlines in CAPS in the DOM | The verifier reads DOM text — type sentence-case assertions; uppercase is CSS-only |
| Charts on the bare white canvas or any gradient | Use the bordered solid `.sheet`; gradient under a chart is a hard verifier failure |
| vw-clamped type | Type must be fixed px at each breakpoint |
| Light-gray "polite" body text everywhere | Keep contrast brutal — `--ink` black for primary copy, `--ink-muted` only for genuine secondary lines |
| Tiny type to cram more in | Floors are hard (body ≥24px, labels ≥20px, titles ≥60px); split the slide instead |

## Verifier notes

- Run: `uv run scripts/verify.py themes/brutalist-bold/example.html --theme brutalist-bold --require-shell --check-overview --fail-on-warnings`
- The accent lint resolves `#FFE600` to `rgb(255, 230, 0)` and counts every element carrying it in any paint property; all accent marks inside one `<svg>` collapse to one hit.
- `require_assertion_titles: true` — every content headline is a full-sentence claim; data slides put the key number in the headline.
- A chart needs an adjacent takeaway (≥5 words, ≥20px, outside the chart). Do **not** put `class="reveal"` on the takeaway — `reveal` drops it to opacity 0 on non-active slides and the lint reads it as invisible. The example's `.takeaway` is always-visible.
- Decorative text (`.ghost-index`, the yellow underline rule, footers) is `aria-hidden="true"`.
- Mark any made-up figure `data-illustrative="true"` with a visible "Illustrative" label (the `.illus-tag` yellow chip on the data slide does both).

## Verify config

```json
{
  "required_tokens": ["--bg","--ink","--ink-muted","--accent","--rule","--font-display","--font-body","--font-mono"],
  "accent_rgb": "255, 230, 0",
  "accent_max_per_slide": 6,
  "forbid_accent_text_selectors": ["h1","h2","h3"],
  "logo_pattern": null,
  "require_logo_on_content_slides": false,
  "forbid_chart_on_gradient": true,
  "headline_contrast_min": 4.5,
  "palette_lock": true,
  "require_assertion_titles": true,
  "max_body_words_per_slide": 90
}
```

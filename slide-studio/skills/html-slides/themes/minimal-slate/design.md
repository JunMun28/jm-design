# Minimal slate

Calm, low-chrome minimalism. A warm off-white canvas; graphite type; one quiet slate accent spent sparingly; maximal whitespace held together by hairlines. No gradients, no shadows-as-decoration, no color fields. The structure does the work and the page breathes. Notion-calm, restful, legible.

Reference lineage: Notion docs, Linear settings pages, Stripe-press editorial minimalism, Swiss/International typographic hairline grids.

## When to choose this theme

- Weekly team status, internal updates, standups, ops reviews.
- Read-at-your-desk memos and circulated standalone summaries.
- Any moment where the content should feel calm and trustworthy, not sold.
- Decks that will be skimmed quietly rather than presented in a dark room.

## When not

- Product launches or keynotes that need energy and spectacle (use aurora-glass).
- Brand-locked corporate reporting (use a Micron theme).
- Warm workshop / training energy (use playful).
- Dense dashboards with many colored series — the single-accent rule starves them.

## Tokens (frozen)

Paste `themes/minimal-slate/tokens.css` first. palette_lock is ON: every visible slide color is one of these tokens — no raw hex in slide markup.

| Hex / value | Token | Role | Contrast on #F7F7F5 |
|---|---|---|---|
| `#F7F7F5` | `--bg` | warm off-white canvas | — |
| `#FFFFFF` | `--surface` | solid white panel / exhibit ground (never gradient) | — |
| `#FCFCFB` | `--surface-tint` | faintest off-white for zebra rows | — |
| `#2A2A28` | `--ink` | graphite primary text | ~13:1 |
| `#87867F` | `--ink-muted` | secondary text, eyebrows, footers | ~4.6:1 |
| `#B6B5AD` | `--ink-faint` | tertiary, decorative numerals, axis chrome | decorative |
| `#4B5563` | `--accent` | slate — the single restrained accent (rgb 75, 85, 99) | ~7.3:1 |
| `#E7E9EC` | `--accent-soft` | slate-tint fill for active/chip states | — |
| `#E6E5E0` | `--rule` | hairlines and borders | decorative |
| `#D7D6CF` | `--rule-strong` | emphasis hairline | decorative |
| `#4B5563` | `--chart-1` | primary chart series (slate) | — |
| `#94A0AE` | `--chart-2` | secondary chart series (muted slate) | — |
| `#C3C8CE` | `--chart-3` | tertiary / context chart series (pale slate) | — |

```
--font-display: "Inter Tight"   (headlines, agenda labels, card titles)
--font-body:    "Inter"         (body, subtitles, descriptors)
--font-mono:    "Geist Mono"    (eyebrows, indices, axis chrome, footers, sign-off)
```

All three load from Google Fonts via the `@import` at the top of tokens.css. Inter Tight is the display face; do not substitute plain Inter for headlines without loading it.

## Typography

- **Fixed px sizes only — never vw-clamped type.** Desktop scale: title ~84px, section ~72px, content h2 60–62px, body 24–28px, mono chrome 20px. Small screens get their own media query with smaller *fixed* px values.
- Inter Tight 600 for h1/h2/h3, tight tracking (−0.02em to −0.025em), line-height ~1.08.
- Inter 400 for body. Secondary copy in `--ink-muted`.
- Geist Mono 500, uppercase, 0.06–0.18em tracking for every eyebrow, index, axis label, legend, footer, and sign-off line. Mono is the quiet connective chrome.
- Readability floors at desktop: body/bullets/table cells ≥ 24px, labels/captions ≥ 20px (axis text included), slide h1/h2 ≥ 60px. Footer/nav chrome may run 12–16px.

## The single-accent rule (mandatory)

`--accent` (#4B5563, slate) is the **only** accent and it is **rationed**. `accent_max_per_slide = 6`; the example runs 1–4. The verifier counts every element whose computed color / border / outline / background / fill / stroke contains `75, 85, 99` (all accent paint inside one `<svg>` counts as a single hit).

- Spend the accent on: the eyebrow hairline tick, the active-agenda-row tick, "done" status dots, and the emphasized chart bar/series. That is the whole budget.
- The eyebrow **text** and footers are `--ink-muted`, NOT slate — chrome must not eat the accent budget.
- Everything else is graphite ink, muted ink, or a hairline. There is no second accent color. A blue link, a green "success" tag, or a red "blocker" tag would break the theme — encode state with position, a hairline, or a hollow-vs-filled dot instead.

## Layout grammar

- Outer margins ~104px (`--margin-outer`) — the generous margin IS the signature. Content max-width ~1120px. Vertical padding ~84px on text slides; exhibit- and list-heavy slides (`.s-data`, `.s-ship`) drop to ~52–64px so the payload clears the footer.
- One message and one visual protagonist per slide. No slide-internal scrolling — split overflow into another slide.
- **Hairlines, not boxes.** Structure is drawn with 1px `--rule` lines: agenda rows separated by hairlines, shipped lists under-ruled, the closing sign-off sits below a single hairline. Reach for a `border-top`/`border-bottom` before reaching for a card.
- Every slide: short mono eyebrow (with its hairline tick) → headline → payload, plus a faint mono footer strip (deck name left, section right).
- Density caps: title = 1 heading + 1 subtitle + optional meta. Content ≤ 1 heading + 4–6 items. Cards ≤ 3 across. Data slide = 1 chart + 1 takeaway.
- Archetypes shipped in `example.html`: cover (meta row separated by hairlines), agenda (hairline rows, active row marked by a slate tick), shipped (two-column under-ruled list with filled/hollow status dots), data (bar+line chart on the solid white panel), blockers (three calm white cards), section divider (large ghosted Inter-Tight numeral), closing (mono sign-off below one hairline).

## Charts / surfaces (the solid-surface rule)

- Exhibits sit on the opaque white `.panel` (`--surface`) — **never** on a gradient, never on the bare canvas. The canvas is off-white; charts need the clean white ground for contrast and export safety. `forbid_chart_on_gradient` is enforced.
- Inline SVG for the simple status chart shown here. Use the slate chart family: primary `--chart-1`, muted `--chart-2`, pale `--chart-3`. Emphasize one bar/series in `--chart-1`; keep the rest in `--chart-2`/`--chart-3` so the eye lands on the point.
- No SVG gradients (they break in overview clones, which strip `id`s) and no glows. Gridlines in `--rule`; axis labels and legend in Geist Mono, ≥ 20px, `--ink-muted`.
- For anything with axes/thresholds/multi-series/tooltips, prefer a real charting library on the white panel rather than hand-rolled SVG.

## Made-up data

Any invented figure carries `data-illustrative="true"` on the exhibit **and** a visible "Illustrative" label (the corner tag on the data panel). Unlabeled placeholders fail the verifier. The example's chart numbers are all illustrative and labeled.

## Anti-patterns

| Don't | Why |
|---|---|
| A second accent color (blue link, green/red status tag) | Breaks the single-quiet-accent identity; encode state with position / hairline / hollow dot |
| Slate on the eyebrow text or footers | Burns the rationed accent budget on chrome; chrome is `--ink-muted` |
| Filled colored cards, tinted backgrounds, color blocks | The theme is whitespace + hairlines; color fields make it loud |
| Drop shadows, glows, or heavy borders for "depth" | Calm low-chrome means flat surfaces and 1px hairlines only |
| Charts on the off-white canvas or any gradient | Use the solid white `.panel`; verifier fails chart-on-gradient |
| Boxing every list item in a card | Reach for a hairline rule first; cards are reserved for the few |
| Cramming a slide to the floor (text < 24px, labels < 20px) | Split the slide; the whitespace is the point, never sacrifice it |
| Gradients anywhere (text, panel, divider) | The theme has none; one gradient breaks the restful flatness |
| vw-clamped type | Type must be fixed px at each breakpoint |
| > 6 slate-paint elements on one slide | `accent_max_per_slide = 6`; ration it to 1–4 |

## Verifier notes

- Run: `uv run scripts/verify.py themes/minimal-slate/example.html --theme minimal-slate --require-shell --check-overview --fail-on-warnings`
- The accent lint resolves `#4B5563` to `rgb(75, 85, 99)` and counts every element carrying it in any paint property; all accent elements inside one `<svg>` count as a single hit. Budget ≤ 6 per slide.
- `forbid_chart_on_gradient: true` — keep every wrapper between an `svg[role="img"]` and its `.slide` free of gradient backgrounds; charts live on the solid `.panel`.
- `require_assertion_titles: true` — every content-slide headline is a full-sentence assertion (sentence case) that carries the takeaway; data slides put the key number in the headline.
- Headline floor is 60px for h1/h2 — the 60–62px content-h2 token is the floor, not a suggestion.
- Eyebrows use the `.eyebrow` class (exempt small-chrome class); footers use `.footer`. Keep decorative numerals (`.ghost-index`) and orb/footer layers `aria-hidden="true"`.

## Verify config

```json
{
  "required_tokens": ["--bg","--surface","--ink","--ink-muted","--accent","--rule","--font-display","--font-body","--font-mono"],
  "accent_rgb": "75, 85, 99",
  "accent_max_per_slide": 6,
  "logo_pattern": null,
  "require_logo_on_content_slides": false,
  "forbid_chart_on_gradient": true,
  "headline_contrast_min": 4.5,
  "palette_lock": true,
  "require_assertion_titles": true,
  "max_body_words_per_slide": 90
}
```

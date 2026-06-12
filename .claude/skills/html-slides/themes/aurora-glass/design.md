# Aurora glass

Midnight product-launch keynote. A near-black, blue-tinted canvas; frosted glass panels sitting on lit gradient hairlines; one rationed aurora glow per slide; pill-badge eyebrows; everything chrome set in uppercase mono. Calm, expensive, nocturnal.

Reference lineage: Linear-era launch keynotes, Vercel/Raycast product pages, macOS frosted-glass surfaces, aurora-gradient hero art.

## When to choose this theme

- Product launches, release overviews, feature announcements.
- Dev-tool / SaaS keynotes where the product is the hero.
- Roadmap and vision decks that should feel premium and confident.
- Any "midnight demo" moment: dark room, projector, one glowing chart.

## When not

- Print-first or projector-in-a-bright-room decks (it lives on dark).
- Dense tabular reporting — glass panels reward few, large statements.
- Formal corporate reporting (use a Micron theme) or warm workshop energy (use playful).

## Tokens (frozen)

Paste `themes/aurora-glass/tokens.css` first.

| Hex / value | Token | Role | Contrast on #08090A |
|---|---|---|---|
| `#08090A` | `--bg` | near-black blue-tinted canvas | — |
| `rgba(255,255,255,0.04)` | `--surface` | frosted glass card fill | — |
| `#16171B` | `--surface-solid` | opaque ground for charts + export | — |
| `#F7F8F8` | `--ink` | primary text | 18.7:1 |
| `#8A8F98` | `--ink-muted` | secondary text | 6.1:1 (5.5:1 on surface-solid) |
| `#5E6AD2` | `--accent` | indigo fills + dots — **never text** | 4.2:1 (below 4.5 — that is why) |
| `#828FFF` | `--accent-text` | links, stats, active indices | 6.9:1 |
| `#00D2FF` | `--aurora-1` | cyan orb / gradient stop | 11.1:1 |
| `#C47BFF` | `--aurora-2` | magenta orb / gradient stop | 7.2:1 |
| `#2DD4BF` | `--aurora-3` | teal orb for section moods | 10.7:1 |
| `#2A2C33` | `--rule` | hairline borders | decorative |

```
--font-display: "Space Grotesk"   (headlines, stats, quotes)
--font-body:    "Inter"           (body, subtitles, descriptors)
--font-mono:    "Geist Mono"      (eyebrows, badges, axis chrome, footers)
```

All three load from Google Fonts via the `@import` at the top of tokens.css. Do **not** reference Inter Tight or any other family unless you also load it.

## Typography

- **Fixed px sizes only — never vw-clamped type.** Desktop scale: title ~112px, section headlines ~80px, content h2 60px, body 24–30px, mono chrome 20px. Small screens get their own media query with smaller *fixed* px values.
- Space Grotesk 600 for h1/h2/h3, tight tracking (−0.025em to −0.03em), line-height ~1.04.
- Inter 400 for body. Secondary copy in `--ink-muted`.
- Geist Mono 500, uppercase, 0.1–0.18em tracking for every index, date, axis label, legend, and footer. Mono chrome is the theme's connective tissue.
- Readability floors at desktop: body/bullets/table cells ≥ 24px, labels/captions ≥ 20px (axis text included), slide h1/h2 ≥ 60px. Footer/nav chrome may run 12–16px.

## Layout grammar

- Outer margins ~96px (`--margin-outer`); 88px vertical padding; content max-width ~1180px.
- One message and one visual protagonist per slide. No slide-internal scrolling.
- Density caps: title = 1 heading + 1 subtitle + optional date. Content ≤ 1 heading + 4–6 items. Bento ≤ 6 cells, exactly one hero. Data slide = 1 chart + 1 takeaway.
- Every slide: pill-badge eyebrow → headline → payload, plus a mono footer strip (deck name left, index right).
- Archetypes shipped in `example.html`: title, agenda (stacked glass rows, active row lit), bento-features (asymmetric grid, one hero cell), data-chart (opaque sheet), quote (ghosted ~280px quote mark), section-divider (orb jumps corner + changes color), metrics row, closing (horizon orb rising at the bottom edge).

## Signature details

1. **Horizon-glow hairline.** Panels read as lit glass: a normal 1px `--rule` border, plus a 1px `::before` gradient strip across the top (`--hairline-gradient`), plus an inner top highlight (`inset 0 1px 0 rgba(255,255,255,0.06)`). This `::before` strip is the **only** sanctioned technique for lit hairlines — a gradient can never be a `border-color`, and `border-image` is forbidden. The pill eyebrow uses the same strip under `overflow: hidden` so the rounded chip clips it.
2. **One-orb light system.** A single blurred radial orb per slide, always inside a clipping `.orb-layer` (so blur and off-canvas positions never create scroll overflow). The orb is repositioned and recolored per archetype — cover top-right cyan/magenta, divider corner teal, closing bottom-center horizon — and drifts very slowly, **transform only**.
3. **Pill-badge eyebrow** with a pulsing 6px `--accent` dot above every headline. Mono, uppercase, lit hairline on top.
4. **Rationed gradient text.** At most ONE word or ONE stat per slide gets the cyan→magenta `background-clip: text` gradient (`.grad`). Two gradient words on a slide is a bug.
5. **Mono chrome everywhere.** Indices, dates, axis labels, legends, footers: uppercase Geist Mono.

## Contrast over orbs (mandatory rule)

Muted text over orb-lit glass can fall to ~2.2:1. The rule:

- A panel that sits over an orb may use **`--ink` only** for its text, **or**
- the orb behind any text panel is **capped at opacity 0.15** (`.orb.faint`).

In practice: free-corner orbs (cover, divider, closing horizon, the data slide's halo above the opaque sheet) run 0.4–0.6; every orb that sits behind a glass panel with muted text (agenda, bento, quote, metrics) uses `.faint`. The example enforces this split.

## Accent rules

- `--accent` (#5E6AD2) is **fills and dots only — never text**. It is 4.2:1 on the canvas; it fails the 4.5:1 floor. Stats, links, and active indices use `--accent-text` (#828FFF).
- The verifier counts **every element** whose computed color/border/outline/background/fill/stroke contains `94, 106, 210` — including rgba tints like the `.eyebrow.fill` chip. Budget ≤ 10 per slide; the example runs 1–3 (pill dot, one indigo chart series, occasionally one filled chip or active-row bar).
- Aurora colors are light, not paint: orbs, the hairline gradient, one glowing chart series, the rationed gradient word. Never large filled areas, never body text.

## Charts

- Charts sit on the opaque `.sheet` (`--surface-solid`) — never on glass, never on any gradient-backed wrapper (the verifier walks ancestors of `svg[role="img"]`).
- Inline SVG only. One glowing series: cyan stroke + a wide low-opacity duplicate stroke as the glow + a flat rgba area fill (no SVG gradients — they break in overview clones, which strip `id`s). Comparison series in quiet indigo.
- Axis labels and legend: Geist Mono, ≥ 20px, `--ink-muted`. Gridlines in `--rule`.
- Push the slide's orb off-canvas or above the sheet — the opaque sheet kills any glow behind the plot.

## Export mode

`backdrop-filter` blur and 90px orb blur are fragile in print/PDF/raster pipelines. Set `<html data-export="true">` before capture; tokens.css then:

- swaps `.glass` to opaque `--surface-solid` and removes backdrop-filter;
- turns orbs into static, unblurred radial-gradient images with no animation (opacity lowered to compensate);
- replaces `.grad` gradient text with flat `--accent-text` (background-clip: text is unreliable in PDF);
- stops the dot pulse and forces `.reveal` elements visible.

Charts need no special handling — they already live on the opaque sheet.

## Anti-patterns

| Don't | Why |
|---|---|
| Two or more orbs on one slide | The light system is rationed — one orb is a mood, two is a lava lamp |
| Gradient text on more than one word/stat per slide | Kills the reward; reads as template clip-art |
| `--accent` as text color (h1/h2/h3, stats, links) | 4.2:1 — fails contrast; use `--accent-text` |
| Gradient as `border-color` / `border-image` | Doesn't render; use the 1px `::before` strip |
| Charts on glass or gradient backgrounds | Verifier failure + unreadable in export; use `.sheet` |
| Muted text on a panel over a bright orb | ~2.2:1; cap the orb at 0.15 or use ink-only text |
| vw-clamped type | Type must be fixed px at each breakpoint |
| Bright/light-mode slides mixed in | The theme is nocturnal; one white slide breaks the spell |
| Orbs outside a clipping `.orb-layer` | Off-canvas blur creates scroll overflow → geometry lint failures |

## Verifier notes

- Run: `uv run --with playwright python3 scripts/verify.py themes/aurora-glass/example.html --theme aurora-glass --check-overview --fail-on-warnings`
- The accent lint resolves `#5E6AD2` to `rgb(94, 106, 210)` and counts every element carrying it in any paint property; all accent elements inside one `<svg>` count as a single hit.
- `forbid_chart_on_gradient: true` — keep every wrapper between an `svg[role="img"]` and its `.slide` free of gradient backgrounds (the slide itself may carry one; the `.sheet` must not).
- Headline floor is 60px for h1/h2 — the 60px content-h2 token is the floor, not a suggestion.
- Pill eyebrows use the `.eyebrow` class (exempt small-chrome class); footers use `.footer`.
- Keep decorative text (`.qmark`, `.ghost-index`, orb layers) `aria-hidden="true"`.

## Verify config

```json
{
  "required_tokens": ["--bg","--surface-solid","--ink","--ink-muted","--accent","--accent-text","--aurora-1","--aurora-2","--rule","--font-display","--font-body","--font-mono"],
  "accent_rgb": "94, 106, 210",
  "accent_max_per_slide": 10,
  "forbid_accent_text_selectors": ["h1","h2","h3"],
  "logo_pattern": null,
  "require_logo_on_content_slides": false,
  "forbid_chart_on_gradient": true,
  "headline_contrast_min": 4.5,
  "palette_lock": true
}
```

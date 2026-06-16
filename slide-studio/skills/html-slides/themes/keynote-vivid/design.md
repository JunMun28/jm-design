# Keynote vivid

Dark product-launch keynote. A near-black indigo canvas; oversized bold geometric sans display in pure white; ONE electric-violet moment per slide; coral and amber kept in reserve as rare pops. Charts sit on a raised SOLID panel. Confident, modern, stage-lit — built for the moment a product walks on stage in a dark room.

Reference lineage: Apple/Linear-era launch keynotes, big-type SaaS announcements, Vercel/Stripe-Sessions stage decks, electric-violet hero gradients on near-black.

## When to choose this theme

- Product launches, "introducing v2.0", feature reveals, release keynotes.
- Dev-tool / SaaS / consumer-app announcements where the product is the hero.
- Vision and roadmap decks that should feel bold, current, and premium.
- Any dark-room, big-screen moment: one oversized statement per slide.

## When not

- Print-first or bright-room decks (it lives on dark).
- Dense tabular reporting — big type rewards few, large statements.
- Formal corporate reporting (use a Micron theme) or warm workshop energy (use playful) or quiet status updates (use minimal-slate).

## Tokens (frozen)

Paste `themes/keynote-vivid/tokens.css` first.

| Hex / value | Token | Role | Contrast on #14111F |
|---|---|---|---|
| `#14111F` | `--bg` | near-black indigo canvas | — |
| `#211B33` | `--surface` | raised SOLID panel — **the chart ground** | — |
| `#2B2440` | `--surface-2` | lighter inset / hero cell / active row | — |
| `#FFFFFF` | `--ink` | primary text (all headlines) | 17.9:1 |
| `#B9B3CC` | `--ink-muted` | secondary text, labels, axes | 8.6:1 |
| `#6E5BFF` | `--accent` | electric violet — fills, eyebrows, dots, chart series — **never text** | 3.6:1 (below 4.5 — that is why) |
| `#9B8CFF` | `--accent-text` | stats, links, the one vivid headline word | 6.6:1 |
| `#FF7A59` | `--accent-2` | coral pop — rare | 7.0:1 |
| `#FFC75B` | `--accent-3` | amber pop — rare | 11.6:1 |
| `rgba(255,255,255,0.12)` | `--rule` | hairline borders | decorative |
| `rgba(255,255,255,0.20)` | `--rule-strong` | stronger hairline | decorative |

```
--font-display: "Sora"        800 weight — oversized headlines, stats
--font-body:    "Inter"       400/500 — body, subtitles, descriptors
--font-mono:    "Geist Mono"  500 uppercase — eyebrows, labels, axes, footers
```

All three load from Google Fonts via the `@import` at the top of tokens.css. (Sora is the chosen geometric sans; Space Grotesk is the sanctioned alternate if Sora ever fails to load — do not introduce a third family.)

## Typography

- **Fixed px sizes only — never vw-clamped type.** Desktop scale: cover h1 ~116px, section headlines ~84px, content h2 64px, body 24–28px, mono chrome 16–20px. Small screens get their own media query with smaller *fixed* px values.
- Sora **800** for h1/h2/h3 — the display voice is heavy and oversized, tight tracking (−0.03em to −0.04em), line-height ~1.02.
- Inter 400 for body. Secondary copy in `--ink-muted`.
- Geist Mono 500, uppercase, 0.1–0.16em tracking for every eyebrow, index, axis label, legend, and footer. Mono chrome is the theme's connective tissue.
- Readability floors at desktop: body/bullets/table cells ≥ 24px, labels/captions/axes ≥ 20px, slide h1/h2 ≥ 60px. Footer/nav chrome may run 12–16px.

## The accent rule — one vivid moment per slide

This is the discipline that makes the theme read as expensive instead of loud.

- **Headlines are WHITE.** `h1/h2/h3` are always `--ink`. Violet on a headline is a bug (the verifier forbids `--accent` on `h1,h2,h3`).
- **Each slide gets exactly ONE electric-violet moment** — a focal point, not a wash. Choose one per slide:
  - the eyebrow pill + pulsing dot (the default when nothing else is colored),
  - a single hero stat (`--accent-text`),
  - one violet word in an otherwise-white headline (`.vivid`),
  - the violet chart series (the "now" bars),
  - the ghost section index.
- **Coral (`--accent-2`) and amber (`--accent-3`) are pops, not partners.** At most one of them appears in a whole deck moment (e.g. a faint coral wash in the cover glow). Never two pops on one slide; never a coral *and* amber on the same slide.
- **Use `--accent-text` (#9B8CFF) for any colored number, stat, or link**, never `--accent` (#6E5BFF) — the brightened violet passes 4.5:1; the fill violet does not.
- The verifier counts **every element** whose computed color/border/background/fill/stroke contains `110, 91, 255`; budget ≤ 10 per slide. The example runs 1–4 (eyebrow chip + dot, one chart series, occasionally one active-row stripe). Stay well under.

## Layout grammar

- Outer margins ~96px (`--margin-outer`); 84px vertical padding; content max-width ~1180px.
- One message and one visual protagonist per slide. No slide-internal scrolling.
- Every slide: pill-badge eyebrow (mono, violet dot) → white headline → payload, plus a mono footer strip (deck name left, section right).
- **Action titles**: every content headline is a full-sentence assertion that carries the takeaway; data slides put the key number in the headline ("Drafting time dropped 58% across the beta"). Covers and section dividers are exempt.
- Density caps: title = 1 heading + 1 subtitle + optional date. Content ≤ 1 heading + 4–6 items. Bento ≤ 6 cells, exactly one hero. Data slide = 1 chart + 1 takeaway. Metrics row = 4 stats, one of them violet.
- Archetypes shipped in `example.html`: cover (oversized title + one violet corner glow), agenda (stacked solid rows, active row lit), bento-features (asymmetric solid grid, one hero cell on `--surface-2`), data-chart (grouped bars on the solid panel), metrics row (four solid stat cells, one violet stat), section-divider (oversized white statement + violet ghost index), closing (centered CTA + one violet wash at the base).

## Charts and surfaces (solid panels only)

- **Charts sit on the solid `.surface` panel (`--surface` / #211B33) — never on a gradient, never on the bare canvas.** `forbid_chart_on_gradient` is ON; the verifier walks every ancestor between an `svg[role="img"]` and its `.slide` and fails on any gradient background. The cover glow and closing wash are radial gradients on the *slide*, never under a chart.
- Inline SVG for the example's grouped bars: the "now" series (Loft 2.0) is `--accent` violet; the comparison series (Loft 1.0) is muted `--ink-muted`. Value labels and axes are white / muted, ≥ 20px Geist Mono. Gridlines in `--rule`.
- For richer charts (axes, thresholds, multi-series, tooltips), use ECharts per `references/runtime/svg-charts.md` — still on the solid panel, still violet for the protagonist series and muted for context.
- Illustrative figures carry `data-illustrative="true"` on the panel **and** a visible "Illustrative" / "illustrative sample data" label — the verifier fails an unlabeled placeholder.

## Signature details

1. **Oversized white display.** Sora 800 at 64–116px is the theme. The size *is* the design; resist shrinking it to fit — split the slide instead.
2. **The violet pill eyebrow** with a pulsing 6px `--accent` dot above every headline. Mono, uppercase, faint violet fill. It is the fallback "one violet moment" when a slide has no other.
3. **One radial glow on free corners** (cover, closing) — a soft violet (and one faint coral on the cover) radial gradient on the *slide*, blurred, never under a chart or behind muted text.
4. **Ghost section index** — the part number in giant low-opacity violet behind the divider headline.
5. **Mono chrome everywhere.** Eyebrows, indices, axis labels, legends, footers: uppercase Geist Mono.

## Anti-patterns

| Don't | Why |
|---|---|
| Violet (`--accent`) on a headline (`h1/h2/h3`) | Headlines are white; violet headlines fail the theme + the forbid-accent-text lint |
| More than one vivid moment per slide | The reward is rationed — one violet focal point reads premium, three reads like a template |
| Coral **and** amber on the same slide (or both heavily in one deck) | They are rare pops, not a palette; one quiet appearance, not a second accent system |
| A colored stat in `--accent` instead of `--accent-text` | #6E5BFF is 3.6:1 — fails contrast; use #9B8CFF (#6.6:1) for any number/link |
| Charts on a gradient or on the bare canvas | Verifier failure + unreadable; charts live on the solid `--surface` panel |
| vw-clamped / `clamp()` type | Type must be fixed px at each breakpoint |
| A bright / light-mode slide mixed in | The theme is nocturnal; one white-background slide breaks the keynote |
| Shrinking display type below the readability floors to cram content | Split the slide; the oversized type is the point |
| A second accent font family | Sora + Inter + Geist Mono only (Space Grotesk is the sole Sora fallback) |

## Verifier notes

- Run: `uv run scripts/verify.py themes/keynote-vivid/example.html --theme keynote-vivid --require-shell --check-overview --fail-on-warnings`
- The accent lint resolves `#6E5BFF` to `rgb(110, 91, 255)` and counts every element carrying it in any paint property; all accent elements inside one `<svg>` count as a single hit. Budget ≤ 10/slide.
- `forbid_accent_text_selectors: ["h1","h2","h3"]` — keep headlines white.
- `forbid_chart_on_gradient: true` — keep every wrapper between an `svg[role="img"]` and its `.slide` free of gradient backgrounds; the slide itself may carry the glow, the chart panel must not.
- `require_assertion_titles: true` — every content headline is a full-sentence assertion; data-slide titles should carry the key number.
- `max_body_words_per_slide: 90` (×1.5 in standalone mode); headline floor is 60px for h1/h2.
- Eyebrows use the `.eyebrow` class; footers use `.footer`; decorative marks (`.ghost-index`, `.cover-glow`) are `aria-hidden="true"`.

## Verify config

```json
{
  "required_tokens": ["--bg","--surface","--ink","--ink-muted","--accent","--accent-2","--accent-3","--rule","--font-display","--font-body","--font-mono"],
  "accent_rgb": "110, 91, 255",
  "accent_max_per_slide": 10,
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

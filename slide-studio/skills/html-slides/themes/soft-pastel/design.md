# Soft pastel

Warm, friendly, approachable. A warm off-white canvas; generously rounded white and softly-tinted cards; gentle peach, lavender, and mint pastels used as fills, chips, and small rounded marks; plenty of whitespace; a rounded friendly display face. Calm and human, never corporate. Headlines and body are always warm dark ink — the pastels never carry text.

Reference lineage: friendly HR / onboarding handbooks, Notion-era soft UI, Headspace / Calm warmth, rounded "soft brutalism done gently" product pages.

## When to choose this theme

- HR, onboarding, and new-joiner welcome decks.
- Team culture, values, and community decks.
- Internal comms that should feel warm and reassuring, not formal.
- Wellbeing, benefits, people-team, and "how we work" material.

## When not

- Executive / investor / board decks (use a Micron theme or consulting-navy).
- Dense tabular financial reporting — soft rounded cards reward few, gentle statements.
- High-energy workshop posters (use playful) or nocturnal product launches (use aurora-glass). Soft pastel is deliberately *quieter* than playful: gentler fills, no bold outlines, more air.

## Tokens (frozen)

Paste `themes/soft-pastel/tokens.css` first. `palette_lock` is ON: every visible color on slide content must come from a token — no ad-hoc hex in slide markup or CSS.

| Hex / value | Token | Role | Contrast |
|---|---|---|---|
| `#FFF7F2` | `--bg` | warm off-white canvas | — |
| `#FFFFFF` | `--surface` | white rounded cards | — |
| `#FCEFE8` | `--surface-2` | soft tinted card / chip fill | — |
| `#4A3F3A` | `--ink` | primary text (headlines + body) — **warm dark, not pure black** | 9.6:1 on bg |
| `#6E625B` | `--ink-soft` | readable secondary body / subtitles | 5.6:1 on bg |
| `#8A7D75` | `--ink-muted` | eyebrows, footers, captions (decorative chrome) | 3.8:1 — chrome only |
| `#F2966F` | `--accent` | peach — primary accent **fill** (never text) | 2.1:1 — fills only |
| `#B4A0E5` | `--accent-2` | lavender — secondary accent fill | fill only |
| `#88C9B0` | `--accent-3` | mint — tertiary accent fill | fill only |
| `#F4C6A0` | `--accent-soft` | warm soft peach — light fills | fill only |
| `#F0E2D8` | `--rule` | soft warm hairline | decorative |
| `#F2966F` | `--chart-1` | chart series — peach | fill only |
| `#B4A0E5` | `--chart-2` | chart series — lavender | fill only |
| `#88C9B0` | `--chart-3` | chart series — mint | fill only |
| `#F4C6A0` | `--chart-4` | chart series — warm soft peach | fill only |

```
--font-display: "Quicksand"     (headlines, big numbers, CTA)
--font-body:    "Nunito Sans"   (body, subtitles, card copy)
--font-mono:    "Space Mono"    (eyebrows, footers, axis chrome, badges)
```

All three load from Google Fonts via the `@import` at the top of tokens.css. Do **not** reference Fredoka, Inter, or any other family unless you also load it.

## Typography

- **Fixed px sizes only — never vw-clamped type.** Desktop scale: title ~104px, section headlines 80px, content h2 62px, body 24–28px, mono chrome 20–21px. Small screens get their own media query with smaller *fixed* px values.
- Quicksand 700 for h1/h2/h3 — rounded, friendly, soft tracking (~−0.01 to −0.02em), line-height ~1.08.
- Nunito Sans 400 for body. Secondary copy in `--ink-soft` (still ≥ 4.5:1), not `--ink-muted`.
- Space Mono, uppercase, ~0.06–0.1em tracking for eyebrows, footers, axis labels, and badges. Mono chrome is the only place `--ink-muted` is allowed.
- Readability floors at desktop: body/bullets/table cells ≥ 24px, labels/captions ≥ 20px (the "Illustrative" chip and any in-chart caption included), slide h1/h2 ≥ 60px. Footer/nav chrome may run 12–16px.

## The accent rule (three pastels, used as fills — not text)

There are three pastels: **peach `--accent` (#F2966F)**, **lavender `--accent-2` (#B4A0E5)**, **mint `--accent-3` (#88C9B0)**, plus a soft-peach `--accent-soft`/`--chart-4`.

- Pastels are **fills, chips, rounded shapes, chart series, and small decorative marks only — never text.** Every pastel fails the 4.5:1 floor as text on the warm canvas (peach is 2.1:1). The verifier sets `forbid_accent_text_selectors: h1,h2,h3`.
- Headlines and body text are **always `--ink`** (9.6:1). Readable secondary text is `--ink-soft` (5.6:1). `--ink-muted` is for decorative mono chrome only.
- White (`--surface`) is the only thing that sits *on* a pastel (icon strokes inside a pastel `.gmark`, the closing CTA label) — and only on the saturated peach, kept large/short.
- Accent budget: `accent_max_per_slide: 10`, `accent_rgb` = `242, 150, 111` (peach). All accent elements inside one `<svg>` count as a single hit. The example runs comfortably under budget.

## Layout grammar (rounded, warm, airy)

- Outer margins ~96px (`--margin-outer`); ~84px vertical padding; content max-width ~1200px.
- **Generous rounding is the signature.** Cards `--radius` 28px, sheets `--radius-lg` 40px, chips/pills/tracks `--radius-pill`, icon marks 14–20px. Nothing has sharp corners.
- **Plenty of whitespace.** One message and one visual protagonist per slide; never crowd the canvas. No slide-internal scrolling.
- Density caps: title = 1 heading + 1 subtitle + optional pastel mark row. Content ≤ 1 heading + 3–4 cards. Data slide = 1 exhibit + 1 takeaway.
- Every slide: rounded chip eyebrow (`.eyebrow`, optional `.lav`/`.mint` dot) → headline → payload, plus a quiet mono footer strip.
- Archetypes shipped in `example.html`: title (rounded headline + pastel pad row), welcome/agenda (stacked rounded rows, first tinted active), value grid (three rounded cards, one pastel icon mark each), data (bars + donut on a solid white sheet), section divider (ghost index + soft blob wash), support grid (tinted cards), closing (centered thank-you + peach CTA pill).

## Signature details

1. **Rounded everything.** Big `--radius` cards, pill chips, pill bar-tracks, rounded-square icon marks. The rounding is the warmth.
2. **Soft pastel blobs.** One or two blurred radial pastel blobs per slide, parked in a corner inside a clipping `.blob-layer` (`overflow: hidden`) so blur never creates scroll overflow. Low opacity (0.3–0.55), purely atmospheric, behind the content.
3. **Pastel icon marks.** Each value/support card carries one rounded-square pastel mark (peach/lavender/mint) with a white line icon — one consistent line-icon family, decorative (`aria-hidden`).
4. **Pastel pad row.** Three small rounded pads in peach/lavender/mint as a calm decorative signature on the cover, divider, and closing.
5. **Mono chrome, warm taupe.** Eyebrows, footers, axis labels, badges: uppercase Space Mono in `--ink-muted`.

## Chart / surface rule

- Charts and tables sit on the **solid white `.sheet`** (`--surface`) — **never on a gradient**, never on a blob, never on `--surface-2` if it lowers contrast. `forbid_chart_on_gradient: true`; the verifier walks ancestors of `svg[role="img"]`.
- Inline SVG only for the small static exhibits shipped here (a bar strip and a donut). Chart series use `--chart-1..4` as fills/strokes via CSS classes (`.ring.r1`, `.bar-fill.f1`) — never inline hex, to honor `palette_lock`.
- Keep the bar **track** (`--surface-2`) distinct in lightness from the pastel **fills** so the bars read; make the fill spans `display:block` so the percentage width takes effect.
- Axis / legend / labels: Space Mono or body, ≥ 20px, `--ink` or `--ink-muted`. Any in-chart caption must also clear the 20px rendered-size floor (mind the SVG viewBox scale factor) — prefer an external legend over tiny in-SVG text.
- Made-up figures carry `data-illustrative="true"` **and** a visible "Illustrative" chip (≥ 20px).

## Export mode

Soft blur is fragile in print/PDF/raster pipelines. Set `<html data-export="true">` before capture; tokens / theme CSS then:

- flatten `.blob` (no blur, lowered opacity) so blobs become static soft washes;
- force `.reveal` elements visible.

Charts need no special handling — they already live on the opaque white sheet.

## Anti-patterns

| Don't | Why |
|---|---|
| Pastels as body or headline text | Every pastel fails 4.5:1 on the canvas (peach 2.1:1) — pastels are fills only; text is `--ink` / `--ink-soft` |
| Hard black (`#000`) anywhere | The theme is warm — use `--ink` (#4A3F3A); pure black breaks the gentle mood |
| `--ink-muted` for sentences the audience must read | It is 3.8:1 — chrome only (eyebrows, footers, captions); readable secondary text is `--ink-soft` |
| Ad-hoc hex in slide markup/CSS | `palette_lock` — every visible color comes from a token; drive SVG fills/strokes via token-backed classes |
| Charts on a gradient, a blob, or a tinted surface | Verifier failure + low contrast; charts live on the solid white `.sheet` |
| Bar track and fill at the same lightness | The bars vanish — keep the `--surface-2` track lighter than the pastel fills |
| Tiny in-SVG captions | At a 1.9× viewBox scale a 9px label still renders ~17px < 20px floor — use an external legend |
| Sharp corners / hard outlines / heavy shadows | Kills the soft, rounded, airy feel — keep big radii and soft low-opacity shadows |
| Loud, high-energy, bold-outline blocks | That is the playful theme; soft pastel is the *calm* one — more air, gentler fills |
| Blobs outside a clipping `.blob-layer` | Off-canvas blur creates scroll overflow → geometry lint failures |
| vw-clamped type | Type must be fixed px at each breakpoint |

## Verifier notes

- Run: `uv run scripts/verify.py themes/soft-pastel/example.html --theme soft-pastel --require-shell --check-overview --fail-on-warnings`
- The accent lint resolves `#F2966F` to `rgb(242, 150, 111)` and counts every element carrying it in any paint property; all accent elements inside one `<svg>` count as a single hit. Budget ≤ 10/slide.
- `headline_contrast_min: 4.5` is enforced on h1/h2 — they use `--ink` (9.6:1), which is the guarantee that pastels never leak into headline color.
- `require_assertion_titles: true`, `max_body_words_per_slide: 90`. Covers and `data-slide-kind="section"` dividers are exempt from action-title and notes lints.
- Keep decorative text/marks (`.ghost-index`, `.blob-layer`, `.dot-row`, icon SVGs) `aria-hidden="true"`.

## Verify config

```json
{
  "required_tokens": ["--bg","--surface","--ink","--ink-muted","--accent","--accent-2","--accent-3","--rule","--font-display","--font-body","--font-mono"],
  "accent_rgb": "242, 150, 111",
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

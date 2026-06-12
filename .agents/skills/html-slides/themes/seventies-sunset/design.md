# Seventies sunset

Warm 70s editorial. Cream paper, heavy soft-serif espresso type, terracotta-to-gold concentric sun arcs, arch-shaped frames, faint film grain, slow golden-hour pacing. The deck should feel like a beautifully printed annual letter found in a 1976 design magazine — analog warmth with modern polish.

Reference lineage: 70s National Park posters, Penguin paperback covers of the era, terracotta editorial spreads, late-day desert light.

## When to choose this theme

- Story-led narratives: annual letters, vision and culture talks, founder stories.
- Brand and values decks where warmth and patience are the message.
- Retrospectives and "year in review" storytelling.
- Anything where the pacing should feel slow and considered, not energetic.

## When not

- Dense engineering or data-heavy reviews.
- Corporate/formal board material.
- High-energy workshops or kickoffs — that is `playful`'s job, not this theme's.

## Tokens (frozen)

Paste `themes/seventies-sunset/tokens.css` first.

| Hex | Token | Role | Contrast |
|---|---|---|---|
| `#F7EFE2` | `--bg` | warm cream paper | — |
| `#EFE2CC` | `--surface` | sand panels + chart areas | — |
| `#3B2A20` | `--ink` | espresso text | 12.0:1 on bg, 10.7:1 on surface |
| `#6B5240` | `--ink-muted` | secondary text | 6.3:1 on bg, 5.7:1 on surface |
| `#A8431B` | `--accent` | burnt terracotta (pre-darkened for AA) | 5.3:1 on bg, 4.7:1 on surface |
| `#D99A2B` | `--accent-2` | harvest gold — **fills only** on light surfaces | 1.9:1 on surface (fails text + non-text); 5.6:1 as text on espresso |
| `#5C5C22` | `--accent-3` | deep olive (pre-darkened for AA) | 6.1:1 on bg, 5.5:1 on surface |
| `#8A3324` | `--deep` | rust — pull quotes + chart axes | 7.1:1 on bg, 6.4:1 on surface |
| `#A8721A` | `--chart-gold` | data-bearing gold | 3.2:1 on surface (≥ 3:1 non-text floor) |

Plus `--rule` (espresso hairline at 18%), `--radius-arch`, `--radius-arch-full`, `--shadow-soft`, `--grain`, `--sun-rise`, `--sun-set`, `--earth-stripes`, `--font-display/body/mono`, `--col-gap`, `--margin-outer` — these names compose with `references/tokens/non-micron-contract.css`.

### The gold rule (mandatory)

`--accent-2` (#D99A2B) is 1.9:1 on sand — below the 3:1 non-text floor. The chosen, consistent fix is a **dedicated darker token**: every gold element that *encodes data* (chart bars, legend swatches, value markers) uses `--chart-gold` (#A8721A, 3.2:1 on `--surface`). Bright `#D99A2B` remains legal only for:

- purely decorative fills on light surfaces (sun rings, earth stripes, ornament discs), and
- text or fills on espresso (`#3B2A20`), where it reads 5.6:1.

Never use either gold as text on cream or sand. Never "fix" a gold bar with a stroke instead — the token swap is the one consistent mechanism in this theme. (For the record: the reviewer's example `#B27B16` was measured at 2.86:1 on `#EFE2CC` — it also fails, which is why the frozen token is `#A8721A`.)

## Typography

- **Fraunces variable** for display, weights 600–900, optical sizing auto.
  - The Google Fonts URL in tokens.css requests the custom axes **explicitly**: `family=Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,600..900,100,0..1;1,9..144,600..900,100,0..1`. Google Fonts strips unrequested custom axes and silently pins them to defaults. Verified served: the css2 request above is accepted and returns Fraunces faces (an invalid axis list returns HTTP 400). If you ever shorten the URL, drop all `font-variation-settings` mentions of SOFT/WONK too — otherwise they silently no-op.
  - Headings: `'SOFT' 100, 'WONK' 0` — soft rounded terminals, no wonk. Weight 700–850.
  - Swash numerals (`.swash`): *italic*, `'SOFT' 100, 'WONK' 1`. This is the only place WONK turns on.
- **DM Sans** for body, 400/500. Line-height 1.55 — looser than playful's 1.5; the theme breathes.
- **Space Mono** for kickers, data labels, folios. Uppercase, letter-spacing 0.14–0.2em.
- Floors at desktop: body/bullets/table cells ≥ 24px, labels/captions ≥ 20px, slide titles ≥ 60px. Nav dots, progress bar, and folios may be 12–16px.

## Layout grammar

- Generous outer margins (`--margin-outer`), 12-col grid, content vertically centered.
- One message, one visual protagonist per slide. The sun, an arch, a chart, or a quote — never two of them competing.
- Arch frames use `--radius-arch` (999px 999px 24px 24px) for windows/cards/doorways and `--radius-arch-full` (999px) for capsules and chips. **No other radii for framing elements** — the arch is the theme's geometry.
- Panels are sand (`--surface`) with `--shadow-soft` (gaussian, low, negative spread). No borders on cards.
- Hairlines (`--rule`) for rails, agenda rows, and table lines.
- Charts sit on solid sand only — never over the sun, grain-over-gradient zones, or any gradient (verify enforces this).

## Slide archetypes

1. **Title** — CSS-only concentric sun (`--sun-rise` on a pseudo-element) rising from the bottom edge; copy centered above it. Corner labels are **espresso on cream** — cream labels are permitted only when fully inside the outer terracotta ring, and that geometry is fragile, so the example doesn't use it.
2. **Agenda** — swash-numeral rail: Fraunces italic WONK numerals in terracotta on hairline rows.
3. **Content, 3-col** — arch-topped sand cards (`--radius-arch`), one ornament disc each (terracotta / decorative gold / olive).
4. **Data chart** — rounded-top bars (`--radius-arch-full` on top corners) in terracotta / `--chart-gold` / olive on the sand surface; rust (`--deep`) axis; Space Mono labels ≥ 20px; one takeaway line.
5. **Quote, light variant** — rust (`--deep`) Fraunces quote on cream with a soft gold radial glow + grain behind. **Dark espresso variant**: background `--ink`, quote in cream `#F7EFE2` (12.0:1), attribution in sand `#EFE2CC` (10.7:1), gold kicker allowed (5.6:1). Use the dark variant at most once per deck.
6. **Divider** — arch doorway (`--radius-arch`) filled with a sunset gradient + grain, revealed with a `clip-path: inset()` wipe; giant ~280px swash numeral beside it (decorative, `aria-hidden="true"`).
7. **Timeline / principles row** — `--earth-stripes` horizon band as the spine, capsule chips (`--radius-arch-full`) as milestones.
8. **Closing** — sunset inversion: espresso background, `--sun-set` (gold core → terracotta outer) sinking below the bottom edge, cream headline, gold kicker.

## Signature details

- **The sun**: five hard-stop rings from ONE radial-gradient (`--sun-rise` / `--sun-set`), drawn as background-image so it never spends accent budget. It rises on the title (translateY transition) and sinks on the close. Slow: `--duration-sun: 1.2s`.
- **Film grain**: `.grain::after` with the percent-encoded SVG feTurbulence data-URI in `--grain` at 5% opacity. Apply over gradient areas (sun zones, glow, doorway) so they read analog. Never over chart areas.
- **Arch doorway wipe**: divider door reveals bottom-to-top via `clip-path: inset(100% 0 0 0) → inset(0 0 0 0)`.
- **Pacing**: `--duration-normal: .8s` with `--ease-out-expo`. Reveals are slower than every other theme. Under `prefers-reduced-motion` the sun, wipes, and reveals all collapse to their static final states.

## Accent rules

- Verify counts every element whose computed color/background/border/outline/fill/stroke contains `168, 67, 27` — budget is 12 per slide. Background-**image** gradients (sun, stripes, doorway) are free; terracotta text, fills, and borders are not.
- Typical spend: agenda numerals 4, chart bars 2, kicker 1. Stay under ~8 so edits don't tip the budget.
- Gold follows the gold rule above. Olive and rust are unbudgeted but should stay supporting colors.

## Anti-patterns

| Don't | Why |
|---|---|
| 2px ink borders, chunky `0 6px 0` offset shadows, sticker chips, rotated elements | That is **playful**. Seventies-sunset frames with arches and soft gaussian shadows only |
| Fraunces at 900 with tight line-height and outlines | Playful's display voice. Here: 700–850, SOFT 100, slower leading |
| High-energy color rotation per slide | One warm family throughout; the palette never "switches accent" |
| Gold (`#D99A2B`) text on cream/sand, or gold data bars without `--chart-gold` | 1.9:1 — fails both text AA and the 3:1 non-text floor |
| Cream corner labels on the title outside the outer sun ring | Fragile geometry; defaults are espresso labels |
| Charts over the sun, glow, or any gradient | Verify fails it; analog grain belongs to ornament, not data |
| Hand-typed arch radii (`border-radius: 999px 999px 24px 24px` inline) | Use `--radius-arch` / `--radius-arch-full` so the geometry stays consistent |
| WONK on headings or body | Wonk is reserved for swash numerals; everywhere else it reads as a glitch |
| Fast snappy motion (< 0.5s reveals) | The theme's pacing is golden-hour slow on purpose |

### How not to drift into playful

Both themes use Fraunces on warm cream — the separation is deliberate and must stay visible:

| Axis | Playful | Seventies-sunset |
|---|---|---|
| Fraunces | 400/700/900, default axes | 600–850, `SOFT 100`, italic `WONK 1` numerals only |
| Edges | 2px ink borders everywhere | **No borders**; arch radii + hairlines |
| Shadows | Hard `0 6px 0` ink offsets | Soft gaussian `--shadow-soft` only |
| Color energy | 4 rotating brights | One warm earth family, gold rationed |
| Ornament | Stickers, blobs, ±3° rotation | Sun arcs, arches, grain — everything level |
| Motion | Quick, springy | Slow rises, sinks, and wipes |

If a slide could be mistaken for playful, remove the borders/rotation first — that is always the tell.

## Verify config

```json
{
  "required_tokens": ["--bg","--surface","--ink","--ink-muted","--accent","--accent-2","--accent-3","--deep","--font-display","--font-body","--font-mono"],
  "accent_rgb": "168, 67, 27",
  "accent_max_per_slide": 12,
  "logo_pattern": null,
  "require_logo_on_content_slides": false,
  "forbid_chart_on_gradient": true,
  "headline_contrast_min": 4.5,
  "palette_lock": true
}
```

Verifier notes:

- Draw suns/stripes/doorways as background-images on pseudo-elements: free of accent budget, and the headline-contrast walk still resolves the slide's opaque `background-color` (cream or espresso) instead of bailing out on a gradient.
- The chart slide must keep every ancestor between the chart element and the slide gradient-free; the example puts the chart on a solid `--surface` panel.
- `--fail-on-warnings` includes the `document.fonts` loaded check — the deck needs network access for the Google Fonts @import on first verify.

# Swiss minimal (light)

White canvas. Strong grid. One accent. Generous whitespace. No shadows. No gradients. The slide has to earn every mark on it.

Reference lineage: Müller-Brockmann grid posters, Massimo Vignelli's NYC Subway diagram, IBM Press, *Linea Grafica*.

## When to choose this theme

- Research summaries, technical talks, dense agendas, plain reports.
- Reading-heavy decks where the deck behaves like a document.
- Audiences that read; speakers who narrate rather than perform.
- Print-style data tables and comparisons (alongside `micron-light` if Micron branding is also needed).

## When not

- Marketing or vision decks — too austere; use `micron-dark` or `editorial-dark`.
- Engineering deep-dives — use `micron-dark-engineering`; this theme has no panels or system colours.
- Anything that wants atmosphere, gradient depth, or feature-card showmanship.

## Tokens (frozen)

Paste `themes/swiss-light/tokens.css` first, then `references/tokens/viewport-base.css`, then `references/tokens/layout-kit.css`. Never override `:root` in the deck.

```
--bg: #FFFFFF
--ink: #0F172A              (slate-900, body and headlines)
--ink-muted: #475569        (slate-600, captions, axis labels)
--rule: #E2E8F0             (slate-200, hairlines)
--rule-strong: #94A3B8      (slate-400, table dividers)
--accent: #E53935           (Müller red — sparingly)
--scale-ratio: 1.25         (modest type scale)
--font-display: "Inter"
--font-body: "Inter"
--font-mono: "IBM Plex Mono"
```

The palette is locked. Don't introduce greens, blues, or pastels — the single accent earns its punch precisely because it's alone.

## Typography

- Inter throughout: 400 body, 500 captions, 700 headlines.
- IBM Plex Mono only for code, callouts, and timestamps. Never for body.
- Headline size scale: `clamp(2.5rem, 5vw, 4rem)` on title slide; `clamp(1.75rem, 3.5vw, 2.5rem)` on content slides.
- Line height: 1.15 on headlines, 1.5 on body.
- Tracking: -0.01em on headlines (Inter's default looks slightly loose at display sizes).
- All-caps **only** for tiny eyebrow labels (`text-transform: uppercase; letter-spacing: 0.08em; font-size: 0.75rem;`).

## Layout grid

- 12-column grid, 24 px gutters, 80 px outer margin on desktop (collapses to 16 px on mobile).
- Slides almost always use 8 of 12 columns for content; the remaining 4 are intentional white space.
- One horizontal rule per slide as a structural beat, either at top under eyebrow or between headline and body. Use `--rule` for hairlines, `--rule-strong` for table dividers.
- Alignment: left. Centered text only on title slide.

## Accent rules

- One accent element per slide. *One.* It can be: a single word, an underline, a small block, a chart highlight, a rule.
- The accent's job is to point at the takeaway. If the slide has no takeaway, the accent doesn't appear.
- `accent_max_per_slide: 6` in `verify.py` is a forgiveness margin (it counts every element whose computed colour contains the accent RGB — a small SVG can register several). Author intent is one focal use.
- Never use accent for body text, never as a background fill larger than ~120 px², never on multiple elements simultaneously.

## Shadows, gradients, depth

- No shadows.
- No gradients.
- No glass, no blur, no inner shadows.
- Depth comes from typographic weight contrast and whitespace, not from rendering tricks.

## Charts

- Charts read on white. The base series tone is `--ink`; the highlighted series uses `--accent`.
- Axis labels in `--ink-muted` at 0.75 rem.
- One series highlighted per chart. The rest in `--rule-strong` or `--ink-muted`.
- See `references/runtime/svg-charts.md` decision table.

## Density limits (override the SKILL.md table where stricter)

| Slide type | Max content |
|---|---|
| Title | 1 heading, 1 subtitle, 1 metadata line (date / source / author) |
| Content | 1 headline + ≤ 4 bullets, OR 1 headline + 1 short paragraph (≤ 50 words) |
| Quote | 1 quote ≤ 25 words + attribution |
| Data | 1 chart or 1 table + 1 single-sentence takeaway |
| Grid | 4 cards max; cards are text-only or text+number |
| Image | 1 image + 1 caption; image left-aligned in grid, not full-bleed |

## Anti-patterns

| Don't | Why |
|---|---|
| Drop in coloured icon sets | Swiss aesthetic uses typographic and rule marks, not stock iconography |
| Add a second accent ("just for this one chart") | The discipline *is* the design — accent inflation flattens the hierarchy |
| Centred body text | Reading anchors break; the grid does the work |
| Full-bleed photography | Photos sit inside the grid; bleeds belong to editorial themes |
| Gradient buttons | There are no buttons; if there were, they'd be flat |
| Shadow-on-card | This is a Bento smell; Swiss has no cards-with-elevation |
| `font-style: italic` for emphasis | Use weight (500 or 700) instead — Inter's italic is fine but feels like a foreign import |

## Logo / branding

This theme is unbranded. No logo block. If the user needs a brand mark, switch to a Micron theme.

## Verify config (manifest, for reference)

```json
{
  "required_tokens": ["--bg","--ink","--ink-muted","--accent","--rule","--font-display","--font-body","--scale-ratio"],
  "accent_rgb": "229, 57, 53",
  "accent_max_per_slide": 6,
  "logo_pattern": null,
  "require_logo_on_content_slides": false,
  "forbid_chart_on_gradient": false,
  "headline_contrast_min": 7.0,
  "palette_lock": true
}
```

Run: `python scripts/verify.py <deck.html> --theme swiss-light --check-overview --fail-on-warnings`.

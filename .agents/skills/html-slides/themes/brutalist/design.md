# Brutalist

Raw, stark, intentional. Default browser fonts considered. Hard primary colours, zero radius, visible borders, instant state changes. Anti-design as a design.

Reference lineage: Bloomberg Businessweek covers, Yale School of Art, *032c*, Balenciaga e-commerce era.

## When to choose this theme

- Counter-culture, editorial, or art-school decks.
- Tech-blog write-ups, hot takes, opinionated talks.
- Decks that want to look authored, not designed.

## When not

- Corporate or conservative audiences.
- Long-reading editorial — switch to `editorial-dark`.
- Anything that needs to feel "trustworthy" in a finance/healthcare sense.

## Tokens (frozen)

Paste `themes/brutalist/tokens.css` first. No `viewport-base.css` shadow softeners — brutalist is deliberately unsmoothed.

```
--bg: #FFFFFF
--ink: #000000
--accent: #FF0000           (primary punch)
--accent-2: #FFFF00         (used only for hover/active)
--accent-3: #0000FF         (used only on system slides)
--rule: #000000             (visible 2–4 px borders)
--font-display: system-ui, "Times New Roman", serif
--font-body: ui-monospace, Menlo, monospace
```

The palette is locked. No greys, no warm-blacks. Pure primaries plus B/W.

## Typography

- Use whatever the OS gives. `system-ui` for headlines, monospace for body. No Google Fonts.
- Weight 700+ on headlines, large.
- No tracking adjustment, no fancy leading. Default browser metrics.
- ALL CAPS allowed for headlines (only theme that endorses it).

## Layout

- 12-col grid is suggested, not enforced. Asymmetry is fine.
- 0 px border-radius everywhere. 0 ms transitions on hover (instant).
- Visible borders: 2–4 px solid black.
- Margins are aggressive — slabs of white space pushed to one edge.

## Accent rules

- Red is primary. Use it as: large block, headline emphasis, single chart series.
- Yellow appears only on hover/active states.
- Blue appears only on rare "system" or "exception" slides.
- `accent_max_per_slide: 10` — brutalist tolerates more accent volume because the theme *is* loud.

## Anti-patterns

| Don't | Why |
|---|---|
| Smooth gradients | Brutalist is hard edges |
| Shadow / glass / blur | Theme is anti-decorative |
| Rounded corners > 0 | Breaks the contract |
| 200 ms hover transitions | Should be instant |
| Custom premium fonts | Defeats the "raw web" stance |

## Verify config

```json
{
  "required_tokens": ["--bg","--ink","--accent","--rule","--font-display","--font-body"],
  "accent_rgb": "255, 0, 0",
  "accent_max_per_slide": 10,
  "logo_pattern": null,
  "require_logo_on_content_slides": false,
  "forbid_chart_on_gradient": true,
  "headline_contrast_min": 7.0,
  "palette_lock": true
}
```

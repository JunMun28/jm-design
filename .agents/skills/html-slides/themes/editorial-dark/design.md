# Editorial (dark)

Long-form narrative on dark. Serif headlines, generous gutters, single-column reading flow. The deck feels like a magazine feature you flip through, not a slide deck you click through.

Reference lineage: *The New York Times Magazine*, *Wired* features, *The Atlantic* longform, Penguin Modern Classics covers.

## When to choose this theme

- Pitch decks where the story matters more than the data.
- Essays-as-slides — opinionated narrative, one argument per slide.
- Founder updates that lean editorial rather than operational.
- Audiences that read in advance and reference the deck after.

## When not

- Engineering or technical reviews — `micron-dark-engineering` reads better at distance.
- Anything dashboard-shaped — editorial fights data density.
- Mandatory branded contexts — switch to a Micron theme.

## Tokens (frozen)

Paste `themes/editorial-dark/tokens.css` first, then `references/tokens/viewport-base.css`, then `references/tokens/layout-kit.css`. Never override `:root` in the deck.

```
--bg: #14110F              (warm near-black)
--bg-elev: #1C1814         (panel surface, one step lighter)
--ink: #F2EDE6             (warm off-white, body and headlines)
--ink-muted: #8E867A       (warm gray, captions, dropcaps secondary)
--rule: #2E2823            (hairlines)
--accent: #D4AF37          (warm gold, used like a drop cap)
--scale-ratio: 1.333       (more dramatic display scale)
--font-display: "Playfair Display"
--font-body: "Inter"
--font-italic: "Cormorant Garamond"
--font-mono: "IBM Plex Mono"
```

The palette is locked. No greens, no blues, no neon. Gold is the only accent.

## Typography

- Playfair Display 700 for headlines. Its high contrast and bracketed serifs are the theme's signature.
- Inter 400 for body, 500 for captions. Inter is the surprise — pairing geometric sans body with display serif gives the deck a contemporary editorial feel rather than a costume-piece classical one.
- Cormorant Garamond italic for pull quotes only. Never for body, never for headings.
- IBM Plex Mono for timestamps, citations, captions under photos.
- Headline size: `clamp(2.75rem, 6vw, 5rem)` on title slide; `clamp(2rem, 4vw, 3rem)` on content.
- Line height: 1.1 on Playfair display; 1.55 on Inter body.
- Tracking: -0.015em on Playfair (its default tracking is loose at display sizes).
- Drop caps allowed on first paragraph of essay slides — see `tokens.css` `.dropcap` class.

## Layout grid

- Single-column reading flow. 12-column grid is used only to position images and pull quotes against the body.
- Max body line length: 65–72 characters. Wider lines break the reading rhythm.
- Generous outer margins: 96 px desktop, 24 px mobile.
- Vertical rhythm: every block is a multiple of the base line height (1.55 × 1rem = 24.8 px).

## Accent rules

- Gold is used like a magazine drop cap: rarely, deliberately, large.
- Up to one drop cap, one accent rule, OR one accent in a chart — not all three.
- `accent_max_per_slide: 6` in `verify.py` allows for the drop cap's multiple coloured spans without false-failing.
- Never use gold for hyperlinks-style body emphasis. If body text needs emphasis, use `<em>` in Cormorant italic.

## Pull quotes

Editorial decks earn pull quotes:

```html
<blockquote class="pull">
  <p>"The story is the point. The deck is the medium."</p>
  <cite>— Source attribution</cite>
</blockquote>
```

- One pull quote per slide max.
- Cormorant Garamond italic, 1.5× body size, indented from main column.
- Attribution in Inter 400, smaller, with em-dash prefix.

## Gradients & depth

- One subtle gradient allowed for ambience: `linear-gradient(180deg, var(--bg) 0%, var(--bg-elev) 100%)` on a slide that hosts a hero image.
- No glass, no blur, no inner shadows.
- Photography is allowed to bleed full-width on dedicated image slides; on text slides, photos sit at the side with caption.

## Charts

- Charts are *unusual* in this theme. Prefer numbers in body copy.
- When a chart is needed: dark canvas, gold for the highlighted series, `--ink-muted` for context series.
- Axis labels in Inter 400 0.75rem `--ink-muted`.
- See `references/runtime/svg-charts.md` decision table.

## Density limits

| Slide type | Max content |
|---|---|
| Title | 1 heading, 1 deck (subtitle/byline), date |
| Essay | 1 headline + 1 paragraph (≤ 80 words) — flow as a continuous text |
| Quote | 1 pull quote ≤ 30 words + attribution |
| Image | 1 image + 1 caption; image bleeds or sits in 6 columns |
| Data | 1 chart + 1 sentence; chart on a flat section, not over gradient |
| Section break | 1 large word/number + 1 line of metadata |

## Anti-patterns

| Don't | Why |
|---|---|
| Bullet lists | Editorial flows; if you have 4 bullets, write 4 sentences |
| Centered body text | Reading anchor breaks |
| Gold buttons / gold accents on multiple paragraphs | The drop-cap discipline collapses |
| Sans-serif headlines | The serif is the theme; without it this is just a dark deck |
| Stock photography of generic teams | Use the photograph the essay actually references, or no photograph |
| Decorative motion (sparkles, particles, parallax beyond the title slide) | Editorial is print-feeling; motion feels wrong |
| Bento grids of cards | A magazine doesn't lay out cards |

## Logo / branding

This theme is unbranded. If the user needs a Micron logo, switch themes.

## Verify config (manifest, for reference)

```json
{
  "required_tokens": ["--bg","--ink","--ink-muted","--accent","--rule","--font-display","--font-body","--scale-ratio"],
  "accent_rgb": "212, 175, 55",
  "accent_max_per_slide": 6,
  "logo_pattern": null,
  "require_logo_on_content_slides": false,
  "forbid_chart_on_gradient": false,
  "headline_contrast_min": 4.5,
  "palette_lock": true
}
```

Run: `python scripts/verify.py <deck.html> --theme editorial-dark --check-overview --fail-on-warnings`.

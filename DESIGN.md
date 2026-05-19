# Design system — index

This repository builds the **html-slides** skill: single-file HTML slide
decks across multiple themes. There is no single palette or layout — design
rules are **per theme**, and each theme owns its own authoritative spec.

> Single source of truth: `.agents/skills/html-slides/themes/<id>/design.md`.
> Do not restate per-theme rules here — that is exactly the duplication this
> file was collapsed to remove. This page only carries the cross-theme
> invariants and a routing table.

## Themes

Manifest: `.agents/skills/html-slides/themes/themes.json` (the source of
truth — never hand-edit decks to add a theme). Visual chooser:
`.agents/skills/html-slides/themes/selector.html`.

| Theme | Tone | When |
|---|---|---|
| `micron-dark` | brand | Brand-led storytelling on black. Default Micron dark. |
| `micron-dark-engineering` | engineering | Technical/engineering reviews, roadmaps, postmortems. |
| `micron-light` | editorial-data | Light, restrained, print/PDF-friendly. Apple/Cursor cadence. |
| `course-module` | learning | Lessons, training, workshops. Learn → recall → apply. |
| `weekly-update` | operations | Squad weekly / ops review. Shipped / in-flight / blocked. |
| `swiss-light` | minimal | White canvas, strong grid, one accent. Reports, talks. |
| `editorial-dark` | editorial | Long-form narrative on dark. Serif headlines. |
| `brutalist` | raw | Counter-culture, hot-take, art-school. Stark, unsmoothed. |
| `glassmorphism` | atmosphere | Modern SaaS/fintech pitch. Frosted glass on gradient. |
| `playful` | warm | Workshops, kickoffs, morale. Bright primaries, chunky type. |

Pick the theme first; then read that theme's `design.md`. The Micron themes
share `references/tokens/micron-tokens.css`; the others carry their own
`themes/<id>/tokens.css`. Both satisfy the shared runtime contract that
`references/runtime/html-template.md` consumes.

## Cross-theme invariants (true regardless of theme)

These are the only design rules that live at this level. Everything else
(color, accent policy, typography scale, logo, gradients, chart surface,
sentence case) is theme-specific and defined in the theme's `design.md`.

- **OKLCH-minded color.** Tint neutrals toward the theme hue; never raw
  `#000`/`#fff` as a "neutral" unless the theme's spec says so (brutalist
  does, deliberately).
- **One message, one visual protagonist per slide.** Split density into
  more slides, never more files.
- **Type hierarchy by scale + weight contrast** (≥ 1.25 step ratio). No
  flat scales. Body line length 65–75ch.
- **Motion is hierarchy, not spectacle.** Composited properties only
  (`transform`/`opacity`), ease-out curves, a `prefers-reduced-motion`
  fallback. No bounce/elastic on UI.
- **No invented content.** No fabricated stats, quotes, logos, products.
- **No AI-slop tells.** No identical card grids, no gradient text, no
  accent side-stripe borders, no decorative glassmorphism (except the
  `glassmorphism` theme, where it is the scoped, intentional point).
- **Verify rendered output**, not just code:
  `scripts/verify.py <deck>.html --theme <id> --check-overview --fail-on-warnings`.

For anything more specific than the list above, the theme's `design.md`
wins. If this file and a theme `design.md` ever disagree, the theme is
right and this file is stale — fix this file.

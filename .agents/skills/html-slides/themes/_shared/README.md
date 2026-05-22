# Shared brand assets

`themes/themes.json -> shared` points here. The Micron themes
(`micron-dark-executive`, `micron-dark`, `micron-light`, `guided-learning`)
reference these binaries. The non-Micron themes are unbranded and need nothing
from this folder.

## Binaries

This skill is for **Micron internal use** — the brand assets are vendored
here, no license restriction.

| File | Status | Used by | Notes |
|---|---|---|---|
| `micron-logo-white-tm-rgb.png` | **present** (600×150 RGBA) | Micron base block `.slide::after` on dark/gradient | official wordmark |
| `micron-logo-black-tm-rgb.png` | **present** (600×150 RGBA) | Micron base block on `.theme-light` slides | official wordmark |
| `fonts/micron-basis.woff2` | optional, not vendored | `@font-face` in `micron-tokens.css` | drop in if available; a metric-matched Arial fallback is already declared, so its absence degrades cleanly with ~zero CLS |

## Asset path contract

There is one convention. Do not invent others.

1. **Source of truth** for the binaries is this folder: `themes/_shared/…`.
2. **A generated deck is a standalone single file.** Copy the logo it needs
   into the deck's own `assets/` directory next to the `.html`:

   ```
   my-deck.html
   assets/micron-logo-white-tm-rgb.png   # copied from themes/_shared/
   assets/micron-logo-black-tm-rgb.png   # only if the deck has light slides
   assets/fonts/micron-basis.woff2       # optional
   ```

   The Micron base block in `references/runtime/html-template.md` and
   `scripts/scaffold-deck.py` reference `assets/micron-logo-*-tm-rgb.png`
   relative to the deck — that is deliberate, so the deck is portable.

3. The logo binaries are present, so the brand mark renders for real.
   Note for future edits: `verify.py`'s logo lint checks only that the
   `::after` *rule* targets the logo (image URL or text wordmark), not
   that the pixels loaded — if a path is ever broken, verify can still
   pass green, so keep the `themes/_shared/ → deck assets/` copy intact
   and glance at slide 2 before delivery.

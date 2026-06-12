# Micron Dark Title Template

`micron-dark` has exactly one approved title-slide treatment: `photo-title`.

Use the theme-owned high-resolution VR portrait asset:

`themes/micron-dark/assets/title-image.jpeg`

Generated decks copy it to:

`assets/micron-dark-title-image.jpeg`

## Selection Rule

- Always use `photo-title` for `micron-dark` title slides.
- Treat `random`, `default`, and omitted `--title-template` as `photo-title`.
- Do not use wafer, divider-band, grain-wave, silk-wave, purple-silk, or
  screen-stack title treatments — `micron-dark` ships `photo-title` only.

## Fragment

The copy-paste fragment lives at:

`themes/micron-dark/title-templates/photo-title.html`

## CSS Contract

- Black stage.
- Official white Micron + `Intelligence Accelerated` lockup bottom-left.
- Large left-aligned title block in a hard black field.
- Date or context sits directly below the title.
- The photo sits on the right half with a center/right crop that keeps the VR
  headset and face sharp.
- Use the actual JPEG asset in the DOM; do not flatten the whole cover into a
  screenshot, and do not use a low-resolution PNG crop.
- Keep the split crisp; do not wash the photo under the text area unless a
  specific photo needs a tiny edge fade.
- No visible slide number, accent rule, decorative kicker, alternate generated
  title art, UI stacks, shader fields, wafer portals, or abstract gradient
  title visuals.
- Use `assets/micron-logo-white-ia-rgb.png` on generated title slides and
  `../_shared/micron-logo-white-ia-rgb.png` inside the theme example. Plain
  Micron wordmark assets are for content-slide footers only.

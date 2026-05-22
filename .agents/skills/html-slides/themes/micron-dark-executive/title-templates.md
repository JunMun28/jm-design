# Micron Dark Title Template

`micron-dark-executive` has exactly one approved title-slide treatment: `photo-title`.

Use the theme-owned photo asset:

`themes/micron-dark-executive/assets/title-image.jpeg`

Generated decks copy it to:

`assets/micron-dark-title-image.jpeg`

## Selection Rule

- Always use `photo-title` for `micron-dark-executive` title slides.
- Treat `random`, `default`, and omitted `--title-template` as `photo-title`.
- Do not use wafer, divider-band, grain-wave, silk-wave, purple-silk, or
  screen-stack title treatments in `micron-dark-executive`.
- Those title treatments belong to `micron-dark`.

## Fragment

The copy-paste fragment lives at:

`themes/micron-dark-executive/title-templates/photo-title.html`

## CSS Contract

- Black stage.
- Official white Micron logo top-left.
- Large left-aligned title block.
- The photo sits on the right with a right-weighted crop equivalent to a 20%
  visual shift, without expanding page geometry.
- A black readability overlay protects the title area.
- No alternate generated title art, UI stacks, shader fields, wafer portals, or
  abstract gradient title visuals.

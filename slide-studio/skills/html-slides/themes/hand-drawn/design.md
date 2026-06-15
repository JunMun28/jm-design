# Hand-drawn (sketchnote)

**Role:** education · explainers · video lessons · workshops where the goal is
*follow along*, not *be impressed*. The deck's looseness lowers the audience's
guard. **Not** for boards, investors, or premium corporate — route those to
`micron-*`, `aurora-glass`, or the native premium themes.

It is a DISTINCT mode, not a recolour of `playful`. Playful = bold serif blocks
with chunky drop-shadows. Hand-drawn = handwriting + wobbly ink on paper.

## The look

- **Type:** `Caveat` (handwriting) for display, `Nunito` (clean rounded sans) for
  body. The research rule: a hand-drawn *heading* over a *clean, readable body* is
  what keeps it charming instead of childish. Never set body in the script font.
- **Paper:** warm `--bg` with a faint dot-grid (notebook), not a flat fill.
- **The wobble:** one SVG filter, `#rough` (feTurbulence + feDisplacementMap), turns
  straight strokes into hand-drawn ones. Apply it to **borders, underlines, arrows,
  and shapes only — NEVER to a text element** (displacement smudges glyphs). The
  pattern is a filtered `::before`/`::after` border behind crisp text.
- **Palette:** graphite ink + paper + ONE "pen" accent per slide (red / blue /
  green) + a highlighter (`--marker`) swipe behind a key word. Restraint is what
  separates a sketchnote from a doodle mess.

## Building blocks (in `tokens.css`)

| Class | What it draws |
|---|---|
| `.sketch` | a wobbly hand-drawn frame around any block (filtered `::before`) |
| `.sticker` | a small rounded hand-drawn label |
| `.hl` | a highlighter swipe behind a word (ink stays readable on it) |
| `.ul` | a hand-drawn underline stroke in the pen accent |
| `.pen` / `.pen-2` / `.pen-3` | red / blue / green pen text |

Diagrams: lay out `.node.sketch` boxes in a `.flow` row joined by inline rough
`<svg>` arrows (`<path>` + `filter="url(#rough)"`). See `example.html` slide 3.

## Hard rules

- One pen accent per slide; rotate across the deck. Marker highlight on at most one
  phrase per slide.
- Headlines stay ink (or ink on a marker swipe) so contrast clears AA — pen-coloured
  headline text can fail. Use `.pen` for body words and doodles, not headings.
- Keep the `#rough` filter `scale` low (~3–4); past that it reads as broken, not drawn.
- Still earns trust: real numbers, a "so what" heading, generous paper space.

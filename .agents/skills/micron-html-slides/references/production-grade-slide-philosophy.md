# Production-grade slide philosophy

Bundled production rules for Micron HTML decks.

## Core stance

HTML is the source. PDF and PPTX are exports.

The agent is a slide designer using HTML, not a web page builder. Slides must feel staged, large-scale, speaker-friendly, and inspectable at presentation distance.

## Hard gates

1. Confirm delivery early: HTML or PDF.
2. Confirm theme early: light or dark.
3. Keep architecture single-file.
4. For decks >=5 slides, make two visually different showcase slides before bulk production when timing allows.
5. Define deck grammar before building all slides.
6. Verify rendered output, not just code.

## Architecture

Use one single-file, no-build HTML deck. All slides live as `.slide` sections in that file. Split dense content into more slides, not more files.

## Deck grammar

A production deck needs a system:

- Background rhythm: primary field plus occasional divider/callout.
- Type rhythm: title, section, body, caption, metric.
- Layout set: 4-5 reusable slide types max.
- Visual protagonist: one main visual role per slide.
- Accent discipline: one intentional purple highlight, not decoration.
- Chrome: consistent eyebrow, slide number, footer, and spacing.

Good decks rotate visual protagonist:

- Big type
- Data/chart
- Image/product render
- Quote/callout
- Comparison
- Timeline/process
- Diagram/map

Do not let every page become title + bullets + card grid.

## Showcase workflow

For longer decks, choose two structurally different slides:

- cover + content
- data slide + conclusion
- section divider + knowledge point
- product hero + comparison

Build those first, screenshot, and use them to lock grammar: masthead, type scale, spacing, accent use, imagery treatment, and chart/table style.

## Content discipline

Every slide gets one memory point.

Use:

- 1 core message
- 3-4 support points max
- 1 visual protagonist
- real data/assets when available

Avoid:

- filler bullets
- invented metrics
- fake quotes
- decorative cards
- icons everywhere
- shrinking text to fit

If crowded, split. Whitespace is a design choice, not a vacancy to fill.

## Anti-slop rules

Production slides should not look like generic generated web UI.

Avoid:

- full-screen random purple gradients
- rounded card grids with accent borders
- bento layouts by default
- emoji decoration
- fake SVG illustrations
- cyber neon cliches
- overused icon blocks
- data as decoration

Prefer:

- strong hierarchy
- precise grid
- controlled color
- real imagery
- whitespace
- typography as structure

## Scale

Slides are read from distance.

- Body text floor: 24px on 1920x1080 equivalent
- Ideal body: 28-36px
- Title: 60-120px
- Section title: 80-160px
- Hero word: 180-240px when it is the visual protagonist

For responsive HTML, map these through `clamp()` but preserve the same hierarchy.

## Motion

Motion is for hierarchy and pacing, not spectacle.

Use:

- short reveal sequences
- stagger only where it clarifies reading order
- `cubic-bezier(0.16, 1, 0.3, 1)` as default ease-out
- transform/opacity only for performance
- reduced-motion fallback

Avoid:

- constant movement
- equal-timed mechanical reveals
- animation that delays reading
- decorative particles unless content requires it

## Verification

Before final, check:

- opens without console errors
- each slide fits 1280x720
- mobile/narrow viewport does not overlap
- no internal slide scroll
- typography remains readable
- nav works: keyboard, wheel, swipe/dots
- screenshots show intended hierarchy

Use visual judgment rubric:

- Philosophy: matches Micron system
- Hierarchy: clear first read
- Craft: precise alignment/spacing/color
- Function: every element earns place
- Originality: not generic template output

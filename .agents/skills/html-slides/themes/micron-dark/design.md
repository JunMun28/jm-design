# Micron slide design system

Source synthesis: merged from the two previous design drafts and realigned to
`/Users/wongjunmun/Downloads/micron-about-dark.original.pptx` (About Micron,
May 2026).
Purpose: single slide-generation reference for Micron-branded HTML/PPT slides.
Compiled: May 2026.

`micron-dark` is the single premium dark Micron theme — for executive,
vision, technical-review, rollout, and walkthrough decks. It uses the approved
photo-title cover, a fixed 1600×900 stage, and at least one official animated
Micron primary icon per deck.

---

## 1. Core direction

Micron identity centers on **Ahead of the curve**.

Slides should feel:

- Vibrant, bold, precise, fluid
- Premium enterprise technology
- Semiconductor / silicon-wafer inspired
- Clean, confident, high-contrast
- Futuristic, not playful
- Simple and impactful, not crowded

The current style anchor is the About Micron dark deck:

- Stark black canvas, not decorative dark blue or purple atmosphere
- Real Micron photography and product imagery, especially cleanroom,
  manufacturing, people at work, fabs, data centers, wafers, and device renders
- Big white Arial-style headlines with short, plain supporting copy
- Split photo covers: black title field on the left, image field on the right
- Title covers use the wide Micron + `Intelligence Accelerated` lockup, not
  the plain Micron wordmark
- The title image is the theme-owned high-resolution VR portrait asset, used
  as a real image on the right half of the stage, not as a flattened screenshot
  of a previous cover
- Dense facts are allowed when structured as rows, stat walls, comparison
  blocks, or image-led panels
- Purple appears as a precise Micron state, chart, map, or icon accent; it does
  not wash the whole deck

Use three brand metaphors:

| Metaphor | Visual expression |
|---|---|
| Silicon wafers | Metallic wordmark feel, vivid refracted color, macro wafer imagery |
| Constant motion | Curved forms, curve frame, diagonal gradients |
| Precision technology | Crisp type, sharp endings, exact grids, minimal decoration |

Main rule: one clear message per slide.

---

## 2. Slide defaults

Use this baseline for slide generation:

```css
canvas: 16 / 9;
base-size: 1600px 900px; /* fixed HTML stage; scale down in viewport */
font-family: "Micron Basis", Arial, Helvetica, sans-serif;
```

HTML `micron-dark` decks are fixed-stage by default, same model as
`micron-light`: every `.slide` is a viewport-sized letterbox, and every
visible slide surface is a centered `.slide-stage` at **1600 x 900**.
Do not stretch dark slides to arbitrary browser aspect ratios.
Use true black for both browser letterbox and the default slide stage. Add
purple/blue energy only through approved Micron gradients, official primary
icons, one data emphasis, or a source-backed map/chart state. Do not use
purple as normal text decoration.

### Lead with the answer (BLUF)

Executive decks are answer-first. Headline rule: every content-slide headline
is a full-sentence assertion stating the takeaway — with the key number on
data slides — never a topic label (`verify.py` fails bare-label and
template-meta titles on this theme).

Decision and approval decks additionally:

- Mark the deck root `data-deck-kind="decision"`.
- Place an **executive-summary slide directly after the cover**, marked
  `data-slide-kind="executive-summary"`. It states the recommendation, the
  quantified ask, and the 2–4 key supports — in the same order the deck's
  sections then prove them. `verify.py` enforces the slide-2 marker.
- Restate the ask on the closing slide with decision + owner + date. The
  close never introduces a new argument.
- State the recommendation in the first two titles; evidence comes after,
  not before.

Generated HTML decks must keep the shared verifier/runtime contract:

- Define `--font-display`, `--scale-ratio`, and `--col-count` in addition to
  Micron color tokens.
- Use `<main class="deck">`, one `.slide-stage` per slide, and `#overview`
  with `.ov-card` / `.ov-thumb` overview thumbnails.
- Use `.slide-progress-chip` for the hover-only progress label; do not invent
  alternate classes such as `.progress-chip`.
- Content-slide Micron marks should be supplied by a `.slide-stage::after`
  background image whose URL includes `micron-logo`, matching the shared
  verifier contract. Direct `<img>` logos may be used only as supplemental
  content, not as the only brand mark.

For Office / PowerPoint export, use **Arial** unless Micron Basis is guaranteed installed.

Recommended 1920 x 1080 equivalent grid:

- Outer margin: 96px
- Inner grid: 12 columns
- Column gap: 32px
- Section spacing: 48-72px
- Card / panel padding: 32-48px

Recommended 1280 x 720 HTML grid:

- Outer margin: 64px
- Inner grid: 12 columns
- Column gap: 24px
- Section spacing: 32-48px
- Panel padding: 24-32px

Every content slide may include:

- Eyebrow top-left, ALL CAPS, wide tracking
- Micron logo mark from the official asset, usually bottom-right

Do not add a repeated deck title / program label as a content-slide footer in
`micron-dark`. Keep the footer area quiet unless the slide needs the logo.
Do not add visible slide counters such as `02 / 06` on content slides; the
runtime already provides progress and navigation affordances.
Do not show a persistent top or bottom progress bar in normal presentation
screenshots.
The About Micron reference uses a quiet bottom-right logo/number treatment, not
web chrome. Do not show the right-edge dot rail by default for
`micron-dark`; keep slide navigation available through keyboard,
scroll, swipe, and Esc overview. Put visible slide progress in the top-right
presentation hotspot beside the `Present` button, hidden until hover/focus.

Keep body text left-aligned. Avoid centered body copy.
Keep meaningful slide captions and body text at least 24px on the 1600 x 900
stage. If tiles, roadmap phases, scorecards, or close notes feel tight, reduce
item count or split the slide instead of dropping to 21-23px type.

### Training / walkthrough decks in dark mode

Dark mode can make training decks feel premium, but it can also turn them into
text-only briefing slides. For enablement or non-technical walkthroughs, make
the "work" visible:

- Include at least one prompt-output specimen: plain-language request on one
  side, recognizable output artifact on the other.
- Replace abstract chips (`XL`, `SL`, `DA`) with miniature work artifacts:
  spreadsheet grid, slide thumbnail, data chart, memo/document excerpt.
- For process/build slides, show all steps in a dim state and highlight the
  current step; do not start with one card floating in empty space.
- Keep charts/tables off gradients. Use black panels, hairlines, and one
  accent state.
- Do not use the generic `screen-stack` UI block for `micron-dark` title
  slides. Title slides use the approved photo treatment only. Use real
  screenshots or data only inside content slides when they explain the work.

---

## 3. Color system

### Primary colors

Use black and white as primary backgrounds.

```css
:root {
  --micron-black: #000000;
  --micron-white: #ffffff;
  --micron-off-white: #f0f0ee;
  --micron-accent: #BD03F7;

  --gray-a: #262626;
  --gray-b: #4D4D4D;
  --gray-c: #8C8C8C;
  --gray-d: #BFBFBF;
  --gray-e: #E6E6E6;
  --gray-f: #F2F2F2;
}
```

Rules:

- Black: hero moments, covers, key points, image + text, KPI dashboards
- White: data, agenda, comparison, timeline, roadmap, teams, FAQ
- Off white: body copy over black or gradients
- Gray A / Gray F: color-blocking only
- Gray B-E: chart/supporting detail only, not large blocks
- Do not use gray as primary page background

Text colors:

| Background | Text |
|---|---|
| Black | White or off white |
| Gradient | White only |
| Image | White only |
| White | Black |
| Light gray up to 50% | Black |

### Accent color

Purple A `#BD03F7` is the main accent.

Only Micron purple is allowed when a purple hue is used:

```css
--micron-accent: #BD03F7; /* rgb(189, 3, 247) */
```

Do not use any other purple, violet, lavender, grape, blue-purple, magenta, or
near-purple value. This includes similar-looking gradient stops and translucent
variants based on a different RGB value. If purple is needed, use
`#BD03F7` / `rgb(189, 3, 247)` only; otherwise use black, white, or neutral
gray.

Use for:

- Navigation/progress indicators
- CTAs and button states when the deck includes true actions
- Hyperlinks over 10pt
- One Micron-related data point in a chart or graph
- One important data value, active step, or status marker when it is clearly
  functioning as data/UI state rather than prose decoration
- Official primary Micron icon details, using the icon assets as delivered

Never use accent:

- In primary headlines
- In secondary headlines, subheads, eyebrows, labels, or body copy unless it
  is an active hyperlink
- Across a whole headline
- Across whole sections of copy
- Over gradients
- As general text color
- As repeated decoration
- As a content background, card fill, or CTA fill
- As a purple-tinted panel, row, card, table, chart, or slide background
- As a panel/card/table/selection border

This rule intentionally overrides earlier visual experiments that colored one
headline keyword purple. Micron's current brand guidance says not to use the
accent color in headlines or non-link text. For a premium executive slide,
make the headline white/off-white and let purple appear in data, maps, charts,
approved gradients, or official icons.

Do not use translucent purple fills such as `rgba(189,3,247,...)`,
`color-mix(... var(--micron-accent) ...)`, or purple gradients as background
surfaces. Use black, white, or neutral gray surfaces. Purple may mark one
active data point, an approved gradient/map/chart state, or an official icon
detail only.

---

## 4. Data visualization colors

Charts must use black or white backgrounds. Never use gradients behind charts.
For `micron-dark`, data visualization is monochrome plus the Micron purple
accent only. Do not introduce blue, green, yellow, red, gold, cyan, or
arbitrary category colors for bars, rows, points, fills, or status chips.

```css
:root {
  --dv-highlight: #BD03F7;
  --dv-base: #BFBFBF;
  --dv-secondary: #8C8C8C;
  --dv-tertiary: #4D4D4D;
  --dv-track: #262626;
}
```

Simple charts:

- Base data: Gray D `#BFBFBF`
- Secondary data: Gray C `#8C8C8C`
- Tertiary or de-emphasized data: Gray B `#4D4D4D`
- Track / remainder: Gray A `#262626`
- Single active constraint, selected state, or key positive highlight:
  Purple A `#BD03F7` on one important chart bar or the text label/value.
  Do not combine purple fill and purple border on the same object.
- In tables, matrices, comparison grids, and row-based decision frames, do not
  use purple left borders or inset selection stripes. If a cell needs emphasis,
  use a neutral charcoal fill, stronger white text, or a small data mark that
  is clearly tied to a chart/value.
- Do not use multiple gray shades inside one ranked bar chart unless the
  shades represent explicit groups. If bar length already encodes magnitude,
  keep all non-highlight bars the same gray so darker gray is not mistaken for
  lower importance.
- Pie charts should read as executive allocation or mix charts, not colorful
  dashboards: use a thin donut or clean pie, direct labels or a nearby label
  rail, neutral gray slices, and exactly one Micron-purple slice for the key
  decision state. Keep the center/annotation white or gray; do not put purple
  in the chart title or legend text.

Complex charts:

- Use ECharts for any chart with axes, target lines, annotations, waterfalls,
  Pareto, Sankey/process flow, heatmap, multiple series, or responsive label
  placement. Hand-authored SVG is acceptable only for tiny static primitives.
- Prefer small multiples, labels, ordering, grouping, stroke weight, or gray
  shade differences over categorical color.
- Use the purple accent for one visual protagonist only: either one chart bar
  or one text/value highlight. Supporting panels and borders stay monochrome.
- If many independent series need unique colors to be understood, the content
  is too dense for `micron-dark`; split the slide or use another approved
  theme.

---

## 5. Gradients

Gradients are optional, not the default. The About Micron dark reference uses
mostly black, charcoal, photography, product renders, and occasional strong
purple blocks. Use a gradient only for chapter dividers, abstract memory or
wafer moments, or a single high-energy transition.

When a gradient is used, use one gradient per slide. All gradients travel
diagonally corner-to-corner at 135deg. Text over gradients is white only.
For HTML decks, gradients must still satisfy the theme verifier's purple rule:
any purple stop must be exactly `#BD03F7`. Do not use near-purple stops such
as `#9601c5`, `#c605d3`, `#8b16f4`, or pink/magenta stops as a shortcut for
the About Micron chapter-dividers. If a richer brand gradient is needed, use
the source image/gradient as an approved asset rather than hand-authoring
off-palette CSS colors.

Official gradient tokens:

```css
:root {
  --grad-hero: linear-gradient(135deg, #244dff 0%, #BD03F7 100%);
  --grad-blue-dark: linear-gradient(135deg, #0156d5 0%, #012152 50%, #14151a 100%);
  --grad-bright-2: linear-gradient(135deg, #244dff 0%, #BD03F7 100%);
  --grad-bright-3: linear-gradient(135deg, #244dff 0%, #BD03F7 100%);
  --grad-bright-4: linear-gradient(135deg, #01a02b 0%, #017dae 50%, #2b42f7 100%);
  --grad-bright-1: linear-gradient(135deg, #fac30b 0%, #f58c29 50%, #e8156b 100%);
}
```

Usage:

| Gradient | Use |
|---|---|
| Hero | Default single-gradient choice |
| Blue dark | Dark tech / enterprise hero |
| Bright 2 | Innovation / motion |
| Bright 3 | Closing / high-energy chapter |
| Bright 4 | Sustainability / manufacturing progress |
| Bright 1 | Headlines only; no text in yellow zone |

Rules:

- Zero or one gradient per slide
- No vertical gradients
- No hard color breaks
- No black text on gradients
- No charts on gradients
- No gradient behind dense body copy
- No accent color over gradients
- Headline gradient fill only for headlines <=5 words
- Do not use individual gradient stop colors as standalone colors

---

## 6. Typography

Primary typeface: Micron Basis.
System fallback: Arial.

```css
:root {
  --font-primary: "Micron Basis", Arial, Helvetica, sans-serif;
  --font-system: Arial, Helvetica, sans-serif;
  --font-mono: "JetBrains Mono", "Courier New", monospace;
}
```

Optional web fallback if Micron Basis is unavailable:

```css
font-family: "Micron Basis", "Plus Jakarta Sans", Arial, Helvetica, sans-serif;
```

### Type scale

For 1280 x 720 slides:

```css
:root {
  --type-eyebrow: 11px;
  --type-hero: 64px;
  --type-h2: 44px;
  --type-h3: 32px;
  --type-subtitle: 22px;
  --type-body: 16px;
  --type-body-sm: 13px;
  --type-caption: 11px;
  --type-mono-sm: 10px;

  --track-eyebrow: 0.18em;
  --track-headline: -0.025em;
  --track-body: 0;
}
```

For 1920 x 1080 slides:

- Hero title: 56-72px
- Section title: 40-52px
- Slide title: 32-44px
- Subtitle: 20-26px
- Body: 16-20px
- Caption: 12-14px
- Metric number: 72-120px

### Type rules

| Element | Rule |
|---|---|
| Eyebrow | ALL CAPS, wide tracking, no punctuation |
| Headline | Sentence case, bold, tight leading, no end punctuation |
| Secondary headline | Sentence case, regular/light, tight leading |
| Subtitle | Sentence case, bold, 110% leading |
| Body | Sentence case, regular, 125-155% leading, left-aligned |
| Bullets | Consistent punctuation |
| Large numbers | Heavy/black weight, data or chapter use only |

Enforced:

- Sentence case everywhere except eyebrows
- No Title Case headlines
- No centered body copy
- No all-caps headlines/body
- No more than 2-3 weights per slide
- No accent-colored headline words or phrases
- No data-viz colors in text
- No Calibri, Aptos, Roboto, or decorative fonts

---

## 7. Layout principles

Use simple, intentional compositions.

Rules:

- One main message per slide
- 2-4 content blocks maximum
- 35-50% negative space on executive slides
- Dashboard slides still need air: use generous gaps between KPI rows, charts,
  and callouts; avoid making every panel touch a tight invisible grid.
- If a KPI dashboard needs more than one metric row plus two charts, split it.
  Do not shrink gutters, labels, or row spacing just to keep everything on one
  slide.
- KPI cards need internal vertical rhythm: label, value, and note must have
  visible separation. Do not stack label/value/note on near-touching baselines
  just to save height.
- Panel and chart title labels need the same rhythm: leave clear space between
  the label and the first row, chart mark, table header, matrix, or body text.
- Strong dark/light contrast
- Left-align type and content
- Use sharp or near-square containers
- Avoid bubbly cards
- Avoid generic dashboard cards as the default executive pattern. Prefer
  source-like stat walls, hairline comparison grids, image-led panels, maps,
  product/evidence panels, and dense corporate proof tables.
- Avoid dense paragraphs
- Do not nest cards inside cards
- Do not decorate with random orbs, blobs, or generic abstract shapes

### Executive visual standard

Do not hand-draw diagrams, curves, fake maps, or decorative SVG/HTML visuals
for `micron-dark`. The About Micron reference favors real assets and
plain structured information: photos, product renders, stat walls, comparison
tables, timelines, maps, and chart panels. If a slide needs a complex visual,
use a real asset, an official Micron icon, a source-backed chart/table, or a
proven diagram/chart runtime. If those are not available, keep the slide
typographic and structured rather than inventing artwork.

The May 2026 About Micron deck shows these reusable slide grammars:

- Black fact-wall slides with charcoal stat cells and short white labels.
- Black agenda / content slides with a simple left title field and a right
  hairline list. The slide should read as real deck content, not a template
  annotation.
- Black editorial slides with one right-side photo, map, product render, or
  data object carrying the visual weight.
- Gradient section dividers with only a large white section title and the small
  Micron logo at the lower right.
- In fixed-stage HTML, the divider gradient must be applied to `.slide-stage`
  (for example `.divider .slide-stage { ... }`), not only to the outer
  `.slide` viewport wrapper. Otherwise the overview or exported slide can
  silently regress to a black stage.
- If the runtime clones `.slide-stage` into overview thumbnails, include an
  overview clone rule too, such as `.ov-thumb .clone.divider { background:
  var(--grad-hero); }`, so the thumbnail matches the live slide.
- Black image grids that use real photography, product imagery, or official
  Micron icons. Do not fake the photo-grid look with purple glow tiles.
- Black hierarchy / architecture slides that use plain editable geometry,
  hairlines, and one active state. Do not add neon artwork around the diagram.
- Leadership and team slides should use real headshots when available. If real
  people assets are not available in a mock, use clean text rows or restrained
  placeholder initials, but never let names, titles, and avatars collide.
- ESG / sustainability / accountability slides should use compact metric walls:
  charcoal cells, large white numbers, and short labels.
- Product portfolio slides on black with real chip/module renders, not
  abstract neon UI mockups.
- Appendix or dense evidence slides that stay mostly black/charcoal, use tight
  table rows, and keep purple to one selected data state.
- Financial-results slides in the About Micron deck are colorful infographic
  slides, not muted dashboards. Use the slide 6 / slide 7 grammar from
  `micron-about-dark.original.pptx`: huge blue-to-green gradient revenue
  number, large magenta/gray revenue-by-technology donut with leader lines,
  a vertical revenue-by-business-unit stacked bar using green, cyan,
  magenta/pink, and blue segments, a dark gray operating-results column, and
  a far-right CEO quote panel. Do not shrink this into small metric cards.
- For source-backed finance charts, color can encode the source categories.
  Micron purple still uses `#BD03F7`, but the finance infographic may include
  non-purple green, cyan, and blue category colors visible in the reference.
  Keep those colors in charts and large numeric treatments only; do not use
  them as decorative prose colors.
  Small Q/Q and Y/Y annotations in these finance charts may use
  `.chart-detail` so they can stay source-like and compact without being
  treated as primary room-readability copy by the verifier.

Avoid generic VR, chatbot, sci-fi, or neon-dashboard imagery beyond the
theme-owned title image unless it is part of the actual source material. Dark
executive should feel like the Micron About deck first, then like an AI or
strategy deck second.

Do not put theme or layout commentary on the slide canvas. Visible phrases
such as "pattern example", "reference-style", "this mirrors the PPTX", "use
this as a placeholder", or "example slide type" are review notes, not deck
content. Keep that information in comments, docs, or `data-slide-kind`; the
rendered slide should read like a plausible executive presentation.

Every `micron-dark` deck must include at least one official Micron
primary animated icon. Use `../micron-icons/bin/find-icon.py` and prefer
`primary/mp4/rev/*.mp4` for dark executive decks. Animated icons should be a
title/hero/transition or one focused visual-protagonist moment, not routine
decoration. PNG primary icons are acceptable only as supporting semantic icons;
they do not replace the required animated primary MP4.

Color blocking:

- Only Gray A and Gray F
- Keep at least half of the layout black or white
- Sharp square corners
- No rounded corners on color-blocking fields

---

## 8. Slide type recipes

**Exhibit-led content slides are the default.** Before reaching for the
generic recipes below, check whether the slide's message maps to a
consulting exhibit from `themes/micron-dark/exhibits.md`:

| The title says… | Build |
|---|---|
| Decomposition of a change or gap | Waterfall / bridge |
| KPI decomposes to one binding driver | Driver tree |
| Prioritisation of options | 2×2 matrix |
| Choice across criteria | Harvey-ball option table |
| Trend with an inflection to explain | Annotated trend |
| Phased plan with exit criteria | Gated roadmap |

Exhibit slides follow one anatomy: mono eyebrow → action title with the
key number → one `figure.exhibit` as protagonist → a "SO WHAT" rail with
the implication → a fineprint source line. Plain bullets, text rows, and
KPI walls are the fallback for slides whose message fits no exhibit —
not the default.

| Slide type | Background | Notes |
|---|---|---|
| Cover / title | Black left field + right photo | Use the official split photo cover, not abstract AI art |
| Section divider | Black, full-bleed photo, or approved gradient | White headline only; no visible template notes |
| Agenda / TOC | Black | Simple hairline list, white text, one active row max |
| Bullets / key points | Black | Short points, strong hierarchy, no paragraph walls |
| Stats / metrics | Black or charcoal | Big number, short label, one accent max |
| Comparison / 2-column | Black or charcoal | Thin dividers, no heavy boxes, no purple selection border |
| Quote / callout | Black | Large type, sparse layout |
| Image + text | Black | Real photo/product/icon carries visual weight |
| Image / use-case grid | Black | Real images or official icons; no purple glow tiles or fake neon panels |
| Timeline / process | Black or charcoal | Thin lines, precise markers |
| Data viz / chart | White or black | Never gradient |
| KPI dashboard | Black | Controlled contrast, minimal colors |
| Architecture / hierarchy | Black | Plain editable geometry, hairlines, one active layer |
| Team / people | Black or charcoal | Real headshots preferred; placeholders must not look like product icons |
| Roadmap | Black or charcoal | Clear phases, subtle dividers |
| FAQ / Q&A | Black or charcoal | Dense but clean |
| Sustainability / scorecard | Black or charcoal | Compact metric wall with large white numbers |
| Closing | Black, photo, or approved gradient | White type only |

---

## 8.1 Title templates

Read `themes/micron-dark/title-templates.md` before creating a new
`micron-dark` cover slide. `micron-dark` now has one approved cover:
`photo-title`, using
`themes/micron-dark/assets/title-image.jpeg`.

Always use that high-resolution photo on title slides. Generated decks copy it
to `assets/micron-dark-title-image.jpeg`; do not substitute a PNG screenshot,
browser capture, or low-resolution crop. The image sits on the right half with
`object-fit: cover` and a center/right crop that keeps the headset and face
sharp, with a hard black title field on the left. Do not use a full-slide photo
wash, wafer portals, divider bands, grain waves, silk waves, screen-stack UI,
shader fields, or abstract gradient art for `micron-dark` title
slides.

Title slides should read like the May 2026 About Micron cover: large white H1
on the left, date or context under it, and the Micron + `Intelligence
Accelerated` lockup anchored bottom left. Do not add a visible slide number,
accent rule, decorative kicker, or subtitle unless the user explicitly asks
for a cover with more context.

Title-slide context labels are larger than content-slide eyebrows: use
28-34px, line-height 1, gray/off-white text, and generous spacing from the H1.
Content-slide eyebrow labels need visible breathing room: use line-height 1
and at least 20px bottom spacing before the content title. Do not set eyebrow
labels in purple unless they are real navigation/UI state.

Those alternate title treatments belong to `micron-dark`.

---

## 8.2 Stage geometry

Use the `.slide-stage` wrapper for all new `micron-dark` HTML decks.

```css
:root {
  --letterbox: #000000;
  --stage-width: 1600px;
  --stage-height: 900px;
  --stage-scale: 1;
  --stage-scaled-width: 1600px;
  --stage-scaled-height: 900px;
}

.slide {
  width: 100vw;
  height: 100dvh;
  overflow: hidden;
  position: relative;
  background: var(--letterbox);
}

.slide-stage {
  position: absolute;
  left: calc((100vw - var(--stage-scaled-width)) / 2);
  top: calc((100dvh - var(--stage-scaled-height)) / 2);
  width: var(--stage-width);
  height: var(--stage-height);
  transform: scale(var(--stage-scale));
  transform-origin: top left;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--micron-black);
}
```

The controller must wrap each slide's children in `.slide-stage` before
`new SlidePresentation()`, then set `--stage-scale`,
`--stage-scaled-width`, and `--stage-scaled-height` on resize.
When wrapping, copy non-`slide` parent classes onto the stage. The overview
runtime clones `.slide-stage`; without those copied classes, parent-scoped
layouts such as `.title-slide`, `.divider`, `.divider-slide`, or `.close` can
look correct in live presentation mode but lose gradients, title positioning,
or other styling in overview thumbnails.

```js
slide.classList.forEach((name) => {
  if (name !== "slide") stage.classList.add(name);
});
```

Overview thumbnails must also use this contract:

- `.ov-thumb { aspect-ratio: 16 / 9; }`
- clone `slide.querySelector(":scope > .slide-stage") || slide`
- size the clone to `1600px x 900px`
- scale by `thumb.clientWidth / 1600`

This keeps the overview cards visually identical to the slide canvas instead
of showing viewport letterbox inside each thumbnail.

---

## 9. Curve frame

The curve frame is Micron's signature image container.
It is derived from the counters of the `m` and `o` in the wordmark.

Use it as a large organic portal shape:

- Large convex arc on one side
- Smaller concave notch on opposing corner
- No stroke
- No complete letterform

Use only for hero moments:

- Cover
- Section divider
- Major visual storytelling slide
- Case study hero image

Rules:

- One curve frame per slide
- Do not crop so curvature disappears
- Do not add strokes/outlines
- Do not put the logo inside it
- Do not substitute circles, rectangles, or hexagons
- Do not crop out a subject's face

Image / gradient pairing:

- Dark photo: bright gradient
- Light photo: Hero or Blue dark gradient
- Bright colorful wafer image: black background

---

## 10. Imagery

Use imagery to speak to the copy, not as filler.

Preferred styles:

- Real Micron cleanroom and manufacturing photography
- Real Micron people-at-work photography
- Fabs, data centers, labs, and other operational settings
- Product renders on black or white fields
- Macro semiconductor wafer texture
- Vivid purple / blue / cyan reflections
- Cinematic lighting
- Glossy silicon surfaces
- Manufacturing environments
- Heroic product renders
- Diverse people engaged in technology contexts
- Futuristic AI-scale visuals tied to memory/storage

AI image prompt baseline:

```text
Abstract macro semiconductor wafer texture, vivid purple-blue-cyan reflections,
cinematic lighting, glossy silicon surface, precise high-tech atmosphere,
black background, premium enterprise technology style.
```

Do:

- Use cinematic, illuminated photos
- Keep copy in dark/quiet image areas
- Pair colorful wafer imagery with black
- Choose images that reinforce the slide message

Don't:

- Use generic stock imagery
- Use blurred/disengaged subjects
- Apply artificial random color overlays
- Place multiple liquiform images side by side
- Place bright wafer imagery on bright gradients

---

## 11. Iconography

Use official Micron icons from the standalone `micron-icons` skill when a deck
needs iconography. Call `../micron-icons/bin/find-icon.py` rather than guessing
filenames or drawing ad hoc symbols. For this dark theme, `--theme
micron-dark` selects `rev` icons by default.

Use simple geometric icons.

Primary icons:

- Vibrant, kinetic, brand-level
- Backgrounds: black or white only
- Do not place on gradients

Secondary icons:

- Monochrome linework, black or white
- Utilitarian
- Can sit on black, white, gray, or gradient

Use icons for:

- Process steps
- Categories
- Product capabilities
- Workflow nodes
- Slide navigation markers

Scale:

- Use icons as large semantic anchors, not tiny utility pictograms.
- KPI cards and executive summary cards should size primary icons around
  64-84px on the 1600x900 stage, usually top-right or as a large side anchor.
  The icon should support the metric, not crowd the label or compete with the
  number.
- Small 24-48px icons are allowed only for dense navigation, captions, or
  non-content chrome.
- Keep repeated icon sets consistent in family, polarity, size, and placement.

Avoid:

- Clipart
- Cartoon icons
- Multicolor icon packs
- Overly thick strokes
- Combining icons into one symbol
- Icons inside tables or simple charts

---

## 12. Charts, tables, infographics

Approved chart types:

- Pie chart: thin segments, direct labels
- Bar chart: thin bars, no 3D
- Line graph: clean precise lines
- Area chart: subtle fill
- Timeline chart
- Bubble chart
- Flow chart
- Map
- Data overlay

Chart rules:

- Use ECharts for non-trivial charts; use inline SVG only for tiny static
  primitives such as one sparkline, one bar strip, or one simple gauge.
- Label directly when possible
- Minimal legends
- Thin bars/lines
- No 3D effects
- No gradients inside chart marks
- No thick bars
- No icons as data values
- No data colors in text/headlines

Tables:

- Neutral grays only
- Minimal lines
- Subtle dividers
- Left-align all text
- Accent only for the most important cell
- No icons
- No data-viz colors
- End with gray row or black rule

Infographics:

- One clear message
- Big images or big numbers
- Strong positive/negative space
- Integrated labels and data
- Do not overcrowd
- Do not use too many colors

---

## 13. Logo rules

Use official logo assets only.

Variants:

| Variant | Use |
|---|---|
| Silicon logo dark | White backgrounds only, digital |
| Silicon logo light | Black backgrounds only, digital |
| White one-color | Gradients, black, full-bleed photography, small use |
| Black one-color | White backgrounds when silicon cannot reproduce |

Rules:

- Clear space = height of the `i` stem in the wordmark
- Place top/bottom left or right with consistent margin
- Center only when logo is primary message
- Include registered mark at least once per touchpoint when appropriate
- Minimum digital logo with trademark: 200px wide

Never:

- Recolor, stretch, distort, or add effects
- Lock up with icons/program marks
- Combine the wordmark with separate `m` symbol
- Put inside a curve frame
- Let graphics enter clear space

---

## 14. CSS components

```css
.slide {
  width: 1280px;
  height: 720px;
  position: relative;
  overflow: hidden;
  font-family: var(--font-primary);
  color: var(--micron-black);
  background: var(--micron-white);
}

.slide.dark {
  color: var(--micron-white);
  background: var(--micron-black);
}

.eyebrow {
  font-size: var(--type-eyebrow);
  font-weight: 500;
  letter-spacing: var(--track-eyebrow);
  text-transform: uppercase;
  line-height: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--gray-d);
}

.divider .eyebrow,
.gradient .eyebrow,
.image-hero .eyebrow {
  color: var(--micron-white);
}

.eyebrow .rule {
  width: 24px;
  height: 1.5px;
  border-radius: 1px;
  flex-shrink: 0;
  background: currentColor;
}

.headline {
  font-size: var(--type-hero);
  font-weight: 700;
  letter-spacing: var(--track-headline);
  line-height: 1.05;
  max-width: 760px;
}

.body {
  font-size: var(--type-body);
  font-weight: 400;
  letter-spacing: 0;
  line-height: 1.55;
  max-width: 560px;
}

.btn-accent {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 3px;
  background: transparent;
  color: var(--micron-accent);
  border: 1px solid var(--gray-b);
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
}

.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 3px;
  background: transparent;
  color: var(--micron-white);
  border: 1px solid var(--micron-white);
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
}
```

HTML slide scaling:

```js
function scaleSlide(wrapper, slide) {
  const scaleX = wrapper.clientWidth / 1280;
  const scaleY = wrapper.clientHeight / 720;
  const scale = Math.min(scaleX, scaleY);
  slide.style.transform = `scale(${scale})`;
  slide.style.transformOrigin = "top left";
  slide.style.left = `${(wrapper.clientWidth - 1280 * scale) / 2}px`;
  slide.style.top = `${(wrapper.clientHeight - 720 * scale) / 2}px`;
}
```

---

## 15. Generation checklist

Always:

- Black or white primary background
- One message per slide
- Sentence case headlines
- Left-aligned body copy
- One gradient max
- 135deg gradient direction
- White text on gradients/images
- Accent color used minimally and intentionally
- Accent appears in official primary icons, approved gradients, maps, charts,
  or one data emphasis; not as persistent web chrome, prose decoration, or card
  border
- Charts on white or black only
- Curve frame only for hero moments
- Arial fallback for PowerPoint

Never:

- Black text on gradient
- Accent in headlines, subheads, eyebrows, labels, or body copy
- Multiple gradients on one slide
- Charts on gradients
- Gradient-filled body/callout/CTA text
- Purple content backgrounds, CTA fills, selection borders, or card borders
- Persistent top progress bars or always-visible navigation dots in normal
  slide screenshots
- Right-edge dot rails for `micron-dark`; use the hidden top-right
  hover/focus progress chip beside `Present` instead
- Gray as primary background
- Content-heavy black slides
- Centered body copy
- Title Case headlines
- More than 2-3 type weights
- Rounded color-block fields
- Thick chart bars
- 3D charts
- Data colors in tables/text
- Icons inside tables/simple charts
- Logo inside curve frame

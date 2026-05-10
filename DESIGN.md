# Micron slide design system

Source synthesis: merged from the two previous design drafts.
Purpose: single slide-generation reference for Micron-branded HTML/PPT slides.
Compiled: May 2026.

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
base-size: 1280px 720px; /* scale up/down for output */
font-family: "Micron Basis", Arial, Helvetica, sans-serif;
```

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

Every slide may include:

- Eyebrow top-left, ALL CAPS, wide tracking
- Slide number bottom-left or top-left, small mono
- Footer bottom-right: `Micron Technology`
- Tiny accent dot beside footer

Keep body text left-aligned. Avoid centered body copy.

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

Use for:

- One CTA
- One active state
- One key number
- One Micron-positive data highlight
- One selected step/tab

Never use accent:

- In headlines
- Across whole sections of copy
- Over gradients
- As general text color
- As repeated decoration

---

## 4. Data visualization colors

Charts must use black or white backgrounds. Never use gradients behind charts.

```css
:root {
  --dv-purple-a: #BD03F7;
  --dv-blue-a: #2044FF;
  --dv-green-a: #01AB01;
  --dv-purple-b: #FF8CFF;
  --dv-blue-b: #32C8FF;
  --dv-green-b: #78F05A;
  --dv-gold-b: #FFBE1E;
  --dv-purple-c: #FCCAFA;
  --dv-blue-c: #96FAFC;
  --dv-green-c: #B6FCB4;
  --dv-gold-c: #FFEC32;

  --semiotic-green: #00891C;
  --semiotic-yellow: #FFDE00;
  --semiotic-red: #EC0B00;
}
```

Simple charts:

- Base data: Gray D `#BFBFBF`
- Secondary data: Gray C `#8C8C8C`
- Highlight: Purple A `#BD03F7`
- Comparison: Blue A `#2044FF`

Complex charts:

- Use related families: purple, blue, green, gold
- Avoid same-grade tints next to each other
- Alternate brightness for separation

Semiotic colors are status-only:

- Green: do / success
- Yellow: caution
- Red: do not / error

Never use semiotic colors as data series colors.

---

## 5. Gradients

Use one gradient per slide.
All gradients travel diagonally corner-to-corner at 135deg.
Text over gradients is white only.

Official gradient tokens:

```css
:root {
  --grad-hero: linear-gradient(135deg, #434c5c 0%, #2c013b 55%, #9601c5 100%);
  --grad-blue-dark: linear-gradient(135deg, #0156d5 0%, #012152 50%, #14151a 100%);
  --grad-bright-2: linear-gradient(135deg, #a60cf6 0%, #6027f5 50%, #0b5efe 100%);
  --grad-bright-3: linear-gradient(135deg, #e70470 0%, #e70c55 50%, #c605d3 100%);
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

- One gradient per slide
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
- No accent-colored headlines
- No data-viz colors in text
- No Calibri, Aptos, Roboto, or decorative fonts

---

## 7. Layout principles

Use simple, intentional compositions.

Rules:

- One main message per slide
- 2-4 content blocks maximum
- 35-50% negative space on executive slides
- Strong dark/light contrast
- Left-align type and content
- Use sharp or near-square containers
- Avoid bubbly cards
- Avoid dense paragraphs
- Do not nest cards inside cards
- Do not decorate with random orbs, blobs, or generic abstract shapes

Color blocking:

- Only Gray A and Gray F
- Keep at least half of the layout black or white
- Sharp square corners
- No rounded corners on color-blocking fields

---

## 8. Slide type recipes

| Slide type | Background | Notes |
|---|---|---|
| Cover / title | Black + one gradient panel or curve frame | Use strong hero image or wafer abstract |
| Section divider | Full-bleed gradient | White headline only |
| Agenda / TOC | White | Simple list, black text |
| Bullets / key points | Black | Short points, strong hierarchy |
| Stats / metrics | White | Big number, one accent max |
| Comparison / 2-column | White | Thin dividers, no heavy boxes |
| Quote / callout | Black | Large type, sparse layout |
| Image + text | Black | Use curve frame for image portal |
| Timeline / process | White | Thin lines, precise markers |
| Data viz / chart | White or black | Never gradient |
| KPI dashboard | Black | Controlled contrast, minimal colors |
| Team / people | White | Clean, structured |
| Roadmap | White | Clear phases, subtle dividers |
| FAQ / Q&A | White | Dense but clean |
| Closing | Hero or Bright 3 gradient | White type only |

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
  background: var(--micron-accent);
  color: var(--micron-white);
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
- Accent color used once, intentionally
- Charts on white or black only
- Curve frame only for hero moments
- Arial fallback for PowerPoint

Never:

- Black text on gradient
- Accent in headlines
- Multiple gradients on one slide
- Charts on gradients
- Gradient-filled body/callout/CTA text
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

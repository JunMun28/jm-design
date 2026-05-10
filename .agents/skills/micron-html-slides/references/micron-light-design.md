# Micron light slide design system

Purpose: light-theme Micron slide-generation reference.
Compiled: May 2026.

---

## 1. Core direction

Light theme should feel:

- Bright, precise, premium
- Clean enterprise technology
- Semiconductor / wafer inspired, but restrained
- High clarity, high negative space
- Data-ready and executive-friendly
- White-first, not gray-first

Main rule: use white as the primary field. Use black for text. Use purple once.

---

## 2. Slide defaults

```css
canvas: 16 / 9;
base-size: 1280px 720px;
font-family: "Micron Basis", Arial, Helvetica, sans-serif;
```

For PowerPoint export: use Arial unless Micron Basis is installed.

1280 x 720 grid:

- Outer margin: 64px
- 12 columns
- Column gap: 24px
- Section spacing: 32-48px
- Panel padding: 24-32px

1920 x 1080 grid:

- Outer margin: 96px
- 12 columns
- Column gap: 32px
- Section spacing: 48-72px
- Panel padding: 32-48px

Slide anatomy:

- Eyebrow top-left, ALL CAPS
- Main title left-aligned
- Footer bottom-right: `Micron Technology`
- Slide number bottom-left
- Tiny purple accent dot near footer

---

## 3. Color system

White is default.

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

Use:

- Background: White
- Text: Black
- Muted labels: Gray B or Gray C
- Dividers: Gray E
- Panels: Gray F
- Dark callout panels: Black or Gray A
- Accent: Purple A `#BD03F7`

Never:

- Use Gray F as full-slide background
- Use purple as headline color
- Use colored body text
- Use many accent marks
- Use gradient behind body copy

---

## 4. Light-theme layout rules

Default composition:

- White canvas
- Black headline
- Gray F content field when grouping needed
- Thin Gray E dividers
- One purple highlight
- Plenty of whitespace

Good light slide patterns:

- White background + large black headline + small chart/table
- White background + Gray F right-side panel
- White background + thin timeline
- White background + 2-column comparison
- White background + black metric number
- White background + product render on Gray F
- White background + small gradient strip or chapter marker

Avoid:

- Full dark hero treatment
- Heavy black blocks
- Purple-dominant layouts
- Decorative gradients
- Floating card stacks
- Nested cards
- Rounded color-block fields

---

## 5. Typography

```css
:root {
  --font-primary: "Micron Basis", Arial, Helvetica, sans-serif;
  --font-system: Arial, Helvetica, sans-serif;
  --font-mono: "JetBrains Mono", "Courier New", monospace;

  --type-eyebrow: 11px;
  --type-hero: 60px;
  --type-h2: 42px;
  --type-h3: 30px;
  --type-subtitle: 22px;
  --type-body: 16px;
  --type-body-sm: 13px;
  --type-caption: 11px;

  --track-eyebrow: 0.18em;
  --track-headline: -0.025em;
}
```

Rules:

- Sentence case headlines
- Eyebrows ALL CAPS only
- Left-align all text
- Black headline on white
- Body Gray A / Black
- Captions Gray B / Gray C
- No Title Case
- No centered body copy
- No accent-colored headline
- Max 2-3 weights per slide

---

## 6. Gradients in light theme

Gradients are accents, not default backgrounds.

Use gradients for:

- Small top or side strip
- Chapter divider
- Edge marker
- Large number fill only if <=5 words equivalent
- Tiny visual energy panel

Do not use gradients for:

- Main content background
- Body copy area
- Tables
- Charts
- CTAs
- Dense slides

Official gradients:

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

Gradient rules:

- One gradient max per slide
- 135deg only
- White text only on gradient
- No black text on gradient
- No accent over gradient
- No chart on gradient

---

## 7. Data visualization

Light theme is preferred for data slides.

Chart background: White.
Chart grid/dividers: Gray E.
Base data: Gray D.
Suppressed data: Gray C.
Highlight: Purple A, once.

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

Rules:

- Thin bars
- Thin lines
- Direct labels
- Minimal legends
- No 3D
- No gradients inside charts
- No icons as data
- No data colors in text
- Do not use C tints on white backgrounds
- Semiotic colors only for status

Tables:

- White background
- Black text
- Gray E row dividers
- Gray F row highlight if needed
- Purple only for one key cell
- Left-align text
- No icons
- No colored table fills

---

## 8. Slide type recipes

| Slide type | Light-theme treatment |
|---|---|
| Cover | White field, black headline, product/wafer image, small gradient edge |
| Section divider | White with oversized black type + gradient strip |
| Agenda | White, numbered list, Gray E dividers |
| Key points | White, 3-4 text blocks max |
| Metric | White, huge black number, one purple highlight |
| Comparison | White, two columns, thin divider |
| Quote | White, large black quote, Gray C attribution |
| Image + text | White, image in curve frame or Gray F field |
| Timeline | White, thin Gray D line, purple active step |
| Data viz | White, gray base, one highlight |
| KPI dashboard | White, compact panels, black numbers |
| Roadmap | White, clear phase columns |
| FAQ | White, dense but spaced |
| Closing | White, black message, small gradient footer |

---

## 9. Imagery

Light theme imagery should be crisp and inspectable.

Best choices:

- Product render on white or Gray F
- Manufacturing environment, bright and precise
- Light people imagery, natural but cinematic
- Macro wafer image as cropped accent
- Abstract material image inside curve frame

Avoid:

- Dark cinematic image as full slide default
- Blurred atmospheric image
- Busy image under text
- Bright wafer image beside bright gradient
- Generic stock photos

AI prompt baseline:

```text
Clean premium semiconductor technology visual, bright white studio lighting,
precise silicon wafer detail, subtle purple-blue reflections, crisp product
or manufacturing atmosphere, minimal enterprise presentation style.
```

---

## 10. Curve frame

Use curve frame sparingly in light theme.

Use for:

- Cover image portal
- Product/wafer hero image
- One major visual slide

Rules:

- One curve frame per slide
- No stroke
- No logo inside
- Do not crop away curvature
- Do not substitute circle/rectangle
- Put on white or Gray F
- Use black background only if image needs contrast

---

## 11. Iconography

Light theme icon style:

- Black line icons
- Thin geometric strokes
- Simple functional forms
- Purple only for selected/active state

Use icons for:

- Process steps
- Categories
- Capabilities
- Navigation markers

Avoid:

- Multicolor icons
- Clipart
- Thick strokes
- Icons inside tables
- Icons as chart values
- Combining multiple icons into one mark

---

## 12. Logo

Use official logo assets only.

On light theme:

- Prefer silicon logo dark on white
- Use black one-color logo if silicon reproduction weak
- Keep clear space = `i` stem height
- Place top/bottom left or right

Never:

- Recolor
- Stretch
- Add effects
- Put inside curve frame
- Lock up with icons

---

## 13. CSS starter

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

.eyebrow {
  font-size: var(--type-eyebrow);
  font-weight: 500;
  letter-spacing: var(--track-eyebrow);
  text-transform: uppercase;
  color: var(--gray-b);
  line-height: 1;
}

.headline {
  font-size: var(--type-hero);
  font-weight: 700;
  letter-spacing: var(--track-headline);
  line-height: 1.05;
  color: var(--micron-black);
  max-width: 760px;
}

.body {
  font-size: var(--type-body);
  line-height: 1.5;
  color: var(--gray-a);
  max-width: 560px;
}

.panel {
  background: var(--gray-f);
  border-radius: 0;
  padding: 28px;
}

.divider {
  height: 1px;
  background: var(--gray-e);
}

.accent-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--micron-accent);
}

.metric {
  font-size: 96px;
  font-weight: 800;
  line-height: 0.95;
  letter-spacing: -0.025em;
  color: var(--micron-black);
}

.metric .highlight {
  color: var(--micron-accent);
}
```

---

## 14. Generation checklist

Always:

- White primary background
- Black headline
- Left-aligned text
- Sentence case
- Gray F only for panels
- Gray E for dividers
- One purple accent max
- Charts on white
- Thin chart marks
- Product/image areas clean and inspectable

Never:

- Full gray slide background
- Purple headline
- Colored body text
- Heavy dark layout
- Multiple gradients
- Gradient behind body/table/chart
- Rounded color-block fields
- Dense paragraphs
- Centered body copy
- Title Case headlines
- 3D charts
- Thick chart bars
- Icons inside tables

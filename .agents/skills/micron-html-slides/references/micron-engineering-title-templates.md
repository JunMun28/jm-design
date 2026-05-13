# Micron engineering title templates

Use the engineering dark style tokens from `micron-engineering-dark.md`, but
take title selection and layout guidance from this standalone file.

These templates are standalone recipes. Do not read or depend on
`micron_engineering_slide_demo_d_3.html`.

## Rules

- Every generated deck starts with a title slide unless the user explicitly asks for a standalone content slide.
- Use a title template only for slide 1, section dividers, or closing moments.
- Content slides must not copy these layouts unless the user asks for a title-style slide.
- Keep title text left aligned.
- Use official `assets/micron-logo-white-tm-rgb.png` if present; otherwise omit logo.
- Use one visual protagonist: wafer object, diagonal band, grain field, wave field, or screen stack.
- Do not include template labels in visible slide content.

## Template pool

| Template | Use when | Visual recipe |
|---|---|---|
| `wafer-hero` | Strategy, launch, technical overview | Black field, left title block, right wafer/semiconductor object, quiet radial purple/blue glow |
| `divider-band` | Fast update, sober status, internal briefing | Dark blue/black field, large diagonal gradient band from lower right, strong left title |
| `grain-wave` | Research, data, infrastructure | Subtle noise/grain field, left black readability overlay, cyan/purple energy on right |
| `silk-wave` | Transformation, architecture, premium keynote | Flowing ribbon or wave across right side, black overlay behind copy |
| `purple-silk` | High-energy milestone | `silk-wave` variant with stronger `#BD03F7`; use sparingly |
| `screen-stack` | Product demo, workflow walkthrough | Stacked interface cards on right using real workflow labels, left title block |

## Selection

- If the user names a title template, use it.
- If topic strongly implies a template, choose that template.
- If there is no direction, choose one of the six templates and randomize when no context fits.
- Prefer CSS/SVG/canvas built inside the single HTML file.
- Use Three.js only when title motion carries the slide and the deck can depend on CDN runtime.

## Title anatomy

- Logo: official white Micron logo when available.
- Eyebrow: audience, section, or topic label.
- H1: 56-72px at 16:9 desktop, max two lines.
- Subtitle: 20-26px, max two lines.
- Accent: one short purple line or one active glow.
- Footer note: useful metadata only, such as audience, date, program, or confidentiality.

## Reusable CSS tokens

```css
:root {
  --black: #000000;
  --white: #ffffff;
  --gray-a: #262626;
  --gray-c: #8c8c8c;
  --gray-d: #bfbfbf;
  --gray-e: #e6e6e6;
  --purple: #bd03f7;
  --purple-b: #ff8cff;
  --blue: #2044ff;
  --cyan: #32c8ff;
  --radius: 8px;
}

.title-copy {
  position: relative;
  z-index: 3;
  max-width: 760px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.accent-line {
  width: 84px;
  height: 7px;
  margin-top: 28px;
  border-radius: 999px;
  background: var(--purple);
}
```

## Screen-stack snippet

```html
<div class="screen-stack" aria-hidden="true">
  <div class="screen-card">
    <div class="screen-topbar">Workflow preview</div>
    <div class="screen-row"><strong>Input</strong><span>Real user task</span></div>
    <div class="screen-row"><strong>Gate</strong><span>Review / approve</span></div>
    <div class="screen-row"><strong>Output</strong><span>Trusted result</span></div>
  </div>
</div>
```

Keep snippet labels tied to the actual deck topic. Do not use fake metrics.

# Micron dark title templates

Use the engineering dark style tokens from `design.md`, but take title
selection and layout guidance from this standalone file.

These templates are standalone recipes. Do not read or depend on the old
engineering demo HTML file.

## Rules

- Every generated deck starts with a title slide unless the user explicitly asks for a standalone content slide.
- Use a title template only for slide 1, section dividers, or closing moments.
- Content slides must not copy these layouts unless the user asks for a title-style slide.
- Keep title text left aligned.
- Use official `assets/micron-logo-white-tm-rgb.png` if present; otherwise omit logo.
- Use one visual protagonist: wafer object, diagonal band, grain field, wave field, or screen stack.
- For all new Micron dark decks, default to `silk-wave-purple`: high-energy
  Micron purple silk wave cover with a large left title, official logo, useful
  context note, and restrained content metadata. Use another title template
  only when the user explicitly names that title direction. Use `editorial-ops`
  only when the user explicitly asks for a sober operating-board cover.
- `editorial-ops`: precision-board black
  field, no full-slide grid background, large magazine-like title, optional thin
  metadata rule, short decision note, and optional boxed bottom KPI strip. Do
  not use executive photo imagery here.
- For reversed MP4 icons on black, add `.micron-icon-video` to the `<video>` so
  the theme applies the approved blend/filter treatment and preserves animation
  size.
- Do not include template labels in visible slide content.

## Template pool

| Template | Use when | Visual recipe |
|---|---|---|
| `wafer-portal` | Strategy, launch, technical overview | Black field, left title block, right wafer/semiconductor object, quiet radial purple/blue glow |
| `divider-band` | Fast update, sober status, internal briefing | Dark blue/black field, large diagonal gradient band from lower right, strong left title |
| `grain-wave` | Research, data, infrastructure | Subtle noise/grain field, left black readability overlay, cyan/purple energy on right |
| `silk-wave` | Transformation, architecture, premium keynote | Flowing ribbon or wave across right side, black overlay behind copy |
| `silk-wave-purple` | Default Micron dark cover | `silk-wave` variant with stronger `#BD03F7`; use for every new Micron dark deck unless explicitly overridden |
| `screen-stack` | Product demo, workflow walkthrough | Stacked interface cards on right using real workflow labels, left title block |
| `editorial-ops` | Daily team updates, operating reviews, internal content-team decks | Flat dark field, huge left title, flexible right-side instrument, short decision note, boxed bottom KPI strip |

Copy-pasteable fragments live in `title-templates/`.

## Selection

- If the user names a title template, use it.
- If topic strongly implies a template, still use `silk-wave-purple` unless the
  user explicitly names a different title direction.
- If there is no direction, choose `silk-wave-purple`. Do not silently fall back
  to `editorial-ops`; it is opt-in for sober operating-board covers.
- Prefer CSS/SVG/canvas built inside the single HTML file.
- Use Three.js only when title motion carries the slide and the deck can depend on CDN runtime.

## Title anatomy

- Logo: official white Micron logo when available.
- Eyebrow: audience, section, or topic label.
- H1: 56-72px at 16:9 desktop, max two lines.
- Subtitle: 20-26px, max two lines.
- Accent: one short purple line or one active glow.
- Footer note: useful metadata only, such as audience, date, program, or confidentiality.
- Bottom KPI strip: if used, pin it below the main copy/visual with clear
  vertical breathing room. Do not let it crowd the subtitle or note.
- Bottom KPI strip must be a sibling of reveal-animated copy/visual groups, not
  a child of them. Do not put absolute-position cover chrome inside `.reveal`
  containers because reveal transforms can cause first-load layout jumps.
- Do not add a visible center guide/crosshair line or full-slide grid across the
  precision-board cover; horizontal framing rules and local glow are enough.

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

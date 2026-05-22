# Micron Dark Engineering — Title Template Fragments

Faithful extraction of the cover treatments from
`micron_engineering_slide_demo_d_3.html` (the hand-crafted reference deck),
re-housed in the html-slides **fixed-stage runtime** so they drop straight into
a generated `micron-dark` deck.

Each `*.html` here is a **fragment**, not a standalone page:

- the `<section class="slide title-slide …">` for slide 1
- a scoped `<style>` block (paste once into the deck `<style>`)
- where needed, a `<script type="module">` (Three.js) or plain `<script>`
  (screen-stack) init (paste once before `window.presentation = …`)

## Shared contract (every template depends on this)

These come from the canonical runtime + Micron tokens already in the deck — do
**not** redefine them inside a template:

- The controller wraps each slide's children in `.slide-stage` before
  `new SlidePresentation()`. So any visual layer (canvas, band, screen stack)
  is written as a **direct child of `.slide`, before `.slide-content`**, and
  ends up inside `.slide-stage`. CSS therefore targets
  `.title-<x> .slide-stage` / `…::before` / `…::after`.
- Stage is **1600 × 900**, centered, letterboxed (`--letterbox`). Never paint
  the whole viewport.
- Shared cover elements (define once, in the deck, not per template):

```css
.md-title-brand{position:absolute;top:46px;left:96px;z-index:5;width:126px;height:auto;opacity:.94}
.md-title-content{position:absolute;inset:96px;z-index:4;display:flex;flex-direction:column;justify-content:center;max-width:690px}
.md-title-content .kicker{color:var(--micron-accent);font-weight:800;letter-spacing:.08em;text-transform:uppercase;font-size:17px;margin-bottom:16px}
.md-title-content h1{font-size:64px;line-height:1.02;font-weight:800;max-width:650px}
.md-title-content .subtitle{font-size:24px;line-height:1.35;color:var(--gray-e);max-width:680px;margin-top:18px}
.md-accent-line{width:84px;height:7px;background:var(--micron-accent);border-radius:999px;margin-top:28px}
.md-title-note{position:absolute;left:96px;bottom:38px;z-index:5;font-size:15px;color:var(--gray-c)}
.md-title-number{position:absolute;right:34px;bottom:28px;z-index:5;font-size:13px;color:rgba(255,255,255,.45);letter-spacing:.04em}
```

- Logo asset: `assets/micron-logo-white-tm-rgb.png` (copy from
  `themes/_shared/micron-logo-white-tm-rgb.png`). Do not use a text wordmark
  when the asset is available.

## Runtime tiers

| Tier | When | Cost |
|---|---|---|
| **CSS-only** | offline decks, fast scaffolds, no CDN allowed | none |
| **Three.js-enhanced** (paste the template's `<script>`) | hand-built showcase covers where the shader is the protagonist | one pinned CDN module |

The CSS-only fallback (`.slide-stage::before`/`::after` gradient field) is
always present so the cover still reads if the canvas never initializes. Add
the Three.js layer **only** when the deck genuinely warrants it; pin the
version (`three@0.184.0`) exactly as below and keep it to title slide 1.

## The six templates

| id | demo source class | visual | runtime |
|---|---|---|---|
| `wafer-portal` | `cover-slide` | cropped right-side wafer sphere/portal | Three.js |
| `divider-band` | `title-option-divider` | rotated gradient band, bottom-right | CSS only |
| `grain-wave` | `title-option-grain` | grain wave shader field | Three.js (CSS fallback) |
| `silk-wave` | `title-option-silk` | blue→purple silk wave field | Three.js (CSS fallback) |
| `silk-wave-purple` | `title-option-silk-purple` | `#BD03F7` silk variant | Three.js (CSS fallback) |
| `screen-stack` | `title-option-screen` | animated 3-card product/dashboard stack | CSS + vanilla JS |

Default: new `micron-dark` decks use `wafer-portal.html` unless the user
names another title direction. The default cover has no `01 / Cover` counter,
no CSS fallback ball over the copy, and one right-side wafer portal.

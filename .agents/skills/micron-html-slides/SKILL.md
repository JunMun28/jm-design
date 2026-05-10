---
name: micron-html-slides
description: Use when creating or editing single-file HTML slide decks, Micron-styled presentations, dark engineering decks, course modules, weekly updates, editorial pitch decks, PDF exports, or PPTX-to-HTML slide conversions.
---

# Micron HTML Slides

## Defaults

- Default to Micron dark engineering when theme is unspecified. Match `micron_engineering_slide_demo_d_3.html`.
- Use Micron light only when the user explicitly asks for light/white slides or the deck is mainly print-style data tables.
- Use Micron dark only when requested or when content clearly needs dark mode.
- For practical technical or engineering decks in Micron dark, use the engineering dark style reference.
- Use a custom template only when requested or when user names course module, weekly update, or editorial pitch deck.
- For a new Micron dark engineering deck, let the user choose a title template when title direction is material; otherwise use `wafer-hero`.
- Ask only when theme/template choice changes the outcome materially.
- Confirm HTML only vs HTML plus PDF when delivery is unclear.

## Read First

Read only what applies:

| Need | File |
|---|---|
| Light theme | `references/micron-light-design.md` |
| Dark theme | `references/micron-dark-design.md` |
| Dark engineering style and title templates | `references/micron-engineering-dark.md` |
| Runtime checklist | `references/frontend-slides-architecture.md` |
| HTML skeleton | `references/html-template.md` |
| Viewport CSS | `references/viewport-base.css` |
| Production rules | `references/production-grade-slide-philosophy.md` |
| Custom templates | `references/custom-templates.md` |
| Verification | `references/verification.md` |
| PDF export | `references/export-workflows.md` |

For a blank deck, start with `scripts/scaffold-deck.py` or adapt `references/html-template.md`.

## Non-Negotiables

- One no-build `.html`; inline CSS/JS by default.
- Use approved CDN runtimes only when the selected reference explicitly calls for them, such as React Flow for complex diagrams or Three.js for shader/canvas title systems.
- One `<section class="slide">` per slide.
- Use full `viewport-base.css` for light/simple decks. For demo-matched dark engineering decks, use the equivalent fixed-stage runtime from `micron_engineering_slide_demo_d_3.html`.
- Vertical scroll-snap is main flow.
- `window.presentation = new SlidePresentation()`.
- Keyboard, wheel, touch/swipe, nav dots, progress bar.
- ESC opens clickable overview thumbnails.
- No slide-internal scrolling; split overflow into another slide.
- Verify before final with `scripts/verify.py`.

## Theme Rules

Micron:

- One message and one visual protagonist per slide.
- Left-aligned text; sentence case headlines.
- Black/white primary backgrounds.
- One purple accent max per slide.
- One gradient max per slide.
- Charts only on white or black.
- Do not invent stats, quotes, logos, products, or claims.

Micron dark engineering:

- Read `references/micron-dark-design.md` first, then `references/micron-engineering-dark.md`.
- Treat `micron_engineering_slide_demo_d_3.html` as the visual source of truth, not a loose inspiration.
- Use a black engineering canvas, 1600x900 fixed stage scaled into viewport, 72px design margin, dark cards, purple/cyan accent logic, and the demo's topbar/content rhythm.
- Title templates are selectable; content layouts are preferences, not a rigid slide taxonomy.
- Avoid generic AI slide tropes: random neon blobs, decorative bento grids, fake dashboards, and meaningless visual noise.

Custom:

- Read `references/custom-templates.md`.
- Treat examples as visual references, not runtime sources.
- Preserve canonical runtime even when adapting custom visual styling.

## Workflow

1. Select theme/template from user request, default Micron dark engineering.
2. Confirm PDF only if needed.
3. Read relevant design reference plus runtime checklist.
4. If using dark engineering, inspect `micron_engineering_slide_demo_d_3.html` or `references/micron-engineering-dark.md` and reuse its stage model, component vocabulary, and dark overview/nav.
5. Build outline from user content.
6. Define deck system: title template, background, type, rhythm, layouts, image role, and approved runtime tech.
7. For decks >=5 slides, make 2 visually different showcase slides when interaction allows.
8. Generate `micron-slides.html` unless user names another file.
9. Run verification at desktop and mobile viewport.
10. Export PDF only when requested.

## Density Limits

| Slide type | Max content |
|---|---|
| Title | 1 heading, 1 subtitle, optional date |
| Content | 1 heading + 4-6 bullets or 2 short paragraphs |
| Grid | 6 cards max |
| Code | 8-10 lines |
| Quote | 1 quote, max 3 lines |
| Image | 1 heading + 1 image |
| Data | 1 chart/table + one takeaway |

## Final Response

Report only:

- File path
- Theme used
- Title template used, when applicable
- External runtimes used, when applicable
- Slide count
- Navigation: arrows, space, vertical scroll/swipe, nav dots, Esc overview

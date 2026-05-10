---
name: micron-html-slides
description: Creates and modifies single-file, no-build HTML slide decks using Micron light/dark styling, Micron dark engineering title templates, or bundled custom templates. Use when creating or editing HTML slide presentations, Micron-styled decks, technical/engineering decks, course modules, weekly updates, editorial pitch decks, PDF exports, or PPTX-to-HTML slide conversions.
---

# Micron HTML Slides

## Defaults

- Default to Micron light when theme is unspecified.
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
- Use full `viewport-base.css`.
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
- Treat the sample style as a production-grade direction: precise, technical, restrained, and useful.
- Title templates are selectable; content layouts are preferences, not a rigid slide taxonomy.
- Avoid generic AI slide tropes: random neon blobs, decorative bento grids, fake dashboards, and meaningless visual noise.

Custom:

- Read `references/custom-templates.md`.
- Treat examples as visual references, not runtime sources.
- Preserve canonical runtime even when adapting custom visual styling.

## Workflow

1. Select theme/template from user request, default Micron light.
2. Confirm PDF only if needed.
3. Read relevant design reference plus runtime checklist.
4. Build outline from user content.
5. Define deck system: title template, background, type, rhythm, layouts, image role, and approved runtime tech.
6. For decks >=5 slides, make 2 visually different showcase slides when interaction allows.
7. Generate `micron-slides.html` unless user names another file.
8. Run verification at desktop and mobile viewport.
9. Export PDF only when requested.

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

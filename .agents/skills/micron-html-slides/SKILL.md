---
name: micron-html-slides
description: Use when creating or editing single-file HTML slide decks, Micron-styled presentations, dark engineering decks, course modules, weekly updates, editorial pitch decks, PDF exports, or PPTX-to-HTML slide conversions.
---

# Micron HTML Slides

## Defaults

- Default to Micron dark engineering when theme is unspecified.
- Use Micron dark engineering as a visual language, not as a fixed layout system.
- Use Micron light only when the user explicitly asks for light/white slides or the deck is mainly print-style data tables.
- Use Micron dark only when requested or when content clearly needs dark mode.
- For practical technical or engineering decks in Micron dark, use the engineering dark style reference.
- For a new Micron dark engineering deck, pick or adapt one title template from `references/micron-engineering-title-templates.md` unless the user names a specific title direction.
- Content slides should be custom to the topic. Do not reuse fixed demo layouts by default.
- If the user asks for `.pptx`, PowerPoint, or editable Office output, use `micron-pptx-slides` instead of generating HTML first.
- Ask only when theme/template choice changes the outcome materially.
- Confirm HTML only vs HTML plus PDF when delivery is unclear.

## Read First

Read only what applies:

| Need | File |
|---|---|
| Light theme | `references/micron-light-design.md` |
| Dark theme | `references/micron-dark-design.md` |
| Dark engineering style | `references/micron-engineering-dark.md` |
| Dark engineering title templates | `references/micron-engineering-title-templates.md` |
| Runtime checklist | `references/frontend-slides-architecture.md` |
| HTML skeleton | `references/html-template.md` |
| Viewport CSS | `references/viewport-base.css` |
| Production rules | `references/production-grade-slide-philosophy.md` |
| Custom templates | `references/custom-templates.md` |
| Verification | `references/verification.md` |
| PDF export | `references/export-workflows.md` |
| PPTX output | Use sibling skill `micron-pptx-slides` |

For a blank deck, start with `scripts/scaffold-deck.py` or adapt `references/html-template.md`.

## Non-Negotiables

- One no-build `.html`; inline CSS/JS by default.
- Use approved CDN runtimes only when the selected reference explicitly calls for them, such as React Flow for complex diagrams or Three.js for shader/canvas title systems.
- One `<section class="slide">` per slide.
- Every generated HTML deck starts with a dedicated title slide. This applies even when the user asks for "a slide"; make the requested content slide 2 unless they explicitly ask for a standalone content slide only.
- Use full `viewport-base.css` for light/simple decks. For Micron dark engineering decks, choose the runtime model that best fits the content while preserving navigation, fit, and verification requirements.
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
- For title slides, also read `references/micron-engineering-title-templates.md`.
- Treat Micron dark engineering as a visual language: black canvas, precise grid, strong hierarchy, dark panels, restrained purple/cyan accents, and useful technical visuals.
- Do not read or depend on the old engineering demo HTML file.
- Do not use fixed demo content layouts. Content slides should be custom to the topic and message.
- Use a black engineering canvas, crisp typography, purposeful contrast, and one visual protagonist per slide.
- Avoid generic AI slide tropes: random neon blobs, decorative bento grids, fake dashboards, and meaningless visual noise.

Custom:

- Read `references/custom-templates.md`.
- Treat examples as visual references, not runtime sources.
- Preserve canonical runtime even when adapting custom visual styling.

## Workflow

1. Select theme/template from user request, default Micron dark engineering.
2. Confirm PDF only if needed.
3. Read relevant design reference plus runtime checklist.
4. If using dark engineering, read `references/micron-engineering-dark.md`; read `references/micron-engineering-title-templates.md` only for title slide direction.
5. Build outline from user content.
6. Add slide 1 as a title page with title, short subtitle, optional audience/date/source note, and a suitable Micron title treatment.
7. Put the requested explanatory/content material after the title page.
8. Define deck system: title treatment, background, type, rhythm, visual protagonists, and approved runtime tech. Make content layouts custom to the topic.
9. For decks >=5 slides, make 2 visually different showcase slides when interaction allows.
10. Generate `micron-slides.html` unless user names another file.
11. Run verification at desktop and mobile viewport.
12. Export PDF only when requested.

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
- Confirm title slide included
- Navigation: arrows, space, vertical scroll/swipe, nav dots, Esc overview

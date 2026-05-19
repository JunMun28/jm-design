---
name: html-slides
description: Use when creating or editing single-file HTML slide decks across multiple themes — Micron (dark, light, dark engineering), Swiss minimal, editorial dark, course modules, weekly updates, brutalist, glassmorphism, playful, PDF exports, or PPTX-to-HTML slide conversions. Theme is chosen per deck; brand-locked Micron themes coexist with neutral-style themes.
---

# HTML Slides

## Defaults

- When theme is unspecified, ask the user to choose a style before building.
- Use Micron dark engineering as a visual language, not as a fixed layout system.
- Use Micron light only when the user explicitly asks for light/white slides or the deck is mainly print-style data tables.
- Use Micron dark only when requested or when content clearly needs dark mode.
- For practical technical or engineering decks in Micron dark, use the engineering dark style reference.
- For a new Micron dark engineering deck, pick or adapt one title template from `themes/micron-dark-engineering/title-templates.md` unless the user names a specific title direction.
- Content slides should be custom to the topic. Do not reuse fixed demo layouts by default.
- If the user asks for `.pptx`, PowerPoint, or editable Office output, use the project `pptx` skill instead of generating HTML first.
- Ask only when theme/template choice changes the outcome materially.
- Confirm HTML only vs HTML plus PDF when delivery is unclear.

## Style Selection

For new deck requests, select the style before outlining or building.

- If the user clearly names a style, use it directly and skip the chooser.
- If the user does not name a style, read `themes/themes.json` for the current list of `stable` themes and present them in order. Do not hard-code the list — the manifest is the source of truth.
- When asking the user to choose, include a link to the HTML preview: `themes/selector.html`.
- Do not apply a default style when style is missing. Stop and ask first.
- If the user asks you to choose after seeing the list, choose the best fit for the content and state the chosen style.
- Only offer themes whose `status` is `stable`. Themes marked `experimental` are used only when the user names them explicitly.

## Read First

Two top-level homes:

- **`themes/`** — one folder per theme (`design.md`, `example.html`, optional `title-templates.md`, optional `preview.png`). `themes/themes.json` is the manifest. `themes/selector.html` is built from the manifest and is the user-facing chooser.
- **`references/`** — cross-theme infrastructure grouped by purpose: `tokens/` (always paste), `runtime/` (skeleton + charts), `patterns/` (opt-in), `process/` (gates). See `references/README.md` for the directory key.

Read only what applies:

| Need | File |
|---|---|
| Theme manifest (start here) | `themes/themes.json` |
| Theme chooser (show to user) | `themes/selector.html` |
| Theme rules + example | `themes/<id>/design.md` and `themes/<id>/example.html` |
| Tokens (always paste, in order) | `references/tokens/micron-tokens.css`, `references/tokens/viewport-base.css`, `references/tokens/layout-kit.css` |
| HTML skeleton + controller | `references/runtime/html-template.md` |
| Fixed 16:9 stage (opt-in; micron-light mandates it) | `references/runtime/fixed-stage.md` |
| Inline SVG charts | `references/runtime/svg-charts.md` |
| Animation patterns | `references/runtime/animation-patterns.md` |
| Image pipeline (opt-in) | `references/patterns/image-pipeline.md` |
| Inline editing (opt-in) | `references/patterns/inline-editing.md` |
| Architecture checklist | `references/process/frontend-slides-architecture.md` |
| Production rules | `references/process/production-grade-slide-philosophy.md` |
| Verification | `references/process/verification.md` |
| PDF export | `references/process/export-workflows.md` |
| PPTX output | Use project skill `pptx` |

For a blank deck, start with `scripts/scaffold-deck.py` or adapt `references/runtime/html-template.md`.

## Non-Negotiables

Universal across every theme. Theme-specific rules (palette, accent, gradient, chart surface, typography, logo placement, sentence case, etc.) live in `themes/<id>/design.md`.

- One no-build `.html`; inline CSS/JS by default.
- Paste the chosen theme's tokens first, in the order the theme's `design.md` specifies. Never redefine `:root` color or scale tokens in the deck. (Micron themes paste `references/tokens/micron-tokens.css` → `viewport-base.css` → `layout-kit.css`; non-Micron themes paste `themes/<id>/tokens.css` → `references/tokens/non-micron-contract.css` → `viewport-base.css` → `layout-kit.css`.)
- Use approved CDN runtimes only when the selected reference explicitly calls for them, such as React Flow for complex diagrams or Three.js for shader/canvas title systems. Pin versions and include SRI hashes.
- For charts in simple decks, use inline SVG primitives from `references/runtime/svg-charts.md`. Reach for Chart.js only when interactivity is required.
- One `<section class="slide">` per slide.
- Every generated HTML deck starts with a dedicated title slide. This applies even when the user asks for "a slide"; make the requested content slide 2 unless they explicitly ask for a standalone content slide only.
- Vertical scroll-snap is main flow.
- `window.presentation = new SlidePresentation()`.
- Keyboard, wheel, touch/swipe, nav dots, progress bar.
- ESC opens clickable overview thumbnails.
- No slide-internal scrolling; split overflow into another slide.
- Fixed-stage decks must expose a real 16:9 slide canvas. Paint the centered stage, not the whole browser viewport; non-16:9 browser windows should show neutral letterbox space outside the slide.
- One message and one visual protagonist per slide.
- Do not invent stats, quotes, logos, products, or claims.
- Preserve the canonical runtime from `references/runtime/html-template.md` even when adapting theme-specific visuals.
- Verify before final with `scripts/verify.py <deck>.html --theme <id> --check-overview --fail-on-warnings`. `--theme` is required (the verifier errors without it) so per-theme rules from `themes/themes.json` (required tokens, accent overuse, chart-surface, headline contrast, logo) actually run alongside the universal lints. Use `--skip-brand` only to deliberately run universal-only.

## Theme Rules

Theme rules live in each theme's `design.md`. Read `themes/<id>/design.md` for the chosen theme; treat `themes/<id>/example.html` as a *visual* precedent, not a runtime to copy verbatim. Add a new theme by creating a folder under `themes/` and a manifest entry in `themes/themes.json` — do not edit this SKILL.md for new themes.

## Workflow

1. Select the requested style directly when clear. If style is missing or ambiguous, show the style list from `Style Selection`, include a link to `themes/selector.html`, and ask the user to choose before reading style references, outlining, or building. Do not apply a default style for an unspecified request.
2. Confirm PDF only if needed.
3. Read relevant design reference plus runtime checklist.
4. Read the chosen theme's `design.md`. If the theme manifest lists a `title-templates.md` extra (e.g. Micron dark engineering), read it only for title slide direction.
5. Build outline from user content.
6. Add slide 1 as a title page with title, short subtitle, optional audience/date/source note, and a title treatment that fits the chosen theme.
7. Put the requested explanatory/content material after the title page.
8. Define deck system: title treatment, background, type, rhythm, visual protagonists, and approved runtime tech. Make content layouts custom to the topic.
9. For decks >=5 slides, make 2 visually different showcase slides when interaction allows.
10. Generate a filename from the deck content/title as a lowercase kebab-case slug, for example `github-copilot-workflow.html` or `factory-yield-review.html`. Do not default to `micron-slides.html` unless the user explicitly names that file.
11. Run verification at desktop, mobile, and a non-16:9 browser viewport when fixed-stage output is used, such as `1127x1084`, to confirm the slide canvas letterboxes instead of stretching.
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

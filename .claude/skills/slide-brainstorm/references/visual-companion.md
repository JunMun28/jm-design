# HTML Brainstorm Artifact

Use this as the slide-brainstorm deliverable. It replaces saved text frame
files.

## Purpose

The HTML brainstorm is a temporary review surface:

- Help the user compare visual pacing, slide density, diagrams, and artifact
  examples.
- Make review easier before `html-slides` builds the final deck.
- Carry the full handoff content for the build skill.

It is not the final deck and must not select the final theme.

## File

Save the brainstorm as:

```text
docs/brainstorms/YYYY-MM-DD-<topic>-brainstorm.html
```

Use today's date and a short kebab-case topic slug.

## Minimum Structure

Use one standalone HTML file with inline CSS/JS. Start by copying
`references/html-companion-skeleton.html`; replace placeholders with the
approved synthesis and slide content. Preserve its flattened DOM so Codex
browser annotations land on meaningful elements.

Required page sections:

1. Header: `BRAINSTORM — NOT FINAL DECK` and deck title only.
2. Core idea: one strong summary line plus proposal, why it matters, and what
   makes it credible.
3. Slide panels: one panel per slide with visible slide content only. Slide 01
   is always a title slide.

Optional sections:

1. Image placeholders when requested: show intended subject, crop, and role.
2. Artifact specimens: prompt/output, spreadsheet grid, chart mock, document
   excerpt, dashboard block, approval note.
3. Risk or assumption callouts, only when needed for review.

## Design Rules

- Theme-agnostic: no final palette, typography, template, or brand treatment.
- Grayscale by default: use shades of gray for the brainstorm companion unless
  the user explicitly asks otherwise.
- Review-first: full enough to judge the actual layout and information design,
  but still theme-less so it does not pretend to be the final deck.
- Standalone by default: no build step and no dev server. Pinned CDN
  dependencies are allowed only when they materially improve a real diagram or
  interactive review surface, and the HTML comment records the library,
  version, URL, reason, and fallback.
- Mermaid-first for flowcharts: when a process, measurement loop, or simple
  graph would benefit from auto-layout, use a pinned Mermaid CDN import before
  reaching for heavier libraries. Keep labels short and move detail into nearby
  slide text.
- Accessible: readable text sizes, keyboard-safe controls if interactive.
- Focused: show the core idea and slide content. Do not expose intake status,
  audits, design principles, or builder notes unless the user asks.
- Header-light: do not show audience/goal/status notes under the page title.
- Title-slide-light: title slides should contain title, one-line ask/subtitle,
  and optional scope. Avoid bottom metadata rows.
- Annotation-friendly: keep slide panels as direct children of `section.deck`,
  with `data-slide`, `aria-labelledby`, one direct `header.slide-head`, and one
  direct `div.preview`.
- Diagram-real: when a flowchart or diagram clarifies the story, include it as
  an actual slide in the narrative, not a detached sample.
- Complete enough for handoff: slide text and intended visual structure must be
  visible in the HTML as a full-fidelity monochrome layout preview.
- Theme-less, not low-fidelity: final color, brand treatment, and theme belong
  later, but the brainstorm must still show production-grade composition,
  detailed diagrams, artifacts, mock interfaces, tables, matrices, equations,
  and state callouts when those are part of the approved arc.
- Layout-contract honest: every internal `DESIGN INTENT` line must be
  implemented visibly in the slide panel. If the design pass chooses
  `technical infographic board`, the HTML must show the numbered zones,
  symbolic artifacts, legends, and payoff strip, not a generic diagram
  placeholder.
- Professionally composed: each content slide must have a clear visual
  protagonist, a 3-5 stop scan path, and an encoding choice that fits the data
  or content shape. A good brainstorm panel should make the point visually
  before the viewer reads every label.
- Image-aware: if the user asked for photos/placeholders, represent each one
  with `.image-placeholder`; label asset status as Provided, Placeholder, or
  Need source.
- Overflow-safe: if a slide has multiple vertical blocks, use the skeleton's
  dense-slide fitting pattern (`.preview.is-dense` or equivalent) so content
  scales down instead of clipping.
- Updated in place: every Phase 4 revision updates this same HTML file.

## Chat Mention

When created, say:

```text
Saved the brainstorm to docs/brainstorms/<topic>-brainstorm.html.
This is the review artifact, not the final deck.
```

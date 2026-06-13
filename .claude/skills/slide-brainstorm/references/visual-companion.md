# HTML Wireframe Artifact

Use this as the slide-brainstorm deliverable. It replaces saved text frame
files.

## Purpose

The HTML wireframe is a temporary review surface:

- Help the user judge narrative flow, slide density, layout choice, and where
  each visual goes — before any pixels are designed.
- Make review easier before `html-slides` (or `slide-quick`) builds the final
  deck.
- Carry the full handoff content for the build skill (titles, key points,
  layout signatures, and the per-slide DESIGN INTENT comment).

It is a low-fidelity draft. It is **not** the final deck, must not select the
final theme, and must not try to look designed.

## File

Save the wireframe as:

```text
docs/brainstorms/YYYY-MM-DD-<topic>-brainstorm.html
```

Use today's date and a short kebab-case topic slug.

## Minimum Structure

Use one standalone HTML file with inline CSS. Start by copying
`references/wireframe-skeleton.html`; replace placeholders with the approved
synthesis and slide content. Preserve its flattened DOM so Codex browser
annotations land on meaningful elements.

Required page sections:

1. Header: `WIREFRAME — NOT FINAL DECK` and deck title only.
2. Core idea: one strong summary line.
3. Slide panels: one `article.slide-panel` per slide with low-fi content only.
   Slide 01 is always a title slide.

Optional sections:

1. Image placeholders when requested: a `.wf-box` labelled with intended
   subject, crop, and asset status.
2. Risk or assumption callouts, only when needed for review.

## Design Rules

- Low-fidelity by design: every visual is a gray `.wf-box` with a short text
  label (`[loop diagram: 3 nodes + feedback edge]`, `[code ~10 lines]`,
  `[table 4 rows]`). Do not render real matrices, charts, mocks, or diagrams.
- Theme-agnostic AND low-fidelity: no palette, typography, brand, or
  production composition. The wireframe judges *structure and layout choice*,
  not visual design — that comes at build.
- Standalone and dumb: inline CSS only. No JS, no CDN, no Mermaid, no
  screenshots, no webfonts.
- Focused: show the core idea and slide content. Do not expose intake status,
  audits, design principles, or builder notes on the page.
- Header-light: do not show audience/goal/status notes under the page title.
- Title-slide-light: title slides carry title, one-line ask/subtitle, and
  optional scope.
- Annotation-friendly: keep slide panels as direct children of `section.deck`,
  each with `data-slide`, `aria-labelledby`, one direct `header.slide-head`,
  and one direct `div.preview`.
- Layout-labelled: every content slide names its layout signature (e.g.
  `contrast wall`, `operating loop`, `technical infographic board`) as a
  `.wf-layout` line, and shows a `.wf-box` placeholder for each visual that
  signature implies.
- Layout-contract recorded, not rendered: every internal `DESIGN INTENT` line
  lives in the HTML source comment (signature, protagonist, scan path,
  encoding). The wireframe shows the matching labeled placeholder box; the
  build skill renders the real artifact. Do not draw the artifact here.
- Image-aware: if the user asked for photos/placeholders, represent each one
  with a `.wf-box` labelled with its asset status: Provided, Placeholder, or
  Need source.
- Updated in place: every Phase 4 revision updates this same HTML file.

## Chat Mention

When created, say:

```text
Saved the wireframe to docs/brainstorms/<topic>-brainstorm.html.
This is the low-fi review artifact, not the final deck.
```

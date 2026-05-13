# Micron engineering dark style

Use this after `micron-dark-design.md` when creating practical Micron dark decks
for engineering reviews, rollout updates, process sharing, system architecture,
data pipelines, technical launches, training, or product demos.

This file defines visual principles for content slides. It is not a fixed layout
template and does not depend on any external source HTML.

For title-slide recipes, read `micron-engineering-title-templates.md`.

## Core principles

Make production-grade technical slides, not generic generated UI.

- Black primary field with restrained blue/purple/cyan energy.
- Precise grid, exact alignment, strong reading order, and enough negative space.
- Left-aligned text by default, sentence case headings, compact labels, useful chrome.
- Dark panels with 8px radius, subtle borders, inset highlights, and deep shadows.
- One accent role per slide: active gate, key metric, selected node, or current phase.
- One visual protagonist per slide: diagram, object, timeline, comparison, quote, chart, workflow, screenshot, or generated visual.
- Visuals explain engineering work: flows, systems, timelines, release gates, dashboards.
- Content layout is chosen per topic. Do not reuse fixed process boards, dashboard grids, or demo-like topbar patterns by default.
- Avoid random blobs, filler icons, fake stats, fake product screenshots, and decorative bento cards.

## Runtime and tech

Keep the canonical slide runtime from `frontend-slides-architecture.md`.
Use one no-build HTML file. Authored CSS and JS stay inline.

Choose the stage model based on content:

- Use fluid viewport layouts for editorial explainers, simple visual stories, and responsive decks.
- Use fixed 16:9 stage layouts for dense presentation-native boards or precise diagrams.
- Use full-bleed layouts for title, closing, object-focused, or image-led moments.
- Preserve keyboard, wheel, touch/swipe, nav dots, progress bar, and ESC overview.

Approved CDN exceptions:

| Need | Runtime | Notes |
|---|---|---|
| Complex architecture, pipeline, dependency, or system flow | React 18 UMD + ReactDOM UMD + `@xyflow/react` UMD/CSS | Use controlled nodes, hidden handles, curved connectors, `fitView`, disabled drag/zoom/pan/select |
| Hero, section divider, closing, shader field, 3D wafer, milestone motion | Three.js module | Use canvas, `ResizeObserver`, device-pixel-ratio cap, static or reduced-motion fallback |
| Simple timeline, swimlane, status, metric, table, card, or lane diagram | HTML/CSS/SVG | Do not add React Flow for simple layouts |

If external network access is not acceptable, replace React Flow with inline SVG
and replace Three.js title motion with static CSS gradients/canvas-free art.

## Title templates

Title templates live in `micron-engineering-title-templates.md`.

- Use title templates for title slides, section dividers, or closing moments.
- Do not use title templates as default content-slide layouts.
- Vary title treatment across generated decks unless the user names a specific direction.
- Do not include visible template labels in generated decks.

## Content slide principles

Content slides are freeform per topic. Do not start from a fixed pattern unless
the user asks for a specific layout.

Before designing each content slide, decide:

- What is the single message?
- What visual protagonist best explains it?
- What can be removed?
- What should purple highlight?
- What should cyan indicate?
- Does the slide need a dense fixed stage, a fluid editorial layout, or a full-bleed visual?

Use layout families only as mental prompts, not templates:

- Comparison: before/after, tradeoff, current/future, risk/control.
- Flow: system, process, data, handoff, dependency, journey.
- Evidence: chart, table, metric, source excerpt, test result.
- Narrative: quote, statement, object spotlight, sequence, closing.
- Tool: dashboard, checklist, SOP, action tracker, command board.

Each generated deck with five or more slides should include at least two clearly
different content compositions.

## Component style

Use these values as a starting system and adapt with `clamp()` for viewport decks.

```css
:root {
  --black: #000000;
  --white: #ffffff;
  --gray-a: #262626;
  --gray-b: #4d4d4d;
  --gray-c: #8c8c8c;
  --gray-d: #bfbfbf;
  --gray-e: #e6e6e6;
  --purple: #bd03f7;
  --purple-b: #ff8cff;
  --blue: #2044ff;
  --cyan: #32c8ff;
  --radius: 8px;
  --panel-shadow: 0 18px 42px rgba(0,0,0,0.42);
}

.engineering-card {
  border: 1px solid rgba(230,230,230,0.18);
  border-radius: var(--radius);
  background: linear-gradient(180deg, rgba(48,48,48,0.96), rgba(20,20,20,0.98));
  box-shadow: var(--panel-shadow), inset 0 1px 0 rgba(255,255,255,0.10);
}

.engineering-card.is-active {
  border-color: rgba(255,140,255,0.42);
  background: linear-gradient(180deg, rgba(70,30,82,0.92), rgba(20,13,23,0.96));
}
```

Use component vocabulary only when it fits the content:

- `.section-label`, `.subtitle`, `.accent-line`
- `.engineering-card`, `.status`, `.metric`
- `.visual-field`, `.diagram-field`, `.comparison-field`
- `.timeline-item`, `.source-note`, `.callout`
- `.screen-frame`, `.workflow-node`, `.evidence-row`

Cards are 8px radius, dark vertical gradients, subtle borders, inset top
highlights, and deep shadows. Purple marks active state; cyan marks data/input
movement. Do not spread purple across every component.

## React Flow diagram rules

Use React Flow for diagrams with enough relationship complexity to justify it.

- Include `https://unpkg.com/@xyflow/react@12.x/dist/style.css`.
- Include React and ReactDOM UMD, then `@xyflow/react` UMD.
- Custom node: fixed width/height, dark gray fill, 8px radius, 1-2px border.
- Core node: black fill, purple border, subtle purple glow.
- Hide handles visually but keep them for edge anchoring.
- Disable dragging, connection, selection, pan, zoom, and double-click zoom.
- Use `MarkerType.ArrowClosed`, 3px edge stroke, direct labels with black label backgrounds.
- Use cyan for input/data movement and purple for validation/core/output emphasis.
- Fit the viewport with padding; avoid nodes touching edges.

## Three.js title rules

Use Three.js only for hero/title/milestone motion that carries the slide.

- Put canvas behind content with `aria-hidden="true"` and `pointer-events: none` unless interaction is intentional.
- Keep text in a dark quiet zone with overlay gradients.
- Cap pixel ratio to avoid overloading presentation machines.
- Use `ResizeObserver` to update renderer size and shader resolution.
- Pause or reduce animation for `prefers-reduced-motion`.
- Avoid particle clutter; prefer wafer, wave, scan, or light-speed fields.

## Quality gates

Before final, inspect screenshots for:

- First read is obvious within 3 seconds.
- Diagram labels are legible and not cramped.
- Purple is intentional, not everywhere.
- No card nesting.
- No fake dashboard values unless provided by user or clearly marked placeholder.
- No visible template labels or copied demo wording.
- Content slides do not repeat one layout structure across the whole deck.
- CDN dependencies are disclosed when used.

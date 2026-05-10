# Micron engineering dark style

Use this after `micron-dark-design.md` when creating practical Micron dark decks
for engineering reviews, rollout updates, process sharing, system architecture,
data pipelines, technical launches, training, or product demos.

Source preference: `micron_engineering_slide_demo_d_3.html`, reviewed May 2026.

## Demo fidelity contract

When the user asks for Micron engineering style, a technical/business explainer,
or gives no theme, match the local demo's visual system. Do not fall back to the
light Micron slide style.

Use this page model:

- Body/page background: `#151515`; slide background: black with restrained radial/diagonal blue-purple energy.
- Stage: `.slide` fills viewport and centers a fixed `.slide-content` stage.
- Design stage: `--slide-w: 1600px; --slide-h: 900px; --margin: 72px`.
- Scaling: `--slide-scale = min(1, viewportW / 1600, viewportH / 900)`.
- Cover visuals may use cover scale, but title/text content must stay fit-scaled and readable on mobile.
- Content shell: `.content { position:absolute; inset: var(--margin); }`.
- Typography at 1600x900: h1 64px, h2 42px, h3 25px, subtitle 24px/1.35, section labels 15px uppercase.
- Navigation/overview: dark progress bar, dark nav dots, black blurred overview, 16:9 thumbnails.
- Brand: use `assets/micron-logo-white-tm-rgb.png` if present; otherwise omit logo. Do not invent a wordmark.

The fixed stage is intentional. Keep vertical scroll snap and `SlidePresentation`,
but do not replace the demo model with a fully fluid light layout.

## Core preference

Make production-grade technical slides, not generic generated UI.

- Black primary field with restrained blue/purple/cyan energy.
- Precise grid, exact alignment, and strong reading order.
- Left text, sentence case headings, compact labels, useful chrome.
- Dark panels with 8px radius, subtle borders, inset highlights, and deep shadows.
- One accent role per slide: active gate, key metric, selected node, or current phase.
- Visuals explain engineering work: flows, systems, timelines, release gates, dashboards.
- Avoid random blobs, filler icons, fake stats, fake product screenshots, and decorative bento cards.

## Runtime and tech

Keep the canonical slide runtime from `frontend-slides-architecture.md`.
Use one no-build HTML file. Authored CSS and JS stay inline.

Approved CDN exceptions:

| Need | Runtime | Notes |
|---|---|---|
| Complex architecture, pipeline, dependency, or system flow | React 18 UMD + ReactDOM UMD + `@xyflow/react` UMD/CSS | Use controlled nodes, hidden handles, curved connectors, `fitView`, disabled drag/zoom/pan/select |
| Cinematic title, shader field, 3D wafer, milestone motion | Three.js module | Use canvas, `ResizeObserver`, device-pixel-ratio cap, static or reduced-motion fallback |
| Simple timeline, swimlane, status, metric, table, card, or lane diagram | HTML/CSS/SVG | Do not add React Flow for simple layouts |

If external network access is not acceptable, replace React Flow with inline SVG
and replace Three.js title motion with static CSS gradients/canvas-free art.

## Title template picker

For a new Micron dark engineering deck, offer a short title choice if the user
has not given direction and the title page matters. Do not show option labels in
the final deck unless the deck is specifically demonstrating title options.

| Template | Use when | Visual recipe |
|---|---|---|
| `wafer-hero` | Default flagship technical deck, strategy, review, launch | Black cover, left text, Micron logo top-left when available, Three.js wafer/planet or semiconductor object on right, quiet radial purple/blue glow |
| `divider-band` | Fast project update, sober status deck, minimal motion | Dark blue/black field, large diagonal gradient band from lower right, left title block |
| `grain-wave` | Research, infrastructure, data-intensive topic | Full-canvas grain/noise shader, left black readability overlay, purple/blue/cyan wave energy |
| `silk-wave` | Premium keynote, transformation, architecture story | Flowing shader ribbon across right side, strong left title, black overlay for copy |
| `purple-silk` | High-energy milestone or launch | Silk-wave variant with stronger `#BD03F7`; use sparingly |
| `screen-stack` | Product demo, UI rollout, workflow walkthrough | Animated stacked interface cards on right with real workflow labels and metrics |
| `grid-scan` | System launch, architecture walkthrough, technical deep dive | Scan-grid shader or static grid field, pointer/subtle skew optional, left title |

Title anatomy:

- Logo: use official `assets/micron-logo-white-tm-rgb.png` if available; otherwise omit logo rather than inventing one.
- Text block: eyebrow, h1, subtitle, accent line.
- Footer note: only meaningful metadata such as audience, date, program, or confidentiality.
- H1: 56-72px on 16:9 desktop, max 2 lines.
- Subtitle: 20-26px, max 2 lines.
- Do not center the main title block.

## Content layout preferences

Treat these as reusable preferences, not mandatory templates.

| Pattern | Best for | Design notes |
|---|---|---|
| Metric strip + status cards | Weekly rollout, UAT, readiness | 3-4 large metrics, one purple key number, then Done / In progress / Needs help |
| Problem cards + takeaway | Problem statement, RCA setup | 3 causes max, one accented risk card, one sharp callout with actual takeaway |
| Process control board | Workflow, handoff, exception gate | Large lane map plus right control panel showing current step, input/gate/output |
| React Flow architecture | App architecture, system context | Dark diagram field, gray nodes, purple core node, cyan/purple key edges, hidden handles |
| React Flow pipeline | Source-to-trusted-output flow | Left explanation card plus diagram; show raw sources, transform/gate, trusted view |
| Timeline command board | Release or migration plan | Left current-phase panel, right week/phase board, active bar in purple |
| Swimlane / RACI / SOP | Responsibilities, operations, training | Dense but scannable, clear owner labels, no icon clutter |
| Milestone lightspeed | Adoption or launch milestone | Three.js/canvas energy field, centered metric, 2-3 proof points only |
| Screen stack | Product walkthrough | Use plausible UI cards only when tied to actual workflow content |

For a single-slide explainer, prefer one of these demo-native compositions:

- Left title/summary + right screen-stack or process-control panel.
- Topbar + 3-4 metric/action cards + one active decision or gate card.
- Compact process board with current checkpoint panel.
- Before/after bridge with 3-4 concrete transition steps.

Avoid a white two-column handout layout unless the user explicitly asks for light.

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

Also preserve the demo vocabulary when useful:

- `.topbar`, `.section-label`, `.subtitle`, `.accent-line`
- `.card`, `.card.white`, `.card.accented`, `.status`, `.metric`
- `.process-board`, `.process-map`, `.process-control`
- `.timeline`, `.timeline-status`, `.timeline-board`
- `.change-board`, `.change-panel`, `.change-bridge`
- `.screen-swap-stage`, `.screen-swap-card`, `.screen-kpis`

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
- No visible title-option labels left from the demo.
- CDN dependencies are disclosed when used.

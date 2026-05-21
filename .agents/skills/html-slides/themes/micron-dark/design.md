# Micron dark style

Use this when creating practical Micron dark decks for engineering reviews,
rollout updates, process sharing, system architecture, data pipelines,
technical launches, training, or product demos.

For normal content-team or day-to-day team presentations, default to an
**editorial operations** direction: flat black or near-black stage, oversized
magazine-like type, a clean top metadata rule, one strong evidence visual when
the content needs it, and a clear ask/action. It should feel polished and
attention-grabbing without becoming the `micron-dark-executive` photo/keynote
style.

The default title slide is `silk-wave-purple` from
`title-templates/silk-wave-purple.html`. Use that template for every new Micron
dark deck unless the user explicitly names another title direction. Do not
silently substitute a custom precision-board, screen-stack, wafer, photo, or
operating-board cover.

`editorial-ops` / precision-board covers are opt-in only: flat black or
near-black field, large left headline, a short recovery/decision note, and an
optional boxed bottom KPI strip. If explicitly requested, keep this cover clean:
use top/bottom framing rules and subtle local glow, but do not use full-slide
grid backgrounds or a visible center guide line.

This file defines visual principles for content slides. It is not a fixed layout
template and does not depend on any external source HTML.

For title-slide recipes, read `title-templates.md`.

## Core principles

Make production-grade technical slides, not generic generated UI.

- Treat these Micron design principles as the default visual brief:
  - Vibrant: vivid color and radiant luminosity, usually through wafer/memory macro imagery, spectral crops, or high-energy generated fields on black.
  - Bold: simple, impactful composition. Use one large shape, crop, object, or visual statement instead of many equal small cards.
  - Precise: clear and intentional. Exact alignment, clean geometry, sharp labels, and no decorative drift.
  - Fluid: seamless forward motion. Use arcs, waves, diagonal flow, progressive builds, or directional light so the slide feels like it is moving toward the next idea.
- Black primary field with Micron purple as the only readable accent.
- Avoid broad gradient backgrounds on routine content slides. Keep the stage
  flat black/near-black; place Micron purple on the active data mark,
  constraint, selected node, callout rule, or section transition.
- Cyan is not an accent color in Micron dark. Do not use cyan for readable text,
  selected bars, active table cells, borders, callout rules, or highlighted
  states. Keep cyan only as subtle ambient energy inside non-readable title
  fields or background depth, when needed.
- To make routine data slides feel premium without breaking the flat-black
  rule, use **background depth as chrome**, not as a surface: faint corner
  glows and a thin horizontal data band behind panel groups. Keep charts
  themselves on flat black or solid dark panels.
  The effect should be visible only after the content hierarchy is clear.
- Do not use full-slide grid backgrounds on Micron dark covers. Grids are
  opt-in only inside a specific technical chart/diagram surface where they
  serve reading, not as page decoration.
- Vivid accents may include warm red/orange/yellow and semiconductor-spectrum color, but they belong inside the visual protagonist, not spread across every UI component.
- Precise grid, exact alignment, strong reading order, and enough negative space.
- Left-aligned text by default, sentence case headings, compact labels, useful chrome.
- Dark panels with 8px radius, subtle borders, inset highlights, and deep shadows.
- Do not make every slide a grid of equal cards. Prefer a large headline,
  oversized metric, editorial chart, process lane, or decision list as the lead
  object. Use panels sparingly; rules, whitespace, and type hierarchy should do
  most of the organizing.
- One accent role per slide: active gate, key metric, selected node, or current phase.
- One visual protagonist per slide: diagram, object, timeline, comparison, quote, chart, workflow, screenshot, or generated visual.
- Visuals explain engineering work: flows, systems, timelines, release gates, dashboards.
- Content layout is chosen per topic. Do not reuse fixed process boards, dashboard grids, or demo-like topbar patterns by default.
- Avoid random blobs, unrelated filler icons, fake stats, fake product screenshots, and decorative bento cards. Restrained official decorative icons are allowed when selected through `../micron-icons/bin/find-icon.py` and kept subordinate to the slide's main visual.
- Avoid handcrafted radar rings, fake wafer maps, custom particle fields, or
  improvised animation for normal team decks. Use motion only when it materially
  improves the slide.
- Official reversed MP4 icons often carry a black video field. On flat black
  editorial slides, keep the MP4 animation and apply a scoped blend/filter
  instead of converting to tiny PNGs: use `.micron-icon-video` with
  `mix-blend-mode: screen` plus mild brightness/contrast/saturation. Do not use
  this utility on screenshots, product demos, or normal footage.

The reference composition is a black field with four confident moments:
color-rich semiconductor imagery for Vibrant, a large cropped gradient
quarter-arc for Bold, one exact symbol/mark for Precise, and a luminous ribbon
or flow field for Fluid. Generated slides do not have to copy that layout, but
they should preserve the same discipline: one strong visual per idea, generous
negative space, and labels that feel intentional.

## Runtime and tech

Keep the canonical slide runtime from `frontend-slides-architecture.md`.
Use one no-build HTML file. Authored CSS and JS stay inline.

Choose the stage model based on content:

- Use fluid viewport layouts for editorial explainers, simple visual stories, and responsive decks.
- Use fixed 16:9 stage layouts for dense presentation-native boards or precise diagrams. For the fixed stage, paste the shared `references/runtime/fixed-stage.md` overlay after `viewport-base.css` rather than hand-rolling the scale math.
- Use full-bleed layouts for title, closing, object-focused, or image-led moments.
- Preserve keyboard, wheel, touch/swipe, nav dots, progress bar, and ESC overview.

Approved CDN exceptions:

| Need | Runtime | Notes |
|---|---|---|
| Complex architecture, pipeline, dependency, or system flow | React 18 + ReactDOM + `@xyflow/react` CSS/runtime | Mandatory for complex workflow/flowchart diagrams. Use controlled node/edge data, hidden handles, curved connectors, `fitView`, disabled drag/zoom/pan/select |
| Non-trivial chart: trend with target, annotated line/area, waterfall, Pareto, Sankey, heatmap, dashboard chart | ECharts | Mandatory when axes, target lines, annotations, multiple series, resize behavior, or label collision matter. Use data/options objects and flat chart surfaces |
| Hero, section divider, closing, shader field, 3D wafer, milestone motion | Three.js module | Use canvas, `ResizeObserver`, device-pixel-ratio cap, static or reduced-motion fallback |
| Simple timeline, swimlane, status, metric, table, card, lane diagram, or tiny mini-chart | HTML/CSS/SVG | Do not add React Flow/ECharts for simple static layouts |

Never hand-position complex workflow/flowchart diagrams with raw absolute
HTML/CSS boxes and arrows. That approach is fragile and fails under responsive
scaling, overview thumbnails, and content changes. For complex flows, use React
Flow or another proven graph/layout library; for simple 2-4 step lanes, plain
HTML/CSS is still acceptable.

If external network access is not acceptable, replace React Flow/ECharts with
generated inline SVG from structured node/edge/chart data, not manually placed
divs or fixed chart coordinates. Replace Three.js title motion with static CSS
gradients/canvas-free art.

## Title templates

Title templates live in `title-templates.md` and reusable fragments live in
`title-templates/`.

- Use title templates for title slides, section dividers, or closing moments.
- Do not use title templates as default content-slide layouts.
- Do not vary the default title treatment for new Micron dark decks. Use
  `silk-wave-purple` unless the user explicitly names another title direction.
- Do not include visible template labels in generated decks.

## Content slide principles

Content slides are freeform per topic. Do not start from a fixed pattern unless
the user asks for a specific layout.

Before designing each content slide, decide:

- What is the single message?
- What visual protagonist best explains it?
- Which principle leads this slide: Vibrant, Bold, Precise, or Fluid?
- What can be removed?
- What should purple highlight?
- What should Micron purple indicate?
- Does the slide need a dense fixed stage, a fluid editorial layout, or a full-bleed visual?

Use layout families only as mental prompts, not templates:

- Comparison: before/after, tradeoff, current/future, risk/control.
- Flow: system, process, data, handoff, dependency, journey.
- Evidence: chart, table, metric, source excerpt, test result.
- Narrative: quote, statement, object spotlight, sequence, closing.
- Tool: dashboard, checklist, SOP, action tracker, command board.

For day-to-day team decks, use this editorial rhythm before inventing a new one:

- Cover: use `silk-wave-purple` by default. If the user explicitly asks for
  `editorial-ops`, use a large left-aligned title, optional thin metadata rule,
  flat dark field with subtle local glow, short decision note, and optional
  boxed bottom KPI strip.
- Signal: huge editorial headline plus one hero icon or artifact.
- Evidence: chart/table/process lane with the active constraint highlighted.
- Reveal: one culprit, one outlier, or one comparison; do not show a dense export.
- Decision: clean action list with owner/time/status fields, not a dashboard.
- Close: the ask, next checkpoint, and expected result.

Each generated deck with five or more slides should include at least two clearly
different content compositions.

For precision-board covers, never put absolute/fixed-position children such as
the bottom KPI strip inside an element that uses `.reveal` or any `transform`.
Transforms create a new containing block during first paint and can make pinned
UI jump from the title area to the footer after reveal state applies. Keep
pinned chrome as a sibling of reveal groups, or disable transform on the parent.

## Complex visual generation

Micron dark must be able to show complex workflows, flowcharts, charts, and
system diagrams. Choose the generation method based on the visual's real
complexity:

- Use hand-authored HTML/CSS/SVG only for editorial examples, swimlanes, status
  lanes, tiny mini-charts, and small 2-4 step process strips where no routing,
  axes, target lines, annotations, or label collision are involved.
- Use ECharts when the visual is chart-shaped and non-trivial: axes, trend
  lines, thresholds, annotations, Pareto, waterfall, Sankey, heatmap, multi-
  series, or dashboard-like chart panels.
- Use React Flow when the diagram is truly node/edge-driven: dependency maps,
  architecture graphs, pipeline DAGs, branching workflows, or anything that
  benefits from fit-to-view and explicit node/edge data.
- Do not pretend a hand-positioned CSS/SVG flowchart or chart is generated.
  If the visual should come from structured data, define the data and render it
  through React Flow, ECharts, or a deterministic generated SVG layout.
- Keep the Micron dark grammar: black field, faint edge texture only when useful,
  white labels, neutral connectors for movement/data, Micron purple for the
  active node or decision, and no decorative blobs or fake 3D chart effects.
- For complex visuals, reserve one slide for one system. If labels become small
  or connectors cross heavily, split into overview + detail slides.

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
  --cyan: #32c8ff; /* ambient only; not a readable accent */
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

.micron-icon-video {
  display: block;
  width: min(78%, 420px);
  height: min(78%, 420px);
  object-fit: contain;
  background: transparent;
  mix-blend-mode: screen;
  filter: brightness(1.12) contrast(1.08) saturate(1.08);
}

.precision-board {
  background:
    radial-gradient(circle at 72% 46%, rgba(189,3,247,.11), transparent 30%),
    #010101;
}

.signal-instrument {
  --signal-shell-size: clamp(320px, 34vw, 500px);
  --signal-core-size: calc(var(--signal-shell-size) * .88);
  --signal-icon-size: calc(var(--signal-shell-size) * .80);
  position: relative;
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  border-radius: 50%;
  border: 1px dotted rgba(255,255,255,.24);
  box-shadow:
    inset 0 0 0 28px rgba(115,118,140,.13),
    inset 0 0 0 62px rgba(0,0,0,.52);
}

Use `.signal-instrument` as a flexible optional shell, not a required fixed
layout. Set CSS variables per deck (`--signal-shell-size`,
`--signal-core-size`, `--signal-icon-size`) and set the visible label in HTML
from the content, e.g. `Yield signal`, `Quality gate`, `Decision window`,
`Forecast risk`. If the official icon or chart is strong enough alone, omit the
shell or use a quieter flat evidence panel.

.precision-board .metric-strip {
  position: absolute;
  left: 44px;
  right: 44px;
  bottom: 24px;
}
```

Use component vocabulary only when it fits the content:

- `.section-label`, `.subtitle`, `.accent-line`
- `.engineering-card`, `.status`, `.metric`
- `.visual-field`, `.diagram-field`, `.comparison-field`
- `.principle-grid`, `.principle-card`, `.visual-tile`
- `.timeline-item`, `.source-note`, `.callout`
- `.screen-frame`, `.workflow-node`, `.evidence-row`

Cards are 8px radius, dark vertical gradients, subtle borders, inset top
highlights, and deep shadows. Micron purple marks active state. Neutral grays
mark supporting data/input movement. Do not spread purple across every
component.

## Anti-repetition guardrails

When generating a new deck:

- Do not default to the same hero/content split across generated decks.
- Do not make every content slide a topbar plus card grid.
- Do not use process boards, dashboards, or timelines unless the topic calls for them.
- Do not invent data to make a dashboard look real.
- Prefer one strong custom visual over many small decorative panels.

## React Flow diagram rules

Use React Flow for diagrams with enough relationship complexity to justify it.

- Include `https://unpkg.com/@xyflow/react@12.x/dist/style.css`.
- Include React and ReactDOM UMD, then `@xyflow/react` UMD.
- In browser-only HTML decks, an ESM import from a pinned CDN is acceptable if
  it is verified in-browser; keep the graph data in plain `nodes` / `edges`
  arrays so the diagram remains auditable.
- Custom node: fixed width/height, dark gray fill, 8px radius, 1-2px border.
- Core node: black fill, purple border, subtle purple glow.
- Hide handles visually but keep them for edge anchoring.
- Disable dragging, connection, selection, pan, zoom, and double-click zoom.
- Use `MarkerType.ArrowClosed`, 3px edge stroke, direct labels with black label backgrounds.
- Use neutral gray for input/data movement and Micron purple for
  validation/core/output emphasis.
- Fit the viewport with padding; avoid nodes touching edges.

## ECharts chart rules

Use ECharts for charts with operational complexity.

- Include a pinned ECharts runtime only on decks/slides that need it.
- Keep chart data in plain arrays and chart config in one named `option` object.
- Mount each chart into a fixed-height `.echart-stage` or similar wrapper so
  first paint, overview thumbnails, and responsive resizing do not jump.
- Use `ResizeObserver` or a debounced `window.resize` listener to call
  `chart.resize()`.
- Use black/near-black chart surfaces, thin grid lines, white/gray labels, and
  Micron purple for the single active series, target, anomaly, or intervention.
  Do not use cyan as a selected chart color.
- Prefer direct **data labels** on selected points/bars only. Do not label every
  point. Use `label.formatter` plus `labelLayout.hideOverlap` and a small dark
  label background so values stay readable in the room.
- Use `markLine` for targets and `markArea` for intervention windows, but keep
  their prose labels off the plot. Put explanatory copy in a side/bottom HTML
  callout where text can wrap predictably.
- Avoid `markPoint` pin markers for normal data labels. Pins read like map
  markers and add clutter; use point symbols + direct value labels instead.
- Interactivity is allowed when it improves rehearsal or live presentation:
  use hover/click tooltip, `axisPointer`, and click-to-update side callouts.
  The chart must still make sense as a static screenshot.
- Disable decorative 3D, rainbow palettes, chart gradients, and hover-only
  meaning. The chart must read in a static screenshot and PDF export.

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

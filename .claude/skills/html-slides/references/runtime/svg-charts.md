# Chart runtime choice

Default preference: use a proven charting library for non-trivial charts.
ECharts is the preferred HTML-slide chart runtime because it handles axes,
annotations, target lines, responsive resize, dark themes, and image/PDF export
more reliably than hand-authored SVG.

Use inline SVG only for tiny static primitives: one sparkline, one bar strip,
one dot strip, one gauge, or a decorative mini-chart. Do not hand-author
production trend charts, threshold charts, Pareto/waterfall charts, multi-series
charts, annotated charts, Sankey/process charts, or dashboard charts with fixed
SVG coordinates.

For Micron decks, simple primitives can still use inline SVG because they render
crisply, print to PDF cleanly, and use the same `--gray-d` / `--micron-accent`
tokens as the rest of the deck. Anything more complex should be data-driven
through ECharts.

For ECharts in presentation decks:

- Use `markLine` for targets and `markArea` for ranges/windows.
- Put prose explanations outside the plot in HTML callouts; do not place long
  labels inside `markArea` or over dense lines.
- Use direct data labels only on selected points/bars, not every point.
- Prefer `labelLayout.hideOverlap`, fixed chart wrapper height, and
  `ResizeObserver` calling `chart.resize()`.
- Interactive charts may use hover/click tooltips and side-callout updates, but
  never rely on hover-only meaning; static screenshots and PDF export must work.

All primitives:

- Use `currentColor` for the base series so the chart inherits `--gray-d` (dim) or `--text-primary` (foreground).
- Use `--micron-accent` for at most **one** highlighted series, bar, or marker.
- Use `--micron-cyan` only for input/movement signals (e.g. an "incoming" arrow on a flow), never as a primary series color.
- Live on a **white or black background only**. Never place a chart on a gradient.
- Pair every chart with a one-line takeaway under it.

## Horizontal bar

```html
<svg class="chart-bar" viewBox="0 0 320 140" role="img" aria-label="2025 capacity by node">
  <g font-family="var(--font-mono)" font-size="9" fill="currentColor" opacity="0.7">
    <text x="0" y="20">1Y</text>
    <text x="0" y="50">1Z</text>
    <text x="0" y="80">1A</text>
    <text x="0" y="110">1B</text>
  </g>
  <g>
    <rect x="32" y="12" width="120" height="12" fill="currentColor" opacity="0.35"/>
    <rect x="32" y="42" width="180" height="12" fill="currentColor" opacity="0.35"/>
    <rect x="32" y="72" width="244" height="12" fill="var(--micron-accent)"/>
    <rect x="32" y="102" width="80" height="12" fill="currentColor" opacity="0.35"/>
  </g>
  <line x1="32" y1="130" x2="320" y2="130" stroke="currentColor" stroke-opacity="0.18"/>
</svg>
```

## Sparkline

```html
<svg class="chart-spark" viewBox="0 0 200 60" role="img" aria-label="Yield trend">
  <polyline
    fill="none"
    stroke="currentColor"
    stroke-opacity="0.35"
    stroke-width="1.5"
    points="0,48 25,42 50,38 75,40 100,32 125,28 150,24 175,18 200,12"
  />
  <circle cx="200" cy="12" r="3.5" fill="var(--micron-accent)"/>
</svg>
```

## Dot plot (cohort / status grid)

```html
<svg class="chart-dot" viewBox="0 0 240 60" role="img" aria-label="Wafer test pass rate">
  <g fill="currentColor" opacity="0.35">
    <!-- repeat dots; one accent dot last -->
    <circle cx="6"  cy="10" r="3"/>
    <circle cx="18" cy="10" r="3"/>
    <!-- ... -->
  </g>
  <circle cx="234" cy="10" r="3.5" fill="var(--micron-accent)"/>
</svg>
```

## Gauge (single KPI)

```html
<svg class="chart-gauge" viewBox="0 0 120 80" role="img" aria-label="Throughput at 78%">
  <path d="M10,70 A50,50 0 0 1 110,70" fill="none" stroke="currentColor" stroke-opacity="0.18" stroke-width="8"/>
  <path d="M10,70 A50,50 0 0 1 96,30" fill="none" stroke="var(--micron-accent)" stroke-width="8" stroke-linecap="square"/>
  <text x="60" y="64" text-anchor="middle" font-family="var(--font-display)" font-weight="700" font-size="28" fill="currentColor">78%</text>
</svg>
```

## Common styling

```css
.chart-bar, .chart-spark, .chart-dot, .chart-gauge {
    color: var(--gray-d);          /* base series tone */
    width: 100%;
    height: auto;
    max-width: 480px;
}
.theme-light .chart-bar,
.theme-light .chart-spark,
.theme-light .chart-dot,
.theme-light .chart-gauge { color: var(--gray-b); }
```

## When to escalate to ECharts / React Flow / Three.js

Use ECharts when the chart has axes, target lines, annotations, labels that
must avoid overlap, multiple series, responsive resizing, tooltips, waterfall /
Pareto / Sankey shape, or any data transform. Use React Flow for node/edge
diagrams and workflow graphs. Use Three.js only for shader/canvas title art.
Approved runtimes must be CDN-pinned where used (see
`frontend-slides-architecture.md`).

## Picking the chart

Match data shape to chart type before choosing a runtime. The "Slide form"
column shows the default implementation. Prefer ECharts once the chart is more
than a tiny static primitive.

| Data shape | Best fit | Secondary | Slide form | Accessibility notes |
|---|---|---|---|---|
| Trend over time (1–3 series) | Line | Smooth area | ECharts unless it is a tiny sparkline | Caption the direction in words — slide distance hides subtle changes |
| Compare categories (≤ 8 items) | Horizontal bar, sorted desc | Vertical column | Inline SVG only for simple bars; otherwise ECharts | Value labels at bar end — no hover at the back of the room |
| Part-to-whole (≤ 5 slices) | Donut | Stacked single bar | ECharts | Pie is poor for screen readers — caption the counts |
| Part-to-whole (> 5 slices) | Stacked single bar with legend | Treemap | ECharts | Always use a legend, never a colour-only pie |
| Distribution / correlation | Scatter | Heat map | ECharts | At slide distance scatter reads as noise — caption the takeaway |
| Performance vs target | Bullet chart | Gauge | ECharts, or inline SVG only for one compact bullet/gauge | Compact, accessible — prefer over gauges in decks |
| Forecast / actual vs projected | Line with confidence band | Ribbon | ECharts | Distinguish actual/forecast with stroke style, not colour |
| Cumulative / waterfall | Waterfall | Stacked bar | ECharts | Label each step's delta |
| Multi-variable (3–6 axes) | Radar | Parallel coordinates | ECharts | Limit to ≤ 6 axes; provide a table for screen readers |
| Hierarchical / nested | Treemap | Sunburst | ECharts | Pair with a list — treemaps are poor for a11y |
| Geographic | Choropleth / bubble map | Geographic heatmap | ECharts only with verified map data | Label regions in text; don't depend on map literacy |
| Flow / process | Sankey | Chord | ECharts Sankey or React Flow for node/edge workflows | Caption the top flow; viewers can't trace ribbons at slide distance |
| Anomaly highlight | Line with marked points | Scatter with annotation | ECharts | Annotate the anomaly with a label, not just colour |

## Scale integrity

A chart that distorts scale lies faster than text ever could. Hard rules:

1. **Bar/column value axes start at zero.** A truncated bar axis exaggerates
   differences; if the deltas only read on a truncated axis, use a line chart
   or state the delta as a number instead.
2. **Non-zero line-chart baselines are allowed** only with visible axis range
   labels, so the zoom is declared.
3. **No dual y-axes.** Two scales on one plot invite false correlation —
   split into two stacked charts sharing the x-axis.
4. **Comparable charts share identical ranges**, or carry a visible
   annotation saying the scales differ.
5. **No 3D, ever.** Depth distorts area and adds nothing.
6. Sort category bars by value (not alphabetically) unless the order is
   itself meaningful (time, process stage).
7. Distinguish actual vs plan vs forecast by stroke/fill style plus a label,
   never by color alone (IBCS-style notation).
8. **The chart's message is a sentence.** The slide headline (or the chart's
   adjacent takeaway) states what the chart proves, with the key number —
   never just the metric name. `verify.py` fails charts with no adjacent
   takeaway in standalone decks and flags naked charts (no visible values)
   everywhere.

Decision rules:

- ≤ 6 data points → use a number, sentence, or small table instead of a chart.
- One series, ≤ 12 points → sparkline inline with the headline.
- Pie/donut tempts you with > 5 slices → switch to a stacked bar.
- Need axes, thresholds, annotations, zoom, brush, drilldown, resize resilience, or complex labels → CDN-pinned ECharts.
- Chart sits on a gradient → move it. Charts must read on a flat surface (Micron themes enforce this in `verify.py`; non-Micron themes still benefit).
- Forecast or anomaly chart → distinguish by stroke style + label, never colour alone.

## Slide-distance test

Before committing a chart: shrink the deck to 50% in the browser and ask whether the single takeaway is still legible. If not, replace the chart with a number, a sentence, or a smaller selection of the same data.

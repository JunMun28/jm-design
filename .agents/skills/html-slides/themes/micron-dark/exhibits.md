# Micron dark — consulting exhibit library

Six exhibit types that turn content slides from text rows into evidence.
Every fragment here ships in the Micron dark language — monochrome grays,
hairlines, mono labels, **one purple accent moment** — and passes
`verify.py --theme micron-dark` as used. Working precedent with all six
rendered: built per this file; see the worked fragments below.

## When to reach for which exhibit

Pick the exhibit from the slide's message, not from habit:

| The title says… | Exhibit | Accent goes on |
|---|---|---|
| "X explains N points of the gap" (decomposition of a change) | Waterfall / bridge | The target or end bar |
| "One driver binds the number" (KPI decomposition) | Driver tree | The binding-constraint node |
| "Do these first" (prioritisation of options) | 2×2 matrix | Do-first quadrant tint + its dots |
| "Option B wins" (choice across criteria) | Harvey-ball table | Winner column underline + verdict |
| "It changed at week N, because…" (trend + event) | Annotated trend | The inflection bar + callout border |
| "Three phases get us there" (plan over time) | Gated roadmap | The final exit-gate diamond |

Still no fit? Fall back to design.md §8 recipes (stat moment, comparison,
image grid). Plain bullets are the last resort, not the default.

## Exhibit slide anatomy (applies to all six)

```
eyebrow (mono kicker)            ← names the exhibit, not the message
action title                     ← full-sentence claim with the key number
figure.exhibit                   ← ONE exhibit, the visual protagonist
aside.so-what                    ← "SO WHAT" rail: implication + next move
p.fineprint                      ← source / method / "illustrative" line
```

Rules that make this work with the verifier:

- Wrap every exhibit in `<figure class="exhibit">`. Figure subtrees are
  exempt from the body-word budget and the repeated-cards lint (marks in a
  chart are data, not a card wall), and each figure counts toward the
  ≤3-exhibits-per-slide cap.
- The so-what rail and title are OUTSIDE the figure — they are the slide's
  words and must fit the 60-word executive budget.
- Accent budget is ≤4 elements per slide. Each recipe below states its
  accent spend; do not add more.
- Text floors inside exhibits: `td`/`th` ≥24px; mono value/axis labels ≥20px.
- Every exhibit slide ends with a `p.fineprint` source/method line. Unsourced
  numbers say `illustrative`.

### Shared anatomy CSS

```css
.exhibit-row{display:grid;grid-template-columns:minmax(0,2.4fr) minmax(280px,1fr);gap:56px;align-items:end}
.so-what{border-left:1px solid var(--line);padding-left:36px;align-self:center}
.sw-label{font:700 20px/1 var(--font-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-bottom:14px}
.sw-text{font-size:24px;line-height:1.4;color:#e6e6e6;max-width:34ch}
.fineprint{margin-top:16px;font:400 15px/1.4 var(--font-mono);color:rgba(191,191,191,.62)}
figure.exhibit{margin:0}
```

Full-width exhibits (table, roadmap) skip `.exhibit-row` and put the
fineprint directly under the figure.

**Variable names.** The fragments use `--accent`, `--line`, `--muted`, and
`--panel` (the scaffold's names). If the deck only defines Micron tokens,
alias them once, scoped to exhibit slides — an undefined var silently
renders the accent bar invisible:

```css
.exhibit-row,figure.exhibit{--accent:var(--micron-accent);--line:rgba(255,255,255,.16);--muted:var(--text-secondary);--panel:#121212}
```

---

## 1. Waterfall / bridge

Use when the message decomposes a change or a gap: yield bridge, cost
bridge, demand build-up. Floating steps walk from the start bar to the end
bar. **Accent: the end/target bar only (1).** Keep ≤6 columns; values on
top in mono, labels below the baseline.

```html
<figure class="exhibit wf" aria-label="Yield bridge from 91.4 to 96.0 percent">
  <div class="wf-col"><span class="wf-val">91.4</span><div class="wf-bar base" style="height:136px"></div><span class="wf-lab">Today</span></div>
  <div class="wf-col"><span class="wf-val">+3.1</span><div class="wf-bar step" style="height:124px;margin-bottom:136px"></div><span class="wf-lab">Test fallout</span></div>
  <div class="wf-col"><span class="wf-val">+0.9</span><div class="wf-bar step" style="height:36px;margin-bottom:260px"></div><span class="wf-lab">Litho drift</span></div>
  <div class="wf-col"><span class="wf-val">+0.6</span><div class="wf-bar step" style="height:24px;margin-bottom:296px"></div><span class="wf-lab">Etch matching</span></div>
  <div class="wf-col"><span class="wf-val">96.0</span><div class="wf-bar target" style="height:320px"></div><span class="wf-lab">Q2 target</span></div>
</figure>
```

Geometry: pick a px-per-unit scale; each floating step's `margin-bottom` is
the running total below it, its `height` is its own delta. The start and
end bars sit on the baseline. Steps must sum exactly to the end bar —
check the arithmetic before styling.

```css
.wf{display:flex;align-items:flex-end;gap:30px;height:440px;padding-bottom:44px;position:relative}
.wf::after{content:"";position:absolute;left:0;right:0;bottom:44px;height:1px;background:var(--line)}
.wf-col{display:flex;flex-direction:column;justify-content:flex-end;align-items:center;width:148px;position:relative;height:100%}
.wf-bar{width:100%;position:relative}
.wf-bar.base{background:#3c3c44}
.wf-bar.step{background:#57575f}
.wf-bar.step::after{content:"";position:absolute;left:100%;top:0;width:30px;border-top:1px dashed rgba(255,255,255,.32)}
.wf-bar.target{background:var(--accent)}
.wf-val{font:700 24px/1 var(--font-mono);color:#fff;margin-bottom:10px}
.wf-lab{position:absolute;bottom:-44px;font-size:20px;color:var(--muted);white-space:nowrap}
```

## 2. Driver tree

Use when one KPI decomposes into branches and one leaf is the story.
Branches must be MECE — say the cutting dimension in the so-what or
fineprint. **Accent: the binding-constraint node border + its value (2).**
Keep to 3 levels and ≤3 leaves per branch.

```html
<figure class="exhibit tree" aria-label="Yield driver decomposition">
  <div class="tree-col c1"><div class="node root"><b>91.4%</b><span>final yield</span></div></div>
  <div class="tree-link l1"></div>
  <div class="tree-col c2">
    <div class="node"><b>97.8%</b><span>line yield · healthy</span></div>
    <div class="node warn"><b>93.4%</b><span>test yield · problem</span></div>
  </div>
  <div class="tree-link l2"></div>
  <div class="tree-col c3">
    <div class="node hot"><b>-2.0 pts</b><span>bin 7A retest</span></div>
    <div class="node"><b>-0.7 pts</b><span>handler drift</span></div>
    <div class="node"><b>-0.4 pts</b><span>other bins</span></div>
  </div>
</figure>
```

```css
.tree{display:grid;grid-template-columns:240px 56px 280px 56px 300px;align-items:center;height:440px}
.tree-col{display:flex;flex-direction:column;justify-content:space-around;height:100%}
.tree-col.c1{justify-content:center}
.node{border:1px solid var(--line);background:var(--panel);padding:18px 22px;position:relative}
.node b{display:block;font-size:30px;line-height:1;color:#fff}
.node span{display:block;margin-top:8px;font:400 20px/1.2 var(--font-mono);color:var(--muted)}
.node.warn{border-color:rgba(255,255,255,.42)}
.node.hot{border-color:var(--accent)}
.node.hot b{color:var(--accent)}
.tree-link{position:relative;height:100%}
.tree-link::before{content:"";position:absolute;left:0;right:0;top:50%;height:1px;background:var(--line)}
.tree-link.l1::after{content:"";position:absolute;right:0;top:25%;bottom:25%;width:1px;background:var(--line)}
.tree-link.l2::after{content:"";position:absolute;right:0;top:16%;bottom:16%;width:1px;background:var(--line)}
```

## 3. 2×2 priority matrix

Use to position options on two named dimensions and call one quadrant.
**Accent: the called quadrant's tint + the dots inside it (≤4 total).**
≤7 positioned items; quadrant captions in mono smallcaps; axes labeled.

```html
<figure class="exhibit m22" aria-label="Impact versus effort matrix">
  <span class="ax-y">Yield impact</span>
  <span class="ax-x">Effort and cost</span>
  <div class="m22-grid">
    <div class="q q-tl"><span class="q-cap">Do first</span></div>
    <div class="q q-tr"><span class="q-cap">Fund and plan</span></div>
    <div class="q q-bl"><span class="q-cap">Housekeeping</span></div>
    <div class="q q-br"><span class="q-cap">Avoid</span></div>
    <div class="dot hot" style="left:17%;top:14%"><i></i>Retest recipe fix</div>
    <div class="dot" style="left:64%;top:20%"><i></i>Test-capacity add</div>
    <!-- …more items, left/top as percentages of the plot area -->
  </div>
</figure>
```

```css
.m22{position:relative;width:640px;height:440px;padding:0 0 40px 44px}
.ax-y{position:absolute;left:0;top:42%;transform:rotate(180deg);writing-mode:vertical-rl;font:700 20px/1 var(--font-mono);letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.ax-x{position:absolute;left:46%;bottom:0;font:700 20px/1 var(--font-mono);letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.m22-grid{position:relative;width:100%;height:100%;border-left:1px solid rgba(255,255,255,.4);border-bottom:1px solid rgba(255,255,255,.4);display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr}
.q.q-tl{background:color-mix(in srgb,var(--accent) 9%,transparent)}
.q.q-tr{border-left:1px dashed rgba(255,255,255,.22)}
.q.q-bl{border-top:1px dashed rgba(255,255,255,.22)}
.q.q-br{border-left:1px dashed rgba(255,255,255,.22);border-top:1px dashed rgba(255,255,255,.22)}
.q-cap{position:absolute;right:12px;bottom:8px;font:700 18px/1 var(--font-mono);letter-spacing:.1em;text-transform:uppercase;color:rgba(191,191,191,.55)}
.q{position:relative}
.dot{position:absolute;display:flex;align-items:center;gap:10px;font-size:20px;color:#e6e6e6;white-space:nowrap;transform:translate(-9px,-9px)}
.dot i{width:18px;height:18px;border-radius:50%;background:#6a6a72;flex:none}
.dot.hot i{background:var(--accent)}
```

## 4. Harvey-ball option table

Use for a recommendation across options × criteria. Real `<table>`
(verifier-exempt from word budget; cells ≥24px). Harvey balls are
conic-gradient circles — gray fills only. **Accent: winner column underline
+ the verdict word (2).** End with a verdict row; never leave the table to
speak for itself.

```html
<figure class="exhibit" aria-label="Vendor comparison with harvey balls">
<table class="opt-table">
  <thead><tr><th>Criterion</th><th>Vendor A</th><th class="pick">Vendor B</th><th>In-house</th></tr></thead>
  <tbody>
    <tr><td>Tool uptime record</td><td><span class="hb" style="--f:50%"></span></td><td class="pick"><span class="hb" style="--f:100%"></span></td><td><span class="hb" style="--f:25%"></span></td></tr>
    <!-- …more criteria rows -->
    <tr class="verdict"><td>Verdict</td><td>Backup</td><td class="pick"><b class="accent">Recommend</b></td><td>Too slow</td></tr>
  </tbody>
</table>
</figure>
```

```css
.opt-table{width:100%;border-collapse:collapse}
.opt-table th{font:700 22px/1.2 var(--font-mono);letter-spacing:.06em;text-transform:uppercase;color:var(--muted);text-align:left;padding:14px 18px;border-bottom:1px solid rgba(255,255,255,.4)}
.opt-table td{font-size:25px;color:#e6e6e6;padding:18px;border-bottom:1px solid var(--line)}
.opt-table td.pick,.opt-table th.pick{background:rgba(255,255,255,.05)}
.opt-table th.pick{border-bottom:2px solid var(--accent)}
.opt-table tr.verdict td{font-size:24px;color:var(--muted)}
.opt-table .accent{color:var(--accent);font-weight:700}
.hb{display:inline-block;width:28px;height:28px;border-radius:50%;border:2px solid #8c8c8c;background:conic-gradient(#bfbfbf var(--f),transparent 0)}
```

Never put the accent color on `th` text — `verify.py` forbids accent on
headers; the underline carries the highlight.

## 5. Annotated trend

Use when the story is an inflection, not the average. Bars (or a sparkline)
plus ONE callout box pinned to the event. **Accent: the inflection bar +
the callout border (2).** Values on every bar in mono ≥20px. More than ~10
marks → switch to ECharts per `references/runtime/svg-charts.md`.

```html
<figure class="exhibit trend" aria-label="Weekly yield trend with annotation">
  <div class="tr-col"><span class="tr-val">90.2</span><div class="tr-bar" style="height:128px"></div><span class="tr-lab">W1</span></div>
  <!-- …more weeks; the event week gets class="tr-bar hot" -->
  <div class="callout">Recipe freeze lapsed in W7 — drift returned within two weeks<i></i></div>
</figure>
```

```css
.trend{display:flex;align-items:flex-end;gap:26px;height:440px;padding-bottom:40px;position:relative}
.trend::after{content:"";position:absolute;left:0;right:0;bottom:40px;height:1px;background:var(--line)}
.tr-col{display:flex;flex-direction:column;justify-content:flex-end;align-items:center;width:92px;position:relative;height:100%}
.tr-bar{width:100%;background:#3c3c44}
.tr-bar.hot{background:var(--accent)}
.tr-val{font:700 20px/1 var(--font-mono);color:var(--muted);margin-bottom:8px}
.tr-lab{position:absolute;bottom:-40px;font:400 20px/1 var(--font-mono);color:var(--muted)}
.callout{position:absolute;right:-6px;top:8px;width:330px;border:1px solid var(--accent);background:rgba(189,3,247,.07);padding:16px 18px;font-size:21px;line-height:1.35;color:#fff}
.callout i{position:absolute;left:34%;top:100%;width:1px;height:56px;background:var(--accent)}
```

Scale integrity: bar heights map linearly from a stated baseline; truncated
baselines need visible range values (every bar is labeled here, which
satisfies that).

## 6. Gated roadmap

Use for phased plans with exit criteria. Swimlanes × months grid; phase
bars carry their label inside (≥20px); diamonds mark gate reviews.
**Accent: the final exit-gate diamond only (1).** State the gate criteria
in the fineprint.

```html
<figure class="exhibit road" aria-label="Three-phase roadmap March to June">
  <div class="rd-head"><span></span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span></div>
  <div class="rd-lane"><span class="rd-name">Contain</span>
    <div class="rd-track"><div class="rd-bar" style="left:0;width:34%">Recipe freeze + golden sample</div><span class="rd-gate" style="left:36%"></span></div>
  </div>
  <!-- …more lanes; final gate gets class="rd-gate hot" -->
  <div class="rd-key"><span class="rd-gate demo"></span> gate review &nbsp;·&nbsp; <span class="rd-gate hot demo"></span> exit gate</div>
</figure>
```

```css
.road{width:100%}
.rd-head{display:grid;grid-template-columns:170px repeat(4,1fr);font:700 20px/1 var(--font-mono);letter-spacing:.1em;text-transform:uppercase;color:var(--muted);padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,.4)}
.rd-lane{display:grid;grid-template-columns:170px 1fr;align-items:center;border-bottom:1px solid var(--line);min-height:104px}
.rd-name{font-size:24px;color:#e6e6e6}
.rd-track{position:relative;height:100%;background:repeating-linear-gradient(90deg,rgba(255,255,255,.08) 0 1px,transparent 1px 25%)}
.rd-bar{position:absolute;top:50%;transform:translateY(-50%);height:52px;background:#3c3c44;display:flex;align-items:center;padding:0 18px;font-size:21px;color:#e6e6e6;white-space:nowrap}
.rd-gate{position:absolute;top:50%;width:16px;height:16px;background:#bfbfbf;transform:translateY(-50%) rotate(45deg)}
.rd-gate.hot{background:var(--accent)}
.rd-key{margin-top:16px;font:400 20px/1 var(--font-mono);color:var(--muted);display:flex;align-items:center;gap:10px}
.rd-gate.demo{position:static;transform:rotate(45deg);display:inline-block}
```

---

## Checklist before shipping an exhibit slide

- [ ] Title is the claim the exhibit proves, with the key number.
- [ ] One exhibit, wrapped in `figure.exhibit`, is the visual protagonist.
- [ ] So-what rail states the implication and the next move (≤30 words).
- [ ] Accent spend matches the recipe (≤4 accent elements on the slide).
- [ ] Numbers are arithmetic-consistent (waterfall steps sum; tree leaves
      sum to their branch; trend matches the title's delta).
- [ ] Fineprint line gives source/method, or says `illustrative`.
- [ ] `verify.py --theme micron-dark` passes.

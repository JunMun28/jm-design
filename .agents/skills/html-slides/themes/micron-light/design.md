# Micron light — design system

Purpose: light-theme Micron slide reference. Style, philosophy, gotchas only — **no fixed layouts.** Use this for the look-and-feel; invent the layout for whatever the deck needs.

Compiled: May 2026. Canonical live precedent:
`docs/brainstorms/2026-05-15-github-copilot-for-everyone-deck.html`
(a managerial training deck — Apple/Cursor restraint).

---

## 1. When to reach for this theme

Micron light is the right pick when **any** of these are true:

- The deck is read by people in good light (managers, customers, training rooms, print-friendly handouts)
- The narrative wants to feel **calm, premium, factual** — not theatrical
- Content is text-heavy, data-heavy, or both, and clarity matters more than mood
- The audience is non-technical and needs the slides to do less, not more
- It will be exported to PDF for circulation

Common deck types: training / onboarding, board reviews, financial readouts, agendas, data tables, vision-with-numbers, internal explainers, comparison decks.

It is **not** the right pick for: theatrical pitches that need black canvas drama, conference keynotes that lean on imagery, brand storytelling decks (use Micron dark executive for those).

---

## 2. The feel — five words

**Bright. Precise. Calm. Editorial. Quiet.**

Light theme decks earn their impact by **restraint with visible Micron purple**. White is still the protagonist, but purple must show up as a real system: title texture, section labels, one or two focal panels, active chart/data states, and the main emphasis word. A deck that uses only a tiny purple dot or one chart bar reads unfinished.

The reader should feel: *this team is confident enough to leave space.*

---

## 3. Color tokens

Inherits `references/tokens/micron-tokens.css`. The theme is a thin layer on top.

```css
:root {
  /* required (verify.py checks these) */
  --micron-black: #000;
  --micron-white: #fff;
  --micron-accent: #bd03f7;
  --micron-accent-display: var(--micron-accent); /* optional alias for large display accents */

  /* light-theme working palette: violet-tinted, not dark gray */
  --light-sheet: rgb(253, 251, 255);
  --light-sheet-bottom: rgb(249, 247, 253);
  --light-letterbox: rgb(241, 239, 247);
  --light-panel: rgb(250, 247, 255);
  --light-panel-soft: rgb(244, 239, 253);
  --light-rule: rgb(214, 207, 228);
  --light-track: rgb(232, 228, 238);
  --light-bar: rgb(158, 149, 178);
  --ink: rgb(25, 23, 42);
  --muted: rgb(92, 83, 113);
  --quiet: rgb(127, 118, 145);
  --hairline: 1px solid var(--light-rule);
  --letterbox: var(--light-letterbox);
  --soft-purple-wash: color-mix(in srgb, var(--micron-accent) 8%, var(--light-sheet));
}
```

Do not use dark gray as the light-theme workhorse. No slate panels, dark-gray
blocks, or generic gray fills. Text uses violet-tinted ink; structure uses
pale violet/cool-blue tints; data recedes through light tracks, not charcoal.

### Where each color is allowed

| Color | Allowed for | Banned for |
|---|---|---|
| `--light-sheet` / `--light-sheet-bottom` | Stage background as a near-white paper gradient | Pure white slabs |
| `--ink` (or `--micron-black`) | Headlines, body, primary text | Backgrounds, gray panels |
| `--muted` | Captions, footer text, attribution, supporting clauses | Headlines |
| `--micron-accent` (purple) | Title dot-grid texture, section-label kicker, italic accent word in H2, soft-purple wash, progress bar, active chart/data state, focal panel glow/border, tiny accent dot | Full headline color, body copy, table fills, gradients behind text |
| `--hairline` | All dividers, table row rules | Anything heavier than 1px |
| `--light-panel` / `--light-panel-soft` | Tables, structural grouping, quiet headers | Charcoal/dark-gray surfaces |
| `--light-track` / `--light-bar` | Non-active chart bars and tracks | Black or dark-gray chart fills |
| `--soft-purple-wash` | One or two focal panels / title-support surfaces | Frame for every slide |
| `--letterbox` | Browser viewport outside the 16:9 stage | Inside the stage |

The accent (purple) is precious but not scarce. **One accent word per H2**, **visible purple section labels**, **one or two purple wash moments per deck**, **one highlight per chart**, and **purple active states** are expected. If the slide has data or a process state, purple should identify the thing the audience should act on.

For illustrated training decks, count accent by **role**, not by SVG path:
one headline accent, one active state, one visual cluster, one focal wash.
The verifier allows this because a single diagram can contain many accent
strokes; the human rule is still that purple marks the point, not decoration.

---

## 4. Reference deck recipe: Copilot for managers

When asked for a light Micron deck like
`2026-05-15-github-copilot-for-everyone-deck.html`, reproduce the **system**,
not the subject matter:

- **Physical scene:** managers in a bright meeting room, reading a training deck
  on a projector and later as a PDF. Light theme is forced by the room and use.
- **Fixed 16:9 sheet:** white 1600×900 stage centered in a cool letterbox with a
  soft shadow. Do not stretch the slide to the browser viewport.
- **Cover:** two-section composition: left title copy, right hero visual. If
  there is no specific product/subject image, use a large official Micron
  animated MP4 icon from `../micron-icons` (`title-hero`, `pos`) on the right.
  Do not draw a divider between the sections; whitespace defines the split.
  The MP4 sits directly on the light field with no circle, border, card,
  square backing, or shadow. Use `mix-blend-mode: multiply` when needed to
  suppress the MP4's white frame. The title stage uses a restrained mesh
  gradient: white/pearl quiet zone on the left for text, controlled Micron
  purple around the right visual, a slight cool-blue tint for depth, and a
  soft white lift in the bottom-right. Keep the faint purple dot fields.
- **Narrative rhythm:** evolution → shift → how it works → examples → live try
  → deeper concept → progressive discovery. Use this cadence for training:
  name the change, show the old/new split, give the action loop, then rehearse.
- **Layouts:** vary signatures every slide. Use timelines, two-column then/now
  comparisons, prompt tables, a centered live-demo prompt, and progressive flow
  diagrams. Avoid repeated card grids.
- **Visual protagonists:** library-rendered charts/diagrams when the visual is
  complex, tiny inline SVG diagrams only when static and simple, product marks, prompt
  tables, and progressive build fragments. Icons are drawn as thin-line figures,
  not emoji or stock clipart.
- **Interaction:** build fragments are allowed for teaching sequences. Arrow /
  space advances the staged build before moving slides.
- **Purple moments:** use `--soft-purple-wash` for one or two memorable quote,
  prompt, decision, or summary surfaces. Do not make it the default panel style,
  but do not ship a light deck that hides purple almost entirely.
- **Brand marks:** content slides may place the black Micron logo on the
  fixed-stage pseudo-element (`.slide-stage::after`) or use the text fallback.
  The verifier accepts stage-level marks.

The reference deck is intentionally more elaborate than the small data example:
it is the standard for managerial training / enablement decks in `micron-light`.

---

## 4A. Per-slide richness devices — DO NOT ship generic cards

This is the single biggest failure mode. A generator that reads §4 and then
renders every slide as the same `1px solid var(--hairline)` + `border-radius:8px`
+ `background:#fff` card grid has produced a *spreadsheet*, not this theme. The
reference deck (`example.html`) earns its polish because **every slide has its
own bespoke class and art-directed CSS**, not a shared card component.

Hard rules:

- **Every content slide gets a unique class** (`slide-evolution`,
  `slide-the-shift`, `slide-how-loop`, `slide-live`, `slide-agent-skills`,
  `slide-progressive`, …) and writes layout/treatment CSS scoped to it. Generic
  reusable `.card` / `.stage-card` / `.loop-card` styling shared across slides
  is a fail.
- **No uniform card grid.** If three slides in a row are "N boxes with a border
  and a heading," the deck has failed the variety map (§6.5) regardless of
  content.
- Each slide must use **at least one** richness device below. These are the
  vocabulary that separates the reference from a plain interpretation. Copy the
  device, not the subject.

Device catalog (all present in `example.html` — read it for exact CSS):

| Device | Where it earns its place | Signature |
|---|---|---|
| **Dark gradient terminal card** | The final/"now" item in an evolution/timeline | `current` card: `radial-gradient(... rgba(189,3,247,.22)) , #0b1020`, white text, deeper shadow — the one dark beat on a white deck |
| **Glow-border focal card** | The "NOW"/answer side of a then/now split | `2px solid var(--micron-accent)` + layered `box-shadow` (`0 0 0 1px …`, `0 12px 36px …`, `0 28px 72px …` in accent) — not the soft wash |
| **Circular numbered badge + connectors** | A sequence/loop | `.loop-num` accent-filled circle, abutting cards joined by an `::after` `→` glyph in accent |
| **U-shaped return loop + ∞ badge** | "repeat"/cycle slides | a 3-sided accent border under the row with an arrowhead and a small `∞` chip — shows the loop without an SVG |
| **Multi-color icon chips** | A 6-up prompt/use-case grid | per-cell `--prompt-color` (purple/green/blue/orange/violet/gold), icon in a radial-highlight chip; the grid is colorful but the accent budget is spent only on the kicker/H2 |
| **Icon-rich technical explainer map** | AI / data-flow / architecture / process explainers that need a polished infographic treatment | top input/source strip with semantic colored icons, central numbered pipeline, evidence rail, artifact card, bottom outcome strip with curved accent edge — see §4A.5 |
| **Realistic app chrome + floating pill** | "let's try it"/demo | window bar with traffic dots, skeleton rail/file/code lines, a rounded prompt pill that overhangs the window edge with a blur glow and accent send button |
| **Accent-ruled board** | "anatomy of X" enumerations | one bordered board, rows split by hairlines, a 2px vertical accent rule per row, accent item labels |
| **Featured-panel flow + skeleton + SVG mock** | Progressive discovery / multi-step process | 4 panels joined by `→`, one `.featured` panel with accent border+glow, skeleton `<span>` lines for "detail," an inline SVG mock of the *output* (a slide, a chart) — never lorem text |
| **Executive snapshot readout** | Yield / financial / ops snapshot slides | one focal KPI, one dominant decision chart, one quiet support chart, and a bottom action strip. Never an equal-weight dashboard grid. |
| **Dotted-field two-section title + animated icon** | Cover | **mandatory** faint radial-dot fields masked into two corners (recipe below) + `.title-copy` on the left + `.title-visual` on the right. If no specific image exists, use a large `title-hero` Micron MP4 icon (`pos`) with no divider, no circular border, no square/card background, no shadow. Keep generous gaps between eyebrow/title/subtitle/meta. |

If a slide cannot justify any device, it is probably a hairline-and-whitespace
slide (§6.1) — that is fine, but it is a deliberate choice, not the default.

For official Micron iconography, use `../micron-icons/bin/find-icon.py` rather
than drawing ad hoc symbols or browsing asset folders. `--theme micron-light`
selects `pos` icons by default. Decorative icon use is allowed when restrained;
use `--decorative` for HTML snippets.

### 4A.1 Title dot-grid texture — REQUIRED, not optional

Every cover slide ships the faint purple dot-grid. It is the theme's
signature on slide 1 and the most-missed device. Treat this as a build
requirement, not decoration: no dot-grid means the Micron light title is not
done. The dots are two pseudo-elements on the title stage, using a
`radial-gradient` dot pattern, `background-size: 17px 17px`, low opacity, and
mask-faded into the top-right and bottom-left corners so they never reach the
type. Paste this verbatim for fixed-stage decks. If a deck has no
`.slide-stage`, apply the same recipe to `.title-slide::before` and
`.title-slide::after` instead:

```css
.title-slide .slide-stage::before,
.title-slide .slide-stage::after {
  content: "";
  position: absolute;
  z-index: 0;                 /* behind .slide-content; mark/type stay on top */
  pointer-events: none;
  background-image: radial-gradient(circle,
    color-mix(in srgb, var(--micron-accent) 25%, transparent) 0 2px,
    transparent 2.4px);
  background-size: 17px 17px;
}
.title-slide .slide-stage::before {       /* top-right field */
  top: -36px; right: -18px; left: auto; bottom: auto;
  width: 420px; height: 220px;
  opacity: 0.58;
  -webkit-mask-image: radial-gradient(ellipse at top right, #000 0 42%, transparent 72%);
          mask-image: radial-gradient(ellipse at top right, #000 0 42%, transparent 72%);
}
.title-slide .slide-stage::after {        /* bottom-left field */
  left: -36px; bottom: 0; top: auto; right: auto;
  width: 270px; height: 270px;
  opacity: 0.54;
  -webkit-mask-image: radial-gradient(ellipse at bottom left, #000 0 46%, transparent 74%);
          mask-image: radial-gradient(ellipse at bottom left, #000 0 46%, transparent 74%);
}
```

Acceptance: on the cover, faint purple dots are visible bleeding from the
top-right and bottom-left, fading out before they touch the headline or the
mark. No dots = the slide is not done. (The logo-on-content-slides
`.slide-stage::after` rule must be scoped `:not(.title-slide)` so it does not
fight these — see §8.)

### 4A.1b Content slide paper texture

Content slides should not be pure white emptiness. Keep white as the
protagonist, but give the stage a barely tinted paper field and one
off-canvas semiconductor contour field. This is structure, not decoration:
it keeps light decks from reading blank while preserving the printed-sheet
effect. Do not use the title dot texture on content slides; dots compete with
tables and charts.

```css
.slide-stage {
  background:
    linear-gradient(145deg,
      color-mix(in srgb, var(--micron-white) 76%, var(--light-sheet)) 0 44%,
      color-mix(in srgb, var(--micron-accent) 2.5%, var(--light-sheet-bottom)) 74%,
      var(--light-sheet-bottom) 100%);
}
.slide:not(.title-slide) .slide-stage::before {
  content: "";
  position: absolute;
  right: -330px;
  bottom: -260px;
  width: 860px;
  height: 640px;
  z-index: 0;
  pointer-events: none;
  opacity: .72;
  border-radius: 50%;
  background:
    repeating-radial-gradient(ellipse at center,
      transparent 0 58px,
      color-mix(in srgb, var(--micron-accent) 11%, transparent) 59px 60px,
      transparent 61px 118px),
    radial-gradient(ellipse at 42% 38%,
      color-mix(in srgb, var(--micron-accent) 5%, transparent) 0 18%,
      transparent 58%);
  transform: rotate(-12deg);
  -webkit-mask-image: radial-gradient(ellipse at center, #000 0 52%, transparent 76%);
          mask-image: radial-gradient(ellipse at center, #000 0 52%, transparent 76%);
}
```

Acceptance: the background reads as off-white Micron paper, not gray and not
blank white. The contour field sits mostly off-canvas at bottom-right and
never crosses the headline or chart authority. Never add bokeh, gradient orbs,
full-slide color washes, title-style dot fields, or dark-gray backgrounds to
solve blankness.

### 4A.2 Title hero icon default

When the cover has no specific product shot, subject image, wafer macro, or
approved graphic, use an animated Micron icon instead of inventing a diagram.
Call `../micron-icons/bin/find-icon.py --group title-hero --theme micron-light
--media mp4 --format html --decorative` and choose the icon that fits the
story. For manufacturing / analytics decks, `data-analytics.mp4` is a good
default; avoid wafer if the rendered asset reads awkwardly.

If the MP4 exposes a visible white square on the tinted paper field, fall back
to the matching transparent PNG and give it only a tiny vertical drift
animation. A clean transparent icon is better than an animated icon with a
visible frame.

CSS shape:

```css
.title-slide .slide-content {
  display: grid;
  grid-template-columns: minmax(0, .95fr) minmax(0, .85fr);
  align-items: center;
  gap: 0;
}
.title-copy {
  align-self: center;
  padding-right: 70px;
}
.title-copy .eyebrow {
  margin-bottom: 32px;
  color: var(--micron-accent);
}
.title-copy .subtitle { margin-top: 28px; }
.title-meta { margin-top: 96px; }
.title-visual {
  display: grid;
  place-items: center;
  min-height: 560px;
  padding-left: 64px;
}
.title-hero-icon {
  width: min(520px, 34cqw);
  height: min(520px, 34cqw);
  object-fit: contain;
  mix-blend-mode: multiply;
  pointer-events: none;
}
```

Do not add a vertical divider, circular outline, concentric ring, square
container, card background, blur box, or drop shadow around the MP4. The icon
should be large enough to anchor the right half, balanced away from the right
nav dots, and a little lower than optical center if the handle/shape needs it.

### 4A.3 Panel corners — rounded, never sharp 90° boxes

Structural panels in this theme have **rounded corners**. Sharp-cornered
hairline boxes read as a wireframe, not a finished deck — this is a
recurring miss (the generator draws the panel and leaves it square). Every
bordered/structural panel gets a `border-radius`; the reference deck's scale:

| Element | radius |
|---|---|
| Tight data/timeline card (`stage-card`, evolution card) | `8px` |
| Comparison panel (`compare`/then-now) | `12px` |
| Friendly process card (`loop-card`, `prompt-cell`) | `18–20px` |
| Board / flow / discovery panel, overview card | `10px` |
| App-window mock, focal visual | `14–18px` |
| Small inner mock (slide/chart thumbnail) | `4px` |
| Pills, badges, numbered circles, avatars, send button | `999px` |

Rule of thumb: **8–20px for panels, 999px for pills/badges, never `0`.**
Larger radius = softer/friendlier (process, prompts); smaller = precise
(data, timelines). Any panel that holds edge-to-edge children (a window
with a title bar, a board with rows) also needs `overflow: hidden` so the
corners clip cleanly. A glow/accent border (`2px solid var(--micron-accent)`)
inherits the same radius as its neutral sibling — the NOW card and the THEN
card must have identical corners.

### 4A.4 Executive snapshot readout

Use this for KPI / chart / operating review slides: yield snapshots, finance
summaries, quality reviews, customer metrics, risk updates. The premium version
does **not** look like a small dashboard pasted onto a slide. It reads like an
editorial decision page.

Required hierarchy:

- Give the slide a specific class, usually `.slide-snapshot` or
  `.slide-<topic>-snapshot`.
- Use one focal KPI (`.kpi.focal`) with a pale purple wash or top accent rule.
  The other KPIs stay quiet and text-led. Four equal KPI blocks are a fail.
- Use one dominant chart/panel (`.panel-primary`) and one supporting chart/list
  (`.panel-support`). Do not make two charts the same visual weight.
- Put the decision/ask in a bottom `.action-strip` with a small mono `Action`
  label and a sentence-case action line. Do not leave it as a loose paragraph
  floating under the charts.
- Keep the section-label kicker quieter on dense data slides: still purple and
  uppercase, but smaller/tighter than the headline, with the underbar doing the
  anchoring.
- Fit the fixed 16:9 stage by reducing row gaps, panel padding, and chart row
  height before shrinking text below the theme readability floors.

Useful class vocabulary:

```css
.slide-snapshot .kpi.focal { background: var(--soft-purple-wash); }
.slide-snapshot .panel-primary { background: var(--light-panel); }
.slide-snapshot .panel-support { background: transparent; border-color: transparent; }
.slide-snapshot .action-strip { border-top: var(--hairline); }
```

The point is hierarchy: the eye should read headline → focal KPI → dominant
chart → action strip. If the viewer has to compare every box equally, the slide
is not premium enough.

### 4A.5 Icon-rich technical explainer map

Use this when the prompt asks for "how X works," AI / data-flow /
architecture / process diagrams, or when a reference image shows a polished
infographic with many semantic icons and more than Micron purple. Treat the
recipe below as a flexible role map, not a fixed layout. Adapt the labels,
counts, and side artifacts to the subject; do not depend on a local generated
deck unless the user explicitly asks to match that file.

This pattern is allowed to use a controlled secondary palette because the
colors carry semantic categories, not decoration. Keep Micron purple as the
lead signal, then add a small set of consistent category colors:

- Purple: primary / active / selected state.
- Blue: search, current, refresh, live lookup, discovery.
- Green: trust, policy, quality, verified state.
- Orange: storage, system, organization knowledge, action step.
- Violet: output, answer, chat/check, closing state.

Recommended structure for a single 1600×900 slide:

```text
[big left title + summary] [input/source strip with semantic icons]
[artifact/example card]    [numbered vertical pipeline] [evidence/proof rail]
[bottom outcome/value strip with dark left label + curved accent edge]
```

Required pieces:

- **Top input/source strip:** usually 3–5 white rounded cards. Each card has one
  semantic line icon in a soft tinted chip, a bold name, and one short type or
  role. Use one icon family across all cards. These can be documents,
  databases, teams, systems, sensors, apps, decisions, or any input set the
  story needs.
- **Central pipeline:** 4–6 rounded process cards, each with a colored numbered
  badge, matching icon chip, bold step name, and one short detail line. A
  vertical connector may run behind the badges, but it must stop before the
  bottom strip. It must never pass through labels or overflow into the outcome
  strip. The number is part of the circular badge, not a loose
  label: center it with grid/flex, clip the badge, and avoid broad selectors
  like `.step span` that accidentally restyle `.badge` or `.chip`.
- **Evidence/proof rail:** one side panel with repeated icon rows. Each row has
  a colored circular icon, a colored keyword, and one short explanatory line.
  This rail should feel like the reason to trust the flow, not another bullet
  list. Name it for the subject: "Why it works," "What changes," "Controls,"
  "Signals," "Checks," or similar.
- **Artifact/example card:** the side card should contain a visible artifact,
  not just text. Use whatever concrete object proves the process: prompt/output
  snippet, tiny chart, file mock, search lens, state diagram, mini UI, before/
  after specimen, or domain-specific icon illustration.
- **Optional input/query/specimen card:** if the diagram needs a floating input
  specimen between the artifact card and the pipeline, size it as a real
  artifact, not a tiny badge. Give it enough width for the label and detail
  line, enough height for wrapped text, and reserve matching pipeline padding
  so it does not collide with the first process card.
- **Bottom outcome/value strip:** the dark left label may include a simple
  outline mark (diamond, target, signal) and a short outcome label such as
  "Why it matters," "What improves," "Value," or "Controls." Its purple accent
  should be a curved/arc edge or vertical glow at the boundary, not a hard
  diagonal wedge that cuts through the words. The remaining cells use compact
  colored icon chips plus short labels. Keep the strip opaque if the Micron
  logo sits behind it.

Implementation guidance:

- Inline SVG symbols inspired by Lucide/Tabler are acceptable for this pattern
  when official Micron icons do not cover the semantics. Keep `stroke-width`
  consistent, rounded caps/joins, and no filled emoji/clipart.
- Scope process-card, source/input-card, evidence-row, and outcome-cell text
  selectors to named copy elements, never to all spans. This bad rule moves
  badge numbers and icon chips out of place:

  ```css
  .step span { display:block; margin-top:8px; }
  .source-card span { display:block; margin-top:8px; }
  .proof-row span { display:block; margin-top:7px; }
  .why-cell span { display:block; margin-top:5px; }
  ```

  Use named classes instead:

  ```css
  .step {
    display: grid;
    grid-template-columns: 64px 62px minmax(0, 1fr);
    align-items: center;
  }
  .step-badge {
    width: 56px;
    height: 56px;
    display: grid;
    place-items: center;
    border-radius: 999px;
    overflow: hidden;
    background: var(--step-color);
    color: var(--micron-white);
    font: 800 25px/1 var(--font-display);
    box-shadow: 0 10px 26px color-mix(in srgb, var(--step-color) 26%, transparent);
  }
  .step-chip {
    display: grid;
    place-items: center;
  }
  .step-copy b { display: block; }
  .step-copy small { display: block; margin-top: 8px; }
  .source-card-copy > span,
  .evidence-row-copy > span,
  .outcome-cell-copy > span { display: block; }
  ```

- Do not make the slide purple-only. If the reference has colored icon
  categories, use the semantic palette above and keep purple as the primary
  state rather than the only color.
- Use fixed 16:9 stage geometry and verify at `1024x576`, `1280x720`, and a
  non-16:9 viewport. Inspect screenshots: title padding, the pipeline spine,
  floating input/specimen cards, the bottom strip, and the logo layer are
  common failure points. A non-16:9/tall viewport is especially good at
  exposing text clipped inside small absolute-positioned cards.
- Avoid fixed-height floating cards unless the text is guaranteed single-line.
  Prefer `min-height` plus real padding, `minmax(0, 1fr)` copy columns, and
  shorter detail copy. If the card sits to the left of the pipeline, increase
  the pipeline's left padding/connector offset together with the card width.
- If the Micron logo overlaps the bottom strip, layer it behind content
  (`z-index` lower than `.slide-content`) and make the strip opaque. Do not
  position the logo as an ordinary foreground `<img>` in the content grid.
  Prefer a stage pseudo-element:

  ```css
  .slide:not(.title-slide) .slide-stage::after {
    content: "";
    position: absolute;
    right: 52px;
    bottom: 30px;
    z-index: 0; /* behind .slide-content */
    width: 112px;
    height: 32px;
    background: url("themes/_shared/micron-logo-black-tm-rgb.png") right bottom / contain no-repeat;
    opacity: .9;
    pointer-events: none;
  }
  .slide-content {
    position: relative;
    z-index: 2;
  }
  .outcome-strip {
    position: relative;
    z-index: 3;
    background: var(--micron-white); /* or a fully opaque strip surface */
  }
  ```

- If a title or source strip is crowded, reduce local type or split the slide.
  Do not let the title touch the top edge; leave visible paper margin.

---

## 5. Typography

```css
:root {
  --font-display: "Plus Jakarta Sans", "Micron Basis", system-ui, sans-serif;
  --font-body:    "Plus Jakarta Sans", "Micron Basis", system-ui, sans-serif;
  --font-mono:    "JetBrains Mono", ui-monospace, Menlo, monospace;
  --scale-ratio: 1.333;
}
```

**Scaling contract (non-negotiable for this theme).** Type scales with the
*stage*, not the browser viewport. The stage is a container
(`container-type: inline-size` on `.slide-stage`, see §8), so every fluid size
uses **`cqw`**, not `vw`:

```css
.deck-h2 { font-size: clamp(46px, 4cqw, 72px); }   /* correct */
/* font-size: clamp(46px, 4vw, 72px);  ← WRONG: desyncs from the scaled stage */
```

Fixed px (e.g. the title `h1: 118px`) is fine — it rides the stage's
`transform: scale()`. Mixing `vw` units inside a transform-scaled stage makes
type drift out of proportion as the window changes; this is a common and
obvious failure. When in doubt, copy the size tokens from `example.html`.

Type roles:

- **Section label / kicker** — mono, uppercase, ~22px, accent color, with a 60×4 underbar in accent. Lives top-left of the content frame. Anchors the eye and gives the deck rhythm.
- **H1 / cover headline** — the cover title **mixes ink and purple**, never one flat color. The product/subject name is ink (800, ~118px) and may stack each word on its own line (tight line-height ~0.94) for poster impact; the second line (the "for everyone"-style phrase) is **`--micron-accent`, italic, ~700**, optionally with the gradient underline. This is the cover's equivalent of the H2 accent rule — black phrase + one purple-italic phrase. A monochrome black title on the cover is a fail.
- **H2** — display sans, 800 weight, 46–72px range, line-height 1.08, max ~30ch. **One italic accent word** in `--micron-accent` carries the meaning.
- **Body / supporting clause** — display sans, ~22px, ink. Short. Period at the end.
- **Italic closer** — italic display sans, slightly larger than body, ink at 92% opacity. The slide's emotional resolution. Optional but earns its place often.
- **Footer** — mono, uppercase, muted (~54% ink). Deck-level identity, not a tagline.
- **Mono is reserved** for: kickers, footers, action lines (`Open · Type · Watch.`), and small UI labels. **Never body copy.**

Restraint rules that the brand depends on:

- **Sentence case** for headlines. Never Title Case.
- **Left-align** all text. No centered body copy. Centered single-line italic closers are the only exception.
- **Periods are loud.** Short declarative sentences with full stops. The brand's voice. ("Three steps. Forever.")
- **One italic accent word per H2.** Never two. Never zero. The italic + purple together carry the tone — neither alone is enough.
- **Max 2–3 weights per slide.** Usually 800 (H2), 400/500 (body), 600 (mono).

---

## 6. The restraint principles

These are *the* rules of this theme. They apply whether you're building a data slide, a training slide, or a poster slide.

### 6.1 Hairlines for simple separation; panels for structure

For *simple* separation (a list, a two-up comparison of plain text, a divider), use **1px hairline rules** (`--hairline`) and **whitespace**, not boxes. A page of identical rounded rectangles looks spreadsheety. Ask first: *would a hairline + whitespace carry this?* If yes, use the hairline.

But structured comparisons and processes **earn a panel**. The canonical precedent (`docs/brainstorms/2026-05-15-github-copilot-for-everyone-deck.html`, mirrored in `themes/micron-light/example.html`) uses panels deliberately and correctly: the THEN/NOW split, the evolution timeline, the loop, the progressive-discovery flow. A panel is sanctioned when it encodes real structure (a contrast, a sequence, a state), the panels on a slide are siblings of one system (not nested, not mixed metaphors), and the slide still reads white-first. A panel is forbidden when it is decoration, a single bullet in a box, or a card grid of interchangeable tiles.

### 6.2 One *focal* device per deck (the wash)

The soft-purple wash (`--soft-purple-wash`) is a **focal point**, not chrome and not a panel style: use it for one or two climactic quote/idea/decision surfaces, never to frame routine slides. Structural panels (§6.1) are separate from this and may recur where the content is genuinely structured; the wash stays selective.

### 6.3 White is the protagonist

The 16:9 stage is white. The browser viewport outside the stage is
`--letterbox` (`--light-letterbox`) so the slide reads as a printed sheet on a
desk. Do not fill the slide with gray to "soften" it — use whitespace.

Use `--light-panel` / `--light-panel-soft` only when a real grouping surface
earns it; never use a gray full-slide background.

### 6.4 Each slide answers one question

If you can't write the slide's question down on a sticky note, the slide hasn't earned its place. Two slides answering the same question = merge or kill one.

### 6.5 Variety map across the deck

No two adjacent slides should share the same layout signature. If slide 03 is a three-row stack, slide 04 is not another three-row stack. Restraint at the slide level + variety at the deck level keeps the rhythm awake.

### 6.6 Refuse decoration

No drop shadows on text. No glow on type. No gradients behind body. No 3D charts. No emoji used as bullet markers. No clipart. No floating card stacks.

The accent's job is to make one moment loud, and silence is the rest of the deck's job.

---

## 7. Brand chrome (what every content slide reuses)

These are *available* — not mandatory. Use the ones the slide actually needs.

- **Top progress bar** — 3px, accent color, with a soft accent glow. Spans the viewport.
- **Right-edge nav dots** — compact vertical column at viewport right, muted dots, accent on active. Use the reference density (`button` about 32×18px, dot 6px, no large 44px vertical slots) so the dots read as one tight progress rail rather than a spaced menu.
- **Section-label kicker + 60×4 underbar** — top of the content frame.
- **Italic closer** — bottom of the content frame, optional.
- **Micron logo** — bottom-right of the stage on content slides. Black logo, full opacity. Title slides use the logo inline in their footer block instead.
- **Footer text** — optional. Mono uppercase, muted, bottom-left. Use only if the deck-level identity needs to be visible per slide; many decks read better without it.
- **Presentation mode** — top-right `.presentation-hotspot` with a hidden-until-hover/focus `.present-toggle` pill, play icon, and `Present` label; requests fullscreen on click and with the `P` shortcut. Expected on managerial decks because they get projected.
- **Build fragments** — `data-build-step` elements that slide in horizontally as arrow/space/click advances the staged build before the slide changes. Use for any teaching sequence (the progressive-discovery slide is the canonical case).

**Forbidden chrome:** do not add visible slide coordinate labels such as
`01 / Snapshot`, `02 / Waterfall`, or a `.slide-coord` element. They compete
with the section-label kicker and make the slide feel annotated rather than
presented.

**Hidden in this theme**: Micron's `.module-rail` (the vertical chapter navigation) is set to `display: none` for light decks. Don't draw one — the top progress bar + right nav dots are the wayfinding.

---

## 8. Stage geometry

Light theme decks are **fixed-stage**: a 16:9 white canvas, centered in a `--letterbox` viewport, with a subtle drop shadow.

Recommended stage dimensions: **1600 × 900** (or 1280 × 720 for smaller decks). Pick once per deck and stick with it.

Why fixed-stage: a white slide that stretches edge-to-edge in a 1440×900 browser feels like a webpage, not a slide. The letterbox treatment makes it read as a printed sheet — and is what makes premium audiences trust the deck on first glance.

The non-negotiable from the skill (`Fixed-stage decks must expose a real 16:9 slide canvas`) applies here.

**Architecture: use the `.slide-stage` wrapper, not the bare
`fixed-stage.md` overlay.** The generic overlay in
`references/runtime/fixed-stage.md` (scale `.slide-content` directly, no
container) is the *minimum* fallback. Managerial / enablement micron-light
decks — the standard for this theme — use the richer model from
`example.html`, because per-slide layouts depend on it (the `cqw` typography
contract in §5 needs a container; letterbox math needs scaled-size vars):

```css
.slide-stage {
  container-type: inline-size;            /* enables cqw typography (§5) */
  container-name: deck-stage;
  position: absolute;
  left: calc((100vw - var(--stage-scaled-width)) / 2);
  top:  calc((100dvh - var(--stage-scaled-height)) / 2);
  width: var(--stage-width); height: var(--stage-height);   /* 1600×900 */
  transform: scale(var(--stage-scale));
  transform-origin: top left;             /* NOT center — letterbox math */
  overflow: hidden; display: flex; flex-direction: column;
  background: var(--micron-white);
  filter: drop-shadow(0 18px 60px color-mix(in srgb, var(--ink) 14%, transparent));
}
```

The controller wraps each slide's children in `.slide-stage` itself
(`setupFixedStage()` in `example.html`) and sets three vars on resize:

```js
const scale = Math.min(window.innerWidth/1600, window.innerHeight/900);
root.style.setProperty("--stage-scale", scale);
root.style.setProperty("--stage-scaled-width",  1600*scale + "px");
root.style.setProperty("--stage-scaled-height",  900*scale + "px");
```

Keep the canonical controller (`window.presentation = new
SlidePresentation()`), the `.slide-stage`-clone overview, **presentation
mode** (the top-right hover-only `.present-toggle` fullscreen button + `P` shortcut), and the **horizontal
build-fragment** controller (`data-build-step`, click/arrow advances the
staged build before the slide changes) — these are part of the theme's feel,
not optional polish. Lift them from `example.html` verbatim; do not
re-invent a simpler version.

Recommended stage dimensions: **1600 × 900** (or 1280 × 720 for smaller
decks). Pick once per deck and stick with it. Why fixed-stage: a white slide
that stretches edge-to-edge feels like a webpage; the letterbox makes it read
as a printed sheet, which is what makes premium audiences trust the deck on
first glance.

---

## 9. Motion

Single ease, single duration, single transform pattern.

```css
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
--duration-normal: 0.6s;

.reveal { opacity: 0; transform: translateY(22px);
  transition: opacity .6s var(--ease-out-expo),
              transform .6s var(--ease-out-expo); }
.slide.visible .reveal { opacity: 1; transform: none; }
```

Stagger by ~70ms via `:nth-child` delays. Six steps max — beyond that, the slide is doing too much.

No bouncing eases. No spring physics. No parallax. The motion is editorial — it ushers content in, then gets out of the way.

---

## 10. Gotchas

The recurring failure modes when building in this theme:

- **Purple in the wrong place.** Headline is purple → fail. Body has a purple word that isn't italic → fail. Accent on chrome (border, divider) → wastes the budget. Accent reads as emphasis only because it's rare; spending it on furniture kills the signal.
- **Dark-gray light theme.** Slate panels, charcoal fills, and generic gray
  bars make the deck feel like a dark theme inverted onto white. Use
  violet-tinted ink for text and pale violet/cool-blue tints for structure.
- **Generic uniform cards (the #1 failure).** Rendering every slide as the same `1px hairline + 8px radius + #fff` box collapses the deck into a spreadsheet. Each slide needs its own bespoke class and at least one richness device from §4A. This is what separates a plain interpretation from the reference.
- **Purple-only technical explainers.** If the reference uses colorful semantic
  icons, do not flatten it into Micron purple badges only. Use the controlled
  icon palette in §4A.5 so each input, check, action, storage, and output state
  remains visually distinct.
- **Pipeline spine overflow.** Vertical connector lines in technical explainers
  must be scoped to the pipeline area only. They should stop near the last step
  and never continue into the bottom outcome strip or through benefit labels.
- **Loose badge numbers or drifting icon chips.** A numbered pipeline badge is
  a single circular UI element. If numbers appear above, left of, or outside
  the colored circle, or source/proof/benefit chips sit off-center, the CSS is
  usually using broad descendants such as `.step span`, `.source-card span`, or
  `.why-cell span`. Use named badge/chip/copy classes instead.
- **Clipped floating specimen cards.** Absolute-positioned input, query, or
  specimen cards often look fine at 16:9 and clip in tall/non-16:9
  verification. Use `min-height`, adequate width, and reserved pipeline
  padding; then inspect the tall screenshot before shipping.
- **Bottom strip accent cutting text.** A dark outcome/value strip may have a
  curved purple edge or glow at the boundary, but the accent must not slice
  through the words. Reserve a clear text lane before drawing the curved edge.
- **Logo on top of content.** Content-slide logo pseudo-elements should sit
  behind the content layer when a bottom strip spans the slide. Make the strip
  opaque if the logo would otherwise ghost through it. If the logo appears
  clipped, floating above the strip, or competing with benefit text, move it to
  the stage background layer or reserve an empty safe area.
- **Equal-weight dashboard snapshot.** KPI rows and chart grids where every
  block has the same border, size, and emphasis feel like an app screenshot,
  not an executive slide. Use the §4A.4 snapshot hierarchy instead.
- **Competing chart panels.** Two charts with equal weight force the audience to
  choose the story. Make one chart primary and one support.
- **Loose action footnote.** A naked paragraph under a data layout reads like an
  afterthought. Use a bottom action strip when the slide asks for a decision.
- **Sharp-cornered panels.** A 1px hairline box with `border-radius: 0` reads as a wireframe. Structural panels are rounded (§4A.3); only intentional full-bleed rules/dividers are square.
- **Framed title MP4.** The cover icon must not sit in a square box, circle,
  card, glow, or drop shadow. Put the official MP4 directly on the light field
  and use `mix-blend-mode: multiply` if the exported video frame is visible.
- **Divider between title and icon.** The Micron-light cover is two sections,
  but not two panels. Do not draw a line between left title and right icon.
- **Bare `fixed-stage.md` overlay on a managerial deck.** Scaling `.slide-content` with `transform-origin:center` and no container ships a deck whose typography can't use `cqw` and whose per-slide layouts have nowhere to anchor. Use the `.slide-stage` model from §8.
- **`vw` type inside the scaled stage.** `clamp(...,Xvw,...)` drifts out of proportion as the window resizes because the stage is already transform-scaled. Use `cqw` (§5).
- **Cards-on-cards.** A 3-card use-cases slide followed by a 3-card steps slide followed by a 3-card pricing slide all blur together. Replace one with manuscript rows or a hairline split — variety map saves the deck.
- **Accent word on H2 is bold but not italic.** The italic is half the brand. Bold purple alone reads as a typo.
- **Recoloured logo.** The micron logo ships in black or white only. Don't tint it accent. Don't add effects. The Anthropic-style "purple Micron" is not a thing.
- **Letterbox color drift.** When the body background is pure white (`#fff`), there's no visible distinction between viewport and stage. The stage shadow + the violet-tinted `--light-letterbox` do the work — keep both.
- **Mono creeping into body copy.** Mono is for kickers, footers, action lines (verbs joined by `·`), and small ALL-CAPS labels. The moment you set a paragraph in mono, the slide loses its editorial register.
- **Centered body copy.** The brand is left-aligned. Centered text reads as a poster, not an editorial page. The exceptions are short single-line italic closers and stat-row hero numbers — which usually only earn centering once or twice in a deck.
- **Drawing the `.module-rail` rail.** Light theme hides it (`display: none`). Use the top progress bar + right nav dots for wayfinding instead.
- **Slide coordinate labels.** Do not show `01 / Snapshot` style labels or
  `.slide-coord` chrome. The content kicker is enough.
- **Purple wash everywhere.** The soft-purple wash works because it is selective. One or two strong focal surfaces are enough.
- **Sentence-end punctuation drift.** "Three steps · Forever" feels conversational; "Three steps. Forever." feels brand. The full stops are the voice.

---

## 11. Voice the type carries

Sample H2s that fit this theme — note the cadence:

- *Three steps. **Forever.***
- *A different **kind** of help.*
- *Same name. Different **software**.*
- *What to type **tomorrow morning**.*
- *Anyone. Anything. **Today**.*

Note the ingredients: short clauses, period-after-each, one italic+purple accent word that flips the sentence's meaning if removed. If you find yourself writing an H2 longer than ~10 words, break it.

---

## 12. Data viz (when the deck has charts/tables)

The theme stays calm even in data slides:

- **Chart background**: white. Never a panel.
- **Grid / dividers**: `--hairline` (1px).
- **Base data**: `--light-bar` (so it reads but recedes without becoming dark gray).
- **Suppressed data**: `--light-track`.
- **Highlight**: `--micron-accent` — exactly one series, one bar, one cell, or one point per chart.
- **Snapshot hierarchy**: one focal KPI, one primary chart, one support chart,
  one action strip (§4A.4). Avoid equal-weight dashboard grids.
- **Direct labels** beat legends; legends beat colour-only encoding.
- **Tabular numbers**: `font-variant-numeric: tabular-nums`. Always.
- **No 3D, no shadows, no gradients inside charts, no icons-as-data.**
- **Tables**: hairline row dividers; one accent row max; left-aligned text; right-aligned numbers; never full-row colour fills.

If the chart needs more than one accent to read, the chart is doing too much — split it.

---

## 13. Imagery (when the deck has images)

Light decks tolerate imagery if it's crisp and inspectable:

- Product render on white or `--light-panel-soft`
- Bright manufacturing / lab environment
- Macro wafer detail as cropped accent
- Light cinematic people imagery, natural

Avoid: dark cinematic image as full-bleed background, blurry atmospherics, busy image with overlay text, generic stock.

If using an image, give it room. One image per slide, max. The image is a quote — let it speak alone.

---

## 14. Quick acceptance checklist

Before you ship a slide:

- [ ] `.slide-stage` wrapper + container queries (§8); typography in `cqw`, not `vw` (§5)
- [ ] Slide has its own bespoke class and ≥1 richness device from §4A — not a generic uniform card
- [ ] Cover slide has the faint purple dot-grid fields (§4A.1) bleeding from two corners — not optional decoration
- [ ] Cover uses `.title-copy` left + `.title-visual` right when there is a hero visual; no divider between them
- [ ] If no specific title image exists, cover uses a large official Micron animated MP4 icon from `../micron-icons` (`title-hero`, `pos`)
- [ ] Cover MP4 has no circular border, square/card background, filter, or shadow; use `mix-blend-mode: multiply` if the frame shows
- [ ] Cover copy has breathing room between eyebrow, title, subtitle, and meta
- [ ] Cover headline mixes ink + a purple-italic phrase (§5) — not a flat monochrome title
- [ ] Every structural panel has a rounded corner (§4A.3: 8–20px; pills/badges 999px) — no sharp 90° hairline boxes
- [ ] Icon-rich technical explainers follow §4A.5 as a flexible role map:
      semantic icon colors, visible input/source strip, numbered pipeline,
      evidence rail, artifact/example card, and outcome strip with curved accent
      edge
- [ ] Pipeline connector lines stop before the bottom strip; no connector line
      runs through benefits or labels
- [ ] Pipeline badge numbers are visually centered inside the colored circles;
      no broad `.step span` rule can affect badges or icon chips
- [ ] Any floating input/specimen artifact has no clipped text at both 16:9 and
      tall/non-16:9 verification sizes, and nearby process content is padded to
      avoid it
- [ ] Bottom-strip Micron logo is behind content and fully hidden by the opaque
      strip when they overlap
- [ ] KPI / chart snapshot slides use §4A.4 hierarchy: one focal KPI, one dominant chart, quiet support panel, bottom action strip
- [ ] Top-right hover-only `.present-toggle` + horizontal build-fragment controller present (lifted from `example.html`)
- [ ] White stage, ink (not pure black) headline
- [ ] One italic + purple accent word in the H2
- [ ] Panels only where they encode real structure (comparison / sequence / state); the soft-purple wash used selectively for one or two focal devices
- [ ] Hairlines used for simple separation (no thick rules)
- [ ] Section-label kicker present, with underbar
- [ ] No visible `.slide-coord` / `01 / Section` coordinate label
- [ ] Logo bottom-right (content slides), full opacity, black variant
- [ ] No centered body copy; sentence case headlines
- [ ] Periods at the end of declarative lines
- [ ] Mono only on chrome (kicker / footer / action lines / ALL CAPS labels)
- [ ] At most one accent highlight per chart
- [ ] No two adjacent slides share a layout signature

If a slide passes this list, it'll feel like Micron light — regardless of what its actual layout is.

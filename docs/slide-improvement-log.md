# Slide System Improvement Log

The self-improvement loop reads this FIRST every iteration so it never repeats
a change, and appends one entry after each committed improvement.
Format per entry: date · change · why · evidence (gate result) · source.

> The loop prompt lives in `docs/slide-improve-loop-prompt.md`.

## Baseline (already done — do NOT redo these)

- 2026-06-13 · **Built the fast path** — new `slide-quick` (intake → outline →
  consultant → wireframe → native PptxGenJS PPTX, ~15 min, ≤2 replies) and
  `slide-consultant` (Pyramid/SCQA/MECE/action-title content reviewer).
- 2026-06-13 · **Merged `slide-layout-designer` into `slide-brainstorm`**
  (`references/layout-blueprint.md` + `archetypes.md` + `lora-reference.md`);
  deleted the standalone skill.
- 2026-06-13 · **Brainstorm artifact → wireframe fidelity** (gray `.wf-box`
  placeholders) while keeping the annotation DOM
  (`section.deck > article.slide-panel[data-slide]`). All content-rigor gates kept.
- 2026-06-13 · **Native engine** in `slide-quick/templates/` (`builder.js`,
  `themes.js` = midnight + light, `example-build.js`); glows via sharp.
- 2026-06-13 · **Validation workflows** — `slide-quick-test` (review+improve,
  generate, review) and `slide-pipeline-test` (full HTML+PPTX gate chain).
- 2026-06-13 · **Applied 21 reviewer findings** — killed phantom `montage`/`sharp`
  refs, added a fabrication guard to the consultant title-number rule, a `.pptx`
  improve branch, PASS/no-issues output, Chart & Comparison integrity frameworks,
  `.image-placeholder`→`.wf-box`, PptxGenJS noFill/noLine + codeText-height fixes,
  light-theme footer contrast.

- 2026-06-13 · **Visual-quality dimension added** — researched slide visual
  excellence and added `slide-quick/references/visual-playbook.md` (10 moves, type
  floors, 3 ready palettes, font pairings, the icon→PNG PptxGenJS pipeline). Wired
  the "make it look designed, not just boxes" rules + a visual bar into slide-quick's
  build + QA-lite, and added a visual-quality improvement category + gate to the loop
  prompt. (The deeper engine work — real icons, image-led layouts, palette refresh —
  is left for the loop to do iteratively, gated.)

## Iterations
<!-- newest first; the loop appends here -->

- 2026-06-13 · **2×2 quadrant / prioritization matrix in the native engine** — added
  `B.quadrant(s, px, py, S, {xLabel, yLabel, quadrants, washes, items})` to
  `builder.js`: hairline cross axes, faint corner labels, bubbles plotted by {x,y}
  in 0..1, and "how good" encoded with ONE accent colour at GRADED opacity (sweet-
  spot quadrant strongest → worst none) so the eye averts to the darkest cell. Item
  labels point outward (left-half→left, right-half→right; `side` overrides) so they
  never collide. Added example slide 10 (impact-effort, quick-wins lit); footers
  bumped to /10 and the stale cover copy "Seven"→"Ten slides". Wired the rule into
  slide-quick `SKILL.md` + visual-playbook. · **Why:** the 2×2 (impact-effort, BCG
  growth-share) is the one ubiquitous strategy/product exhibit still missing — a
  spatial-positioning view fundamentally different from the linear/tabular exhibits.
  · **Evidence:** built midnight + light, rendered both via LibreOffice. First render
  exposed a real bug — I had shipped `right = it.x < 0.6` (the planning stub) instead
  of the side-aware outward rule, so left-quadrant labels pulled to centre and
  collided ("Native charts" over its bubble, over "New theme pack"); fixed to
  `it.side ? … : it.x >= 0.5` and re-rendered clean. Final: graded wash draws the eye
  to "Quick wins", labels collision-free, accent bubbles, AA both themes; slides
  01–09 unregressed (footers "/ 10"). Excellence cold-judge: PASS, genuine consulting
  2×2, zero slop. · **Source:** BiteSize impact-effort matrix; LaunchNotes 2×2;
  LogRocket — Impact-Y/Effort-X, four named quadrants, grade ONE colour by opacity
  (accessible, highlights the best cell), never four colours.

- 2026-06-13 · **Timeline / roadmap exhibit in the native engine** — added
  `B.timeline(s, y, items, {current})` to `builder.js`: one horizontal axis with
  evenly tiled circular markers (date above · phase + one line below), the axis +
  markers accented up to `current` to show progress and hollow after — NOT a row of
  phase cards. Added example slide 09 (a 4-quarter rollout roadmap, current=Q2);
  footers bumped to /9. Wired the rule into slide-quick `SKILL.md` + visual-playbook.
  · **Why:** the engine had no timeline — the phased-plan exhibit in nearly every
  strategy / project / product / pitch deck — so a roadmap slide had to fall back to
  boxes. · **Evidence:** built midnight + light, rendered both via LibreOffice. First
  render exposed a real bug — adjacent node labels OVERLAPPED ("…feedback loopAll of
  engineering…") because centered `step`-wide boxes collided; fixed by tiling n equal
  columns (dot at each centre, text = colW−0.4, no clamp) and re-rendered clean. Final:
  clean axis, progress accent through Q2, hollow Q3–Q4, no overlap, AA both themes;
  slides 01–08 unregressed, footers now "/ 09". Excellence cold-judge: PASS, premium
  roadmap, zero slop. · **Source:** Slideworks (consultant roadmaps); Visme roadmap
  examples; SlideModel horizontal-timeline (one axis, circular markers, short
  date+label beneath, restraint, let visuals carry it).

- 2026-06-13 · **Decision matrix + Harvey balls in the native engine** — added
  `B.harvey(s,x,y,d,level,color)` (a ring filled 0–4 quarters via a PptxGenJS PIE
  wedge — the McKinsey/BCG "how good" ideogram) and `B.compareTable(s,y,{options,
  rows,highlight})` (options across, criteria down, hairline row rules ONLY, the
  recommended column carrying an accent header + cap + faint wash; cells = short
  string / `✓`–`—` / a 0–4 Harvey ball) to `builder.js`. Replaced example slide 02
  — which was literally "two bordered panels + three bullets each", the exact
  rows-of-cards / three-bullets slop THE BAR auto-fails — with a real decision
  matrix (Manual vs Full pipeline vs Quick path, Quick path recommended; honest —
  Full pipeline still wins the visual-polish row). Wired the rule into slide-quick
  `SKILL.md` + visual-playbook. · **Why:** the engine had NO comparison exhibit, so
  any "which option" slide defaulted to the panels-of-bullets slop; the decision
  matrix is the most common exec/consulting comparison and was impossible before.
  · **Evidence:** built midnight + light, rendered both via LibreOffice. First render
  exposed a real bug — a negative PIE start angle made levels 1–3 render wrong
  (level-1 came out full); fixed to positive `angleRange:[0,90*level]` and verified
  with an isolated 0–4 Harvey strip (clean empty→quarter→half→¾→full). Matrix then
  rendered data-accurate in both themes: proportional balls, accented recommended
  column, ✓ green / — dim, hairline chrome, ~25% whitespace; slides 01,03–08
  unregressed. Excellence cold-judge: PASS, a genuine Big-Three exhibit, zero slop.
  · **Source:** Deckary comparison-slide formats; Ampler & Deckary on Harvey balls
  (Big-Three "how good" ideograms); Stratechi (McKinsey-alum) decision-matrix
  convention — options × criteria, 1–3 words/cell, highlight the recommendation.

- 2026-06-13 · **Split (visual-led two-column) layout in the native engine** — added
  `B.split(s, opts)` to `builder.js`: lays a narrative LEFT column (kicker + title +
  body) and RETURNS the visual-zone rect {x,y,w,h} for the RIGHT, so a chart/icon/
  stat drops straight in (`side:'left'` flips). Made `kicker` and `title` accept an
  optional `x`/`w` column override (backward-compatible defaults MX/CW) so they can
  live in a column. Added example slide 08 (narrative-left + before/after chart-
  right; footers bumped to /8) and wired the rule into slide-quick `SKILL.md` +
  visual-playbook move #8. · **Why:** every native slide was full-width stacked
  (title-on-top, visual-below); the engine couldn't do the analyst-standard "claim
  left, exhibit right," so composition never varied — a flatness the bar penalises.
  · **Evidence:** built midnight + light, rendered both via LibreOffice. Slide 08
  reads as a real two-column exhibit — claim left, accented before/after bars right,
  reading gravity respected, AA in both themes; the comparison slide (uses the now-
  parametrised kicker/title) and slides 01–07 unregressed, footers now "/ 08".
  Excellence cold-judge: PASS, clear composition gain, zero slop. · **Source:** Visme
  / Pitchworx / Piktochart on visual hierarchy + reading gravity (Gutenberg diagram,
  Z/F-pattern: narrative left, focal exhibit right; pick one focal element).

- 2026-06-13 · **Hand-drawn (sketchnote) html-slides theme — completes the style
  range** — added `themes/hand-drawn/` (tokens.css + example.html + design.md +
  screenshots) and registered it in `themes/themes.json`. A DISTINCT sketchnote
  mode: `Caveat` handwriting display over clean `Nunito` body, warm paper dot-grid,
  and wobbly ink via one SVG filter (`#rough`: feTurbulence + feDisplacementMap)
  applied to borders/underlines/arrows ONLY, never text. Helpers: `.sketch` frame,
  `.sticker`, `.hl` highlighter swipe, `.ul` underline, pen colors; a flow diagram
  of `.node.sketch` boxes joined by inline rough `<svg>` arrows. · **Why:** THE BAR
  demands the full style range (hand-drawn / playful / premium); the system had
  premium + playful but NO hand-drawn anywhere. html-slides is the right vehicle —
  web fonts + CSS/SVG nail handwriting + rough texture where portable PPTX cannot.
  · **Evidence:** `verify.py --theme hand-drawn` EXIT 0, no page errors (fixed two
  it caught: a nowrap highlight overflowing at 375px, and an ILLUSTRATIVE line under
  the 24px body floor); cold-judged the rendered screenshots — title (handwriting +
  highlighter + doodle arrow), a sketchnote flow diagram, a circled stat — reads as
  a genuine "YouTube lesson" sketchnote, distinct from playful, zero slop, charming
  not childish. Regression: existing `playful` theme still verifies EXIT 0 against
  the edited manifest (shared verifier intact). Change is theme-additive (no
  pipeline code touched), so gated via verify.py + visual review, not the heavy
  pipeline workflow. Excellence cold-judge: PASS. · **Source:** Autoppt / Slidesgo
  2026 / MS PowerPoint design-styles (sketchnote = handwriting heading + clean body,
  restraint keeps it from childish); Google Fonts Caveat/Nunito; SVG filter
  feTurbulence+feDisplacementMap rough-ink technique; WebAIM contrast.

- 2026-06-13 · **Playful mode — a distinct native style (not a recolour)** — added
  a `playful` theme to `themes.js` (warm cream canvas + deep coral/teal/violet
  block palette, white-AA verified: 5.35 / 4.67 / 5.67; muted 4.80 on cream) and
  three ADDITIVE block primitives to `builder.js` — `B.solidKicker` (filled pill,
  white text), `B.block` (solid saturated rounded block), `B.blockRow` (bold
  multi-colour blocks with white icon + heading + line). New `example-playful.js`
  (5 slides: cover with flat accent circles, bold-block pillars, hero-number-on-
  block, a playful-tinted chart, block CTA). Wired playful into slide-quick
  `SKILL.md` intake/PREFS + a "distinct mode, not a recolour" build rule, and into
  visual-playbook. · **Why:** THE BAR demands the FULL style range (hand-drawn /
  playful / premium) as distinct modes, but the engine only did premium (midnight +
  light). Playful was the achievable missing mode (hand-drawn needs sketch fonts
  PPTX can't guarantee). · **Evidence:** built playful + rebuilt midnight + light,
  rendered all via LibreOffice. Playful reads as a genuinely distinct mode — bold
  saturated blocks, solid kicker pills, big friendly type, warm palette — zero slop
  (multi-colour solid blocks ≠ neutral equal cards; flat circles ≠ gradient soup);
  white text AA on every block; one overlap (footer under a circle) caught and
  fixed before commit; midnight/light byte-unregressed. Excellence cold-judge: PASS.
  · **Source:** Autoppt presentation-design styles; Slidesgo 2026 trends; MS
  PowerPoint creative-ideas blog (bold geometric colour blocks + big friendly
  headings balanced with a clean body so it never reads childish); WebAIM contrast.

- 2026-06-13 · **Real icons in the native engine (vendored Tabler set)** — added
  `B.loadIcons(names, opts)` (async — reads vendored Tabler outline SVGs, tints
  `currentColor`→accent, rasterizes to transparent 256px PNG via sharp),
  `B.icon(s, dataURI, x, y, size)`, and a chrome-less `B.iconRow(s, y, items)`
  (icon + bold label + supporting line, NO bordered cards) to `builder.js`.
  Vendored 24 curated MIT Tabler icons into `assets/icons/` with a `NOTICE`
  (license + how to add more). Refactored `example-build.js` into an async IIFE
  (so it can `await loadIcons`) and added slide 07 (3 real-icon pillars); footers
  bumped to /7. Wired the rule into slide-quick `SKILL.md` + visual-playbook move
  #2. · **Why:** move #2 ("real icons, not boxes or emoji") was documented but the
  engine had ZERO icon support, so every concept slide fell back to flat `node`
  boxes — a core AI-slop tell. Icons are the biggest visual lever that applies to
  ALL style modes. · **Evidence:** built midnight + light, rendered both via
  LibreOffice. Slide 07 shows three crisp accent-tinted icons (bolt/target/shield),
  chrome-less, generous whitespace, AA labels in both themes; slides 01–06 (incl.
  the chart) unregressed, footers now "/ 07". Excellence cold-judge: PASS, reads as
  designed, zero slop tells. · **Source:** Tabler Icons (MIT, github.com/tabler/
  tabler-icons); visual-playbook move #2 + SVG→PNG sharp pipeline (already in the
  playbook); Duarte/Reynolds (one idea + glyph, generous whitespace).

- 2026-06-13 · **Chartjunk-free chart helper in the native engine** — added
  `B.chart(s, type, series, opts)` to `builder.js` (type = `col`/`bar`/`line`):
  a REAL, editable PptxGenJS chart (`addChart`, not an image, not shapes) with
  Knaflic declutter baked in — no chart title, no gridlines, hidden value axis,
  data labeled directly, and ONE accent series/bar with the rest muted
  (`opts.highlight`); theme fonts/colors throughout. Wired an example column-chart
  slide (06, Q3 inflection highlighted) into `example-build.js` (footers bumped to
  6) and a "trends/comparisons get a real chart, never a faked one" rule into
  slide-quick `SKILL.md` + a "Charts (Knaflic declutter)" section in
  `references/visual-playbook.md`. · **Why:** the engine could make single-number
  callouts (`stat`/`statBand`) but had NO way to draw a trend/ranking/comparison —
  the single most common analyst exhibit — so those slides fell back to box+bullets,
  the exact AI-slop tell. PptxGenJS charts are editable, so this clears the bar AND
  keeps the deck native-editable. · **Evidence:** built midnight + light, rendered
  both via LibreOffice. Slide 06 reads as a genuine exec exhibit — no gridlines/axis
  noise, labels on the bars, one accent bar drawing the eye to the inflection,
  generous whitespace, AA-readable labels in both themes; slide 05 statBand + earlier
  slides unregressed (footers now "/ 06"). Excellence cold-judge: PASS, zero slop
  tells. · **Source:** Cole Nussbaumer Knaflic, *Storytelling with Data*, ch. 3–4
  (remove border/gridlines/markers, clean axes, label directly, single highlight
  colour); PptxGenJS `addChart` API (chartColors, valGridLine/catGridLine,
  valAxisHidden, showValue/dataLabel*).

- 2026-06-13 · **Big-number exhibit vocabulary in the native engine** — added
  `B.stat` (hero value + small-caps label + colored delta) and `B.statBand`
  (2–4 KPIs with hairline dividers and NO card chrome) to `builder.js`, plus
  AA-checked `good`/`bad` delta colors to both themes (`themes.js`); wired an
  evidence slide into `example-build.js` and a "lead with the number, not
  bullets" rule into slide-quick `SKILL.md` + `references/visual-playbook.md`.
  · **Why:** the engine could only make "box + bullets" data slides — the exact
  AI-slop tell THE BAR rejects; the big-number callout is the signature
  consulting exhibit and was previously impossible. · **Evidence:** built
  midnight + light, rendered both via LibreOffice. Slide 05 reads as a real exec
  KPI band — hero numbers as protagonist, chrome-less dividers, ~25% whitespace,
  AA contrast in both themes, ILLUSTRATIVE tag; earlier slides unregressed.
  Excellence cold-judge: PASS, zero slop tells. · **Source:** SlideModel "How to
  Present Key Metrics"; FanRuan KPI card design (4-layer callout: label · value
  · delta · context; ≤3–4 callouts per slide).


## Failed experiments
<!-- Scrapped changes that did NOT clear the bar (reverted, not committed). Record so
     the loop never retries a dead end. Format: date · what was tried · why it failed. -->


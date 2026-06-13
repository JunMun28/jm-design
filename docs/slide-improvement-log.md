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

- 2026-06-13 · **Made the consultant's two integrity checks actionable on the fast
  path** — "Chart & number integrity" and "Comparison integrity" were bare
  `see references/frameworks.md` stubs in the consultant SKILL.md check list, but the
  fast path invokes the consultant and reads only its SKILL.md (not frameworks.md), so
  on EVERY quick deck those two checks reached the agent with no actionable rule —
  effectively non-functional. Inlined concise rules (faithfully transcribed from
  `frameworks.md` §Chart & number integrity / §Comparison integrity), keeping the
  `(details: frameworks.md)` pointer: title number must match the visual (mismatch =
  P0); percentages need a visible/inferable denominator; FLAG (don't fix) truncated
  baselines / mismatched dual axes / cherry-picked ranges; never alter a value to fit
  a title — reframe it; comparisons share unit/timeframe/scope/dimension-count, real
  baseline, one axis per slide. · **Why:** a chart-title/visual mismatch or
  apples-to-oranges comparison is a P0 boardroom-credibility failure; the consultant
  was silently skipping both on the fast path. · **Evidence:** the inlined text was
  verified line-by-line against `frameworks.md` (the already-validated source) and now
  matches the format of every other check in the list; the block reads cleanly. This
  is a zero-mechanism, additive doc inline (no flow/structure change), so it was gated
  by fidelity + structural inspection rather than a 4th heavy slide-quick-test run
  (which can't detect a fidelity issue and has no flow to regress — same proportionality
  call as the path-fix iteration). Excellence cold-judge: PASS — closes a real
  integrity hole on every deck. · **Source:** `slide-consultant/references/frameworks.md`
  (Zelazny/IBCS/Knaflic chart + comparison integrity); slide-quick-test workflow rank-6
  finding (prior run).

- 2026-06-13 · **Harvey-ball rendering polish (correct fill origin + matrix
  hierarchy)** — two render bugs in the decision-matrix exhibit, both surfaced by the
  prior gate workflow: (1) `harvey()` filled from 3 o'clock (`angleRange:[0,90*level]`)
  so a "half" ball filled the BOTTOM — not how a Harvey ball works; changed to
  `[270,270+90*level]` (start at 12 o'clock / North, clockwise; positive angles, so
  the pptxgenjs negative-start constraint still holds). (2) non-highlighted balls in
  `compareTable` used `T.ink` — near-white on midnight — so a full ball in a
  non-recommended column was the brightest object and out-shouted the accented
  column; changed to `T.muted` (recessive but visible). · **Why:** the decision matrix
  is a flagship exhibit; a hostile expert would flag bottom-filling Harvey balls, and
  the inverted hierarchy drew the eye AWAY from the recommendation — defeating the
  matrix's whole purpose. · **Evidence:** verified with an isolated 0–4 Harvey strip
  (now empty → top-right quarter → right half → three-quarter → full; the >360° end
  angles render fine), then rebuilt midnight + light and rendered: slide 02 shows
  conventional balls and the accent "Quick path" column clearly dominant in both
  themes; `harvey` is used only by `compareTable`, so no other slide is affected;
  build is 10 pages, unregressed. Excellence cold-judge: PASS — clear correctness +
  hierarchy gain on a flagship exhibit. · **Source:** slide-quick-test workflow
  findings (ranks 2–3, prior run); Harvey-ball convention (fill clockwise from 12
  o'clock); Knaflic — one accent, recessive rest.

- 2026-06-13 · **Tightened the slide-quick ↔ slide-consultant handshake (content
  contract + fabrication guard)** — the consultant runs on EVERY quick deck but its
  improve-mode contract was written for the file case, leaving the inline return
  format undefined and the handoff fragile. Fixes: (1) consultant `improve` mode now
  spells out the inline return — the FULL rewritten table, echoing back the EXACT
  columns received (never rename/add/drop/reorder; preserve un-edited columns like
  `exhibit` verbatim), every row, + change log, never a bare findings list; `.pptx`
  uses the same canonical format. (2) slide-quick Step 3 now requires `mode=improve`
  explicitly (consultant defaults to `review`), demands the full table back, and
  guards the third column name (`exhibit`, not `layout`). (3) the action-title rule
  now treats unsourced outline numbers as UNVERIFIED — keep but don't coin/round, and
  flag placeholder-looking numbers rather than promoting them into titles. · **Why:**
  an undefined contract silently drops the consultant's content improvements or
  mis-applies them, and the placeholder loophole risked fabricated title numbers — on
  every deck. · **Evidence:** ran the `slide-quick-test` workflow (8 agents, full
  generate + content/visual review) → **status PASS**, deck shipped clean. The review
  surfaced one defect IN this change (rank-1 P1): my first draft used the literal
  `# | title | layout | key points` example, contradicting slide-quick's actual
  `exhibit` header — a literal reader could rename the column and break the build.
  Fixed by making the contract column-agnostic and naming `exhibit` on both sides;
  verified by inspection that both skills are now consistent (strictly safer wording,
  no re-run needed). Excellence cold-judge: PASS — clear content-integrity gain. ·
  **Source:** slide-quick-test workflow findings (ranks 6–8 prior run; rank 1 this
  run); Minto/SCQA action-title discipline already in the consultant refs.
  · **NEXT-UP (workflow-surfaced, not this change):** P1 — `harvey()` fills from 3
  o'clock not 12 (`angleRange:[270,270+90*level]`); P2 — non-highlight Harvey balls
  use `T.ink` (near-white on midnight, out-shouts the accent) → use `T.muted`; `--strict`
  referenced in QA-lite but never defined; brainstorm `template.md`/`SKILL.md` still
  say "inline CSS/JS" vs the no-JS wireframe rule; consultant chart/comparison-integrity
  checks are stubs. The two Harvey-ball fixes are a tight coherent next iteration.

- 2026-06-13 · **Fixed the P0 build/PDF path bugs (fast path works from a clean
  checkout)** — the documented build commands failed for a real per-deck script:
  (1) `example-build.js` uses `require("./builder")`, which resolves relative to the
  SCRIPT, so a `decks/<topic>/build.js` threw "Cannot find module ./builder";
  (2) the PDF command `../pptx/...` resolved outside the project when run from repo
  root; (3) `example-build.js` `writeFile`'d a nested out path with no `mkdir`, so it
  ENOENT'd. Fixes: slide-quick `SKILL.md` Step 5 now states ONE cwd convention (run
  from repo root, all paths repo-root-relative), shows the per-deck `build.js`
  requiring templates by their path RELATIVE TO THE SCRIPT
  (`../../.claude/skills/slide-quick/templates/builder.js`) with a note NOT to copy
  `builder.js` out (its icon dir is location-relative); the PDF + QA-lite commands
  now use `.claude/skills/pptx/scripts/office/soffice.py`; the remaining `../`
  read-paths (visual-playbook, consultant frameworks, wireframe skeleton, pptxgenjs
  pitfalls) were made repo-root-relative; and `example-build.js` now
  `mkdirSync(dirname(out))` before writing. · **Why:** a build path that fails from a
  clean checkout makes the whole fast path unreliable in practice — a P0 correctness
  bug outranks any new feature. · **Evidence:** REPRODUCED the exact failure — wrote
  a real `decks/_loop-pathtest/build.js` per the FIXED instructions and ran it from
  repo root → "BUILD OK", `loadIcons` resolved (icons rendered, proving ICON_DIR is
  correct), the nested out dir was created (no ENOENT), and the fixed soffice command
  produced a PDF; the rendered deck looked correct; `example-build.js` still builds
  midnight + light; all referenced paths verified to exist (test dir removed). Gate
  note: used direct reproduction (deterministic, targeted proof for this path-bug
  class) rather than re-running the 8-agent slide-quick-test workflow, which had
  already validated the flow AND surfaced these exact bugs the prior iteration.
  Excellence cold-judge: PASS — clear correctness gain, not cosmetic. · **Source:**
  the slide-quick-test workflow findings (ranks 1–3, P0) from the prior iteration;
  Node module-resolution semantics (`require` is file-relative; `node_modules` walks
  up).

- 2026-06-13 · **Content-shape → exhibit routing guide (the engine's brain)** — in
  slide-quick `SKILL.md`, replaced the stale, MISDIRECTING outline mapping
  ("comparison → two panels" — the exact slop deleted in the decision-matrix
  iteration; it also omitted every exhibit built since) with a full content-shape →
  exhibit DECISION TABLE: compare/trade-offs → `B.compareTable`(+`harvey`); trend/
  ranking/before-after → `B.chart`; phased plan → `B.timeline`; positioning →
  `B.quadrant`; KPIs → `B.statBand`/`stat`; pillars → `B.iconRow`/`blockRow`; claim+
  exhibit → `B.split`; sequence → node diagram; code → `codeText`. Added a "one
  exhibit per slide, never a box of bullets, aim for variety" rule and aligned the
  wireframe step to label the chosen exhibit. · **Why:** the engine became a rich
  toolkit over 9 iterations but the skill's SELECTION guidance still pointed at the
  old slop and ignored the new vocabulary — so decks wouldn't actually use it. This
  is the multiplier (effortless: the skill routes content to the right exhibit with
  minimal user input). · **Evidence:** ran the `slide-quick-test` workflow (8 agents,
  full fast-path generate + content/visual review) → **status PASS**; the generated
  deck reviewed clean and NONE of the workflow's 11 findings touched the new routing
  table (they are pre-existing issues — see Failed/Next below). SKILL-only change, no
  engine code touched. · **Source:** Zelazny (exhibit form follows the message);
  Minto (one message per slide); Knaflic (lead with the visual) — all already applied
  across prior iterations, here consolidated into a selection table.
  · **Workflow-surfaced NEXT-UP (pre-existing, not this change):** P0 — Step 5 build
  paths break from a clean checkout: example-build.js `require("./builder")` resolves
  to the SCRIPT dir so a `decks/<topic>/build.js` throws (fix: absolute require or
  copy templates); the PDF cmd `../pptx/...` is wrong from repo root (use
  `.claude/skills/pptx/scripts/office/soffice.py`); example-build.js needs
  `mkdirSync(dirname(out))` before writeFile (nested out path ENOENTs). P1 — brainstorm
  `presentation-design-decisioning.md` + `strong-slide-design-checklist.md` still say
  "render the real artifact", contradicting the wireframe policy; consultant inline
  improve-mode return contract is undefined (full table vs change-log); Step 3 doesn't
  require mode=improve. These are the strongest candidates for upcoming iterations.

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


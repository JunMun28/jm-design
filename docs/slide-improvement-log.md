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


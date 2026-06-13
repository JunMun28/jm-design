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

## Iterations
<!-- newest first; the loop appends here -->

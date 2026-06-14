# Visual / Packaging QA Audit Table

Use this format for the visual + packaging QA pass (image-mode contact-sheet
review and layered-mode text-box review). It replaces the prose checklist with
a scannable severity table followed by a root-cause paragraph, so the report
says *which rule to fix* — not just *which slide looks off*. This extends the
P0–P3 severity culture from `slide-consultant` to visual/packaging QA.

## Severity legend (reproduce inline in every report)

- 🔴 **critical** — content cropped, text invisible, footer overlap, off-canvas,
  doubled text, blank/black slide, missing logo or chart. Must fix before deliver.
- 🟠 **high** — content visible but hierarchy broken, no breathing room, text box
  overlaps the element below, low contrast. Should fix.
- 🟡 **medium** — italic/em lost, font fallback (JhengHei/Calibri/Arial on a
  non-Latin run), color drift, sub-pixel landing error. Fix in this pass.
- 🟢 **low** — minor spacing/alignment, cosmetic offset. Note but don't block.

## Table format

```markdown
**Visual/packaging QA · `<deck-name>` · <mode> · <date>**

| Slide | Issue | Severity |
|---|---|---|
| 1 cover     | meta-row bottom 6.95" overlaps footer (6.85")     | 🔴 |
| 4 pipeline  | step-3 body box overlaps the caption below it      | 🟠 |
| 7 quote     | `<em>` italic dropped on the pull-quote             | 🟡 |
| 9 metrics   | column 2 numbers 2px high vs column 1              | 🟢 |

**Root causes** (name the 2–3 systemic causes — fix the rule, not slide 5 alone)

1. **<root cause>.** <Why it happened at the rule level, not the slide level.>
2. **<root cause>.** <…>
```

Every audit table **must** be followed by the Root causes paragraph. A list of
per-slide symptoms with no named systemic cause is an incomplete report: if the
same defect appears on slides 1, 5, and 9, the fix belongs in the build rule
(the export script, the cursor rail, the font-slot map), not in three manual
slide patches. Name the rule.

## Verification footer (append after re-export / re-render)

```markdown
**Verification**

- ✅ 0 rail / overlap violations across <N> slides
- ✅ All text within canvas and not clipped at edges
- ✅ Italic preserved on Latin `<em>` runs, suppressed on non-italic scripts
- ✅ Round-trip render avg mean-delta vs source = <value> (LibreOffice)
- File: `<absolute-path>.pptx` · <size>
```

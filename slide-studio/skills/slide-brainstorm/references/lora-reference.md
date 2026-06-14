# LoRA Reference — Extracted Layout Grammar

This is the canonical layout-inspiration reference for the Technical Infographic archetype. It records the layout grammar of a "How LoRA Works" training infographic, extracted with the 10-point Reference Image Extraction checklist in SKILL.md. Use it as a worked example of an extraction and as a style target — adapt the grammar to new content; do not clone the slide.

## Extraction

1. **Canvas and aspect ratio:** 16:9 single stage; one composed diagram, no scrolling.
2. **Margins and grid:** ~48px outer margin; 12-column grid; main canvas splits into 3 equal zones plus a narrower right rail (roughly 3+3+3+3 columns).
3. **Reading path:** title → numbered zones 1 → 2 → 3 left-to-right → right rail → bottom band. Numbered badges and arrows make the order explicit.
4. **Title/subtitle treatment:** large centered title (one assertion line), one short explanatory subtitle directly beneath.
5. **Primary content zones:** zone 1 = frozen base weights (large matrix block labeled W); zone 2 = low-rank adapter path (two small matrices A and B with a multiply arrow); zone 3 = merged output (W + BA feeding the forward pass).
6. **Supporting rails:** right rail carries runtime state notes — training vs inference, what is frozen vs updated, a warning chip about rank choice.
7. **Summary band:** bottom band lists why it matters — fewer trainable parameters, swap adapters per task, no inference latency after merge.
8. **Color semantics:** blue = frozen/base (W matrix); green = trainable (A, B); purple = active flow/current step arrows; orange = training-time actions; neutral gray = labels, scaffolding, inactive paths.
9. **Shape language:** matrix grids, rounded adapter blocks, solid arrows for data flow, dashed arrows for gradients, small badges for zone numbers, one small equation card (h = Wx + BAx).
10. **Density and text hierarchy:** labels ≤4 words; explanatory sentences live only in the rail and bottom band; body text ~40 words total.

## Why it works

The mechanism is one composed diagram, not a sequence of generic cards. Color carries meaning (frozen vs trainable), the numbered zones force a reading order, and all prose is pushed to the rail and bottom band so the diagram stays the protagonist.

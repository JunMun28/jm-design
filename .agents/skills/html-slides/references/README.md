# References index

This directory holds **cross-theme infrastructure**. Per-theme content (design rules + example HTML) lives under `../themes/<id>/`.

| Group | What's in it | When to open |
|---|---|---|
| `tokens/` | `micron-tokens.css`, `non-micron-contract.css`, `viewport-base.css`, `layout-kit.css` | Always — paste verbatim into every deck's `<style>`. Micron: `micron-tokens.css` → viewport → layout-kit. Non-Micron: `themes/<id>/tokens.css` → `non-micron-contract.css` → viewport → layout-kit. See `runtime/html-template.md` Read order. |
| `runtime/` | `html-template.md`, `svg-charts.md`, `animation-patterns.md` | Always read `html-template.md` for the controller. `svg-charts.md` when the deck has charts. `animation-patterns.md` when motion decisions are open. |
| `patterns/` | `image-pipeline.md`, `inline-editing.md` | Opt-in — read only if the deck has images or the user asked for in-browser editing. |
| `process/` | `frontend-slides-architecture.md`, `production-grade-slide-philosophy.md`, `verification.md`, `export-workflows.md` | Gates: architecture checklist before building, philosophy for ambiguous calls, verification before final, export for PDF. |

For themes (design rules + worked examples), see `../themes/themes.json` (manifest) and `../themes/selector.html` (visual chooser).

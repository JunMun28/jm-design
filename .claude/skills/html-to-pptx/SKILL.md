---
name: html-to-pptx
description: Convert existing HTML pages, HTML slide decks, scroll-snap presentations, fixed-stage html-slides artifacts, or local/remote browser-rendered visuals into high-fidelity PowerPoint .pptx files. Use this whenever the user asks to convert HTML to PPTX, PowerPoint, deck, slides, or presentation output and visual match matters, even if they do not explicitly name this skill. Offers two modes: image (default, almost pixel-perfect, one full-slide raster per slide) and layered (editable, a pixel-perfect background raster with the heading/body/label text re-added as real, editable PowerPoint text boxes on top). Choose layered when the user wants the PPTX to stay editable; choose image when only visual fidelity matters.
---

# HTML to PPTX

## What This Skill Does

Turn rendered HTML into a PowerPoint deck that looks like the browser version. Two modes:

- **`--mode image` (default)** — each HTML slide is captured as a high-resolution PNG and placed edge-to-edge on a PPTX slide with `PptxGenJS`. Maximum fidelity, fully byte-deterministic, but the slide is a flat picture (not editable). Right tradeoff when the user just wants "almost pixel perfect".
- **`--mode layered` (editable)** — a true layered slide: layer 1 is a pixel-perfect background raster (charts, SVG, photos, borders, pseudo-element labels) rendered with the editable text glyphs hidden; layer 2 is every heading/body/label text node re-added as a real, editable PowerPoint text box positioned over its original geometry with matching font size, weight, color, and alignment. The user can select and edit the text in PowerPoint while the visuals stay intact. Use this when the user says "editable", "let me edit the text", or "layers". It is also deterministic across runs.

Layered mode deliberately keeps complex visuals (charts, photos, icons, gradients, chart axis/SVG labels) in the background raster rather than trying to reconstruct them as shapes — that is the "background image, then foreground editable details" split and it is what keeps fidelity high while making the text editable.

## Dependencies

Use the local repo/runtime dependencies when available:

- Node.js
- `playwright`
- `pptxgenjs`
- `sharp`
- Python 3 with `Pillow` for validation
- Optional, for round-trip render validation: **LibreOffice** (`soffice`) plus a PDF rasterizer (`pdftoppm` from poppler, or the `PyMuPDF` Python package). When present, the validator renders the generated `.pptx` back to PNGs and diffs them against the source screenshots — the only way to truly confirm that layered-mode text boxes land correctly after font substitution. The validator auto-detects `soffice` (including `/Applications/LibreOffice.app/Contents/MacOS/soffice` on macOS); if it is missing the validator still runs all structural checks and just records that the render pass was skipped.

If the repo has `node_modules`, run the scripts from the repo root so relative HTML assets and packages resolve naturally.

## Workflow

1. Confirm the input and output path. If the user only gives an HTML file, create a `.pptx` beside it or in the requested output directory.
2. Pick the mode: default to `image` for "make it look like the HTML"; use `--mode layered` when the user wants editable text or asks for layers.
3. Run the converter (add `--mode layered` for the editable build):

   ```sh
   node .agents/skills/html-to-pptx/scripts/html_to_pptx.mjs \
     path/to/deck.html \
     --out path/to/deck.pptx \
     --workdir tmp/html-to-pptx/deck-run \
     --scale 2 \
     --validate
   ```

4. If the source is an `html-slides` deck and the theme is known, also run the source verifier before conversion when its Python Playwright dependency is available:

   ```sh
   python .agents/skills/html-slides/scripts/verify.py path/to/deck.html --theme <theme-id> --check-overview --fail-on-warnings
   ```

   This catches source UI problems before they get frozen into the PPTX. If it fails only because Python Playwright is missing, record that dependency note and continue with the bundled converter plus PPTX validator. Do not install packages into system Python just to run this optional gate unless the user asked for dependency setup.

5. Read the generated validation report. Fix the source HTML or rerun the converter if there are missing slides, blank captures, wrong dimensions, non-zero placement offsets, unexpected pixel drift, or obvious UI issues in the contact sheet.
6. When creating or improving this skill, or when the user asks for consistency, run at least three conversion passes into separate iteration folders and compare validator reports.

## Converter Behavior

The bundled converter:

- Opens the HTML in Chromium with Playwright.
- Waits for page load, fonts, images, and video first frames where possible.
- Disables CSS animation/transitions for deterministic captures.
- Forces `.slide` elements to visible so reveal animations do not hide content.
- Captures each direct `.slide-stage` when present, otherwise each `.slide`, otherwise the whole page as one slide.
- Writes PNG screenshots plus a `manifest.json` with per-slide dimensions and SHA-256 hashes for repeatability checks.
- In `image` mode, creates a PPTX with one full-slide image per slide using `PptxGenJS`.
- Optionally runs the validator immediately with `--validate`.

Useful options:

```sh
node .agents/skills/html-to-pptx/scripts/html_to_pptx.mjs input.html --out output.pptx
node .agents/skills/html-to-pptx/scripts/html_to_pptx.mjs input.html --out output.pptx --mode layered
node .agents/skills/html-to-pptx/scripts/html_to_pptx.mjs input.html --out output.pptx --scale 1
node .agents/skills/html-to-pptx/scripts/html_to_pptx.mjs input.html --out output.pptx --width 1600 --height 900
node .agents/skills/html-to-pptx/scripts/html_to_pptx.mjs https://example.com/deck --out deck.pptx
```

Use `--scale 2` by default for sharper PowerPoint output. Use `--scale 1` only for smaller files or quick smoke tests.

## Layered (editable) mode

`--mode layered` produces an editable deck by separating each slide into two layers:

1. **Background raster.** The slide is screenshotted with every editable text glyph hidden via `color: transparent` (no reflow, so geometry is preserved). This raster carries all the visuals that are expensive or lossy to rebuild as shapes — SVG charts, photos, gradients, borders, card chrome, and CSS pseudo-element labels (e.g. chart axis ticks). It is placed full-slide as layer 1.
2. **Editable text boxes.** The converter walks every visible, non-SVG text node, measures its rendered rectangle with a DOM `Range`, and reads the parent's computed typography (font size, weight, italic, color, alignment, line-height, letter-spacing, text-transform). Each becomes a real PowerPoint text box positioned over its original spot.

Implementation details that keep it faithful:

- **Font mapping.** Brand webfonts with no `@font-face` (e.g. "Micron Basis") already fall back to Arial in headless Chromium, so the converter emits Arial for any non-standard family — the `.pptx` then renders with the same metrics the measurements were taken against.
- **px → pt.** Font sizes convert through the stage-to-slide scale (a 1600px stage on a 13.33in slide ≈ `0.6 pt/px`).
- **Single-line runs never wrap** (`wrap: false`), so a target font that is a hair wider than Chromium's can't push the last glyph onto a new line.
- **Multi-line runs** get a small width pad and `fit: shrink` (PowerPoint `normAutofit`), so if the target font still needs an extra line the text shrinks to stay inside its original band instead of overflowing onto the element below.

Limits to state to the user: chart values, axis labels, and any SVG/`::before`/`::after` text remain part of the background image (not editable); inline runs are placed per text node, so unusual inline mixes can drift slightly. Everything a presenter normally edits — titles, body copy, KPI numbers, card labels — is editable.

## Living-deck workflow

When converting a deck from the living-deck pipeline, default to `--mode layered`
so the `.pptx` keeps editable text boxes, and name the output to match the deck
variant — `<topic>.<theme>.pptx` beside `<topic>.<theme>.html`:

```sh
node .claude/skills/html-to-pptx/scripts/html_to_pptx.mjs \
  ai-agents.micron-dark.html \
  --out ai-agents.micron-dark.pptx \
  --mode layered --validate
```

The HTML deck and the exported PPTX are edited **independently** — there is no
sync between them. Re-export from the HTML whenever you want a fresh PPTX.

## Validation

The validator opens the generated `.pptx` as an Office package and checks the real slide XML and embedded media. It reads `manifest.json["mode"]` and adapts.

Both modes:

- PPTX slide count equals captured slide count.
- Presentation slide size matches the manifest.
- Each slide has exactly one background image at `x=0, y=0` filling the full slide.
- The embedded background matches its captured raster (the full screenshot in `image` mode, the text-hidden background in `layered` mode) within a tiny tolerance, and is not blank.
- A contact sheet is generated for human visual review.

Layered mode adds:

- The editable text box count equals the number of extracted runs for that slide.
- Every extracted run's text is present as an editable text box (no dropped text).
- All text boxes sit within the slide bounds.

Round-trip render (when LibreOffice is available, both modes): the generated `.pptx` is converted to PDF with `soffice` and rasterized (`pdftoppm` or PyMuPDF), then each rendered page is diffed against the source screenshot. This is the true "what PowerPoint shows" check — it is what catches layered-mode text landing in the wrong place. Single-digit mean deltas are mostly font antialiasing; large localized deltas mean a real layout problem. If LibreOffice is absent the validator records the skip and still runs every structural check.

Run it directly when needed:

```sh
python .agents/skills/html-to-pptx/scripts/validate_html_to_pptx.py \
  --pptx path/to/deck.pptx \
  --manifest tmp/html-to-pptx/deck-run/manifest.json \
  --report tmp/html-to-pptx/deck-run/validation-report.json \
  --contact-sheet tmp/html-to-pptx/deck-run/contact-sheet.png
```

## Validator Subagent

Use a validator subagent after the converter finishes when subagents are available. Give it the generated `manifest.json`, `validation-report.json`, contact sheet, PPTX path, and source HTML path.

Prompt template:

```text
Read .agents/skills/html-to-pptx/references/validator-subagent.md and execute it.

Source HTML: <absolute html path>
PPTX: <absolute pptx path>
Manifest: <absolute manifest path>
Validation report: <absolute validation-report path>
Contact sheet: <absolute contact-sheet path>

Your job is to find visual or packaging issues that the main agent may have missed. Do not edit unrelated files. If you run commands, save any extra evidence into the same iteration folder.
```

If subagents are not available, run the same validator steps inline and say that you did the fresh-eye pass yourself.

## Review Checklist

Precondition — converting an html-slides deck: confirm the source deck passed
`html-slides/scripts/verify.py` and, for executive decks, that its final-deck
content review recorded `FINAL DECK REVIEW: PASS` (or accepted-risk). If
neither happened, run those gates first, or state plainly in the final
response that the PPTX packages an unverified deck. Conversion fidelity
cannot fix content that was never reviewed.

Inspect the contact sheet before calling the conversion done:

- No slide is blank, cropped, or missing.
- No browser controls, overview UI, nav dots, scrollbars, or hover controls appear inside captures.
- Reveal animations are visible in their final state.
- Logos and background images loaded.
- Video tiles show a useful first frame, not a black rectangle.
- Text is not clipped at slide edges.
- `image` mode: the PPTX package uses one full-slide image per slide.
- `layered` mode: the background image has the editable text removed (no glyphs baked in where a text box also sits — otherwise you get doubled text), and rendered text boxes do not overlap each other or the element below. Watch headings that sit just above a body paragraph.

For dark executive decks, be extra suspicious of black-on-black failures: a slide can look "mostly black" and still be correct, but it should have visible text, lines, imagery, or chart marks.

## Final Response

Report:

- PPTX path
- Workdir path
- Mode (image or layered) and slide count; for layered, the editable text box count
- Validation result, including the round-trip render average mean-delta when LibreOffice was available
- Any remaining caveat — for image mode, that the slides are flat pictures; for layered mode, which elements stayed in the background raster (charts, SVG/pseudo text) and are not editable

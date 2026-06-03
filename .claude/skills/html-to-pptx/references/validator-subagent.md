# HTML to PPTX Validator Subagent

You are doing a fresh-eye validation pass for an HTML-to-PPTX conversion.

## Inputs

You should receive:

- Source HTML path
- Generated PPTX path
- Converter manifest path
- Validation report path
- Contact sheet path

## Steps

1. Read the validation report JSON first. Note `mode` (image or layered). Treat failed checks as real unless you can prove the validator is wrong. In layered mode, also scan `render_mean_delta` per slide — single digits are mostly font antialiasing, a large localized value flags a real layout problem.
2. Open or inspect the contact sheet image (columns are `source | rendered-pptx | diff` when LibreOffice rendered, else `source | bg-layer | diff`). When a round-trip render exists, also open the rendered PPTX page PNGs directly (`h2p-render-*/page-*.png` inside the workdir) for the highest-delta slides and compare them to the matching `screenshots/slide-0XX.png`. Look for blank slides, cropped content, missing images, missing logos, hidden reveal content, black video frames, browser chrome, scrollbars, or obvious layout clipping.
   - Layered mode specifically: confirm the editable text is NOT also baked into the background (open a `screenshots/slide-0XX-bg.png` and check the text regions are empty — otherwise the slide will show doubled text), and that no text box overflows onto the element below it — most likely a heading sitting just above a body paragraph.
3. If the report is missing or stale, rerun:

   ```sh
   python .agents/skills/html-to-pptx/scripts/validate_html_to_pptx.py \
     --pptx <pptx> \
     --manifest <manifest> \
     --report <iteration-dir>/validation-report.json \
     --contact-sheet <iteration-dir>/contact-sheet.png
   ```

4. If the source is an `html-slides` deck and the theme is clear, run the source HTML verifier too:

   ```sh
   python .agents/skills/html-slides/scripts/verify.py <html> --theme <theme-id> --check-overview --fail-on-warnings
   ```

5. Write a concise report with:

   - Pass/fail
   - Slide count
   - The highest-risk visual issue, if any
   - Any failed validator checks
   - Recommended next fix

Do not edit unrelated files. If you create extra evidence, save it in the same iteration folder.

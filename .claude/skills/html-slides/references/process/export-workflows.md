# Export workflows

Use only when the user asks for export.

## HTML remains source

The skill produces one single-file, no-build HTML deck. Keep that HTML as source.

## PDF export

For a generated deck:

```bash
bash <skill-dir>/scripts/export-pdf.sh deck-topic.html deck-topic.pdf
```

This calls the canonical `window.presentation.goTo(index, { immediate: true })`, screenshots each `.slide`, and combines the pages into a PDF. Good for email, print, and review.

## Existing PPTX extraction

When converting an existing PowerPoint into a new Micron HTML deck:

```bash
python <skill-dir>/scripts/extract-pptx.py input.pptx extracted/
```

Use extracted text/images as source material, then build a new single-file Micron HTML deck.

## Editable PPTX

Use project skill `pptx`. Do not generate HTML first and then convert it when the user needs editable PowerPoint output.

# Image pipeline

If no images were provided or requested, skip this entirely.

## Processing (Python + Pillow)

```bash
pip install Pillow
```

```python
from PIL import Image, ImageDraw

def crop_circle(input_path, output_path):
    img = Image.open(input_path).convert('RGBA')
    w, h = img.size
    size = min(w, h)
    left, top = (w - size) // 2, (h - size) // 2
    img = img.crop((left, top, left + size, top + size))
    mask = Image.new('L', (size, size), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, size, size], fill=255)
    img.putalpha(mask)
    img.save(output_path, 'PNG')

def resize_max(input_path, output_path, max_dim=1200):
    img = Image.open(input_path)
    img.thumbnail((max_dim, max_dim), Image.LANCZOS)
    img.save(output_path, quality=85)
```

| Situation                        | Operation                     |
| -------------------------------- | ----------------------------- |
| Square logo on rounded aesthetic | `crop_circle()`               |
| Image > 1MB                      | `resize_max(max_dim=1200)`    |
| Wrong aspect ratio               | Manual crop with `img.crop()` |

Save processed images with `_processed` suffix. Never overwrite originals.

## Placement

Use direct file paths (not base64) — decks are viewed locally and base64 inflates HTML.

```html
<img src="assets/logo_round.png"
     alt="Logo"
     class="slide-image logo"
     loading="lazy"
     width="200" height="200" />

<img src="assets/screenshot.png"
     alt="Screenshot"
     class="slide-image screenshot"
     loading="lazy"
     width="1200" height="800"
     onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'image-fallback',textContent:this.alt}))" />
```

**Always set `width` and `height`** so the browser reserves space (no CLS) and PDF export renders the image at the intended size. Always set `loading="lazy"` on non-title images. Always provide an `onerror` fallback so a missing file shows a labelled box, not the broken-image glyph.

## CSS

```css
.slide-image {
  max-width: 100%;
  max-height: min(50vh, 400px);
  object-fit: contain;
  border-radius: var(--radius-md);
}
.slide-image.screenshot {
  border: 1px solid var(--line);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
.slide-image.logo {
  max-height: min(30vh, 200px);
}
.image-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 16/9;
  background: var(--panel);
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: var(--type-xs);
  letter-spacing: var(--track-mono);
  text-transform: uppercase;
  border: var(--hairline);
}
```

Adapt border/shadow colors to match the selected Micron theme. Never repeat the same image on multiple slides (except a logo on title + closing).

Placement patterns:

- Logo centered on title slide.
- Screenshots in two-column layouts with text.
- Full-bleed images as slide backgrounds with text overlay — use sparingly.
- For decks without imagery, prefer abstract wafer macro on title via a CSS conic-gradient or inline SVG, not a stock photo placeholder.

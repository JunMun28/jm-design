# HTML Presentation Template

Reference architecture for generating slide presentations. Every presentation follows this structure.

## Base HTML Structure

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Presentation Title</title>

    <!-- Fonts: use Micron Basis if available; otherwise Plus Jakarta Sans, Arial fallback -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" />

    <style>
      /* ===========================================
           CSS CUSTOM PROPERTIES (THEME)
           Change these to change the whole look
           =========================================== */
      :root {
        /* Colors - replace with selected Micron light/dark design tokens */
        --bg-primary: #ffffff;
        --bg-secondary: #f2f2f2;
        --text-primary: #000000;
        --text-secondary: #4d4d4d;
        --accent: #bd03f7;
        --accent-glow: rgba(189, 3, 247, 0.22);
        --overview-bg: rgba(245, 241, 230, 0.96);
        --overview-card: rgba(255, 255, 255, 0.62);
        --overview-line: rgba(0, 0, 0, 0.16);
        --overview-muted: #666666;

        /* Typography - MUST use clamp() */
        --font-display: "Micron Basis", "Plus Jakarta Sans", Arial, sans-serif;
        --font-body: "Micron Basis", "Plus Jakarta Sans", Arial, sans-serif;
        --font-mono: ui-monospace, SFMono-Regular, Menlo, monospace;
        --title-size: clamp(2rem, 6vw, 5rem);
        --subtitle-size: clamp(0.875rem, 2vw, 1.25rem);
        --body-size: clamp(0.75rem, 1.2vw, 1rem);

        /* Spacing - MUST use clamp() */
        --slide-padding: clamp(1.5rem, 4vw, 4rem);
        --content-gap: clamp(1rem, 2vw, 2rem);

        /* Animation */
        --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
        --duration-normal: 0.6s;
      }

      /* ===========================================
           BASE STYLES
           =========================================== */
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      /* --- PASTE viewport-base.css CONTENTS HERE --- */

      /* ===========================================
           ANIMATIONS
           Trigger via .visible class (added by JS on active slide)
           =========================================== */
      .reveal {
        opacity: 0;
        transform: translateY(30px);
        transition:
          opacity var(--duration-normal) var(--ease-out-expo),
          transform var(--duration-normal) var(--ease-out-expo);
      }

      .slide.visible .reveal {
        opacity: 1;
        transform: translateY(0);
      }

      /* Stagger children for sequential reveal */
      .reveal:nth-child(1) {
        transition-delay: 0.1s;
      }
      .reveal:nth-child(2) {
        transition-delay: 0.2s;
      }
      .reveal:nth-child(3) {
        transition-delay: 0.3s;
      }
      .reveal:nth-child(4) {
        transition-delay: 0.4s;
      }

      /* ... Micron theme-specific styles ... */
    </style>
  </head>
  <body>
    <div class="progress-bar"></div>
    <nav class="nav-dots" aria-label="Slide navigation"></nav>

    <section class="slide title-slide" data-slide-kind="cover">
      <div class="slide-content">
        <h1 class="reveal">Presentation Title</h1>
        <p class="reveal">Subtitle or author</p>
      </div>
    </section>

    <section class="slide" data-slide-kind="content">
      <div class="slide-content">
        <h2 class="reveal">Slide Title</h2>
        <p class="reveal">Content...</p>
      </div>
    </section>

    <div id="overview" aria-hidden="true"></div>

    <script>
      /* ===========================================
           SLIDE PRESENTATION CONTROLLER
           =========================================== */
      class SlidePresentation {
        constructor() {
          this.slides = Array.from(document.querySelectorAll(".slide"));
          this.currentSlide = 0;
          this.locked = false;
          this.overviewOpen = false;
          this.navDotsContainer = document.querySelector(".nav-dots");
          this.progressBar = document.querySelector(".progress-bar");
          this.overview = document.getElementById("overview");

          this.setupNavDots();
          this.setupIntersectionObserver();
          this.setupKeyboardNav();
          this.setupWheelNav();
          this.setupTouchNav();
          this.applySlide(0);
        }

        clamp(index) {
          return Math.max(0, Math.min(this.slides.length - 1, index));
        }

        applySlide(index) {
          const next = this.clamp(index);
          this.currentSlide = next;
          this.slides.forEach((slide, i) => {
            slide.classList.toggle("active", i === next);
            slide.classList.toggle("visible", i === next);
          });
          this.navDotsContainer.querySelectorAll("button").forEach((dot, i) => {
            dot.classList.toggle("active", i === next);
            dot.setAttribute("aria-current", i === next ? "true" : "false");
          });
          if (this.progressBar) {
            this.progressBar.style.width = `${((next + 1) / this.slides.length) * 100}%`;
          }
        }

        goTo(index, options = {}) {
          const next = this.clamp(index);
          if (this.locked && !options.immediate) return;

          this.applySlide(next);
          this.slides[next].scrollIntoView({
            behavior: options.immediate ? "auto" : "smooth",
            block: "start",
          });

          if (!options.immediate) {
            this.locked = true;
            window.setTimeout(() => {
              this.locked = false;
            }, 650);
          }
        }

        next() {
          this.goTo(this.currentSlide + 1);
        }

        prev() {
          this.goTo(this.currentSlide - 1);
        }

        setupIntersectionObserver() {
          const observer = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  this.applySlide(this.slides.indexOf(entry.target));
                }
              });
            },
            { threshold: 0.6 },
          );
          this.slides.forEach((slide) => observer.observe(slide));
        }

        setupNavDots() {
          // IMPORTANT: Always clear before building - if outerHTML was
          // captured while dots were rendered, re-opening the file would
          // append a duplicate set on top of the existing ones.
          this.navDotsContainer.innerHTML = "";
          this.slides.forEach((_, i) => {
            const dot = document.createElement("button");
            dot.type = "button";
            dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
            dot.addEventListener("click", () => this.goTo(i));
            this.navDotsContainer.appendChild(dot);
          });
        }

        setupKeyboardNav() {
          document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              this.toggleOverview();
              return;
            }
            if (this.overviewOpen) return;

            if (["ArrowRight", "ArrowDown", "PageDown", " "].includes(e.key)) {
              e.preventDefault();
              this.next();
            } else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) {
              e.preventDefault();
              this.prev();
            } else if (e.key === "Home") {
              e.preventDefault();
              this.goTo(0);
            } else if (e.key === "End") {
              e.preventDefault();
              this.goTo(this.slides.length - 1);
            }
          });
        }

        setupWheelNav() {
          let wheelAcc = 0;
          let wheelTimer = null;
          window.addEventListener(
            "wheel",
            (e) => {
              if (this.overviewOpen) return;
              wheelAcc += e.deltaY + e.deltaX;
              if (Math.abs(wheelAcc) > 60) {
                e.preventDefault();
                wheelAcc > 0 ? this.next() : this.prev();
                wheelAcc = 0;
              }
              window.clearTimeout(wheelTimer);
              wheelTimer = window.setTimeout(() => {
                wheelAcc = 0;
              }, 150);
            },
            { passive: false },
          );
        }

        setupTouchNav() {
          let startX = 0;
          let startY = 0;
          window.addEventListener("touchstart", (e) => {
            const touch = e.changedTouches[0];
            startX = touch.clientX;
            startY = touch.clientY;
          }, { passive: true });
          window.addEventListener("touchend", (e) => {
            if (this.overviewOpen) return;
            const touch = e.changedTouches[0];
            const dx = touch.clientX - startX;
            const dy = touch.clientY - startY;
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
              dx < 0 ? this.next() : this.prev();
            }
          }, { passive: true });
        }

        buildOverview() {
          this.overview.innerHTML = "";

          const head = document.createElement("div");
          head.className = "ov-head";
          head.innerHTML = `<span><b>Slide overview</b> · esc to close</span><span>${String(this.currentSlide + 1).padStart(2, "0")} / ${String(this.slides.length).padStart(2, "0")}</span>`;
          this.overview.appendChild(head);

          const grid = document.createElement("div");
          grid.className = "ov-grid";
          this.slides.forEach((slide, i) => {
            const card = document.createElement("button");
            card.type = "button";
            card.className = `ov-card${i === this.currentSlide ? " active" : ""}`;
            card.setAttribute("aria-label", `Go to slide ${i + 1}`);

            const thumb = document.createElement("div");
            thumb.className = "ov-thumb";
            const clone = slide.cloneNode(true);
            clone.classList.add("clone");
            clone.classList.add("visible");
            thumb.appendChild(clone);

            const label = document.createElement("div");
            label.className = "ov-label";
            label.innerHTML = `<b>${String(i + 1).padStart(2, "0")}</b><span>${slide.dataset.slideKind || "slide"}</span>`;

            card.appendChild(thumb);
            card.appendChild(label);
            card.addEventListener("click", () => {
              this.toggleOverview(false);
              this.goTo(i);
            });
            grid.appendChild(card);
          });
          this.overview.appendChild(grid);

          requestAnimationFrame(() => {
            this.overview.querySelectorAll(".ov-thumb").forEach((thumb) => {
              const clone = thumb.querySelector(".clone");
              const scale = thumb.clientWidth / window.innerWidth;
              clone.style.transform = `scale(${scale})`;
            });
          });
        }

        toggleOverview(force) {
          this.overviewOpen = typeof force === "boolean" ? force : !this.overviewOpen;
          if (this.overviewOpen) {
            this.buildOverview();
            this.overview.setAttribute("aria-hidden", "false");
          } else {
            this.overview.setAttribute("aria-hidden", "true");
          }
        }
      }

      window.presentation = new SlidePresentation();
    </script>
  </body>
</html>
```

## Required JavaScript Features

Every presentation must include:

1. **SlidePresentation Class** - Main controller with:
   - Keyboard navigation (arrows, space, page up/down)
   - Touch/swipe support
   - Mouse wheel navigation
   - Progress bar updates
   - Navigation dots
   - ESC slide overview grid

2. **Intersection Observer for vertical scroll-snap**:
   - Add `.visible` class when slides enter the viewport
   - Keep active slide state synced to scroll position
   - Use `scrollIntoView()` for keyboard/dot jumps

3. **Optional Enhancements** (match to chosen Micron theme):
   - Custom cursor with trail
   - Particle system background (canvas)
   - Parallax effects
   - 3D tilt on hover
   - Magnetic buttons
   - Counter animations

4. **Inline Editing** (only if user explicitly asks for in-browser editing):
   - Edit toggle button (hidden by default, revealed via hover hotzone or `E` key)
   - Auto-save to localStorage
   - Export/save file functionality
   - See "Inline Editing Implementation" section below

## Inline Editing Implementation (Opt-In Only)

**If the user did not explicitly ask for inline editing, do NOT generate any edit-related HTML, CSS, or JS.**

**Do NOT use CSS `~` sibling selector for hover-based show/hide.** The CSS-only approach (`edit-hotzone:hover ~ .edit-toggle`) fails because `pointer-events: none` on the toggle button breaks the hover chain: user hovers hotzone -> button becomes visible -> mouse moves toward button -> leaves hotzone -> button disappears before click.

**Required approach: JS-based hover with 400ms delay timeout.**

HTML:

```html
<div class="edit-hotzone"></div>
<button class="edit-toggle" id="editToggle" title="Edit mode (E)">Edit</button>
```

CSS (visibility controlled by JS classes only):

```css
/* Do NOT use CSS ~ sibling selector for this!
   pointer-events: none breaks the hover chain.
   Must use JS with delay timeout. */
.edit-hotzone {
  position: fixed;
  top: 0;
  left: 0;
  width: 80px;
  height: 80px;
  z-index: 10000;
  cursor: pointer;
}
.edit-toggle {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
  z-index: 10001;
}
.edit-toggle.show,
.edit-toggle.active {
  opacity: 1;
  pointer-events: auto;
}
```

JS (three interaction methods):

```javascript
// 1. Click handler on the toggle button
document.getElementById("editToggle").addEventListener("click", () => {
  editor.toggleEditMode();
});

// 2. Hotzone hover with 400ms grace period
const hotzone = document.querySelector(".edit-hotzone");
const editToggle = document.getElementById("editToggle");
let hideTimeout = null;

hotzone.addEventListener("mouseenter", () => {
  clearTimeout(hideTimeout);
  editToggle.classList.add("show");
});
hotzone.addEventListener("mouseleave", () => {
  hideTimeout = setTimeout(() => {
    if (!editor.isActive) editToggle.classList.remove("show");
  }, 400);
});
editToggle.addEventListener("mouseenter", () => {
  clearTimeout(hideTimeout);
});
editToggle.addEventListener("mouseleave", () => {
  hideTimeout = setTimeout(() => {
    if (!editor.isActive) editToggle.classList.remove("show");
  }, 400);
});

// 3. Hotzone direct click
hotzone.addEventListener("click", () => {
  editor.toggleEditMode();
});

// 4. Keyboard shortcut (E key, skip when editing text)
document.addEventListener("keydown", (e) => {
  if (
    (e.key === "e" || e.key === "E") &&
    !e.target.getAttribute("contenteditable")
  ) {
    editor.toggleEditMode();
  }
});
```

**CRITICAL: `exportFile()` must strip edit state before capturing outerHTML.**

When the user presses Ctrl+S in edit mode, `document.documentElement.outerHTML` captures the live DOM -
including `body.edit-active`, `contenteditable="true"` on every text element, and `.active`/`.show` classes on
the toggle button and banner. Anyone opening the saved file sees dashed outlines, a checkmark button, and an
edit banner, as if permanently stuck in edit mode.

Always implement `exportFile()` like this:

```javascript
exportFile() {
    // Temporarily strip edit state so the saved file opens cleanly
    const editableEls = Array.from(document.querySelectorAll('[contenteditable]'));
    editableEls.forEach(el => el.removeAttribute('contenteditable'));
    document.body.classList.remove('edit-active');

    // Also strip UI classes from toggle button and banner
    const editToggle = document.getElementById('editToggle');
    const editBanner = document.querySelector('.edit-banner');
    editToggle?.classList.remove('active', 'show');
    editBanner?.classList.remove('active', 'show');

    const html = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;

    // Restore edit state so the user can keep editing
    document.body.classList.add('edit-active');
    editableEls.forEach(el => el.setAttribute('contenteditable', 'true'));
    editToggle?.classList.add('active');
    editBanner?.classList.add('active');

    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'presentation.html';
    a.click();
    URL.revokeObjectURL(a.href);
}
```

## Image Pipeline (Skip If No Images)

If no images were provided or requested, skip this entirely. If images were provided, process them before generating HTML.

**Dependency:** `pip install Pillow`

### Image Processing

```python
from PIL import Image, ImageDraw

# Circular crop (for logos on modern/clean styles)
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

# Resize (for oversized images that inflate HTML)
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

### Image Placement

**Use direct file paths** (not base64) - presentations are viewed locally:

```html
<img src="assets/logo_round.png" alt="Logo" class="slide-image logo" />
<img
  src="assets/screenshot.png"
  alt="Screenshot"
  class="slide-image screenshot"
/>
```

```css
.slide-image {
  max-width: 100%;
  max-height: min(50vh, 400px);
  object-fit: contain;
  border-radius: 8px;
}
.slide-image.screenshot {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
.slide-image.logo {
  max-height: min(30vh, 200px);
}
```

**Adapt border/shadow colors to match the selected Micron theme.** Never repeat the same image on multiple slides (except logos on title + closing).

**Placement patterns:** Logo centered on title slide. Screenshots in two-column layouts with text. Full-bleed images as slide backgrounds with text overlay (use sparingly).

---

## Code Quality

**Comments:** Every section needs clear comments explaining what it does and how to modify it.

**Accessibility:**

- Semantic HTML (`<section>`, `<nav>`, `<main>`)
- Keyboard navigation works fully
- ARIA labels where needed
- `prefers-reduced-motion` support (included in viewport-base.css)

## File Structure

Single presentations:

```
presentation.html    # Self-contained, all CSS/JS inline
assets/              # Images only, if any
```

Multiple presentations in one project:

```
[name].html
[name]-assets/
```

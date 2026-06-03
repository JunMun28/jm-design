# HTML deck skeleton

Reference runtime + skeleton for every generated deck. Inline-editing and image guidance live in their own files: see `references/patterns/inline-editing.md` (opt-in) and `references/patterns/image-pipeline.md`.

## Read order

The token layer is theme-dependent. Pick the branch for the chosen theme.

**Micron themes** (`micron-dark-executive`, `micron-dark`, `micron-light`, `guided-learning` — anything whose manifest `verify.logo_pattern` is set):

1. `references/tokens/micron-tokens.css` — paste verbatim at the top of `<style>`. It is variables-only.
2. `references/tokens/viewport-base.css` — paste after tokens.
3. `references/tokens/layout-kit.css` — paste after viewport.
4. **Micron base block** (below) — paste after layout-kit. micron-tokens.css sets no element rules, so this block wires `html/body`, `h1–h3`, the reveal, and the mandatory Micron logo from the tokens.
5. The chosen theme's `themes/<id>/design.md` (e.g. `themes/micron-dark/design.md`) provides theme-specific rules that build on these tokens. Do not redefine `:root` colors/scale in the deck — extend them.

**Non-Micron themes** (`playful` — manifest `verify.logo_pattern` is `null`):

1. `themes/<id>/tokens.css` — paste verbatim at the top of `<style>`. It styles `html/body` and `h1–h3` and sets the theme's own `--ease-out-expo`/`--duration-normal` (and `--font-mono` where the theme needs one).
2. `references/tokens/non-micron-contract.css` — paste right after the theme tokens. One identical file for every non-Micron theme; it maps the theme's names onto the runtime contract (`--bg-primary`, `--text-primary`, `--space-*`, `--col-gutter`, `--hairline`) that viewport-base.css + layout-kit.css consume. Skipping it fails `verify.py` (the contract names are universal required tokens).
3. `references/tokens/viewport-base.css` — paste after the contract.
4. `references/tokens/layout-kit.css` — paste after viewport.
5. **Universal skeleton** (below) only. Do **not** paste the Micron base block — the theme's tokens.css already owns base + headings, and these themes carry no logo.
6. The chosen theme's `themes/<id>/design.md` for theme-specific rules.

## Base structure

```html
<!DOCTYPE html>
<html lang="en" data-theme="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>Presentation Title</title>

    <!--
      Fonts: prefer locally-installed "Micron Basis". The @font-face block
      in micron-tokens.css declares a fallback that metric-matches Arial so
      there is no CLS while the webfont loads. The Google Fonts link below
      is OPTIONAL — keep it only when the deck will be served online. For
      offline / PDF export, delete the link and rely on the local stack.
    -->
    <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin />
    <link rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" />

    <style>
      /* --- TOKENS (see Read order — branch by theme) ---
         Micron:     PASTE micron-tokens.css → viewport-base.css → layout-kit.css → Micron base block
         Non-Micron: PASTE themes/<id>/tokens.css → non-micron-contract.css → viewport-base.css → layout-kit.css
      */

      /* ============================================================
         UNIVERSAL SKELETON — paste for EVERY theme.
         Depends only on the shared contract (--duration-normal,
         --ease-out-expo) which every tokens file now defines.
         ============================================================ */
      * { margin: 0; padding: 0; box-sizing: border-box; }

      /* Reveal — applied when .slide gains .visible */
      .reveal {
        opacity: 0;
        transform: translateY(24px);
        transition:
          opacity var(--duration-normal) var(--ease-out-expo),
          transform var(--duration-normal) var(--ease-out-expo);
      }
      .slide.visible .reveal { opacity: 1; transform: none; }
      .reveal:nth-child(1) { transition-delay: 0.05s; }
      .reveal:nth-child(2) { transition-delay: 0.15s; }
      .reveal:nth-child(3) { transition-delay: 0.25s; }
      .reveal:nth-child(4) { transition-delay: 0.35s; }
      .reveal:nth-child(5) { transition-delay: 0.45s; }

      /* Letterbox space outside the 16:9 stage on non-matching viewports.
         Theme-neutral: resolves to the theme's surface, not hard-coded. */
      body { background: var(--bg-primary, #000); }

      /* Progress bar — composited scaleX, never width. Themes may override
         colour/height; the controller drives transform: scaleX(fraction). */
      .progress-bar {
        position: fixed;
        inset: 0 0 auto 0;
        height: 2px;
        z-index: 60;
        background: var(--accent, var(--micron-accent, currentColor));
        transform: scaleX(0);
        transform-origin: left;
        transition: transform var(--duration-fast, 0.25s) var(--ease-out-expo, ease-out);
      }

      /* ============================================================
         MICRON BASE BLOCK — paste ONLY for Micron themes.
         micron-tokens.css is variables-only, so these element rules
         turn the tokens into base type, headings, and the brand mark.
         Non-Micron tokens.css already styles html/body + h1–h3 and
         carries no logo — pasting this block there would clobber the
         theme and stamp a Micron logo on an unbranded deck. SKIP IT.
         ============================================================ */
      html, body {
        background: var(--bg-primary);
        color: var(--text-primary);
        font-family: var(--font-body), "Micron Basis Fallback", sans-serif;
        font-size: var(--type-base);
        line-height: var(--leading-body);
      }
      html, body, #overview {
        scrollbar-width: none;
        -ms-overflow-style: none;
      }
      html::-webkit-scrollbar,
      body::-webkit-scrollbar,
      #overview::-webkit-scrollbar {
        display: none;
        width: 0;
        height: 0;
      }
      h1, h2, h3 {
        font-family: var(--font-display), "Micron Basis Fallback", sans-serif;
        letter-spacing: var(--track-headline);
        line-height: var(--leading-tight);
        font-weight: 700;
      }
      h1 { font-size: var(--type-h1); }
      h2 { font-size: var(--type-h2); }
      h3 { font-size: var(--type-h3); }

      /* Mandatory Micron logo on non-title slides — one rule, never per slide.
         Copy themes/_shared/micron-logo-*-tm-rgb.png into the deck's assets/.
         See themes/_shared/README.md for the asset contract. */
      .slide:not(.title-slide)::after {
        content: "";
        position: absolute;
        right: var(--space-5);
        bottom: var(--space-5);
        width: clamp(60px, 8vw, 96px);
        height: clamp(18px, 2.4vw, 28px);
        background: url("assets/micron-logo-white-tm-rgb.png") right bottom / contain no-repeat;
        opacity: 0.9;
        pointer-events: none;
      }
      .theme-light .slide:not(.title-slide)::after {
        background-image: url("assets/micron-logo-black-tm-rgb.png");
        opacity: 0.85;
      }
      .theme-light body { background: var(--gray-f); }
      /* ===================== END MICRON BASE BLOCK ===================== */
    </style>
  </head>
  <body>
    <div class="progress-bar" role="progressbar" aria-label="Deck progress"></div>
    <nav class="nav-dots" aria-label="Slide navigation"></nav>
    <div class="presentation-hotspot" aria-hidden="false">
      <button class="present-toggle" type="button" aria-label="Enter presentation mode (full screen)" title="Presentation: full screen (shortcut P)">
        <svg class="present-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 5.5v13l10-6.5-10-6.5Z" /></svg>
        <span class="presentation-toggle-text">Present</span>
      </button>
    </div>

    <main class="deck" tabindex="-1">
      <section class="slide title-slide" data-slide-kind="cover">
        <div class="slide-content">
          <h1 class="reveal">Presentation Title</h1>
          <p class="reveal eyebrow">Subtitle or author</p>
        </div>
      </section>

      <section class="slide" data-slide-kind="content">
        <div class="slide-content">
          <h2 class="reveal">Slide title</h2>
          <p class="reveal">Content…</p>
        </div>
      </section>
    </main>

    <div id="overview" role="dialog" aria-modal="true" aria-label="Slide overview" aria-hidden="true" tabindex="-1"></div>

    <script>
      class SlidePresentation {
        constructor() {
          this.slides = Array.from(document.querySelectorAll(".slide"));
          this.currentSlide = 0;
          this.locked = false;
          this.programmaticScroll = false;  // gates IntersectionObserver
          this.overviewOpen = false;
          this.lastFocus = null;
          this.deck = document.querySelector(".deck");
          this.navDotsContainer = document.querySelector(".nav-dots");
          this.progressBar = document.querySelector(".progress-bar");
          this.presentToggle = document.querySelector(".present-toggle");
          this.overview = document.getElementById("overview");

          this.setupNavDots();
          this.setupIntersectionObserver();
          this.setupKeyboardNav();
          this.setupWheelNav();
          this.setupTouchNav();
          this.setupPresentationMode();
          this.applySlide(0);
        }

        clamp(i) { return Math.max(0, Math.min(this.slides.length - 1, i)); }

        applySlide(i) {
          this.currentSlide = i;
          this.slides.forEach((s, idx) => {
            s.classList.toggle("active", idx === i);
            s.classList.toggle("visible", idx === i);
          });
          this.navDotsContainer.querySelectorAll("button").forEach((d, idx) => {
            d.classList.toggle("active", idx === i);
            d.setAttribute("aria-current", idx === i ? "true" : "false");
          });
          if (this.progressBar) {
            // Composited: scaleX, never width (width animates layout).
            this.progressBar.style.transform = `scaleX(${(i + 1) / this.slides.length})`;
          }
        }

        goTo(i, options = {}) {
          const next = this.clamp(i);
          if (this.locked && !options.immediate) return;
          this.applySlide(next);
          this.programmaticScroll = true;
          this.slides[next].scrollIntoView({
            behavior: options.immediate ? "auto" : "smooth",
            block: "start",
          });
          if (!options.immediate) {
            this.locked = true;
            window.setTimeout(() => {
              this.locked = false;
              this.programmaticScroll = false;
            }, 650);
          } else {
            // Immediate jumps still clear the flag on the next tick
            requestAnimationFrame(() => { this.programmaticScroll = false; });
          }
        }

        next() { this.goTo(this.currentSlide + 1); }
        prev() { this.goTo(this.currentSlide - 1); }

        setupIntersectionObserver() {
          const observer = new IntersectionObserver(
            (entries) => {
              if (this.programmaticScroll) return;  // don't fight goTo()
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  this.applySlide(this.slides.indexOf(entry.target));
                }
              });
            },
            { threshold: 0.6 },
          );
          this.slides.forEach((s) => observer.observe(s));
        }

        setupNavDots() {
          this.navDotsContainer.innerHTML = "";  // avoid duplicate dots on reopen
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
            if (this.overviewOpen) {
              if (e.key === "Tab") this.trapFocus(e);
              return;
            }
            if (e.key.toLowerCase() === "p") {
              e.preventDefault();
              this.requestPresent();
              return;
            }
            if (["ArrowRight", "ArrowDown", "PageDown", " "].includes(e.key)) {
              e.preventDefault(); this.next();
            } else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) {
              e.preventDefault(); this.prev();
            } else if (e.key === "Home") {
              e.preventDefault(); this.goTo(0);
            } else if (e.key === "End") {
              e.preventDefault(); this.goTo(this.slides.length - 1);
            }
          });
        }

        setupWheelNav() {
          // Listen on the deck element (not window) so a passive listener
          // can coexist with native scroll-snap. We use deltaY only, and
          // do not call preventDefault — scroll-snap does the right thing.
          let wheelAcc = 0;
          let wheelTimer = null;
          this.deck.addEventListener("wheel", (e) => {
            if (this.overviewOpen) return;
            wheelAcc += e.deltaY;
            if (Math.abs(wheelAcc) > 80) {
              wheelAcc > 0 ? this.next() : this.prev();
              wheelAcc = 0;
            }
            window.clearTimeout(wheelTimer);
            wheelTimer = window.setTimeout(() => { wheelAcc = 0; }, 180);
          }, { passive: true });
        }

        setupTouchNav() {
          let startX = 0, startY = 0;
          window.addEventListener("touchstart", (e) => {
            const t = e.changedTouches[0];
            startX = t.clientX; startY = t.clientY;
          }, { passive: true });
          window.addEventListener("touchend", (e) => {
            if (this.overviewOpen) return;
            const t = e.changedTouches[0];
            const dx = t.clientX - startX, dy = t.clientY - startY;
            // Horizontal swipes navigate; vertical falls through to scroll-snap.
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
              dx < 0 ? this.next() : this.prev();
            }
          }, { passive: true });
        }

        setupPresentationMode() {
          this.presentToggle?.addEventListener("click", () => this.requestPresent());
        }

        requestPresent() {
          document.documentElement.requestFullscreen?.().catch(() => {});
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
            clone.classList.add("clone", "visible");
            clone.setAttribute("aria-hidden", "true");
            clone.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
            clone.querySelectorAll("button, a, input, select, textarea, [tabindex]").forEach((el) => el.setAttribute("tabindex", "-1"));
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
              // Fixed-stage decks contain a 16:9 .slide-stage inside a
              // viewport-height .slide. Scale the stage dimensions for the
              // overview so thumbnails do not include letterbox space.
              // CSS should pin `.clone > .slide-stage` to top-left and remove
              // its live transform inside overview cards.
              const slideRect = this.slides[0].getBoundingClientRect();
              const fixedStage = Boolean(clone.querySelector(":scope > .slide-stage"));
              const srcW = fixedStage ? 1600 : (slideRect.width || window.innerWidth);
              const srcH = fixedStage ? 900 : (slideRect.height || window.innerHeight);
              clone.style.width = srcW + "px";
              clone.style.height = srcH + "px";
              clone.style.transform = `scale(${thumb.clientWidth / srcW})`;
            });
          });
        }

        toggleOverview(force) {
          this.overviewOpen = typeof force === "boolean" ? force : !this.overviewOpen;
          if (this.overviewOpen) {
            this.lastFocus = document.activeElement;
            this.buildOverview();
            this.overview.setAttribute("aria-hidden", "false");
            this.overview.focus({ preventScroll: true });
          } else {
            this.overview.setAttribute("aria-hidden", "true");
            this.lastFocus?.focus?.({ preventScroll: true });
          }
        }

        trapFocus(e) {
          const focusable = this.overview.querySelectorAll("button, [tabindex]:not([tabindex='-1'])");
          if (!focusable.length) return;
          const first = focusable[0], last = focusable[focusable.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault(); last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault(); first.focus();
          }
        }
      }

      window.presentation = new SlidePresentation();
    </script>
  </body>
</html>
```

## Required runtime features

Every deck must include:

1. **SlidePresentation controller** with keyboard, wheel, touch, nav dots, progress bar, Present button, ESC overview.
2. **IntersectionObserver** gated by `programmaticScroll` so it doesn't race `goTo()`.
3. **Focus trap + `aria-modal`** on `#overview`; restore focus on close.
4. **Passive wheel listener on the `.deck` element** — never on window with `{passive:false}`. Scroll-snap is the primary flow; wheel just nudges currentSlide.
5. **Brand mark** rule for `.slide:not(.title-slide)`. One CSS rule, never per slide. Micron themes only — it lives in the Micron base block. Non-Micron themes are unbranded by contract (`verify.logo_pattern: null`) and must not carry it.
6. **Letterbox color** on `body` (`var(--bg-primary)`) so non-16:9 windows show neutral space, not stretch.
7. **Present button** inside a top-right `.presentation-hotspot`; the `.present-toggle` pill is hidden until hover/focus, includes a play icon, and requests fullscreen on click and via the `P` shortcut.
8. **No visible browser scrollbars** on the slide flow or overview; use `scrollbar-width:none`, `-ms-overflow-style:none`, and hidden WebKit scrollbar pseudo-elements while preserving scroll-snap.

## Accessibility checklist

- Semantic landmarks (`<main class="deck">`, `<nav>`).
- Keyboard fully works without mouse.
- `prefers-reduced-motion` disables reveal transitions (handled in viewport-base.css).
- All decorative SVG: `role="img"` + `aria-label`, or `aria-hidden="true"` if purely ornamental.

## File structure

```
presentation.html          # single-file, all CSS/JS inline
assets/                    # images + optional micron-basis.woff2
assets/fonts/              # webfont(s), referenced by micron-tokens.css
```

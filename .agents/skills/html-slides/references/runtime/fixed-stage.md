# Fixed-stage runtime (opt-in overlay)

`viewport-base.css` ships a **fluid** slide model: every `.slide` is
`100vw × 100dvh` and content reflows to the window. That is correct for
most themes. Some decks instead need a **real 16:9 stage**: a fixed-ratio
canvas centred in a neutral letterbox, so the deck reads as a printed
sheet, not a web page.

Use this when:

- The theme requires it. **`micron-light` mandates it** (see its
  `design.md` §7). **`micron-dark-engineering`** uses it for boardroom /
  readout decks.
- The deck must letterbox (not stretch) on a non-16:9 browser — the
  SKILL.md non-negotiable "Fixed-stage decks must expose a real 16:9 slide
  canvas" applies.

This is an **overlay**: paste it *after* `viewport-base.css` so it
overrides the fluid `.slide` / `.slide-content` rules. Everything else
(reveal, overview, nav, the controller from `html-template.md`) is
unchanged — the overview clone sizing already reads the live slide rect,
so it works for both models.

## CSS — paste after viewport-base.css

```css
/* Fixed 16:9 stage. Pick one stage size per deck and keep it. */
:root {
  --stage-w: 1600px;          /* or 1280px for smaller decks */
  --stage-h: 900px;           /* keep 16:9 with --stage-w */
  --stage-scale: 1;           /* set by JS below */
}

html, body { height: 100%; overflow-x: hidden; }

/* Letterbox: neutral space outside the stage. Theme tokens drive it —
   micron-light sets --letterbox; others fall back to a near-bg tone. */
body { background: var(--letterbox, var(--bg-secondary, var(--bg-primary))); }

/* The slide fills the viewport and centres the stage; the STAGE is
   .slide-content, scaled to fit. Overrides viewport-base's fluid rules. */
.slide {
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  scroll-snap-align: start;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: var(--bg-primary);
}
.slide-content {
  position: relative;
  width: var(--stage-w);
  height: var(--stage-h);
  flex: 0 0 auto;
  max-height: none;            /* undo viewport-base's max-height:100% */
  transform: scale(var(--stage-scale));
  transform-origin: center;
}

@media print {
  body { background: #fff; }
  .slide { width: var(--stage-w); height: var(--stage-h); page-break-after: always; }
  .slide-content { transform: none; }
}
```

## JS — add before `new SlidePresentation()`

```js
function updateStageScale() {
  const s = Math.min(1, window.innerWidth / 1600, window.innerHeight / 900);
  document.documentElement.style.setProperty("--stage-scale", s.toFixed(4));
}
updateStageScale();
window.addEventListener("resize", updateStageScale);
// If --stage-w/--stage-h are not 1600/900, divide by your chosen size.
```

## Verify

Run the standard verifier plus a non-16:9 viewport to confirm the stage
letterboxes instead of stretching:

```bash
uv run scripts/verify.py <deck>.html --theme <id> \
  --viewports 1280x720,375x667,1127x1084 --check-overview --fail-on-warnings
```

The `1127x1084` (non-16:9) shot must show neutral letterbox space around a
correctly-proportioned stage, not a distorted slide.

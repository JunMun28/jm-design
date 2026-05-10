# Frontend-slides architecture

Use this as the required slide runtime architecture for Micron HTML decks.
This skill is self-contained; use bundled files inside `micron-html-slides`.

## Source files to read

- `references/html-template.md`: canonical architecture template. Start from this structure.
- `references/viewport-base.css`: paste full contents into output.
- `references/animation-patterns.md`: use only when motion decisions are needed.
- `scripts/export-pdf.sh`: use only if user asks for PDF export.
- `scripts/extract-pptx.py`: use only if converting PPT/PPTX content.
- `references/export-workflows.md`: use for PDF delivery.
- `references/verification.md`: use before final response.

Use the architecture. Do not use generic frontend-slides visual presets.
Micron design files control color, typography, layout feel, imagery, charts, and brand rules.

Do not invent a different runtime. Adapt bundled `references/html-template.md` to Micron tokens and layouts.
The deck remains vertical scroll-snap. Add the Open Design-style ESC overview grid on top of that vertical flow.

## Required output shape

Default output is one single-file, no-build HTML deck:

- no npm
- no build step
- all authored CSS inline
- all authored JS inline
- approved CDN runtimes only when a design reference explicitly calls for them; disclose them in the final response
- one `<section class="slide">` per slide
- `.slide-content` inside content slides
- vertical scroll-snap between slides
- progress bar
- nav dots
- ESC overview grid with clickable slide thumbnails
- `SlidePresentation` JS controller

## Canonical template requirements

Follow `references/html-template.md`:

- Preserve document skeleton: metadata, theme variables, reset, viewport CSS, slide sections, controller script.
- Keep CSS variables in `:root`; replace generic preset tokens with Micron tokens.
- Paste full `viewport-base.css` before custom Micron slide styles.
- Keep `.reveal` / `.visible` animation pattern.
- Keep progress bar and nav dots unless user asks for a static/export-only deck.
- Keep ESC overview unless user asks for a static/export-only deck.
- Include clear CSS section comments.
- Do not use frontend-slides style presets; use Micron design files.

## Required document anatomy

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Deck title</title>
    <style>
      :root {
        /* Micron tokens here */
      }

      * { box-sizing: border-box; margin: 0; padding: 0; }

      /* Paste full viewport-base.css here */

      /* Micron theme, layouts, charts, and motion here */
    </style>
  </head>
  <body>
    <div class="progress-bar"></div>
    <nav class="nav-dots" aria-label="Slide navigation"></nav>

    <section class="slide title-slide">
      <div class="slide-content">
        <p class="eyebrow reveal">SECTION</p>
        <h1 class="reveal">Title</h1>
      </div>
    </section>

    <div id="overview" aria-hidden="true"></div>

    <script>
      class SlidePresentation {}
      window.presentation = new SlidePresentation();
    </script>
  </body>
</html>
```

## Viewport invariants

Every generated deck must preserve these:

- `.slide { width: 100vw; height: 100vh; height: 100dvh; overflow: hidden; }`
- `html { scroll-snap-type: y mandatory; scroll-behavior: smooth; }`
- `#overview` is fixed, hidden by default, scrollable internally, and opened with Escape.
- `.slide-content` has max-height and overflow protection.
- typography and spacing use `clamp()`.
- images use viewport max-height constraints.
- height breakpoints exist for 700px, 600px, and 500px.
- `prefers-reduced-motion` is included.
- never use internal slide scrolling to solve overflow.

## Controller requirements

`SlidePresentation` must provide:

- current slide tracking
- intersection observer that adds `.visible`
- keyboard nav: arrows, space, page up/down, home/end
- mouse wheel nav with debounce
- touch/swipe nav
- progress bar updates
- nav dot generation
- ESC toggles overview.
- Overview cards clone each slide into a scaled thumbnail.
- Overview clones must force `.reveal` content visible.
- Clicking an overview card closes overview and jumps to that slide.
- Expose the instance as `window.presentation` so verification and PDF export can call `window.presentation.goTo(index, { immediate: true })`.

When building nav dots, clear before appending:

```js
this.navDotsContainer.innerHTML = "";
```

## Optional copied features

Use these only when relevant:

| Feature | When to use | Rule |
|---|---|---|
| React Flow | Complex architecture, pipeline, dependency, or system diagrams | Use only as an approved CDN runtime; make it non-interactive unless the user asks for interactive diagrams |
| Three.js | Cinematic title templates, shader canvases, 3D wafer/tech hero, milestone motion | Use only when it materially improves the slide; provide a static fallback or reduced-motion behavior |
| Inline editing | User asks to edit text in-browser | Copy `references/html-template.md` opt-in editor pattern; skip all edit code otherwise |
| Export clean HTML | Inline editing enabled | Strip `contenteditable`, edit classes, toggle/banner state before saving |
| Image pipeline | User provides images | Keep direct file paths, process copies only, never overwrite originals |
| PDF export | User asks for PDF | Use `scripts/export-pdf.sh` |
| PPT extraction | User provides PPTX | Use `scripts/extract-pptx.py` |

## Reveal motion

Use `.reveal` elements inside slides:

- initial opacity 0
- transform translateY only
- transition opacity and transform
- stagger children sparingly
- avoid motion that delays reading

Default easing:

```css
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
```

## Density limits

Split instead of cramming:

| Slide type | Maximum |
|---|---|
| Title | 1 heading + 1 subtitle |
| Content | 1 heading + 4-6 bullets or 2 short paragraphs |
| Grid | 6 cards max |
| Code | 8-10 lines |
| Quote | 1 quote, max 3 lines |
| Image | 1 heading + 1 image |
| Data | 1 chart/table + one takeaway |

## Modification mode

When editing an existing deck:

1. Count current content before adding anything.
2. Check density limits.
3. Preserve viewport invariants.
4. If added content risks overflow, split into another slide.
5. Re-verify at 1280x720 and mobile width.

## Verification

Before final:

- open the HTML
- capture at least 1280x720
- capture one narrow/mobile viewport
- check console errors
- check nav dots/keyboard/wheel/swipe
- press Esc: overview opens; press Esc again: overview closes
- click overview thumbnail: deck jumps to that slide
- inspect screenshots for overlap and hierarchy

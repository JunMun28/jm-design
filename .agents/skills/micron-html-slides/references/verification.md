# Verification

Verify rendered output before final.

## Basic command

```bash
python <skill-dir>/scripts/verify.py micron-slides.html --viewports 1280x720,375x667 --slides 10 --check-overview
```

Use fewer slides if the deck is short.

If the active Python does not have Playwright, use Codex workspace dependencies
and run the same command with the bundled Python from `load_workspace_dependencies`.

## What to check

- HTML opens.
- No JavaScript page errors.
- Console is clean or warnings are understood.
- Every slide fits viewport.
- No text overlap.
- No internal slide scroll.
- Navigation works: keyboard, wheel, swipe/dots.
- Esc opens slide overview.
- Overview thumbnails are visible and clickable.
- Mobile/narrow viewport does not collapse critical content.
- Use `--fail-on-warnings` when warnings should block delivery.
- The verifier fails on DOM overflow, blank slide geometry, console errors, nav-dot mismatches, and overview-card mismatches.
- For fixed-stage dark engineering decks, transformed 16:9 stages are valid; verify visual fit, not raw unscaled scroll dimensions.

## If verification fails

- White screen: check console error first.
- Fonts wrong: wait for `document.fonts.ready`, check font URL/name.
- Layout overflow: split slide; do not shrink below readable type.
- Animation issue: prefer transform and opacity; avoid layout-thrashing properties.
- Navigation issue: confirm `.slide` elements exist and `SlidePresentation` initialized.
- Overview issue: confirm `#overview` exists, Escape toggles `aria-hidden`, and `.ov-card` elements are generated from slides.

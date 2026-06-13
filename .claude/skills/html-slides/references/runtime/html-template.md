# Deck DOM contract + shell markers

The slide runtime and all chrome (app bar, left thumbnail rail, present mode,
grid overview, help, jump-to-slide, progress, notes panel) live in ONE canonical
shell — `assets/shell.css` + `assets/shell.js` — and are **inlined** into every
deck by `scripts/build-deck.py`. The agent never hand-writes the shell. This file
documents the DOM the agent *does* author. See ADR 0005 (inlined shell) and ADR
0006 (Slide Player).

## Document skeleton

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Deck title</title>

  <!-- SHELL:CSS -->
  <!-- /SHELL:CSS -->

  <style id="theme-tokens">
    :root {
      /* map the shell chrome tokens to the theme palette */
      --bg: …; --ink: …; --muted: …; --faint: …;
      --accent: …; --panel: …; --line: …; --line-strong: …;
      /* fixed-canvas themes only: */
      --stage-w: 1600px; --stage-h: 900px;
    }
    /* theme content CSS — typography (BARE selectors: h1{}, p{}, .eyebrow{}),
       cards, layouts, decorations. Never use `.slide p {}` — it beats your own
       class rules. The shell's content defaults are :where(...) (zero
       specificity), so any theme rule wins. */
  </style>
</head>
<body>
  <main class="deck" data-deck-title="Deck title" data-deck-mode="live"  data-stage="fixed">
    <section class="slide" data-slide-kind="cover">
      <p class="eyebrow reveal">SECTION</p>
      <h1 class="reveal">Title</h1>
    </section>

    <section class="slide">
      <h2 class="reveal">An action-title assertion</h2>
      <p class="reveal">Body…</p>
      <aside class="speaker-notes">Presenter note for this slide.</aside>
    </section>
  </main>

  <!-- SHELL:JS -->
  <!-- /SHELL:JS -->
</body>
</html>
```

## Rules

- The two marker pairs are mandatory and must stay in the file (they let the deck
  be re-inlined / "reshelled"). Put the theme `<style id="theme-tokens">` **after**
  `<!-- /SHELL:CSS -->` so theme tokens override the shell's defaults.
- `data-stage="fixed"` + `--stage-w/--stage-h` only for themes authored at a fixed
  design canvas (e.g. Micron `1600×900`). Omit both for fluid (`clamp()`) themes.
- `data-deck-mode="live|standalone"`. Decision/approval decks add `data-deck-kind="decision"`.
- First slide is the cover (`data-slide-kind="cover"` or `class="title-slide"`).
- Section dividers use `data-slide-kind="section"`. Both cover and section are exempt from action-title and notes lints.
- Reveal animation: put `class="reveal"` on entry elements. The shell adds `is-active` **and** `visible` to the current slide and `visible` to each `.reveal`, so both `.slide.visible .reveal{…}` and `.reveal.visible{…}` contracts work.
- Speaker notes: one `<aside class="speaker-notes">…</aside>` per content slide (skip cover/section). Hidden in present mode.

## Shell-provided DOM (do NOT author)

The shell builds these at runtime from `.deck > .slide`: the app bar, `.rail`
(thumbnails), `.stage`/`.stage-area`, `.notes-panel`, `.grid-overview`,
`.help-overlay`, `.jump-input`, `.present-bar`, `.progress-bar`, and
`window.presentation` (`goTo(i,{immediate})`, `present()`, `current`, `total`).

## Build + verify

```sh
python3 scripts/build-deck.py reshell <deck>.html        # inline the canonical shell
uv run scripts/verify.py <deck>.html --theme <id> --require-shell --check-overview --fail-on-warnings
```

Never edit between the `<!-- SHELL:* -->` markers — `verify.py --require-shell`
fails on shell drift. Fix the canonical `assets/shell.*` and reshell instead.

# Implementation plan — Universal deck shell + Slide Player UX

- **Date:** 2026-06-13
- **Decision records:** [ADR 0005](../adr/0005-inlined-deck-shell-with-markers.md)
  (inlined shell), [ADR 0006](../adr/0006-slide-player-replaces-scroll-snap.md)
  (Slide Player paradigm)
- **Status:** Built. **All phases complete** (0–6). `scaffold-deck.py` rewritten
  to derive player decks from each theme's verified example (absolute asset paths
  + re-inlined shell); `audit-theme-matrix.py` runs examples + scaffolds; all of
  `.agents/` removed (working tree). Prior interim status below.
  - Shell (`assets/shell.css` + `assets/shell.js`) with fixed-canvas mode; inliner
    (`scripts/shell.py` + `scripts/build-deck.py` new/reshell/check); freshness gate
    + scale-aware readability + player grid-overview check in `verify.py`.
  - **All 7 theme `example.html` migrated to the player + markers and passing**
    `verify.py --require-shell --check-overview` at 1280×720 + 375×667
    (micron-dark, micron-light, guided-learning, playful, hand-drawn, aurora-glass,
    seventies-sunset).
  - `SKILL.md` + `references/runtime/html-template.md` rewritten to the player model.
  - `.agents/skills/html-slides` removed (working tree).
  - **REMAINING:** `scripts/scaffold-deck.py` still emits old-model decks — it must
    be rewritten to emit player decks via the inliner (with per-theme covers +
    asset handling), then `audit-theme-matrix.py` run *without* `--skip-generated`.
    Until then the audit covers shipped examples only.

## Goal

One canonical **Deck Shell**, inlined into every deck by a build step so a single
edit reaches all future decks (and marked existing ones via `--reshell`), output
staying one portable `.html`. The shell presents a **Slide Player** (left **Slide
Rail** + single stage, one slide at a time, no scroll-snap), a **Grid Overview**
the rail expands into, a fullscreen **Present Mode**, and collapsible
**Speaker Notes**. No nav dots, no second-window presenter view, no timer.

## Confirmed decisions

- **Shell boundary:** controller + document skeleton + viewport CSS **+ default
  chrome styling** (rail, top bar, stage, notes, grid overview, present controls,
  progress line). Themes override the chrome look via tokens; they never
  re-author the shell.
- **Navigation:** Slide Player; one slide shown at a time; arrow keys / rail
  click; **scroll-snap removed**; nav dots removed; ESC grid becomes the
  rail-expanded **Grid Overview** (kept).
- **Present Mode:** fullscreen slide-only + auto-hiding bar (exit, prev/next,
  counter) + thin progress line. Notes hidden. **No timer.**
- **Speaker Notes:** recommended; player-chrome panel; hidden in Present Mode;
  `verify.py` warns (never fails) when a content slide has none.
- **Wayfinding kept:** URL deep-link per slide, `?` help overlay, jump-to-slide
  (type a number), live counter.
- **Mobile:** rail collapses to a hamburger / top filmstrip; swipe navigates;
  notes hidden by default.
- **Source of truth:** `.claude/skills/html-slides`. `.agents/skills/html-slides`
  is removed.

## The keystone

`verify.py`'s **shell-freshness check** is what makes "change once, change all"
real. It lands in the *same* step as the inliner, before any example is migrated,
so every migrated deck is validated by the gate. Without it, drift returns.

## Phases (in order)

### Phase 0 — Canonical shell source (player edition)
- `assets/shell.css` ← `assets/base.css` + the chrome now scattered in theme
  examples, reworked for the player: left rail, top bar, centered stage frame,
  notes panel, grid overview, present-mode control bar, progress line. All
  token-driven so themes override via `:root`.
- `assets/shell.js` ← `assets/runtime.js`, rebuilt for the player model:
  single-active-stage (no scroll-snap), rail thumbnail generation (live-scaled
  clones with `.reveal` forced visible), arrow/click navigation, Grid Overview
  expand/collapse, Present Mode (fullscreen + auto-hide bar), hash deep-link,
  `?` help overlay, jump-to-slide, notes show/hide, `window.presentation` API.
  **Drop** timer, audience theme-switcher (`T`/`data-themes`), `preview-goto`,
  and the second-window presenter view.
- Write the shell **DOM contract** once: `.deck` wrapper + hooks (`.rail`,
  `.stage`, `.top-bar`, `.notes`, `.grid-overview`, `.progress-bar > span`,
  present controls), `<aside class="speaker-notes">`, `.reveal`→`.visible`.

### Phase 1 — The inliner (`scripts/build-deck.py`)
- Shared module `scripts/shell.py`:
  - `inline_shell(html_text) -> html_text` — replace content between
    `<!-- SHELL:CSS -->…<!-- /SHELL:CSS -->` and `<!-- SHELL:JS -->…<!-- /SHELL:JS -->`
    with the canonical files. Idempotent.
  - `canonical_shell_hash()` — hash of `shell.css` + `shell.js`, reused by verify.
- `build-deck.py new --theme <id> …` → emit a marked deck (markers + theme tokens
  + scaffold content + notes stubs), then `inline_shell`.
- `build-deck.py --reshell <deck.html>` → re-inline the latest shell into an
  existing marked deck (the manual "change all existing decks").

### Phase 2 — verify.py gates (the keystone)
- `check_shell_freshness(deck_text)` (Python side, no browser): extract the
  inlined shell between markers, normalize, hash-compare to
  `canonical_shell_hash()`. **Fail** on mismatch or missing markers.
- Notes-warn: a content slide (not section/title) with no
  `<aside class="speaker-notes">` → warning, never a hard fail.
- Rework `--check-overview` into a **player check**: exactly one active stage,
  rail thumbnail count == slide count, Grid Overview opens/closes, deep-link
  jumps. Remove the old scroll-snap / nav-dot assertions.

### Phase 3 — Wire scaffold + migrate examples
- `scaffold-deck.py`: delete its inline controller; emit markers; call
  `inline_shell` (shared module).
- Migrate all 6 theme `example.html` to markers + inlined shell. Un-link
  `guided-learning` from `assets/runtime.js`.
- Re-run `scripts/audit-theme-matrix.py --output tmp/html-slides-audit`.

### Phase 4 — Demote docs + reword instructions
- `references/runtime/html-template.md` → DOM-contract + marker reference (delete
  the controller body; it lives only in `shell.js`).
- `SKILL.md`: rewrite the three changed non-negotiables — scroll-snap → Slide
  Player; nav dots → Slide Rail; ESC overview → Grid Overview. Reword the inline
  rule to "inline via the Shell Inliner — never hand-write the shell." Document
  player / present / notes / deep-link. Change the workflow step from "adapt
  html-template.md" to "author content + notes + markers, then run
  `build-deck.py`."

### Phase 5 — Player UX polish + responsive
- `?` help overlay, jump-to-slide, counter, Grid Overview behavior.
- Mobile: rail collapses to hamburger / top filmstrip; swipe navigates; notes
  hidden by default; present mode unchanged.
- Notes authoring: scaffold emits an `<aside class="speaker-notes">` stub per
  content slide; `slide-brainstorm` / `slide-consultant` produce a notes draft.

### Phase 6 — Cleanup + regression
- Remove `.agents/skills/html-slides` (flag whole-`.agents` cleanup separately).
- Full regression: audit-theme-matrix green; `verify.py` passes every example
  (freshness + player + brand); browser check of player, Grid Overview, Present
  Mode, and deep-link at desktop + mobile, light + dark.

## Review checkpoints
- After Phase 2: prove the gate **fails** a deliberately-stale deck and **passes**
  a freshly inlined one before migrating anything.
- After Phase 3: audit-theme-matrix green across all stable themes.
- After Phase 5: browser verification of player + rail + Grid Overview + Present
  Mode + notes + deep-link, light and dark, desktop and mobile.

## Out of scope (this change)
- A linked/hosted deck portal (`--linked` mode) — deferred per ADR 0005.
- Tier 3 (in-slide fragments, slide transitions, kiosk/autoplay).
- Talk timer and second-window presenter view — explicitly dropped.
- Retrofitting already-delivered output decks outside the skill.

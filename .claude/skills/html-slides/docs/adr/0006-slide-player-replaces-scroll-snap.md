# ADR 0006 - Slide-player navigation replaces scroll-snap, nav dots, and the presenter window

- **Status:** Accepted
- **Date:** 2026-06-13
- **Relates to:** [ADR 0005](0005-inlined-deck-shell-with-markers.md) (the shell that ships this UX)

## Context

The **Deck Shell** (ADR 0005) historically expressed navigation as a *web page*:
vertical scroll-snap was the main flow, a right-edge nav-dot rail tracked
position, and Escape opened a thumbnail overview grid. `runtime.js` additionally
offered a second-window **presenter view** (current + next + notes + timer).

We are reimagining the delivered deck as a *slide application* rather than a
scrolling page. The driving picture is Google Slides / Keynote: a persistent
left thumbnail rail and a single slide stage, with a dedicated fullscreen
present mode. In that picture, scroll-snap, nav dots, the ESC grid, and the
second presenter window are all either redundant or actively wrong.

This contradicts three rules previously marked **non-negotiable** in `SKILL.md`:
"vertical scroll-snap is the main flow," "nav dots," and "ESC overview grid."
Those rules are being changed deliberately, which is why this is recorded.

## Decision

The deck shell presents a **Slide Player** as the default view and a fullscreen
**Present Mode** as the presentation state.

- **Slide Player** (default, non-presenting): a persistent left **Slide Rail**
  of live-scaled, numbered thumbnails (current highlighted, scrollable,
  collapsible) + a single main slide stage + a top bar (deck title, slide
  counter, `?` help, Present) + a collapsible **Speaker Notes** panel under the
  stage.
- Navigation is **one slide at a time** — arrow keys, or clicking a rail
  thumbnail. **Vertical scroll-snap is removed** as the navigation model.
- **Nav dots are removed**; the **Slide Rail** is the navigator. The overview
  grid is **kept** as a **Grid Overview** the rail expands into (all thumbnails
  at once), rather than the old ESC-only grid.
- **No timer** anywhere — neither in the player top bar nor in Present Mode.
- **Present Mode** (Present button or `P`): fullscreen, slide-only. Rail, top
  bar, and notes collapse away; only the slide, a thin progress line, and an
  auto-hiding minimal control bar (exit, prev/next, counter) remain. Esc
  returns to the player.
- **The second-window presenter view is dropped.** Without it there is no
  private surface for notes during a projected talk, so **Speaker Notes** move
  into the player chrome and are hidden whenever Present Mode is active.
- Tier 1 wayfinding is kept: URL deep-linking per slide, `?` help overlay,
  jump-to-slide (type a number), and the live counter.

Output remains one self-contained `.html` inlined via the **Shell Inliner**
(ADR 0005); this ADR changes only what that inlined shell *is*.

## Consequences

- The deck reads and behaves like a slide app, not a long scroll page. The rail
  gives persistent wayfinding and direct access to any slide.
- Three `SKILL.md` non-negotiables (scroll-snap main flow, nav dots, ESC
  overview) are rewritten; the verifier checks that referenced them change with
  them. `--check-overview` becomes a rail/player check.
- The shell rewrite is larger than a token swap: the `.slide` sizing model
  changes from scroll-snapped sections to a single shown stage with the others
  inactive. The reveal/`.visible` motion contract is preserved per slide.
- Mobile needs an explicit responsive story (rail collapses to a hamburger or
  top filmstrip; swipe navigates; notes hidden by default) — a left rail cannot
  stay pinned on a narrow viewport.
- Existing decks built on the scroll-snap model are not auto-converted; they
  keep working as-is. New decks (and reshelled marked decks) get the player.

## Alternatives considered

- **Keep scroll-snap; add a toggleable left rail in place of the ESC grid.**
  Smaller change, preserves the page-scroll feel. Rejected: it keeps the
  webpage paradigm the redesign is explicitly trying to leave.
- **Keep the second-window presenter view.** Richest presenter workflow.
  Rejected by the user as unwanted complexity; notes relocate to the player.
- **Drop speaker notes entirely** once the presenter window is gone. Rejected:
  notes still have value in the player while building and rehearsing; they are
  simply hidden during Present Mode.

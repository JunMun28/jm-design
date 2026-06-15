# ADR 0005 - Inlined deck shell with markers, not a linked runtime

- **Status:** Accepted
- **Date:** 2026-06-13

## Context

The theme-independent core of a deck — the `SlidePresentation` controller,
the document skeleton, the viewport invariants, and the default chrome styling
(now named the **Deck Shell** in `CONTEXT.md`) — existed in four unsynced
copies:

1. `references/runtime/html-template.md` (~452 lines) — the canonical template
   the agent adapted by hand.
2. `assets/runtime.js` (~960 lines) — an external runtime linked only by
   `themes/guided-learning/example.html`. Richest of the four: it already had
   presenter view, speaker notes, URL deep-linking, and a talk timer.
3. `scripts/scaffold-deck.py` — its own minimal (~17-line) inline controller.
4. Each theme's `example.html` — five more inline copies of the controller.

The June 12 2026 overhaul rewrote the inline template (copies 1, 3, 4) *without*
the presenter/notes/deep-link features that `runtime.js` already had, so the
actively-used path was the least capable one. A fix to the shell had to be made
in up to four places and still would not reach already-delivered decks.

We want one edit to the shell to reach every deck ("change once, change all"),
**and** we want the rich `runtime.js` feature set to become the default. The
hard constraint is the skill's #1 non-negotiable and a project-glossary value:
a delivered deck is **one no-build, self-contained `.html`** that survives being
emailed, moved between folders, and opened from `file://`.

"Change all" has two incompatible readings:

- **Linked runtime** — every deck `<script src="shell.js">`/`<link>` against a
  shared file. One edit live-updates every deck that points at it, including
  already-shipped ones. But decks stop being self-contained: they break when
  emailed alone, opened from another folder, or the shared file moves.
- **Inlined at build** — the shell is baked into each deck. Output stays one
  portable file, but a shell edit reaches only decks built (or rebuilt)
  afterward.

## Decision

The **Deck Shell** lives in exactly one canonical source — `assets/shell.js` +
`assets/shell.css`, evolved from `runtime.js` + `base.css` — and is **inlined**
into every deck by a build step. Decks never link a shared runtime.

- The agent **never hand-writes the shell.** A deck carries `<!-- SHELL:CSS -->`
  and `<!-- SHELL:JS -->` **Shell Markers**; the **Shell Inliner**
  (`scripts/build-deck.py`) reads the canonical source and inlines it at those
  markers. The agent authors only theme tokens, slide content, and per-slide
  `<aside class="speaker-notes">`.
- Because the markers persist in delivered files, the inliner can **reshell** an
  existing deck (`build-deck.py --reshell deck.html`). This recovers a *manual*
  "change all existing decks" without surrendering single-file output.
- `verify.py` **fails** any deck whose inlined shell has drifted from the
  canonical source (hash compare between the markers). This is the mechanical
  guarantee that "change once" actually propagates — a stale deck cannot pass.
- `scaffold-deck.py` and every theme `example.html` are migrated to markers +
  the inliner, so no hand-maintained copy of the shell remains anywhere.
- The shell reuses `runtime.js`'s speaker-notes and deep-linking code (the
  timer is dropped), but the navigation model and chrome are replaced by the
  Slide Player /
  Present Mode design (see [ADR 0006](0006-slide-player-replaces-scroll-snap.md)):
  the second-window presenter view, nav dots, scroll-snap, and the ESC overview
  grid are dropped. Its dev/demo-only features — the audience theme-switcher
  (`T` / `data-themes`) and the `preview-goto` postMessage hook — are also
  stripped, since a delivered deck is single-theme.

## Consequences

- One physical source for the shell; a single edit + reshell (or rebuild)
  updates every deck. Drift is caught by CI, not by reviewers.
- Delivered decks remain one portable `.html`. Portability, the non-negotiable,
  is preserved.
- "Change all *shipped* decks" is manual, not automatic: someone must rerun
  `--reshell` (or the deck must still carry markers). A deck whose markers were
  stripped is frozen. This is the accepted cost of single-file output.
- The agent workflow changes: "adapt `html-template.md`" becomes "author content
  + notes + markers, then run `build-deck.py`." `html-template.md` is demoted to
  a DOM-contract + marker document.
- `guided-learning` is **un-linked** from `assets/runtime.js` and inlines the
  shell like every other theme — the one place the old linked model lived is
  retired.
- Inlined decks grow by the full shell (~1k lines of JS). For a single-file
  artifact this is just text and is acceptable; it is the price of portability.

## Alternatives considered

- **Linked shared runtime (`<script src>`).** Gives automatic "change all,"
  including shipped decks, with the smallest files. Rejected: it breaks the
  single-file non-negotiable — decks would stop working when emailed or moved.
- **Opt-in `--linked` mode alongside inlining.** Keep inline as default, allow a
  linked build for a hosted deck *portal*. Deferred, not rejected: cheap to add
  later if a portal ever exists; no current need justifies the second code path.
- **Scaffold-only canonicalization.** Only `scaffold-deck.py` knows the shell;
  agent-authored decks keep adapting by hand. Rejected: the agent path is the
  common one, so drift would simply return there.
- **Keep the June-12 controller as the base** and port presenter/notes/deep-link
  into it. Rejected as the base: `runtime.js` already implements the hard parts
  (presenter-window sync, notes collection, hash routing), so it is the cheaper,
  lower-risk starting point; the June-12 nav/overview/verify expectations are
  reconciled into it rather than the reverse.

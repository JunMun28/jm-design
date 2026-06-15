# Slide Studio — living round-trip: returnable wireframe, style variants, files panel

- **Date:** 2026-06-15
- **Status:** Design approved (pending spec review). Not yet planned.
- **Branch:** `main` (Slide Studio lives at `slide-studio/`; the new shell + living editor were merged to main in `3c94eac`).
- **Scope:** **A** (shell parity) + **C** (returnable wireframe + non-destructive style variants + Claude-Design-style files panel). **B** (direct in-browser typing) is explicitly out of this round.

## Problem

Slide Studio (`slide-studio/`, Angular 22 + Atlas + Node daemon) guides a non-technical user
through `brief → wireframe → theme → deck` and already refines via **annotate → regenerate**
(both wireframe and deck). But:

- The flow runs **forward only**; there is no first-class "go back from the finished deck to
  the wireframe, refine content/structure, and regenerate." ("Request changes" only loops back
  one stage.)
- A project holds **one theme / one `deck.html`** — no way to keep several style variants.
- Its **vendored skills are stale** (`slide-studio/skills/`): old html-slides runtime
  (`assets/runtime.js`), not the new universal Slide Player shell + living editor on main.
- There is no **files view** (the user wants Claude Design's "click an `.html` to open and
  keep editing").

We want the Claude-Design round-trip: the **wireframe is a durable, returnable source**; each
**deck is a re-generatable rendering**; you can keep **multiple style variants**; and you
browse/open everything from a **files panel**.

## Goal

1. **Shell parity (A):** Slide Studio's generated decks use the new universal Slide Player
   shell, rendered in an **embedded viewer mode** inside the workspace.
2. **Returnable wireframe + variants (C):** from a deck you can go back to the wireframe,
   refine, and regenerate; "add a style" produces a **new, non-destructive** deck variant;
   variants coexist.
3. **Files panel:** a Claude-Design-style list of the project's artifacts; clicking an `.html`
   opens it in the right view to continue iterating.

## Non-goals

- **B — direct in-browser typing** (contenteditable + save). Refine = annotate→regenerate this
  round.
- **Auto-sync** between variants or between wireframe and decks. Variants are frozen at the
  wireframe revision they were generated from.
- Rewriting Slide Studio's agent-driving, streaming, gates, or annotation engine. This is
  **additive**.
- Hand-editing vendored skills — `slide-studio/skills/` stays a one-way sync from
  `.claude/skills` via `scripts/sync-skills.mjs`.

## Current-state anchors (verified)

- Deck entry constant `DECK_ENTRY = 'deck.html'` — `apps/daemon/src/server.ts:114`.
- Generate composes `GENERATE_SKILLS = ['html-slides','micron-icons']` skill bodies and tells
  the agent to write `deck.html` then run verify — `apps/daemon/src/skills.ts:128`, `server.ts:~615`.
- Skills read from vendored tree — `apps/daemon/src/skills.ts:88–106` (`skillsRoot()`, `loadSkillBody`).
- Deck served at `GET /api/projects/:id/artifact/content?entry=…` — `server.ts:412–422`; embedded
  as `<iframe sandbox="allow-scripts" [srcdoc]>` — `apps/web/src/app/deck/deck.component.ts:65–73`;
  live-reload via chokidar — `apps/daemon/src/artifact-watcher.ts:74–94`.
- Slide Studio injects its **own** minimal pager into the deck iframe (`display:none` per slide)
  — `deck.component.ts:227–244`.
- Annotation SDK served at `/api/annotation-sdk.js` (`server.ts:454–457`); finds slides by
  `[data-slide], .slide-panel, .slide, body > section` and anchors by selector+text — works as
  long as slides stay in the DOM (the new shell keeps them; it toggles `.is-active` via
  opacity/pointer-events) — `apps/daemon/src/annotation-sdk.ts:97–106`, `annotation.ts:56–90,246–274`.
- Deck annotation → regenerate (surface-aware) — `annotation.ts:336–344` (`headerFor`),
  `feedback-queue.ts:250–252` (`hasDeckAnnotations`), `server.ts:597`.
- Verify gate: `uv run skills/html-slides/scripts/verify.py <deck> --theme <id>` (cwd =
  vendored html-slides root) — `apps/daemon/src/verify.ts:52–56,117–149`.
- Flow + gates: `FlowStage = 'brief'|'wireframe'|'theme'|'deck'`, `setTheme` advances to deck;
  `theme: string | null` on the record — `apps/daemon/src/projects.ts:15–16,33,254–270`.
- Themes read from vendored `skills/html-slides/themes/themes.json` — `apps/daemon/src/themes.ts:24–30`.

## Design

### A. Shell parity

1. **Sync skills:** `node scripts/sync-skills.mjs` vendors the merged-to-main skills (universal
   shell `assets/shell.{css,js}`, `scripts/build-deck.py`, the new `verify.py`, `deck_meta.py`,
   reshelled theme examples) into `slide-studio/skills/`. This is the existing one-way sync.
2. **Embedded viewer mode (shell change):** the universal shell gains an opt-in embed flag —
   `<body data-embed>` (or `.deck[data-embed]`) — that **hides the `Edit`, `Save`, and
   `Present` buttons** (B is out of scope; Present is redundant with Slide Studio's own
   export). The player (stage, rail, grid, help, notes, keyboard nav) stays. This is a small,
   additive CSS/JS guard in `shell.css`/`shell.js`, upstream in `.claude/skills/html-slides`,
   then re-synced. Slide Studio sets `data-embed` on decks it renders.
3. **Drop Slide Studio's injected pager** (`deck.component.ts:227–244`): the shell's player
   replaces it. Keep the Annotation SDK injection.
4. **Verify** keeps working (now the new `verify.py`); decks generated from a theme example
   carry shell markers so the freshness check applies. No `--require-shell` needed.

### C. Returnable wireframe + non-destructive variants

**Data model (`apps/daemon/src/projects.ts`):**

- Replace the single `theme: string | null` + implicit `deck.html` with:
  ```
  type DeckVariant = { id: string; theme: string; file: string; fromWireframeRev: number; createdAt: string };
  // ProjectRecord gains:
  decks: DeckVariant[];          // was: a single deck.html + theme
  wireframeRev: number;          // bumped each time the wireframe is revised+approved
  activeDeckId: string | null;   // which variant the deck view is showing
  ```
- **Migration on load:** an existing project with `theme` + a `deck.html` on disk is migrated to
  `decks: [{ id, theme, file: 'deck.html', fromWireframeRev: 0, createdAt }]`, `wireframeRev: 0`.
  Keep reading old records; never lose existing projects.

**Variant files:** each variant is its own file `deck.<theme>.html` in the project dir (the
legacy `deck.html` is treated as the first variant). The daemon stamps each with its source +
theme using the synced `deck_meta.py` (`<!-- SOURCE: …wireframe · THEME: … -->`).

**Generate / add-a-style (`server.ts` generate path + `themes.ts`/`projects.ts`):**

- First deck generation writes `deck.<theme>.html`, registers a `DeckVariant`, sets `activeDeckId`.
- **"Add a style"**: a new action (theme picker → generate) regenerates from the **current
  wireframe** into a **new** `deck.<theme>.html` variant; never overwrites an existing variant
  (if the theme already has a variant, confirm/replace is the user's choice). Verify per variant.
- Deck **annotate → regenerate** (existing) rewrites the **active** variant in place.

**Returnable wireframe (stage nav):**

- The stepper becomes **freely navigable backward**: from `deck` the user can return to
  `wireframe` ("Refine content") or `theme`. Gates remain as `approved` markers; revisiting a
  stage is allowed and does not reset later gates.
- Refining the wireframe reuses the existing annotate→revise loop; on re-approval (Gate 2),
  `wireframeRev++`. Variants whose `fromWireframeRev < wireframeRev` are **stale** (informational
  flag; regenerate to refresh). No auto-regeneration.

### Files panel (Claude-Design-style)

- New Angular panel in the workspace listing project artifacts, **grouped**: **Wireframe**,
  **Decks** (each variant, with theme + a "wireframe changed" badge when stale), **Exports**
  (PPTX/PDF — downloadable, not in-app editable). Assets are hidden.
- Backed by a daemon endpoint `GET /api/projects/:id/files` returning the grouped list from the
  project record + on-disk exports.
- **Click routing:** a deck variant → deck view with that variant active (annotate→regenerate,
  back-to-wireframe available); the wireframe → wireframe view (annotate→revise). Routes to the
  right view, never raw source.
- The panel is the variant switcher; the stepper remains for guided first-creation.

## Data flow (scenarios)

- **New deck:** brief → wireframe → theme → generate `deck.micron-dark.html` (variant 1, active).
- **Add a style:** from deck, "add a style" → playful → generate `deck.playful.html` (variant 2);
  both appear in Files panel; switch between them.
- **Refine content:** from deck, "Refine content" → wireframe → annotate→revise → approve
  (`wireframeRev++`) → regenerate the active variant (or add a fresh one); older variants show
  "wireframe changed."
- **Open later:** Files panel → click `deck.playful.html` → opens in deck view to keep iterating.

## Error handling & edge cases

- **Migration:** old single-deck/theme projects load into the new shape without data loss.
- **Stale variant:** `fromWireframeRev < wireframeRev` → badge only; never silent regenerate.
- **Annotation vs one-slide player:** the shell keeps all slides in the DOM, so SDK selector+text
  relocation still resolves; the user annotates the visible slide (navigate via the rail first).
  Add a daemon test asserting the SDK's `slides()` finds the new shell's `.slide` set.
- **Embedded viewer:** hiding `Edit`/`Save`/`Present` must not break layout or navigation.
- **Sandbox:** deck iframe is `sandbox="allow-scripts"` srcdoc; the shell is self-contained
  (no same-origin needed); the editor's FS-Access save is hidden in embed mode, so no sandbox
  conflict.
- **Verify per variant:** each `deck.<theme>.html` verifies against its own theme id.
- **Vendored-skill drift:** never hand-edit `slide-studio/skills/`; fix upstream + re-sync.

## Testing

Slide Studio uses `node:test` (daemon) + Angular build (web).

- **Daemon suites:** project migration (old → `decks[]`/`wireframeRev`); generate writes
  `deck.<theme>.html` + registers a variant; add-a-style is non-destructive; `GET …/files`
  grouping; stale-variant flag; verify invoked per variant; annotation SDK finds the new shell's
  slides.
- **Web build:** Files panel + variant switcher + free backward stepper typecheck/build.
- **Integration smoke:** after `sync-skills`, a generated deck contains the new shell markers,
  renders the one-slide player, hides Edit/Save/Present under `data-embed`, and the Annotation
  SDK reports the slide count.

## Implementation slices (this is multi-slice; plan per slice)

- **S1 — Shell parity:** upstream `data-embed` viewer mode in the shell; `sync-skills`; drop the
  injected pager; confirm verify + annotation still work. *(Foundation; do first.)*
- **S2 — Variant data model:** `decks[]` + `wireframeRev` + `activeDeckId` + migration; generate
  writes/register `deck.<theme>.html`; verify per variant.
- **S3 — Files panel:** `GET …/files` + the grouped Angular panel + click-to-open routing
  (doubles as variant switcher).
- **S4 — Returnable wireframe + add-a-style:** free backward stepper nav; "Refine content";
  "Add a style" theme→new variant; `wireframeRev` bump + stale badge.

Each slice is independently shippable and testable; the implementation plan will sequence them
S1 → S2 → S3 → S4.

## Out of scope / future

- B — direct in-browser typing (contenteditable + save through the daemon).
- Auto-regenerating stale variants when the wireframe changes.
- Wireframe-level multiple revisions/history UI beyond a monotonic `wireframeRev`.

Related: [[project_living_deck_editable_source]] (the html-slides editor this builds on),
[[project_atlas_slides_app]] (Slide Studio), [[project_universal_slide_shell]].

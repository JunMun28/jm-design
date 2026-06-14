# Living deck — editable source + restyle round-trip

- **Date:** 2026-06-14
- **Status:** Design approved (pending spec review). Not yet planned.
- **Branch context:** builds on `slide-loop` (universal Slide Player shell, ADR 0005/0006).

## Problem

Today the slide pipeline is one-way:

```
slide-brainstorm → wireframe HTML → html-slides → deck HTML → html-to-pptx → PPTX
```

The wireframe is *meant* to be the durable source (the brainstorm skill says "fix the
wireframe, don't patch downstream"), but in practice the round-trip is manual and lossy:

- Edits made to a built deck never flow back; the wireframe goes stale.
- Re-running `html-slides` is a full rebuild, not an incremental refine.
- PPTX is terminal — no path back to deck or wireframe.

The user wants the Claude Design experience: a content source you can return to, the
ability to regenerate the same content in different design styles, and outputs that stay
editable instead of becoming frozen.

## Goal

Two living layers with a clear, low-sync relationship:

1. **Wireframe = content source** (theme-free). You go back to it anytime to refine
   content/structure, then **regenerate styled decks** from it — in the same or a
   different theme.
2. **Styled deck = rendering.** Each generated deck is a **living, editable** single-file
   HTML: click-to-edit text, reorder/duplicate/delete slides, and **save back to the same
   file**. Exports to an editable PPTX.

Regeneration is **non-destructive** (new variant file per style). The two layers do **not**
auto-sync — that is the accepted trade-off.

## Non-goals

- Two-way HTML↔PPTX sync.
- A version-history UI or a local "deck workspace" app (git versions files; a workspace app
  overlaps the separate planned Atlas Slides app).
- Adding a brand-new slide from the inline editor (chat does that — it needs design intent).
- Changing `slide-quick` (native-PPTX fast path stays as-is, out of scope here).
- Inline-editing the wireframe itself (v1 refines the wireframe via chat / direct edit; see
  Future).

## The two-layer model

| Layer | Artifact | Editable how | Role |
|---|---|---|---|
| Content source | `docs/brainstorms/YYYY-MM-DD-<topic>-brainstorm.html` | chat / direct edit | the durable "what it says"; theme-free |
| Styled deck(s) | `<topic>.<theme>.html` (one per style) | inline editor + chat | the "how it looks"; living source for polish |
| Export | `<topic>.<theme>.pptx` | PowerPoint (layered) | independent handout copy |

**The one discipline (because there is no sync):**

- Content / structure change → edit the **wireframe**, then regenerate the styles that need it.
- Look-and-feel polish → edit the **styled deck** directly.
- Edits made on a styled deck do **not** appear in the wireframe or in other styles.

## Components & behavior

### 1. Wireframe stays the durable content source

- No role change. The brainstorm skill already treats the wireframe as the durable handoff
  artifact. Revert any "launchpad-only / no return" wording — going back to the wireframe is
  the intended path.
- It remains theme-free (content + structure + `DESIGN INTENT` only), which is exactly what
  makes multi-style regeneration possible.

### 2. Non-destructive "generate in another style"

- `html-slides`, when building from a wireframe, names output by theme so variants coexist:
  `<topic>.<theme>.html` (e.g. `ai-agents.micron-dark.html`, `ai-agents.playful.html`).
- Building a new style **never overwrites** an existing variant. If a same-named variant
  exists, confirm before overwriting.
- The theme is still chosen via the existing `Style Selection` question; "generate another
  style" is just re-invoking the build on the same wireframe with a different theme.

### 3. Source-link stamp

- Each generated deck records its origin near the top:
  `<!-- SOURCE: docs/brainstorms/2026-06-14-<topic>-brainstorm.html · THEME: <id> · GENERATED: 2026-06-14 -->`
- Purpose: from any styled deck, the wireframe is one lookup away ("go back to refine"), and
  the build tooling knows which wireframe a deck came from.

### 4. Living inline editor (the main build work)

Upgrade `references/patterns/inline-editing.md` from an opt-in "export a copy" snippet into a
**standard, shell-owned editor** (lives in `assets/shell.css` + `assets/shell.js`, inlined by
`scripts/build-deck.py`). It is **inert until activated** (edit hotzone / `E` key), like the
rest of the Slide Player.

Features:

- **Click-to-edit text** — headings, paragraphs, list items, table cells become
  `contenteditable` in edit mode; click and retype.
- **Reorder slides** — drag thumbnails on the Slide Rail; on drop, reorder the slide DOM
  nodes and renumber the counter + rail.
- **Duplicate / delete slide** — small controls on the rail; clone or remove the slide node,
  then renumber.
- **Save back to the same file** — primary mechanism is the File System Access API: on first
  Save, a one-time picker grants a writable handle to the file; the handle is cached for the
  session so later saves are silent (`handle.createWritable()`). Fallback (non-Chromium or
  API blocked): download the cleaned HTML and prompt the user to overwrite, with a clear
  warning.
- **Strip edit state on save/export** — written file must contain no `contenteditable`
  attributes, no `edit-active` body class, no active toggle classes, no dashed outlines. The
  shell editor code itself stays (so the file remains editable next time) — only the
  transient state is removed.

### 5. PPTX export defaults to layered

- This workflow exports via `html-to-pptx --mode layered` so the handout `.pptx` keeps real,
  editable text boxes. Output is `<topic>.<theme>.pptx`. Independent copy; no sync back.

## Data flow (scenarios)

- **New deck:** intake → `slide-brainstorm` → wireframe → `html-slides` (theme A) →
  `ai-agents.micron-dark.html`.
- **Refine content for all styles:** open the wireframe → edit (chat/direct) → regenerate the
  affected themes → fresh variant files.
- **Try another look:** from the wireframe, build theme B → `ai-agents.playful.html` (new
  file; theme A untouched).
- **Polish one deck:** open the styled deck in Chrome → `E` → edit text / reorder → Save
  (writes the same file).
- **Hand out PPTX:** `html-to-pptx --mode layered` on a styled deck → editable `.pptx`.
- **Recipient tweaks PPTX:** edits text boxes in PowerPoint. Forks from HTML; no sync (accepted).

## Architecture notes

- **Editor is shell-owned**, so `scripts/build-deck.py reshell <deck>` upgrades editing on
  existing decks too, and `verify.py`'s shell-freshness gate (`--require-shell`) covers it.
- Editing changes only slide **content**; the `<!-- SHELL:CSS/JS -->` markers and DOM
  contract are preserved, so `reshell` and `verify.py` keep working after edits.
- Reuses the existing Slide Rail thumbnails for reorder/duplicate/delete — no new navigator.

## Error handling & edge cases

- **Save unsupported** (Firefox/Safari or blocked API): fall back to download-overwrite; show
  a one-line warning naming the limitation.
- **Save permission denied / picker cancelled:** keep edits in the DOM, surface a non-blocking
  message; do not lose the in-progress edits.
- **Reorder/duplicate/delete:** renumber slide counter and rail consistently; never leave a
  gap or duplicate `data-slide` index.
- **Edit-state leak:** assert (in `verify.py`) that a delivered/saved deck has no
  `contenteditable`/`edit-active` residue, and that the PPTX capture renders the clean state.
- **Variant collision:** building a theme whose variant file already exists prompts before
  overwrite.
- **Stale source link:** if the wireframe path in the stamp no longer exists, report it rather
  than silently regenerating from a guess.

## Testing

- `slide-pipeline-test` and `slide-quick-test` still pass end-to-end.
- New checks:
  1. Edit → Save produces a clean file (no edit-state residue) that still opens editable.
  2. Reorder/duplicate/delete persist correctly and renumber.
  3. `html-slides` builds two themes from one wireframe into two coexisting variant files.
  4. Source-link stamp is present and points at the real wireframe.
  5. `html-to-pptx --mode layered` output is text-editable.
  6. `verify.py` passes on an editor-enabled deck and flags edit-state residue.

## Skill changes (summary)

- `slide-brainstorm` — keep the wireframe as the durable content source you return to (revert
  "launchpad-only" wording); note it stays theme-free for multi-style regeneration.
- `html-slides` — add the shell-owned living editor; non-destructive per-theme variant naming;
  source-link stamp; `verify.py` edit-state + shell checks.
- `html-to-pptx` — default this workflow to `--mode layered`; variant-aware output naming.

## Future (out of scope for v1)

- Extend the inline editor to the wireframe itself (it has a clean annotation DOM).
- A "regenerate-all-variants from the updated wireframe" convenience command.
- Optional version history / workspace UI (belongs to the Atlas Slides app).

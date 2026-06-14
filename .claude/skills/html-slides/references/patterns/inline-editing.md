# Living editor (standard, shell-owned)

The in-browser editor is part of the universal shell (`assets/shell.js` +
`assets/shell.css`) and ships in **every** deck. It is **inert until the user
clicks `Edit`** in the app bar (or presses `E`). Do not hand-author editor
markup in a deck — it comes from the shell via `scripts/build-deck.py`.

## What it does

- **Edit text** — in edit mode, headings, paragraphs, list items, table cells,
  blockquotes, figcaptions, and `.eyebrow` become `contenteditable`. Click and retype.
- **Reorder slides** — drag thumbnails on the Slide Rail.
- **Duplicate / delete** — `+` / `×` buttons on each rail thumbnail (edit mode only).
- **Save back to the same file** — the `Save` button writes the deck to disk via the
  File System Access API (first save asks once for the file; later saves are silent).
  Non-Chromium browsers fall back to a download you overwrite manually.

## Why save reconstructs the authored file

The shell builds all chrome (app bar, rail, stage, overlays) at runtime and moves
slides into `.stage`. Saving the live `outerHTML` would bake that chrome in and
double it on reopen. Instead, `serializeAuthored()` re-emits the edited `.slide`
sections into a **pristine snapshot** captured at load (`PRISTINE_HTML`), so the
saved file keeps the inlined shell + `<!-- SHELL:* -->` markers and stays
re-inlinable with `build-deck.py reshell`.

## API (for tests / automation)

`window.presentation.editor`: `toggle(force?)`, `isActive` (getter),
`move(from,to)`, `duplicate(i)`, `remove(i)`, `serialize()`, `save()`.

## Scope

The editor changes slide **content and order** only. Adding a brand-new slide,
restyling, or changing the deck title is a chat job (the agent edits the file).
Editing the wireframe is separate — see `slide-brainstorm`.

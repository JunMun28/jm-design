# Brainstorm File Template

Save the file to `docs/brainstorms/YYYY-MM-DD-<topic>-deck.txt`. Use today's date; keep `<topic>` short and kebab-case (e.g., `github-copilot-for-everyone`, `q4-roadmap`, `wafer-yield-review`).

## Section order

```
1. HEADER box
2. NARRATIVE ARC
3. DESIGN PRINCIPLES
4. SHARED GRAMMAR (every content slide)
5. SLIDE 01 — TITLE
6. SLIDE 02 — ...
...
N. SLIDE NN — ...
N+1. VISUAL VARIETY MAP
N+2. DESIGN SYSTEM
N+3. CHANGES FROM PREVIOUS DRAFT
N+4. END OF BRAINSTORM
```

Use horizontal `─` rules (75 chars wide) to separate top-level sections. Box-drawing characters (`┌─┐│└─┘`) draw the slide frames.

## Header box

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  BRAINSTORM: <Deck Title>                                                   ║
║  Audience  : <specific roles + technical level>                             ║
║  Goal      : <one-line outcome the deck must produce>                       ║
║  Product   : <subject — what we're presenting about>                        ║
║  Style     : <visual idiom — e.g. "Micron light · editorial · Apple feel"> ║
║  Format    : <N slides · ~X min talk + Y min demo (if any)>                 ║
║  Date      : YYYY-MM-DD                                                     ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

## Narrative arc

Write the **core thesis** in 1–3 short lines. Then a **story spine** — one question per slide.

```
Core thesis:
  <sentence>
  <sentence>
  <sentence>

Story spine — one question per slide:

  01  TITLE          —  Why are we here?
  02  <NAME>         —  <question this slide answers>
  03  ...
```

## Design principles

A bulleted manifesto. 4–10 short rules the deck commits to. Examples:

- "One idea per slide. Nothing else."
- "Periods are loud."
- "Card budget for the entire deck: 1."
- "No two adjacent slides share a layout signature."

## Shared grammar

A single ASCII frame showing the elements every content slide reuses (progress bar, kicker + underbar, H2 + accent, signature block, italic closer, footer). This documents what does NOT change across slides.

## Per-slide block

```
─────────────────────────────────────────────────────────────────────────────
  SLIDE 0N — TITLE OF SLIDE      (one-line layout signature in parens)
─────────────────────────────────────────────────────────────────────────────

  ┌────────────────────────────────────────────────────────────────────────┐
  │ <progress bar at this slide's index>                                   │
  │                                                                        │
  │   0N — KICKER                                                          │
  │   ───                                                                  │
  │                                                                        │
  │   Headline.                                                            │  ← H2 size · accent word
  │   Second line.                                                         │
  │                                                                        │
  │   [ signature block — see references/design-vocabulary.md ]            │
  │                                                                        │
  │   One italic closer.                                                   │  ← .callout / .center-line / .closing
  │                                                                        │
  │   <Deck title>                                                  [logo] │
  └────────────────────────────────────────────────────────────────────────┘

  COPY     (~N words)
    KICKER   <copy>
    H2       <copy>                  (italic purple on accent word)
    BODY     <copy>
    CLOSER   <copy>

  TECHNIQUE
    – <why this layout · what it teaches · what it avoids>

  SOURCES (optional)
    <citation lines if researched online>
```

## Visual variety map

```
  Slide  Layout signature                            Card count
  ───────────────────────────────────────────────────────────────
  01     Two-col title · circular icon mark           0  (mark)
  02     Vertical hairline split                      0
  ...
  ───────────────────────────────────────────────────────────────
  Cards across the deck                              <total>
```

## Design system

Palette · Typography · Layout grammar · Voice · Motion · Stage.

Keep it concrete with hex values, point sizes, named easing functions where possible. If the deck inherits a reference style, restate the relevant tokens here so the build phase doesn't have to dig.

## Changes from previous draft

The diff log. Group by:

- **Layout** — the big structural moves
- **Per-slide moves** — slide-by-slide bullet list
- **Cut slides** / **New slides**
- **Net result**

Always present after a revision. This is the trust layer — the user can scan it instead of re-reading the whole file.

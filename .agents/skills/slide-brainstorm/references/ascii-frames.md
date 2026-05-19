# ASCII Frame Drawing Conventions

## Why ASCII

The frame is the cheapest possible prototype. It conveys:

- Where elements sit on the canvas
- How much copy goes in each slot
- The hierarchy (what's largest)
- The design intent (annotated with `← arrows`)

It does NOT convey colour, exact typography, or interaction. That's fine — those live in the DESIGN SYSTEM section, not in the frame.

## Character set

Use the Unicode box-drawing characters consistently:

```
┌ ┐ └ ┘    corners
─          horizontal
│          vertical
├ ┤ ┬ ┴ ┼  joints (rare; use only when you really need them)

╔ ╗ ╚ ╝    heavy corners (use ONLY for the deck-level header box, not slide frames)
═ ║        heavy lines (same — header box only)

←  →       inline annotation arrows
·          mono dot separator between actions ("Open · Type · Watch.")
█          giant accent block / fold marker (use sparingly)
```

Rule of thumb: slide frames use light box-drawing, the brainstorm-level header box uses heavy box-drawing. This gives the file a clear "scaffolding vs content" distinction.

## Frame size

Aim for ~76 columns wide × ~22 rows tall per frame. This roughly matches a 16:9 slide and keeps the file readable in a 100-column editor.

## Annotating intent

Put a `←` followed by a short note at the right edge of any line whose design intent isn't obvious:

```
│   GitHub Copilot.                                                       │  ← H2 size · italic accent on "Copilot"
│   For everyone.                                                         │
```

Don't over-annotate. Two or three arrows per slide is plenty. The COPY and TECHNIQUE blocks below the frame carry the rest.

## Showing progress bars and rails

Every content slide shares a top progress bar and a right-edge nav-dot column (in the Micron-light grammar). Draw them as the first/last visible line/column of each frame so they're consistent.

```
│ ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  ← progress · slide 02 of 08
```

If the reference theme hides the rail (`display:none`), say so in SHARED GRAMMAR and omit it from frames. Don't draw what won't render.

## Worked example — manuscript row layout

```
  ┌────────────────────────────────────────────────────────────────────────┐
  │ ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
  │                                                                        │
  │   03 — HOW IT WORKS                                                    │
  │   ───                                                                  │
  │                                                                        │
  │   Three steps.    Forever.                                             │  ← H2 · italic accent on "Forever"
  │                                                                        │
  │   ─────────────────────────────────────────────────────────────────    │
  │   01    Ask.       Tell Copilot what you want, in your own words.      │  ← manuscript row
  │   ─────────────────────────────────────────────────────────────────    │
  │   02    Refine.    Read the draft, push back, change direction.        │
  │   ─────────────────────────────────────────────────────────────────    │
  │   03    Ship.      Save it, send it, present it.                       │
  │   ─────────────────────────────────────────────────────────────────    │
  │                                                                        │
  │   It learns the room as you talk.                                      │  ← italic closer
  │                                                                        │
  │   GitHub Copilot — for everyone                              [GH logo] │
  └────────────────────────────────────────────────────────────────────────┘
```

## Worked example — title slide (two-column)

```
  ┌────────────────────────────────────────────────────────────────────────┐
  │                                                                        │
  │   ●●●●●            │           01 / 08                                 │  ← left: dot grid logo · right: section label
  │                    │                                                   │
  │   GITHUB           │           A 20-minute walkthrough                 │  ← display type left · meta lockup right
  │   COPILOT          │                                                   │
  │   For *everyone*.  │           ─                                       │
  │                    │                                                   │
  │                    │           Wong Jun Mun                            │
  │                    │           Mgr Training · 2026-05-16               │
  │                    │                                                   │
  │                                                                        │
  │   github · jm-design                                       [GH mark]   │
  └────────────────────────────────────────────────────────────────────────┘
```

## Worked example — borderless quote grid (NO cards)

```
  ┌────────────────────────────────────────────────────────────────────────┐
  │   05 — IN PRACTICE                                                     │
  │   ───                                                                  │
  │                                                                        │
  │   Real prompts.    From real desks.                                    │  ← H2 · italic on "real desks"
  │                                                                        │
  │   "Summarise this           │   "Build an Excel formula                │  ← whitespace gridding · no card borders
  │    50-page wafer-yield      │    that flags lots below 92% yield."     │
  │    report into ten          │                                          │
  │    bullets."                │   "Draft an email asking the supplier    │
  │                             │    to expedite the qual report."         │
  │   "Make a 4-slide           │                                          │
  │    deck for the FY26        │   "Turn this CSV into a one-page         │
  │    capex review."           │    supplier scorecard."                  │
  │                                                                        │
  │   You bring the verb.                                                  │  ← italic closer
  └────────────────────────────────────────────────────────────────────────┘
```

## Common mistakes to avoid

- **Pixel-counting**: Don't try to draw exact widths down to the character. The frame is a sketch, not a mock.
- **Over-bordering**: Box-drawing every sub-element makes the frame look like a Windows 95 dialog. Use whitespace and the occasional hairline rule.
- **Inventing details that the design system doesn't ground**: If you draw a chart, the design system needs to say what chart library / styling. Otherwise leave it as `[ chart placeholder ]`.
- **Drawing what won't render**: Don't include a left rail if the chosen theme hides it.

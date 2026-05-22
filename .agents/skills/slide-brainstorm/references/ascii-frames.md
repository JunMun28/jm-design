# ASCII Frame Drawing Conventions

## Why ASCII

The frame is the cheapest possible prototype. It conveys:

- Where elements sit on the canvas
- How much copy goes in each slot
- The hierarchy (what's largest)
- The design intent (annotated with `← arrows`)
- **The visual idea** — the layout signature, the one protagonist, and the
  *feel* the composition should create, written vividly in the `VISUAL`
  block so the frame is interesting, not just a wireframe of boxes.

It does NOT pin colour, exact typography, a font, or a theme — those are
chosen later in `html-slides`. The frame describes the *visual idea* in
theme-agnostic terms (composition, scale contrast, negative space, rhythm,
the protagonist), not the brand. Keep specifics out of the frame; keep the
imagination in.

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

Don't over-annotate. Two or three arrows per slide is plenty. The COPY, ARGUMENT and TECHNIQUE blocks below the frame carry the rest.

## Describe the visual — make it interesting

A frame of empty boxes tells the build skill *where* things go but nothing
about *why it should feel like anything*. Every frame gets a `VISUAL` block
(see `references/template.md`) that does the imaginative work:

- **LAYOUT** — reach for a named signature from
  `references/design-vocabulary.md` (vertical hairline split, full-bleed
  stat, manuscript row, three-up borderless grid…). One name beats a
  paragraph and the build skill already understands it.
- **PROTAGONIST** — the single thing the eye hits first. If you can't name
  one, the slide has two messages; fix the slide.
- **FEEL** — one vivid sentence. This is the line that makes the deck
  interesting. Write the *mood and drama*, not the mechanics.
- **MOTION** — only if the entrance/build is part of the idea.

Make `FEEL` evocative but theme-agnostic — describe scale, space, tension,
and pacing, never a hex value, font, or theme name:

```
✗ flat:    "Big number, centered, on a light background."
✓ alive:   "One number the size of a fist, marooned in white space —
            the silence around it is the argument."

✗ flat:    "Two columns comparing before and after."
✓ alive:   "A hairline splits the slide like a ledger; the left side is
            cramped and grey-feeling, the right breathes — the gap does
            the persuading."

✗ flat:    "Title slide with the deck name."
✓ alive:   "Near-empty canvas, one line of type holding its breath low
            on the page; it should feel like the moment before someone
            starts talking."
```

The test: a reader who sees only the `VISUAL` block should be able to
picture the slide and *want to see it built*. If it reads like a furniture
list, rewrite it.

## The ARGUMENT block is not optional

Every frame is followed by the `ARGUMENT` block defined in
`references/template.md`. The frame shows *where copy sits*; the `ARGUMENT`
block states *why the slide is allowed to exist*:

- An argument slide: `CLAIM` (what it asserts) + `EVIDENCE` (the proof).
- A structural slide (title, section, transition, close): `ROLE: structural
  — no claim`.

Never draw a frame without it. The arrows annotate design intent; the
`ARGUMENT` block is the accountability layer — it is where a claim with no
evidence becomes visible instead of hiding behind a nice layout. If you
catch yourself writing `EVIDENCE: (the demo will show it)` or leaving it
blank on a content slide, the slide is not ready — that is a Phase 3 rigor
audit finding, not a frame you present.

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

  VISUAL
    LAYOUT      manuscript row — three hairline-ruled rows, generous gutter
    PROTAGONIST the numbered verbs (Ask / Refine / Ship) marching down
    FEEL        reads like a recipe card, not a slide — calm, inevitable,
                each rule a quiet drumbeat that says "this is all there is"
    MOTION      rows wipe in top-to-bottom, one beat apart
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

# Brainstorm File Template

Save the file to `docs/brainstorms/YYYY-MM-DD-<topic>-deck.txt`. Use today's date; keep `<topic>` short and kebab-case (e.g., `github-copilot-for-everyone`, `q4-roadmap`, `wafer-yield-review`).

## Section order

```
1. HEADER box
2. NARRATIVE ARC
3. INTAKE STATUS
4. DESIGN PRINCIPLES
5. SHARED GRAMMAR (every content slide)
6. SLIDE 01 — TITLE
7. SLIDE 02 — ...
...
N. SLIDE NN — ...
N+1. VISUAL VARIETY MAP
N+2. RIGOR AUDIT (persuasion decks only)
N+3. DESIGN INTENT (content-level only — no theme/tokens)
N+4. CHANGES FROM PREVIOUS DRAFT
N+5. END OF BRAINSTORM
```

Use horizontal `─` rules (75 chars wide) to separate top-level sections. Box-drawing characters (`┌─┐│└─┘`) draw the slide frames.

## Header box

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  BRAINSTORM: <Deck Title>                                                   ║
║  Audience  : <specific roles + technical level>                             ║
║  Goal      : <one-line outcome the deck must produce>                       ║
║  Product   : <subject — what we're presenting about>                        ║
║  PresStyle : <keynote / compact / training / leave-behind async reading>   ║
║  Theme     : TBD — chosen in html-slides  (or: STYLE NOTE if volunteered) ║
║  Format    : <N slides · ~X min talk + Y min demo (if any)>                 ║
║  Date      : YYYY-MM-DD                                                     ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

## Narrative arc

Write the **core thesis** in 1–3 short lines. Then a **story spine** —
one question plus enough detail to explain why each slide exists.

```
Core thesis:
  <sentence>
  <sentence>
  <sentence>

Story spine — one question + slide detail per slide:

  01  TITLE          —  Why are we here?
      Purpose        —  <why this slide exists>
      Main point     —  <sentence audience should remember>
      Evidence/demo  —  <source, demo beat, ASSUMPTION, or none>
      Builds to      —  <how it hands off to the next slide>

  02  <NAME>         —  <question this slide answers>
      Purpose        —  ...
      Main point     —  ...
      Evidence/demo  —  ...
      Builds to      —  ...
```

For **persuasion decks**, the arc carries two more lines, drawn from the
Phase 1 evidence intake and confirmed by the user in the Phase 2 synthesis:

```
  Strongest objection : <the single most damaging true thing a skeptic says>
  How the deck answers : <which slide(s) in the spine do the rebutting>
```

If no slide in the spine answers the objection, the arc is incomplete —
add or repurpose a slide before drawing frames.

## Intake status

Record what was known vs assumed before any slides. This prevents a polished
wireframe from laundering placeholder content into fact.

```
─────────────────────────────────────────────────────────────────────────────
INTAKE STATUS
─────────────────────────────────────────────────────────────────────────────

Source status:
  Provided / Exists but not provided / None

Assumptions:
  ASSUMPTION: <agent-proposed content the user explicitly accepted>
  ASSUMPTION: <or "None">

Pushback:
  Informational deck — <none raised / concern captured verbatim>
  Persuasion deck — <strongest objection captured verbatim>

Demo pacing:
  <none / demo outside slide flow / slide NN hands off to live demo>
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

  ARGUMENT
    CLAIM     <the one thing this slide asserts>
    EVIDENCE  <the proof — data, source, demonstrated result>
    — or, for a non-argument slide —
    ROLE      structural — no claim   (title · section · transition · close)

  VISUAL   (the part that makes the frame come alive — theme-agnostic)
    LAYOUT     <named layout signature from design-vocabulary.md, e.g.
                "vertical hairline split" or "full-bleed stat">
    PROTAGONIST <the one thing the eye lands on first and why>
    FEEL       <one vivid sentence: the mood / drama / pacing the
                composition should create — e.g. "a single number the size
                of a fist, alone in white space, daring you to look away">
    MOTION     <optional — how it enters / builds, if it matters>

  TECHNIQUE
    – <why this layout · what it teaches · what it avoids>

  SOURCES (optional)
    <citation lines if researched online>
```

The `ARGUMENT` block is **mandatory on every slide**. An argument slide
states `CLAIM` + `EVIDENCE`. A structural slide states `ROLE: structural —
no claim`. There is no third option: a content slide cannot omit the block,
so a claim with no evidence cannot hide as "just a structural slide." If
`EVIDENCE` would read "trust me" or be blank, the slide fails the Phase 3
rigor audit — fix the deck, not the annotation.

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

## Rigor audit (persuasion decks only)

Run this on the drafted spine **before presenting the frames**, and print
the result in the file like the variety map. Five checks, one line each —
`PASS`, or the offending slide and the fix:

```
  Check                    Result
  ───────────────────────────────────────────────────────────────────────
  1 Claim w/o evidence     PASS  /  S04 asserts "2× faster" — no EVIDENCE
  2 Objection unanswered   PASS  /  no slide rebuts "<the Phase 2 objection>"
  3 Buried lede            PASS  /  core message first appears S05, want ≤S03
  4 So-what slide          PASS  /  S06 conveys info, advances no claim
  5 Unsourced specifics    PASS  /  S03 "40% of teams" has no SOURCES line
  ───────────────────────────────────────────────────────────────────────
  Verdict  <ship the frames>  /  <N fixes required before frames>
```

A non-PASS is not a style note — it is a hole in the argument. Fix the deck
(add evidence, add a rebuttal slide, move the lede, cut the so-what slide,
source the number), then re-run. Do not present frames with an open finding
unless the user explicitly accepts the risk on the record.

## Design intent (content-level only)

Hierarchy · Density · Voice/tone · Pacing · what each slide's visual
protagonist *is* (chart, quote, diagram) — not which theme renders it.

Do **not** specify palette, hex values, typefaces, or a named theme here:
the theme/template is chosen later in `html-slides`. Presentation style
(keynote, compact executive briefing, training walkthrough, leave-behind /
async reading deck) is allowed because it controls density and pacing. If the
user volunteered a visual style, capture it as a single `STYLE NOTE:` line
(verbatim) for the build skill to act on — don't expand it into a token spec.

## Changes from previous draft

The diff log. Group by:

- **Layout** — the big structural moves
- **Per-slide moves** — slide-by-slide bullet list
- **Cut slides** / **New slides**
- **Net result**

Always present after a revision. This is the trust layer — the user can scan it instead of re-reading the whole file.

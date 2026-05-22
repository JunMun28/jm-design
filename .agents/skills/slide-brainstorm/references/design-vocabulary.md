# Design Vocabulary

The shared language we use to describe slide layouts. Reach for these names before inventing new ones — the build skill knows what they mean.

## Layout signatures

### kicker + underbar

The small mono uppercase label above every H2.

```
02 — THE SHIFT
───
```

Use on every content slide. It anchors the eye and gives the deck rhythm.

### H2 with italic accent

The headline. Large weight. One word is italic in the accent color (purple in Micron-light). That italic word is the slide's centre of gravity.

```
A different *kind* of help.
```

Picking the italic word is a design choice — it should be the word that makes the sentence true.

### manuscript row

The "movie credits" layout. Each row is `INDEX    VERB.    Supporting clause.` baseline-aligned. Rows are separated by 1px hairlines.

```
01    Ask.       Tell Copilot what you want, in your own words.
02    Refine.    Read the draft, push back, change direction.
03    Ship.      Save it, send it, present it.
```

Best for: steps, principles, ordered phases. Beats a 3-card "steps grid" because there are no borders to look at.

### split-card

Two side-by-side comparison panels with light borders.

```
┌───────────────┐   ┌───────────────┐
│ BEFORE        │   │ NOW           │
│ ...           │   │ ...           │
└───────────────┘   └───────────────┘
```

Use sparingly — at most once per deck. Otherwise prefer:

### vertical hairline split

Same comparison feel as split-card, no borders. Just a single 1px vertical rule between two text columns.

```
BEFORE                 │   NOW
You did the work.      │   You direct the work.
Tools were a tax.      │   Tools listen.
```

Default to this. Use split-card only when the comparison needs a visible container (e.g., to enclose icons).

### stat-row

Three giant anchor words side by side, divided by vertical hairlines. Each one is a pillar of the thesis.

```
Anyone.    │    Anything.    │    Today.
```

Use once per deck, at the climax. This is loud — don't dilute it by repeating.

### borderless quote grid

N×M grid of large ink quotes. No card outlines. Whitespace is the gutter. Vertical hairlines between columns are optional.

```
"Summarise this report."         "Build an Excel formula."
"Make a 4-slide deck."           "Draft an email to the supplier."
```

Best for: real-world examples, testimonials, "here's what people actually say".

### soft wash panel

A single accent-color background (8–10% opacity) used as a focal point exactly once per deck. Often holds the climactic statement or the call-to-action.

```
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
░  Anyone. Anything. Today.  ░
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
```

Restraint earns impact. If you use this twice, it stops being a focal point.

### inline action line

A single horizontal line of verbs joined by mono dots. The whole prompt of the deck in one breath.

```
Open VS Code · Press Cmd+I · Type · Watch.
```

Great for the "let's try it" slide before a live demo.

### prompt-output specimen

Two adjacent surfaces: the user's plain-language request on the left, and the
assistant's draft/output on the right. The output must look like a real work
artifact, not filler text.

```
PROMPT                              │  OUTPUT
"Clean this spreadsheet             │  [spreadsheet grid]
 and flag missing values."          │  Missing owner: 7 rows
                                    │  Duplicate IDs: 3 rows
```

Best for: training walkthroughs, non-technical enablement, showing what a user
types and what they get back. This is often stronger than another explanation
slide because the audience can copy the pattern.

### artifact strip

Three inspectable mini-artifacts in a row: spreadsheet, slide thumbnail, chart,
memo, approval note, or similar. Each artifact has enough visible structure to
be recognized at a glance.

```
[spreadsheet rows]     [slide thumbnail]     [small chart + takeaway]
Clean.                 Draft.                Analyze.
```

Best for: "what it can do" slides. Use this instead of icon chips when the
audience needs to see business work, not categories.

### italic closer

One centered italic sentence below the main block. The slide's emotional resolution.

```
                It learns the room as you talk.
```

Almost every content slide can earn one if the closer line genuinely advances the story. Don't ship a closer that just rewords the headline.

## When to use what

| Situation | Reach for |
|---|---|
| Three steps / phases / principles | manuscript row (preferred) or steps grid |
| Before-after comparison | vertical hairline split (preferred) or split-card |
| Use cases / examples | borderless quote grid |
| Training example / what user types | prompt-output specimen |
| Business artifacts / non-technical examples | artifact strip |
| Climactic thesis | stat-row + soft wash panel |
| Pre-demo "let's try" | inline action line |
| Definitions / who is in scope | kicker + H2 + italic closer, no signature block |

## Voice rules

- **Periods are loud.** Every declarative line gets a full stop. "Three steps. Forever."
- **Subject-verb-object.** Short clauses. Avoid "It is possible for users to..." → "Anyone can..."
- **One accent word.** Pick the word that flips the sentence's meaning if removed.
- **Verb-first action lines.** "Open · Type · Watch." not "You open it, type, and watch."

## Card budget

A whole deck should have ≤1 visible panel (the soft wash). Anywhere you'd reach for a card, ask: would a hairline rule + whitespace work instead?

If yes, use the hairline. If no (rare — usually a comparison that needs an icon container), use the card but keep it the only one.

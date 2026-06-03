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

### checklist gate

A decision or readiness slide where each row is a criterion, status, and
implication. It should feel like an inspection surface, not a bullet list.

```
GATE                  STATUS        IMPLICATION
Work-real missions    Required      No generic quizzes.
Artifact evidence     Required      Completion is not enough.
Pilot guardrails      Required      Scale only after proof.
```

Best for: executive approval criteria, pilot readiness, risk controls, launch
gates, training quality, and "what good looks like" slides.

### mission board

A set of concrete task tiles or rows that read like things a user can do next.
Each mission shows context, action, and output.

```
OUTLOOK        Brief the supplier.      Email draft.
TEAMS          Close the loop.          Action list.
EXCEL          Explain the trend.       Insight summary.
```

Best for: learning platforms, gamified experiences, task libraries, app
coverage, enablement journeys, and use-case slides. The tile is allowed only
when it behaves like a product object; otherwise use rows.

### decision cockpit

An executive decision surface: decision, premise, proof needed, risks,
guardrails, owner, and next step in one composed view.

```
DECISION       Approve pilot.
PROOF NEEDED   Usage, artifacts, manager signals.
GUARDRAILS     Small cohort, fixed duration, no scale claim.
NEXT STEP      Select pilot group.
```

Best for: approval asks, steering committees, investment decisions, and pilot
proposals. Stronger than a closing bullet slide because it shows how to decide.

### operating loop

A circular or staged loop where each step changes the state of the next. Use it
when the idea depends on repetition or behavior change.

```
Pick task -> Use tool -> Produce artifact -> Get feedback -> Repeat
```

Best for: adoption, practice, coaching, continuous improvement, product
mechanics, flywheels, and learning systems.

### node-edge loop

A node-and-edge diagram that borrows the topology of a workflow canvas: boxed
nodes, thin connectors, and one visible feedback edge. In brainstorm HTML, use
Mermaid from a pinned CDN as the recommended default when quick layout matters,
or inline SVG/CSS when exact placement matters more than authoring speed. Do
**not** call it React Flow unless the actual React Flow library is imported and
rendered.

```
[Join] -> [Repeat] -> [Finish] -> [Produce] -> [Improve]
                    \------------------------> [Decide]
```

Best for: measurement loops, product mechanics, agent workflows, automation
flows, approval paths, and anything where the audience needs to see state
moving through a system. Stronger than a row of equal scorecards because the
relationships are visible.

Renderer choice:

- Mermaid from a pinned CDN for quick flowcharts, sequence diagrams, and
  measurement loops. This is the usual recommendation for brainstorm decks.
- Inline SVG/CSS for diagrams that need precise visual composition and no
  dependency.

### technical infographic board

A dense teaching slide that explains a mechanism through coordinated visual
zones: numbered stages, symbolic diagrams, formulas, state labels, side legends,
and a bottom "why it matters" strip. This is the right pattern when the audience
needs to understand how a technical method works, not merely remember a
definition.

```
TITLE: How LoRA works

[1 Pretrained model] | [2 Low-rank update] | [3 Forward pass] | [training / inference legend]
   matrix W          |    A x B + formula  |    x -> W + AB -> y | update A/B, freeze W

[benefit] fewer params | [benefit] lower memory | [benefit] task-specific tuning
```

Best for: algorithms, model-training mechanics, optimization methods,
architecture walkthroughs, data pipelines, quantization, retrieval, inference
paths, and any explanation where the audience needs a mental model of moving
parts.

Use it when a simple flowchart or three-card explanation would be too shallow.
The board must have:

- **3-4 primary zones** that map to the mechanism's actual stages.
- **At least one real symbolic artifact** such as a matrix, tensor, equation,
  parameter table, graph, or pseudo-interface.
- **A side legend or callout rail** that distinguishes training-time vs
  inference-time behavior, frozen vs trainable state, or input vs output path.
- **A bottom payoff strip** with 2-3 concrete reasons the mechanism matters.
- **Tight labels attached to objects**, not disconnected bullets.

Avoid making every technical slide this dense. Use the technical infographic
board as the main "how it works" anchor, then follow with simpler workflow,
comparison, or product slides so the deck still breathes.
- `@xyflow/react` via an ESM CDN for a real React Flow canvas when the user
  needs dragging, zooming, handles, or interactive edge editing.
- D3 for custom data-driven SVG.
- ELK or Dagre when auto-layout matters more than interaction.

When a CDN renderer is used, record the library, exact version, CDN URL, and
fallback in the brainstorm HTML comment. Mermaid node labels should be short;
put detailed explanations in nearby rows, captions, or a decision sheet so the
auto-layout does not shrink into unreadable type.

### journey map

A before/during/after path with states, actions, artifacts, and friction.
Unlike a timeline, it tracks experience and state change.

Best for: onboarding, customer stories, employee adoption, training paths, and
workflow transformation.

### map surface

A spatial arrangement of zones, modules, capabilities, teams, or product areas.
It should help the audience locate where things live.

Best for: platforms, capability models, product suites, curriculums, game
worlds, and maturity stages.

### contrast wall

A strong comparison surface where opposing claims or states are placed against
each other with one decisive takeaway.

```
PASSIVE TRAINING        ACTIVE PRACTICE
Watch once.             Repeat in real work.
Completion proves seat. Artifact proves skill.
```

Best for: objections, before/after, risk/control, promise/proof, and
old/new framing.

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
| Approval criteria / readiness / guardrails | checklist gate |
| Learning tasks / gamified platform / use cases | mission board |
| Executive ask / pilot scope / decision | decision cockpit |
| Repeated practice / flywheel / behavior change | operating loop or Mermaid node-edge loop |
| Measurement loop / stateful workflow / automation path | Mermaid node-edge loop |
| Adoption path / onboarding / experience change | journey map |
| Platform areas / capability groups / world zones | map surface |
| Objection / before-after / promise-proof | contrast wall |
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

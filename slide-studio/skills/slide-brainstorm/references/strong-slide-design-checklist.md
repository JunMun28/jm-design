# Strong Slide Design Checklist

Use this before presenting any brainstorm HTML. It prevents the common failure
where a deck is technically correct but feels like a boring sequence of
traditional slides.

When subagents are available, this checklist is also part of the independent
reviewer pass in `subagent-review-verifier.md`. The author should still run it
first, then ask the reviewer to challenge the result.

The goal is not decoration. The goal is to make each slide easy to understand,
easy to remember, and intuitive to review.

## Core Rule

Every content slide must have a **visual job** in addition to its argument job.

- Argument job: what claim this slide makes and what backs it.
- Visual job: what shape helps the audience understand that claim faster.

If a slide's visual job is "show bullets in a box", redesign it unless the user
explicitly asked for a conventional handout.

For one-slide proposals, also require a **proposal spine**. The slide should
resolve the decision in a scannable structure such as:

`Problem -> Program -> Ask -> Success`

or:

`Tension -> Mechanism -> Commitment -> Evidence`

If the slide only says "we should promote X" without the ask, mechanism, and
success measure, keep brainstorming before designing.

## Anti-Boring Checklist

Run this checklist before showing the brainstorm:

| Check | Pass condition | Fix if it fails |
|---|---|---|
| Visual job | Each slide has a named visual role: map, loop, decision, contrast, artifact, proof, scorecard, timeline, checklist, specimen, or ask | Choose the role first, then rebuild the layout around it |
| Proposal spine | One-slide proposals show the problem/tension, proposed mechanism, specific ask, and success measure | Use a proposal card, ask sheet, decision cockpit, scorecard, or operating loop |
| Content-shape fit | The layout matches the content shape: comparison, sequence, mechanism, relationship, hierarchy, evidence, exception, product state, or decision | Re-select the layout using `presentation-design-decisioning.md` instead of decorating the current structure |
| Visual protagonist | The first eye stop is obvious and is the thing the slide is actually about | Enlarge, isolate, or reposition the main artifact/chart/diagram/number; demote supporting labels |
| Shape variety | No two adjacent content slides use the same layout signature | Swap one slide to a different signature from `design-vocabulary.md` |
| Theme rhythm | No background tone (dark / light / accent) repeats 3+ slides in a row; an N≥8 deck has at least one dark beat AND one light beat | Re-tone one slide in the run, or insert a contrasting interlude; see the Theme Rhythm rule below |
| Artifact reality | At least one slide shows the thing being discussed: prompt, output, mission card, dashboard, email, document, table, screenshot placeholder, or work artifact | Replace abstract labels with a recognizable artifact specimen |
| Scan path | The eye can read the slide in 3-5 stops, not 12 scattered items | Group content into a path: left-to-right, top-to-bottom, hub-and-spoke, or before/after |
| Visual encoding | Position, length, connection, grouping, contrast, order, size, annotation, or state carries the meaning | Replace decorative boxes with a visual form that makes the comparison, sequence, relationship, or mechanism visible |
| Interaction cue | When the topic is a product, platform, workflow, training, or app, at least one slide should show what the user does next | Add a checklist, path, active step, button row, mission board, or state change |
| Tension | The deck has at least one contrast slide or objection slide that makes the stakes visible | Add before/after, risk/guardrail, objection/answer, or "what changes" structure |
| Memory hook | The deck has one slide with a memorable visual signature, not just another table | Use stat-row, mission board, artifact strip, map, progress ladder, or decision cockpit |
| Layout fidelity | The HTML implements the internal `DESIGN INTENT` line with enough detail to judge the final slide structure | Replace vague placeholders with the actual monochrome board, diagram, table, product mock, artifact, or mechanism visual |
| Card discipline | Cards are rare. Repeated same-size cards are treated as a failure unless they are literal product tiles | Replace card grids with hairlines, rows, spatial maps, specimens, or tables |
| Density honesty | Dense slides are structured, not cramped; sparse slides are decisive, not empty | Scale type and reduce items, or split/merge slides |
| Source honesty | Visual polish never disguises weak evidence | Mark proposals, assumptions, placeholders, and unsourced specifics honestly |
| Renderer honesty | If the slide claims or implies a named library pattern, that library is actually used | Use the real CDN-backed library, or rename the pattern to plain SVG/CSS |
| Diagram readability | Auto-laid diagrams remain readable after rendering, not merely syntactically valid | Shorten node labels, move detail into adjacent rows, or switch to a hand-placed SVG/CSS layout |

If two or more checks fail, do not present the brainstorm yet. Rebuild the
weakest slides first.

## Presentation Designer Lens

Before choosing a layout, ask what the slide is really presenting:

- **Comparison:** what changed, which option wins, or what tradeoff matters?
- **Sequence:** what happens first, next, and after the feedback loop?
- **Mechanism:** what parts exist, what moves, what stays fixed, and what
  changes state?
- **Relationship:** what depends on what, and where are the boundaries?
- **Evidence:** what chart, table, or specimen makes the claim credible fastest?
- **Product state:** what would the user actually see, type, click, review, or
  approve?
- **Decision:** what must be true for the audience to say yes?

The best slide is usually the one where the viewer can infer the point from the
visual structure before reading every label.

## Better Than Traditional Slides

Prefer these shapes over ordinary title-plus-bullets:

- **Checklist slide**: for readiness, approval criteria, rollout guardrails,
  quality gates, or "what must be true".
- **Mission board**: for learning platforms, product workflows, gamified
  experiences, task libraries, or use cases.
- **Decision cockpit**: for executive asks, tradeoffs, scope, risk, proof
  needed, and decision owner.
- **Journey map**: for before/during/after experiences, user adoption, training
  paths, onboarding, or customer stories.
- **Artifact specimen**: for prompts, outputs, emails, docs, slides, charts,
  screenshots, reports, or system states.
- **Operating loop**: for behavior change, product mechanics, flywheels,
  continuous improvement, or learning cycles.
- **Mermaid node-edge loop**: for measurement loops, automation flows, product
  mechanics, or state transitions where relationships matter more than equal
  category boxes. Mermaid from a pinned CDN is the recommended default for
  brainstorm flowcharts. Do not call it React Flow unless the actual React Flow
  library is imported and rendered.
- **Technical infographic board**: for explaining mechanisms like LoRA,
  quantization, optimizer memory, retrieval pipelines, architecture paths, or
  training workflows. It should combine numbered stages, symbolic artifacts
  such as matrices/equations/graphs, training-vs-inference or state callouts,
  and a payoff strip. Use this when a simple flowchart would feel too shallow.
- **Contrast wall**: for old/new, passive/active, risk/control, promise/proof,
  or game/productivity tension.
- **Scorecard**: for metrics, pilot evaluation, readiness, health, or success
  criteria.
- **Map**: for platform areas, modules, app coverage, capability groups, zones,
  or maturity stages.
- **Ask sheet**: for the final decision slide: decision, scope, investment,
  guardrails, proof needed, and next step.

## When A Checklist Is Better

Use a checklist instead of a traditional slide when the audience must judge,
approve, prepare, or compare. A checklist works especially well for:

- pilot approval criteria
- launch readiness
- executive decision gates
- training completion quality
- adoption guardrails
- "what good looks like"
- risk controls
- implementation next steps

Checklist slides should not be plain bullet lists. Make the checks visible as
a progress path, gate list, decision sheet, status board, or inspection strip.

## Variety Map

Before final review, create a quick internal map:

`Slide | Argument job | Visual job | Layout signature | Artifact shown | Evidence status`

Rules:

- Adjacent slides should not share the same layout signature.
- At least 40 percent of content slides should show an artifact, flow, map,
  specimen, or decision surface.
- A persuasion deck must include a visual answer to the strongest objection.
- The title and close may be structural, but they still need a clear visual
  signature.

## Theme Rhythm (planning lint)

A concrete, verifiable pacing rule. Track each slide's **background tone** —
`dark`, `light`, or `accent` (a full-bleed accent/photo beat) — as an extra
column in the Variety Map. Note: this is the *Micron* per-deck theme system's
tonal vocabulary, **not** open-design's locked light/dark/hero theme classes;
it never pins a fixed palette, it only checks the *rhythm* of whatever tones
the chosen theme uses.

Hard rules:

1. **No 3-in-a-row.** No background tone may repeat for 3 or more consecutive
   slides. A long dark run reads as a monotone slab; break it with a light or
   accent beat.
2. **Both beats on long decks.** A deck with **N ≥ 8 slides** must include at
   least one `dark` slide AND at least one `light` slide, so the deck has
   tonal contrast rather than one flat mood end to end.

Fix a violation by re-toning one slide in the offending run, or inserting a
contrasting interlude (section divider, full-bleed quote, accent stat beat).
Do **not** solve it by recoloring every slide to alternate mechanically —
the rhythm should follow the narrative (e.g. dark for tension, light for
resolution), not a stripe pattern.

**Optional spot-check (once a draft deck HTML exists).** Confirm the planned
rhythm survived into the build:

```bash
# Count slides and eyeball the tone of each .slide block.
grep -c 'class="slide' deck.html
# List each slide's opening tag + any tone/theme class for a quick scan.
grep -oE 'class="slide[^"]*"' deck.html
```

If three consecutive matches carry the same tone class (or an N≥8 deck shows
only one tone), the rhythm rule was violated in the build — fix before review.

Record the checklist result as a concise HTML comment for handoff when useful.

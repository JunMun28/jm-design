# Presentation Design Decisioning

Use this internally after the Phase 2 narrative arc is approved, before writing
the brainstorm HTML, and again before presenting the HTML brainstorm.

The goal is not to make slides busier. The goal is to choose the clearest visual
form for the message, then execute it with enough fidelity that the user can
judge the slide before final theme work.

## Designer Pass

For each content slide, answer these privately before writing HTML:

| Question | Good answer |
|---|---|
| Audience question | What is the one question this slide must answer? |
| Data/content shape | Is this a comparison, sequence, mechanism, relationship, hierarchy, distribution, evidence, exception, product state, or decision? |
| Visual protagonist | What should the eye land on first: matrix, flow path, number, chart, object, screenshot, equation, map, table, before/after, or decision surface? |
| Best encoding | Which visual form makes the content easiest to understand: position, length, connection, grouping, contrast, order, size, annotation, or state? |
| Scan path | What are the 3-5 eye stops, in order? |
| Proof and honesty | Which labels, data, examples, or source notes make the slide credible without faking certainty? |
| Restraint move | What can be removed so the visual feels intentional rather than busy? |

Turn that into one compact internal `DESIGN INTENT` line:

`Slide NN — <layout signature>: protagonist=<first eye stop>; scan=<3-5 stops>; encoding=<position/connection/grouping/contrast/order/size/annotation/state>; artifacts=<what is visible>`

Example:

`Slide 03 — technical infographic board: protagonist=matrix W; scan=pretrained matrix -> A/B adapters -> forward-pass graph -> training/inference legend -> benefit strip; encoding=position, border style, and labels; artifacts=frozen matrix, adapter pair, formula.`

## Match Content Shape To Layout

| Content shape | Best layout families | Avoid |
|---|---|---|
| Comparison | contrast wall, vertical hairline split, matrix, before/after specimen | Equal cards with repeated text |
| Sequence / workflow | manuscript row, workflow path, journey map, operating loop, node-edge loop | One isolated step with the rest hidden |
| Mechanism / algorithm | technical infographic board, system diagram, equation board, node-edge loop | Generic flowchart with no symbolic artifacts |
| Relationship / system | map, node-edge loop, architecture board, hub-and-spoke | Bullet list of components |
| Hierarchy / prioritization | pyramid, ranked table, decision cockpit, scorecard | Unordered bullets |
| Evidence / metrics | chart, table, stat-row, annotated specimen, scorecard | Big number without context |
| Exception / risk | guardrail board, checklist gate, contrast wall, failure-mode table | Risk buried in a footnote |
| Product / tool state | product mock, prompt-output specimen, artifact strip, dashboard surface | Abstract labels without UI or artifact detail |
| Decision / ask | decision cockpit, ask sheet, checklist gate | "Next steps" bullet slide |

## Data Presentation Rules

- If values matter, use position/length before area or decoration.
- If order matters, make the order visible with a path, rank, or timeline.
- If causality matters, show arrows/edges and label the state change.
- If mechanism matters, show parts, states, and what changes during training,
  inference, review, or decision time.
- If tradeoff matters, put options in the same visual field so the eye compares
  directly.
- If the content is uncertain, encode it as a proposal, assumption, placeholder,
  or open question. Do not make uncertainty look like proof.

## Professional Craft Checks

Before showing the brainstorm, reject the slide if any are true:

- The first eye stop is not obvious.
- The slide has more than 5 unrelated eye stops.
- The layout could be swapped with any other slide and still make sense.
- The visual is decorative rather than explanatory.
- The data is shown in a less readable form than a table would be.
- The slide is mostly labels for things the viewer cannot inspect.
- The "beautiful" version hides an assumption, weak source, or missing example.

## Fidelity Rule

A brainstorm slide may be theme-less, but it must not be vague. Use monochrome
wire art, inline SVG/CSS, tables, charts, matrices, annotated product mocks,
state legends, and specimen surfaces to make the chosen visual form reviewable.

# Brainstorm HTML Template

Save the file to `docs/brainstorms/YYYY-MM-DD-<topic>-brainstorm.html`. Use
today's date; keep `<topic>` short and kebab-case.

The file is standalone HTML with inline CSS/JS. Copy
`references/html-companion-skeleton.html` first. It is the canonical skeleton
for the review + handoff artifact, not a loose design reference.

## Section Order

1. HEADER
2. CORE IDEA
3. SLIDE PANELS

## Header

Include:

- `BRAINSTORM — NOT FINAL DECK`
- Deck title

Do not include a header note with audience, goal, review status, or other admin
metadata. The page should feel like the deck content, not a project brief.

In the HTML source comment, include a `DESIGN INTENT` block with one line per
slide:

`Slide NN — <layout signature>: <visible composition and key artifacts>`

This keeps the visible page clean while preserving the internal layout contract
for review and handoff.

The `DESIGN INTENT` block comes from the internal professional design pass after
the Phase 2 narrative arc is approved. Do not require or display these lines in
the user-facing Proposed Arc.

Each `DESIGN INTENT` line should capture the professional design choice, not
just the component name:

`Slide NN — <layout signature>: protagonist=<first eye stop>; scan=<3-5 stops>; encoding=<position/length/connection/grouping/contrast/order/size/annotation/state>; artifacts=<what is visible>`

## Core Idea

Show the deck's summary at the top:

- Core idea: one short sentence
- Proposal
- Why it matters
- What makes it credible

Keep this visible and concise. Do not recreate the full intake notes.
Use it as a compact review strip, not a second hero. The title slide carries
the opening.

For a confirmed **single-slide proposal**, the Core Idea strip may be even
tighter:

- Core idea: one short sentence.
- Proposal: the program/mechanism.
- Ask: the action or commitment requested.
- Success: the behavior or output that proves progress.

This keeps the brainstorm artifact aligned with the one-slide brief instead of
inflating a crisp proposal into a mini deck.

## Slide Panels

Always include a title slide as Slide 01. It should show the deck title or
proposal name, a one-line subtitle/ask, and optional scope. Do not use a bottom
metadata row unless the user asks for it.

For a single-slide proposal being handed to `html-slides`, the visible
brainstorm panel should preserve the approved slide structure, for example:

`Problem -> Program -> Manager ask -> Success measure`

Do not add extra panels only to satisfy a generic slide count. The brainstorm
can be a title panel plus one content panel, or a single content panel if the
user explicitly asked for no title slide in the final output.

Each slide panel must include:

- Slide number and title
- Headline
- Visible body or artifact content
- The internal `DESIGN INTENT` choice, rendered as a
  full-fidelity monochrome preview
- Image placeholder, if requested for that slide/topic
- Closer, if useful

Keep the DOM flat for Codex/browser annotation. Prefer:

- `<section class="deck">` containing direct `<article class="slide-panel" data-slide="NN">` children.
- Each slide article has one direct `<header class="slide-head">` and one
  direct `<div class="preview">`.
- Avoid anonymous wrapper divs around slide headings or slide groups. Name
  necessary content groups (`mission-list`, `flowchart`, `decision-sheet`) so
  annotations land on meaningful elements.

Do not duplicate labels. If the outer slide title says the role, do not add an
inner kicker that repeats it.
Use hairlines, open spacing, symbolic visuals, precise labels, and typography.
Avoid nested cards.
If the panel has many vertical blocks, mark it dense and scale headline,
placeholder, and scorecard sizes so no slide content clips.
When a diagram explains the idea, make it a real slide in the arc, not a
separate sample panel. Flowcharts are appropriate for process, journey, and
workflow slides.

Default to grayscale / monochrome in the brainstorm companion. Final color,
typography, and theme belong to `html-slides`, but layout fidelity belongs here:
the brainstorm should show the real composition, diagram topology, artifact
shape, and information hierarchy the final builder is expected to preserve.

## Layout Fidelity

The brainstorm is **theme-less, not low-fidelity**. Do not hide behind abstract
rectangles, generic placeholders, or simple title-plus-bullet panels when the
content requires a richer visual.

For every content slide, implement the internal `DESIGN INTENT` line:

- A `technical infographic board` should show numbered mechanism zones,
  symbolic artifacts such as matrices/equations/graphs, training-vs-inference
  or state callouts, and a bottom payoff strip.
- A `product mock` should show recognizable controls, prompt/output surfaces,
  generated states, review/approval affordances, and placeholders only for
  unavailable images.
- A `workflow` should show the full path and active step, not one isolated
  box.
- A `decision cockpit` should show the decision surface: premise, proof,
  risks, guardrails, owner, and next step.
- A `data/chart/table` slide should show real axes, row/column structure,
  labels, and sample values when sourced or clearly marked assumptions.

Use inline SVG/CSS for complex static mechanism diagrams when exact placement
matters. Use pinned Mermaid/D3/ECharts only when the renderer materially helps
and a fallback is provided.

## Professional Visual Choice

Before writing slide HTML, run `references/presentation-design-decisioning.md`.
The layout should be selected from the shape of the content:

| Content shape | Preferred visual treatment |
|---|---|
| Comparison | Put options in the same field: matrix, contrast wall, before/after, or hairline split |
| Sequence | Show the full path with an active step, timeline, workflow, journey, or loop |
| Mechanism | Show parts and state changes with a technical infographic board, equation board, graph, or system diagram |
| Relationship | Show nodes, zones, dependencies, hierarchy, or map position |
| Evidence | Use the most readable chart/table/specimen, directly labeled |
| Product state | Show the interface or artifact surface with real controls/states |
| Decision | Show criteria, tradeoffs, owner, proof needed, guardrails, and next step |

Every content slide should have:

- **Visual protagonist:** the first object the eye lands on.
- **Scan path:** 3-5 ordered stops, not scattered labels.
- **Encoding:** how the content becomes visual: position, length, connection,
  grouping, contrast, order, size, annotation, or state.
- **Restraint:** what was intentionally removed so the slide looks designed,
  not merely filled.

## CDN Dependencies

The brainstorm should stay standalone by default, but CDN libraries are allowed
when they make a slide materially clearer or more interactive.

Use this decision rule:

| Need | Preferred approach |
|---|---|
| Static loop, arrow, process, or simple graph that needs exact art direction | Inline SVG/CSS |
| Text-authored diagram with quick layout | Mermaid from CDN (recommended default for brainstorm flowcharts) |
| Interactive node canvas, dragging, zooming, complex edges | Real React Flow (`@xyflow/react`) via a React/ESM setup |
| Custom data-driven SVG with precise control | D3 from CDN |
| Large directed graph auto-layout | ELK / Dagre with SVG |

Rules:

- Pin exact versions in CDN URLs. Do not use `latest`.
- Prefer ESM CDNs for module imports, such as `esm.sh`, and package CDNs such
  as `jsDelivr` or `UNPKG` when a package provides browser-ready files.
- Record dependencies in an HTML comment: library, version, CDN URL, reason,
  and fallback.
- Mermaid is the first choice for flowcharts, measurement loops, sequence
  diagrams, and simple graph layouts in the brainstorm artifact. Use an import
  like `https://cdn.jsdelivr.net/npm/mermaid@<exact-version>/dist/mermaid.esm.min.mjs`,
  call `mermaid.initialize({ startOnLoad: true })`, and keep node labels short
  enough to read after auto-layout.
- If using React Flow, actually import/render `@xyflow/react`; otherwise call
  the pattern `node-edge loop`, not React Flow.
- Keep a fallback: a static SVG, plain HTML version, or clear message if CDN
  loading fails.

Minimal Mermaid pattern:

```html
<div class="mermaid-panel" aria-label="Measurement loop">
  <pre class="mermaid">
flowchart LR
  A["Join"] --> B["Repeat"] --> C["Finish"] --> D["Produce"] --> E["Improve"]
  E -. review .-> A
  </pre>
  <div class="mermaid-fallback">Static fallback content here.</div>
</div>
<script type="module">
  import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11.12.0/dist/mermaid.esm.min.mjs";
  mermaid.initialize({ startOnLoad: true, theme: "base", flowchart: { useMaxWidth: true } });
</script>
```

## Density Rules

The brainstorm must reflect the resolved `Slide density` from intake:

- **Sparse** — one claim, one visual or diagram, one closer. Do not pad with
  extra bullets.
- **Balanced** — headline plus 3–4 supporting points or one simple structured
  visual.
- **Dense executive** — condensed and information-rich. Prefer matrices,
  operating models, scorecards, decision sheets, compact tables, journey maps,
  or artifact strips. A dense slide should scan in about 10 seconds and support
  about two minutes of discussion.
- **Leave-behind dense** — self-contained, with clearer explanatory headings and
  compact notes because no presenter may be present.

"Compact" is ambiguous. It can mean concise/low-text or condensed/high-info.
The intake must resolve this before the brainstorm is written.

For dense executive slides, use structured information instead of prose. A
workday/platform example should become a table or matrix such as:

`App | Employee mission | Copilot skill practiced | Work artifact | Learning signal`

## Strong-Slide Verification

Before presenting the brainstorm, check every slide against this gate:

| Check | Pass condition |
|---|---|
| Density match | Slide content matches the selected density level |
| Slide job | Slide has one job: frame, model, example, proof, guardrail, decision, or ask |
| Claim title | Content-slide title/headline makes a claim, not just a label |
| Concrete content | At least one slide shows a workflow, artifact, decision frame, or example |
| Information design | Dense content uses a matrix, scorecard, table, operating model, or other scannable structure |
| Professional visual choice | Layout matches the content shape and has a clear protagonist, scan path, encoding, and restraint move |
| Source honesty | Unsourced specifics are framed as proposal/ASSUMPTION, not proof |
| Pushback coverage | The stated pushback or objection is answered explicitly |
| Layout fidelity | The HTML visibly implements each internal `DESIGN INTENT` line at full structural fidelity |
| Anti-boring design | Every content slide has a named visual job, adjacent slides avoid the same layout signature, and at least one slide shows an artifact, workflow, checklist, map, specimen, scorecard, mission board, or decision surface |
| Horizontal logic | Read only the slide titles, in order: they retell the argument from context to recommendation, with no duplicate claims and no gaps; for decision decks the ask appears in the first two titles |
| Grouping discipline | Every group of zones/steps/bullets/cards names one cutting dimension, holds 2–5 non-overlapping items of one rhetorical type, and uses an explicit "Out of scope"/"Other" instead of silently dropping content |

Fix failures before presenting the file. Keep the visible page focused on slide
content unless the user asks to see the audit; recording a concise audit as an
HTML comment is acceptable for handoff.

For the anti-boring design gate, use
`references/strong-slide-design-checklist.md`. This is mandatory when a deck is
about a product, platform, workflow, learning experience, executive decision,
or any topic that could otherwise become traditional title-plus-bullets.

## ARGUMENT Comment Format

Every slide panel carries exactly one `ARGUMENT` comment, placed directly
inside its `article.slide-panel` before the `header.slide-head`. Two forms,
no third:

- Argument slide:
  `<!-- ARGUMENT - CLAIM: <one sentence> | EVIDENCE: <data/demo/source> | SOURCES: <origin or ASSUMPTION> -->`
- Structural slide (title, section, transition, close):
  `<!-- ARGUMENT - ROLE: structural - no claim -->`

A blank or "trust me" `EVIDENCE` is a failed slide. The format is fixed so a
reviewer (or a script) can grep for `ARGUMENT -` and audit every slide
mechanically. The canonical skeleton ships placeholder `ARGUMENT` comments;
an unreplaced placeholder counts as blank `EVIDENCE`.

## Rigor Audit

Persuasion decks run this five-check audit after the strong-slide verification
and before the independent review gate. Informational decks skip the audit but
still carry the `ARGUMENT` comment on every slide.

1. **Claim without evidence** — any argument slide whose `EVIDENCE` is blank or
   hand-wavy.
2. **Objection unanswered** — no slide rebuts the Phase 2 strongest objection.
3. **Buried lede** — for decision decks and dense-executive density, the core
   message and the ask are not on slide 2; for other decks, the core message is
   not a single sentence by slide ≤3.
4. **So-what slide** — a slide that conveys information, advances no claim, and
   is not structural.
5. **Unsourced specifics** — a stat, quote, or causal claim with no `SOURCES`.

Print the result in the brainstorm HTML as a comment:

```html
<!--
  RIGOR AUDIT
  1 Claim without evidence: PASS
  2 Objection unanswered: PASS
  3 Buried lede: PASS
  4 So-what slide: PASS
  5 Unsourced specifics: FAIL - slide 04 adoption stat has no SOURCES line
-->
```

A non-PASS is a hole in the argument, not a style note. Fix the deck (add
evidence, add a rebuttal slide, move the lede, cut the so-what slide, source
the number) and re-run. Do not present the HTML with an open finding unless
the user explicitly accepts the risk on the record.

## Independent Review Gate

Before presenting the brainstorm HTML, run
`references/subagent-review-verifier.md`.

Record the result as an HTML comment:

```html
<!--
  SUBAGENT REVIEW
  Status: PASS / fixed findings / accepted risk / unavailable - inline fallback used
  Reviewer summary:
  - <finding or PASS>
-->
```

The review must happen after the HTML file exists. Fix P0/P1 findings before
presenting unless the user explicitly accepts the risk.

## Image Placeholders

When the user asks for photos or image placeholders, include a visible
`.image-placeholder` block in the relevant slide panel. Label:

- what the image should show
- asset status: `Provided`, `Placeholder`, or `Need source`
- intended role: hero, supporting evidence, screenshot, product moment, etc.

Do not add image placeholders when the user says no.

Keep argument, source, and assumption thinking internal unless the user asks to
see it. The companion is for reviewing the slide content and flow.

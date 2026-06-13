# Slide Skills Fast Path — Design

Date: 2026-06-13
Status: Approved in brainstorm; spec pending user review
Author: brainstormed with Claude (superpowers:brainstorming)

## Problem

The current slide pipeline (`slide-brainstorm` → `slide-layout-designer` →
`html-slides` → `html-to-pptx`) produces high-quality decks but takes about
an hour end-to-end. Measured pain points from the 2026-06-13 "What Is an AI
Agent?" session:

| Stage | Time sink |
|---|---|
| Discovery | ~11 questions over many turns (6 framing + 5 content) |
| Brainstorm HTML | Full-fidelity previews + reviewer subagent + browser checks |
| Layout pass | Separate skill: blueprint + rebuild + re-verify |
| Build | Theme chooser server, 3 verify.py cycles, screenshot review, final-deck reviewer |
| PPTX | HTML→PPTX conversion + LibreOffice round-trip validation |

Roughly 6 user-approval gates and 4 subagent/verify cycles. Non-technical
users will not wait an hour for "explain X to my team."

Reference studied for ideas: `baoyu-slide-deck`
(little-journey/.agents/skills/). Ideas copied: batched confirmation in one
question call, auto-recommendation from content signals, slide-count
heuristic from source length, saved preferences (EXTEND.md pattern),
explicit skip-confirmation wording, conditional review gates.

## Goals

- A fast path that delivers an editable PPTX in ≤15 minutes with exactly
  2 user replies (1 batched intake + 1 wireframe approval).
- One consulting-grade content review instead of many scattered gates.
- Lighter brainstorm artifact everywhere (wireframe, not full-fidelity).
- Fewer skills to maintain (merge layout-designer into brainstorm).

## Non-goals

- Replacing the full pipeline. It stays for executive / persuasion /
  high-stakes decks, with all its rigor gates.
- Changing `html-to-pptx`, `pptx`, html-slides themes, or verify.py.
- AI-image slide generation (baoyu's image mode). Maybe later as an
  opt-in "pretty mode".

## Decisions (from brainstorm Q&A)

1. **New `slide-quick` skill alongside** the existing pipeline (the full
   pipeline keeps its own flow; decision 5 below lightens it in two
   targeted ways only). Self-contained: it does not call html-slides or
   html-to-pptx; the slowness lives in those skills' gates.
2. **New `slide-consultant` skill** — a separate, reusable reviewer.
   `slide-quick` calls it automatically once. Full pipeline can use it on
   demand.
3. **PPTX engine = native PptxGenJS** authoring. No HTML intermediate, no
   conversion, no LibreOffice round-trip validation. Trade-off accepted:
   flatter look (no glass/gradients/webfonts) in exchange for speed and
   full editability.
4. **Quick brainstorm artifact = low-fi wireframe HTML** (gray boxes +
   labels), not chat-only and not full-fidelity.
5. **Full pipeline also lightened**: `slide-layout-designer` merges into
   `slide-brainstorm`; the full pipeline's brainstorm HTML drops to
   wireframe fidelity. All content-rigor gates stay.

## Skill landscape after the change

| Skill | Status | Notes |
|---|---|---|
| `slide-quick` | NEW | Fast path: intake → outline → consultant → wireframe → native PPTX |
| `slide-consultant` | NEW | McKinsey-grade content copy reviewer, 2 modes |
| `slide-brainstorm` | CHANGED | Absorbs layout-designer references; wireframe-fidelity HTML |
| `slide-layout-designer` | DELETED | References move to `slide-brainstorm/references/` |
| `html-slides` | POINTER UPDATES | References to layout-designer repointed |
| `html-to-pptx`, `pptx` | UNTOUCHED | |

## `slide-quick` specification

### Flow (target ≤15 min, exactly 2 user replies)

1. **Intake — one batched question.** Read the user's topic/content first.
   Then ONE `AskUserQuestion` call (≤4 questions), every question carrying
   an AI recommendation derived from content signals:
   - Audience + goal (combined question, recommended guess from topic)
   - Slide count (recommended from the length heuristic below)
   - Theme: midnight (dark) / clean light
   - Delivery: PPTX / PPTX+PDF
   "Just make it" / "use defaults" in the user's message skips intake
   entirely (assumptions stated in the next update — baoyu's
   skip-confirmation policy).
2. **Outline.** Draft `# | action title | layout | key points` for every
   slide. No user gate here.
3. **Consultant pass.** Run `slide-consultant` in improve mode on the
   outline. Copy is fixed at the cheapest point (before any build).
4. **Wireframe.** Write the low-fi wireframe HTML (format below) to
   `docs/brainstorms/YYYY-MM-DD-<topic>-wireframe.html`. Show it.
5. **One approval reply.** "Go" or edits. Edits patch the wireframe, not
   re-run the flow.
6. **Build.** Native PptxGenJS from theme templates. One LibreOffice
   render to JPGs. The MAIN agent eyeballs the montage (no subagent by
   default). Fix-and-rerender once if needed. Deliver the .pptx
   (+ PDF when chosen).

### Slide-count heuristic (copied from baoyu)

| Source length | Recommended slides |
|---|---|
| < 1000 words / bare topic | 5–8 |
| 1000–3000 words | 8–14 |
| > 3000 words | 12–18 (suggest splitting beyond) |

### Saved preferences

`PREFS.md` in the skill directory (baoyu EXTEND.md pattern): preferred
theme, language, audience default, delivery default, `skip_intake` flag.
When present, intake collapses to zero or one question.

### Native PPTX engine

- Template library seeded from `decks/native-build/build.js` (2026-06-13):
  helpers for panel, node, arrow, kicker pill, footer, glow PNGs
  (sharp-generated radial gradients — the only sanctioned "glow" in
  native PPTX).
- Two themes at launch: **midnight** (dark, indigo accent — port of
  today's native build) and **clean light** (white/charcoal corporate).
- Office-safe fonts only: Calibri (head/body), Consolas (code).
- Diagrams are real PowerPoint shapes (editable); code ≤10 lines/slide.
- Known PptxGenJS pitfalls honored (no `#` in hex, no 8-char hex, fresh
  option objects, ROUNDED_RECTANGLE vs accent bars, etc. — see
  `pptx/pptxgenjs.md`).
- QA: render via soffice → montage → main-agent inspection against a
  short checklist (overlap, clipping, contrast, alignment). One fix
  cycle. `--strict` flag opts into a visual-QA subagent.

### Delivery scope

`slide-quick` outputs PPTX and PDF only. If the user wants an HTML deck,
route to the full pipeline (that is what it is good at).

### Routing (which path triggers)

- `slide-quick`: user says "quick", invokes `/slide-quick`, or asks for an
  internal / training / simple deck with PPTX delivery and no high-stakes
  signals.
- Full pipeline: executive, investor, persuasion, brand-locked (Micron),
  HTML delivery, or user asks for rigor.
- Both skills state on their first turn which path was chosen and how to
  switch (e.g., "Using the quick path — say 'full pipeline' for the
  rigorous one").

## `slide-consultant` specification

A professional slide-content reviewer following consulting frameworks:

- **Pyramid Principle** (answer first, grouped support)
- **SCQA** opening discipline
- **MECE** grouping (one cutting dimension, 2–5 items, no overlap)
- **Action titles + horizontal logic** (titles alone retell the story)
- **One message per slide**; so-what test on every slide
- **Evidence honesty** (claims backed or labeled; no invented numbers)

Modes:

| Mode | Behavior | Output |
|---|---|---|
| `improve` | Rewrites copy in place | Changed artifact + short change log |
| `review` | No edits | Findings list with P0–P3 severity, slide #, why, fix |

Accepted inputs: outline markdown, wireframe HTML, deck HTML, or `.pptx`
(via markitdown text extract).

Usage: auto-invoked once by `slide-quick` (improve mode, on the outline);
available standalone (e.g., `/slide-consultant review deck.pptx`) for any
deck from either pipeline.

## Wireframe artifact (shared format)

One small standalone HTML file. Inline CSS only. No JS, no Mermaid, no
CDN, no screenshots, no reviewer subagent (in quick mode).

Per slide panel:
- Slide number + **action title** (full-sentence claim)
- Layout-signature label (from the design vocabulary, e.g. "contrast
  wall", "operating loop")
- Gray placeholder boxes with text labels for visuals: `[loop diagram]`,
  `[code ~10 lines]`, `[table 4 rows]`
- 2–4 key bullets in plain text

Mode differences:
- **Quick mode:** the above only.
- **Full mode (`slide-brainstorm`):** same fidelity, but keeps ARGUMENT
  comments, rigor audit, MECE/titles checks, and the independent reviewer
  subagent. Only the *rendering* gets lighter; the *content rigor* stays.

## Full-pipeline changes

1. **Merge layout-designer:** move `archetypes.md` and `lora-reference.md`
   into `slide-brainstorm/references/`; fold the design-pass instructions
   into the brainstorm skill (run after arc approval, as today). Delete
   `.claude/skills/slide-layout-designer/`. Update `html-slides/SKILL.md`
   pointers (`../slide-layout-designer/SKILL.md` →
   `../slide-brainstorm/references/...`).
2. **Wireframe fidelity:** replace the full-fidelity companion skeleton +
   layout-fidelity rules in `slide-brainstorm` with the shared wireframe
   format. Remove the "production-grade monochrome preview" requirement;
   keep DESIGN INTENT lines (they drive the build) but they no longer
   need to be visually implemented in the brainstorm artifact.
3. **Keep:** all Phase 1 content rules, ASSUMPTION discipline, rigor
   audit, subagent review gate, html-slides verify.py + final-deck
   review. The full pipeline stays the rigorous one.

## Risks and trade-offs

- **Native look < HTML look.** Accepted (Q3). Flat panels + glow PNGs,
  Office fonts. Users wanting the designed look use the full pipeline.
- **Less review in quick mode** → a bad slide can slip through. Mitigated
  by the consultant pass (content) + main-agent montage check (visuals)
  + `--strict` flag.
- **Routing ambiguity** (which path?). Mitigated by explicit first-turn
  path statement + easy switch phrase.
- **Skill deletion** (`slide-layout-designer`) breaks muscle memory /
  references. Mitigated by pointer updates and a note in
  `slide-brainstorm` description.

## Success criteria

- Simple deck request → delivered editable PPTX in ≤15 min with ≤2 user
  replies.
- Consultant pass measurably improves titles (action titles, horizontal
  logic) on first build — no post-delivery copy rework needed.
- Full pipeline still passes its own gates end-to-end after the
  layout-designer merge (run `slide-pipeline-test` to confirm).
- No remaining references to `slide-layout-designer` anywhere in
  `.claude/skills/`.

## Implementation order (for writing-plans)

1. `slide-consultant` skill (standalone, testable on today's deck).
2. `slide-quick` skill: intake → outline → wireframe → native engine
   (port `decks/native-build/` into templates) → QA-lite.
3. Merge layout-designer into `slide-brainstorm`; delete the skill; update
   pointers; lighten brainstorm HTML rules to wireframe.
4. Routing notes in both pipelines' skill descriptions.
5. End-to-end test: same "What is an AI agent?" topic through
   `slide-quick`; compare time + output vs today's session. Run
   `slide-pipeline-test` for the full pipeline.

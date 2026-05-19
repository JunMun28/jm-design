---
name: slide-brainstorm
description: Brainstorm slide deck content as an ASCII text file BEFORE building any .pptx, .html, or .pdf. Use whenever the user wants help planning a deck, presentation, talk, pitch, training session, or workshop — even when they only mention "slides" or a topic. Run a structured intake (audience, purpose, scope, length, optional reference style), then produce a single brainstorm document with narrative arc, slide-by-slide ASCII layouts, design system notes, and a "changes from previous draft" log. Iterate freely on terse feedback like "less words", "fewer cards", "tailor to X industry", "remove slide N", "search online for Y". Never touch the actual deck file until the user explicitly approves the brainstorm.
---

# Slide Brainstorm

Turn a vague request ("I want to make a deck about X") into a concrete, reviewable ASCII brainstorm document that a builder can execute against later.

The output is a single text file. No HTML, no PPTX, no PDF — until the user explicitly says "build it".

## Why this skill exists

Most decks fail before the first slide is rendered. Wrong narrative, wrong audience framing, redundant slides, cards-on-cards visual sameness — these are cheap to fix in ASCII and expensive to fix in pptxgenjs.

This skill front-loads design thinking into a text document where iteration costs ~30 seconds per turn, then hands a clean spec to whatever builder skill comes next (`pptx`, `html-slides`, etc.).

## The Loop

```
INTAKE (4 questions, multiple-choice when possible)
    ↓
DRAFT brainstorm file
    ↓
ITERATE on feedback ←────────────────┐
    ↓                                │
present diff + ask "anything else?"  │
    ↓                                │
user says "looks good" ──────────────┘ (otherwise back to ITERATE)
    ↓
HANDOFF — invoke build skill (pptx / html-slides) with brainstorm path as input
```

## Step 1 — Intake

Ask these four questions, one at a time, before writing anything. Prefer multiple-choice. If the user has already answered some in their opening message, skip those — don't make them repeat themselves.

1. **Audience** — who's in the room? (specific roles + technical level)
2. **Goal** — awareness · adoption · training · pitch · status update · other
3. **Scope** — what exactly is being covered? Get a one-sentence summary
4. **Length** — rough slide count (3–5 short · 6–10 medium · 12+ long)

Then optionally:

5. **Reference style?** — "Is there an existing deck/HTML file whose visual style I should match? Paste the path if so." If yes, read it and extract the design grammar (palette, typography, layout patterns) before drafting.

Don't ask more than ~5 questions total before the first draft. Resist the temptation to interview to perfection — momentum matters. You can refine through iteration.

## Step 2 — Draft

Write the brainstorm to `docs/brainstorms/YYYY-MM-DD-<topic>-deck.txt`. Use today's date. Topic is a short kebab-case slug.

The file structure (full template in [references/template.md](./references/template.md)):

```
HEADER (audience, goal, product, style, format, date)
NARRATIVE ARC (core thesis + one-question-per-slide spine)
DESIGN PRINCIPLES (the rules the deck commits to)
SHARED GRAMMAR (what every content slide reuses)
SLIDE 01 — TITLE
SLIDE 02 — ...
...
DESIGN SYSTEM (palette, typography, layout grammar, voice, motion)
CHANGES FROM PREVIOUS DRAFT
```

Each slide section gets:

- A **header line** naming the slide and its layout signature
- An **ASCII frame** — a box drawn with `┌─┐│└─┘` characters showing the slide layout at roughly 16:9 proportions, with inline annotations using `← arrow comments` pointing at design intent
- A **COPY block** listing the actual words (kicker, H1/H2, body, closer)
- A **TECHNIQUE block** explaining layout decisions in design vocabulary
- Optional **SOURCES** if facts were researched online
- Optional **STAGE NOTES** for live-demo / presenter coaching slides

See [references/ascii-frames.md](./references/ascii-frames.md) for frame-drawing conventions and worked examples.

## Step 3 — Iterate

Read terse feedback charitably and apply with discipline. Common feedback patterns and how to respond:

| User says | Apply |
|---|---|
| "less words" / "more premium" / "Apple feel" | Cut copy 50–70%. One italic accent word per H2. Period after every declarative line. Bigger type, more whitespace. |
| "fewer cards" / "looks boring" / "visually repetitive" | Replace card grids with hairline rules + whitespace gridding. Aim for ≤1 visible panel across the whole deck. |
| "tailor to <industry>" | Rewrite examples on the use-case slide(s) to match that industry's vocabulary and real workflows. Cross-check role coverage (ops, finance, supply chain, etc.). |
| "remove slide N" / "add slide N about X" | Renumber. Rescale progress bars across all remaining slides. Update the narrative arc and visual variety map. Log the change. |
| "follow style of <file>" | Read the file. Extract real CSS classes, palette, typography. Do not invent classes that aren't there. If something is `display:none` in the relevant theme, note it. |
| "search online for X" | Use WebSearch + WebFetch. Cite real sources inline in the slide section. Don't make up facts. |
| "more visual variety" | Audit the variety map — make sure no two adjacent slides share a layout signature. |

After each iteration, summarise what changed in a short prose paragraph, then ask "Anything else you want to tweak, or are we ready to build?" Don't dump the full file back at them.

See [references/iteration-patterns.md](./references/iteration-patterns.md) for deeper guidance.

## Step 4 — Handoff

When the user says "build it" (or equivalent), do **not** keep editing the brainstorm. Instead:

1. Confirm the output format (PPTX, HTML slides, PDF)
2. Invoke the relevant builder skill (`pptx`, `html-slides`, etc.) and pass the brainstorm file path as input
3. Let that skill handle rendering

## Core Principles

Carry these through every step.

**Ask one question at a time.** Multi-question messages overwhelm and produce muddled answers. Prefer multiple-choice options the user can click.

**Periods are loud.** Apple/Cursor restraint = short declarative sentences with full stops. "GitHub Copilot." "Three steps. Forever." "Anyone. Anything. Today."

**One accent per slide.** One italic accent word per H2. One soft-color panel for the entire deck, used as a focal point, not a frame. Restraint earns impact.

**Cards are last resort.** A page covered in rounded rectangles looks spreadsheety. Use hairline rules (1px), whitespace, and typography weight to do the gridding work cards used to.

**Each slide answers one question.** If you can't write that question down, the slide doesn't earn its place. Two slides answering the same question = merge or kill one.

**Variety map.** No two adjacent slides should share the same layout signature. If slide 03 is a 3-card grid, slide 04 must not be another 3-card grid.

**The narrative arc earns the thesis.** The deck's biggest claim (e.g., "curiosity is the new credential") must be earned by the slides that came before. Don't open with the thesis — close with it.

**Refuse to render until approved.** ASCII brainstorm only. If the user explicitly asks to build mid-iteration, confirm: "Want me to build the .pptx now, or one more brainstorm pass first?"

**Cite when you research.** When a slide leans on facts you looked up, inline a SOURCES block with URLs. Hallucinated authority is worse than no authority.

**Catch your own reference-mining mistakes.** If you pull a CSS class or pattern from a reference file, verify it's actually visible in the target theme. Admit and correct mid-stream — it builds trust.

## Design Vocabulary (cheat sheet)

Full guide in [references/design-vocabulary.md](./references/design-vocabulary.md).

- **kicker / section-label** — small mono uppercase line above the headline (e.g., "02 — THE SHIFT")
- **H2 with italic accent** — large headline where ONE word is italic in the accent color
- **manuscript row** — `01    Verb.    Supporting sentence.` baseline-aligned, divided by hairlines (the deck's "movie credits" layout)
- **split-card** — two side-by-side comparison panels (use sparingly)
- **vertical hairline split** — same comparison feel as split-card but with no borders, just a 1px vertical divider
- **stat-row** — three giant anchor words side by side (`Anyone. Anything. Today.`) divided by vertical hairlines
- **borderless quote grid** — N×M grid of large ink quotes; no card outlines, whitespace is the gutter
- **soft wash panel** — a single accent-color background (8–10% opacity) used as a focal point once per deck
- **inline action line** — one horizontal line of verbs joined by mono dots (`Open · Type · Watch.`)
- **italic closer** — one centered italic sentence below the main block (`.callout`, `.center-line`, `.closing`)
- **manuscript row vs steps grid** — same content, different layout. Prefer manuscript rows when you've already used a card layout earlier in the deck.

## When NOT to use this skill

- The user wants to **edit an existing pptx file** — that's the `pptx` skill, not this.
- The user wants you to **render the deck immediately** without brainstorming — confirm once, then hand off to a builder skill.
- The user wants **a one-slide poster or single artifact** — that's the `canvas-design` skill.

## Bundled resources

- [references/template.md](./references/template.md) — the exact brainstorm file template with section order
- [references/ascii-frames.md](./references/ascii-frames.md) — frame-drawing conventions, character set, worked slide examples
- [references/design-vocabulary.md](./references/design-vocabulary.md) — the full layout-signature menu with when-to-use guidance
- [references/iteration-patterns.md](./references/iteration-patterns.md) — common feedback → response playbook
- [references/intake-questions.md](./references/intake-questions.md) — reusable wording for the 4–5 intake questions
- [references/example-excerpt.md](./references/example-excerpt.md) — a real ~80-line excerpt from a successful brainstorm, as a tonal reference

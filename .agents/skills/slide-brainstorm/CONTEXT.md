# Context — slide-brainstorm skill

The domain language for the slide-brainstorm skill. These terms are meaningful to
anyone reasoning about *what makes deck content strong*, independent of how the
skill is implemented.

## Glossary

### Persuasion deck

A deck whose goal is **Decision**, **Pitch**, or **Adoption** — the audience must
*change their mind or act*. The deck only works if its central claim survives
scrutiny. Persuasion decks require an **evidence intake** (see below) before
the brainstorm HTML is generated.

Contrast with **Informational deck**.

### Informational deck

A deck whose goal is **Awareness**, **Status update**, or **Training** — the
audience must *understand*, not be convinced against resistance. Informational
decks get a single light evidence prompt, not the full intake. The split is
keyed off the existing Phase 2 goal taxonomy, not asked separately.

### Evidence intake

The Phase 1 exchange, required for **persuasion decks**, that captures: the
*proof* behind the core claim, and the *strongest counter-argument* a hostile
audience member would raise. Distinct from the existing audience/goal/scope
intake. Its absence is the skill's primary content weakness — decks look sharp
while the argument underneath is unexamined.

### Thesis stress-test

A Phase 2 step that attacks the proposed core message for defensibility before
any slide is drawn — the cheapest point to discover the argument doesn't hold.

### Claim + evidence annotation

A Phase 3 per-slide annotation. Every **argument slide** states the **claim**
it makes and the **evidence** that backs it. **Structural slides** (title,
section, transition, close) instead carry an explicit `Role: structural — no
claim` marker. The marker is mandatory: a content slide with no evidence
cannot disguise itself as structural. Lives in each canonical brainstorm HTML
slide panel alongside `TECHNIQUE`, not in a separate format.

### Rigor audit

A proactive self-check the model runs on a **persuasion deck**'s draft
*before* presenting Phase 3 brainstorm HTML, reported inline like the visual
variety map. Five checks: (1) claim without evidence, (2) the Phase 2
strongest objection unanswered anywhere in the arc, (3) buried lede — core
message not stated as one sentence by slide ≤3, (4) so-what slide —
advances no claim and isn't structural, (5) unsourced specifics — stats,
quotes, or causal claims with no source. A reactive iteration-pattern entry
("not convincing" / "so what" / "where's the proof") backs it up for
explicit pushback.

### HTML brainstorm artifact

A temporary standalone HTML page generated during Phase 3 for all brainstorms.
It borrows the Superpowers brainstorming idea of a browser companion, but here
the HTML replaces saved text-frame artifacts. The brainstorm HTML is review
scaffolding and the handoff artifact, not the final html-slides deck.

## Decisions

- "Better content" = **argument & evidence rigor**, not brevity, layout, or
  word-craft. Those are already well covered; rigor is the silent gap.
- Rigor is **woven into existing phases** (1, 2, 3, 4), not a separate
  red-team gate. Rationale: lower friction, harder to skip than an optional
  appended phase.
- Evidence intake is **proportional to goal** (persuasion vs informational),
  not mandatory for every deck. Rationale: preserves the skill's fast-path
  ethos for low-stakes decks.
- Intake splits into a small **framing** set (audience/goal/length, numbered
  options) and an uncapped **content block** (subject, key takeaways, source
  material, concrete specifics) asked open-ended, one at a time — the
  content block is where deck quality is decided and is never trimmed to
  save turns.
- For persuasion decks the content block's "concrete specifics" question is
  **sharpened into two one-at-a-time prompts** (proof, then strongest
  objection); this replaces the generic specifics question rather than
  adding budget.
- The thesis stress-test is **two required lines in the Phase 2 synthesis**
  ("Strongest objection:" / "How the deck answers it:") the user confirms or
  corrects — consistent with the existing approve-the-synthesis gate.
- The **references HTML format is canonical**. SKILL.md Phase 3 & 5 reference
  it; saved text-frame files are removed. Single source of truth; the
  annotation is maintained in one place.
- The rigor check is **proactive audit + reactive pattern**, not a new
  phase — consistent with "woven, harder to skip."
- The HTML brainstorm artifact is **required review scaffolding and handoff**,
  not a second source of truth. It carries the full brainstorm content.

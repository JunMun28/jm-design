# Argument rigor woven into existing phases, scaled to deck goal

The slide-brainstorm skill optimized brevity and layout but never interrogated
whether a deck's argument held — evidence and objections were marked merely
"optional," which is exactly where weak decks fail. We decided to enforce
argument & evidence rigor by **weaving it into the existing five phases**
rather than adding a separate red-team gate: a gate is visible but skippable
and adds a round-trip, whereas woven checks are ambient and harder to skip.

Rigor is **scaled to the Phase 2 goal**, not applied uniformly. Decision /
Pitch / Adoption decks are *persuasion decks* and get the full treatment (a
one-turn compound evidence intake, two required objection lines in the
synthesis, a proactive 5-check audit before the brainstorm artifact). Awareness / Status /
Training decks are *informational decks* and get a single light prompt. This
preserves the skill's "ask early, stay short" fast path for low-stakes work
while spending rigor where it changes outcomes.

We also collapsed a pre-existing format split: SKILL.md described an inline
"Purpose/Key message" review format and a markdown "Deck Spec" handoff that
nothing on disk used. The **HTML brainstorm format is now the single canonical
source**; saved text frame files are gone so the claim+evidence annotation is
maintained in exactly one place.

## Considered options

- **Dedicated skeptic gate** between brainstorm and handoff — rejected:
  visible but skippable, adds a round-trip, inconsistent with "harder to skip."
- **Mandatory evidence intake for every deck** — rejected: fights the
  fast-path ethos and over-interrogates low-stakes decks.
- **Keep both brainstorm formats, cross-linked** — rejected: perpetuates drift
  and forces the annotation to be maintained twice.

## Consequences

- The skill's question budget rises to ~6 for persuasion decks only.
- The markdown "Deck Spec" handoff format is gone; downstream builder skills
  (`html-slides`, `pptx`) consume the canonical brainstorm HTML directly.
- Structural slides now require an explicit `Role: structural — no claim`
  marker so a missing-evidence slide cannot hide as non-argumentative.

---
name: slide-consultant
description: McKinsey-grade slide content reviewer. Reviews and improves slide copy using Pyramid Principle, SCQA, MECE, and action-title discipline. Use when the user asks to "review my slides", "improve slide copy", "consultant review", "make titles stronger", or when slide-quick auto-invokes it. Works on outlines, wireframe HTML, deck HTML, or .pptx files.
---

# Slide Consultant

Review and improve slide content copy like a top-tier consulting reviewer.
Scope: **content and copy only** — storyline, titles, grouping, evidence.
Visual design is out of scope (that belongs to the build skills).

## Modes

| Mode | Behavior | Output |
|---|---|---|
| `improve` (default for slide-quick) | Rewrite copy in place | Changed artifact + change log |
| `review` | No edits | Findings list: severity, slide #, issue, why, fix |

If the user does not name a mode: standalone invocation defaults to `review`;
being called by another skill defaults to what that skill asked for.

## Accepted inputs

- Outline markdown (`# | title | layout | key points` table)
- Wireframe or deck HTML (read the file)
- `.pptx` — extract text first: `python -m markitdown deck.pptx`
  (needs `pip install "markitdown[pptx]"`; see the pptx skill)

## Process

1. Read the artifact. List every slide title in order.
2. **Storyline check (horizontal logic):** read titles alone, in order. They
   must retell the full argument with no gaps and no duplicate claims. For
   decision decks, the recommendation must appear by slide 2.
3. **Per-slide checks**, in this order (details + examples in
   `references/frameworks.md`):
   - Pyramid: answer first, support below. SCQA across the opening slides.
   - SCQA: opening slides cover Situation, Complication, Answer.
   - Action title + skim test: full-sentence claim someone could dispute,
     ≤12 words; read titles alone ("skim test") — they must retell the
     argument. Data slides carry the key number in the title — but ONLY a
     number already present in the source; if the source has no number,
     state the direction/claim, not a fabricated figure.
   - One message per slide; body argues the title, nothing else.
   - So-what test: if the slide vanished, would the argument miss it?
   - MECE grouping: one cutting dimension, 2–5 items, no overlap, one
     rhetorical type per list.
   - Evidence honesty: every number/quote traced or labeled "Illustrative".
     NEVER invent a stat, quote, or source to strengthen copy.
   - Chart & number integrity: see `references/frameworks.md`.
   - Comparison integrity: see `references/frameworks.md`.
4. Output per mode (formats below).

## Output contracts

`review` mode — findings list, most severe first:

```
P1 · Slide 4 · Title is a label ("Architecture"), not a claim.
Issue: a label communicates the topic, not the point.
Why: a reader skimming titles loses the argument here.
Fix: "Three services share one queue — the queue is the bottleneck."
```

Severity: P0 fabricated/contradictory content · P1 storyline breaks,
uninterpretable slide · P2 weak but understandable · P3 polish.

`improve` mode — apply the fixes directly to the artifact (Edit the file, or
return the rewritten outline if given inline), then a short change log:

```
CHANGES
- S4 title: label → claim ("Three services share one queue…")
- S7: merged bullet 3 into 2 (overlap); now 4 MECE items
- S9: marked unsourced "40%" as Illustrative
```

If a slide or the deck passes all checks, say so — `review` mode returns
"No P0–P2 issues; N optional P3 polish items" (or "Clean"); `improve` mode
returns a change log of "No changes needed" rather than forcing edits. Do
not manufacture findings to fill space.

## Hard rules

- Never invent facts, numbers, quotes, or sources. If evidence is missing,
  reframe the claim or label it.
- Never change the user's meaning — sharpen, don't redirect.
- Keep the user's language (English copy stays English, etc.).
- In `improve` mode on a file, edit the file; do not just describe edits.
- For `.pptx` inputs (text was extracted, not editable in place): do NOT
  Edit the .pptx. Return the rewritten copy as a slide-by-slide outline
  table plus the change log, and tell the caller to apply these during the
  build step.

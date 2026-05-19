# Iteration Patterns

Common feedback you'll receive after the first draft, and how to apply it cleanly.

The big idea: read terse feedback charitably. "Less words" usually means "the slide is doing too much," not just "delete some lines." Diagnose the root cause, then make the fix general — most fixes apply across multiple slides.

## "Less words" / "more premium" / "Apple feel" / "Cursor feel"

Cut copy by 50–70%. Specifically:

- Each H2 to ≤6 words. One italic accent word.
- Each body paragraph to 1–2 sentences. Break long ones with periods.
- Manuscript rows become `VERB.    Short supporting clause.` (under ~10 words after the verb).
- Closers become one italic sentence. If you can't make it one, kill it.

Then audit whitespace. Premium decks have 40–60% empty space on every content slide.

## "Fewer cards" / "looks boring" / "visually repetitive"

Cards-on-cards is the most common visual failure. The fix is layout variety, not just removing cards.

1. **Audit**: count cards per slide. If the deck has >2 cards total, you have a card problem.
2. **Swap cards for**: manuscript rows · vertical hairline splits · borderless quote grids · stat-row.
3. **Variety map**: list every slide's layout signature in a table. No two adjacent slides should share one.
4. **One card slide max**: usually the use-cases slide if it really needs icon containers. Everything else: hairlines and whitespace.

## "Tailor to <industry>"

The use-cases slide(s) need to be rewritten with that industry's actual vocabulary and workflows.

- **Ask** (only if you don't know the industry well): "Which 4–6 roles in <industry> should the examples speak to?"
- **Replace** every example with one that sounds like real work from that domain. Use real artifact names ("wafer-yield report", "supplier qual scorecard", "FY26 capex deck").
- **Cross-check**: do the examples cover the spectrum of roles, not just one persona?

Industries seen so far:
- Semiconductor: wafer yield, supplier qualification, capex review, lot below spec, OSAT
- Manufacturing: SPC, OEE, OTD, MES
- Finance: variance commentary, board pack, FP&A close, audit prep
- Healthcare: discharge summary, formulary, prior auth
- Education: lesson plan, rubric, IEP

## "Remove slide N" / "add slide N about X"

A slide change is never local. It cascades:

1. **Renumber** all subsequent slides.
2. **Rescale progress bars** — `width: index / total × 100%`. Update every slide's frame.
3. **Update the narrative arc** — the story spine must still be one question per slide and they must still chain.
4. **Update the visual variety map** — check adjacency.
5. **Log it** in the CHANGES section.

Don't forget to scan the rest of the deck for forward/backward references to the renamed slide.

## "Follow style of <file>"

Read the file. Extract:

- Palette (named CSS variables or hex values)
- Typography (font families, scale, weights)
- Spacing tokens
- Reusable component classes (with what they actually look like — not what the names suggest)
- Theme-specific overrides (e.g., `html[data-theme="light"] .rail { display: none }`)

Then write a SHARED GRAMMAR block that lists every element using its real class name from the source file. Do NOT invent classes. If you're not sure whether something is visible in the chosen theme, check the CSS.

When you reference the source file in stage notes or design system, use the same `selector { property }` shorthand the file uses. Designers should recognise their own vocabulary.

## "Search online for X"

Use WebSearch first to find authoritative sources. Then WebFetch the most credible 2–3 results. Don't trust a single source.

Cite inline:

```
SOURCES
  – <Author / Org>. "<Title>." <publication>, <date>. <url>
  – <Author / Org>. "<Title>." <publication>, <date>. <url>
```

Then use the researched facts in the slide copy. Quote sparingly — paraphrase into the deck's voice.

## "More visual variety"

Open the variety map. Find adjacent slides sharing a signature. Swap one of them.

Concrete moves:

- 3-card grid → manuscript rows
- Split-card → vertical hairline split
- Quote grid → stat-row + italic closer
- Steps grid → numbered manuscript rows

The goal is texture across the deck. Even small variations (hairline thickness, alignment) help.

## "Where did you get <thing>?"

This is a trust check. The user spotted something in the brainstorm that they don't recognise from the reference style or didn't ask for.

1. **Don't defend it.** Don't rationalize.
2. **Admit fast**: "You're right — I assumed it, it isn't in the reference."
3. **Verify**: re-read the reference file. Find what IS there. Quote the relevant CSS or markup.
4. **Correct**: replace the invented element with the real one. Update every slide that uses it.
5. **Note in CHANGES**: log the correction so the user can see you fixed it everywhere.

Catching and correcting beats arguing every time. It earns the next round of trust.

## "Looks good, ready to build"

Switch to handoff mode. Stop iterating on the brainstorm. Confirm format (pptx / html / pdf) and invoke the appropriate builder skill, passing the brainstorm path as input.

If the user hasn't explicitly approved but starts asking build-related questions (file format, file name), ask once: "Want me to build now, or one more brainstorm pass first?"

## General iteration discipline

- **Make the fix general, not local.** If "slide 04 has too many words", check slides 02–08 for the same problem.
- **Always log changes.** The user trusts the diff log more than the file content. Show them what moved.
- **Summarise, don't dump.** After a revision, write 1 paragraph describing what changed. Don't paste the whole file back.
- **Ask "anything else?" — not "is this perfect?"** Open-ended check-ins surface latent feedback.

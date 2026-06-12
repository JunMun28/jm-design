# Final-Deck Content Review Subagent

Use this after `verify.py` passes and before delivering the deck. `verify.py`
gates rendering, brand, and mechanical content budgets; this gate judges what
the deck *says*. The author of the deck is too close to it and will miss weak
titles and uninterpretable exhibits.

## Required Flow

1. Build the deck and run `scripts/verify.py <deck>.html --theme <id>
   --check-overview --fail-on-warnings` until it passes. Keep the screenshots
   it emits.
2. Spawn one reviewer subagent with the prompt below, passing the deck path
   and the screenshots directory.
3. Fix all P0/P1 findings before delivery. P2/P3 findings may be fixed,
   deferred, or recorded as accepted risk.
4. Record the result in an HTML comment in the deck, for example:
   `FINAL DECK REVIEW: PASS`, `FINAL DECK REVIEW: fixed P1 on slide 04`, or
   `FINAL DECK REVIEW: unavailable - inline fallback used`.
5. Mention the review status in the final response to the user.

## If Subagents Are Unavailable

Do not silently skip the gate. Run the same prompt inline and record:

`FINAL DECK REVIEW: unavailable - inline fallback used`

## Reviewer Prompt

```text
You are an independent final-deck content reviewer. Do not edit files.

Review this finished HTML slide deck:
<absolute-or-repo-relative-path>

Rendered screenshots (one per slide, from verify.py):
<screenshots-directory>

Known facts:
- Audience: <role + technicality>
- Goal: <decision / adoption / training / status>
- Deck kind: <decision / informational> and mode: <live / standalone>
- Approved brainstorm (if any): <path or "none">

Step 0: confirm you could open the deck HTML and at least one screenshot.
If not, report PATH FAILURE as a P0 finding and stop.

Check, in order:
1. Assertion titles — every content-slide headline states a business takeaway
   as a full-sentence claim someone could dispute. Flag bare labels
   ("Overview", "Results"), topic phrases, and any title that describes the
   slide or template instead of the subject. Data-slide titles should carry
   the key number.
2. Skim test — read only the slide titles, in order. Retell the argument and
   the ask from the titles alone. Name the first slide where the storyline
   breaks, any duplicate claims, and any gap. If the storyline is
   unrecoverable from titles, that is a P1.
3. One claim per slide — flag any slide arguing two or more separate points,
   or a body that argues something different from its headline.
4. Interpretable exhibits — for every chart or table: name the number it
   proves. If you cannot state its values, units, and takeaway from the slide
   alone, it is decoration (P1) unless it is visibly marked "Illustrative".
5. MECE grouping — for each group of bullets/cards/zones, name its cutting
   dimension; flag overlapping items, an obvious missing bucket, mixed
   cause/action/finding lists, and groups of 1 or more than 6.
6. Comparison integrity — flag any headline comparison vulnerable to an
   apples-to-oranges challenge (mismatched cohorts, time windows,
   denominators) with no caveat on the slide.
7. The ask — decision decks must state the recommendation by slide 2 and
   close with decision + owner + date. Placeholders ("TBD", "leadership")
   are a P1. The closing slide restates the ask, never introduces it.
8. Brainstorm fidelity — when an approved brainstorm exists, diff the final
   titles against the brainstorm slide titles; flag any meaning change.

Return:
- PASS if no material issues.
- Otherwise BLOCKING ISSUES and a prioritized list of findings, each with:
  - severity: P0 / P1 / P2 / P3
  - slide number
  - issue
  - why it matters
  - concrete fix

Do not comment on theme, palette, typography, or rendering — verify.py and
the theme rules own those.
```

## Severity

- **P0**: Fabricated stat/quote/claim, broken file, missing required slide,
  or an unmarked illustrative exhibit presented as real data.
- **P1**: Titles fail the skim test, a chart cannot be interpreted, the ask
  is missing or placeholder, or a headline comparison would not survive a
  skeptical audience.
- **P2**: A slide can be understood but should be improved.
- **P3**: Small wording or polish note.

P0 and P1 findings must be fixed before delivery unless the user explicitly
accepts the risk on the record.

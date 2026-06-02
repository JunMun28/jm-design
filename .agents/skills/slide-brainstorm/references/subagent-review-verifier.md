# Subagent Review Verifier

Use this after the brainstorm HTML exists and before presenting it to the user.
The purpose is fresh-eye review: the author of the brainstorm is too close to
the file and will miss weak slides.

## Required Flow

1. Write or update the brainstorm HTML.
2. Run the local self-checks:
   - density and strong-slide verification
   - anti-boring checklist
   - persuasion rigor audit, when applicable
   - browser/layout overflow check, when feasible
3. Spawn one reviewer subagent with the prompt below.
4. Fix all reviewer findings that are clear correctness, argument, source
   honesty, overflow, or major design issues.
5. For findings you do not fix, record why in the HTML comment as
   `SUBAGENT REVIEW: accepted risk - <reason>`.
6. Present the brainstorm only after the review result is clean, fixed, or
   explicitly recorded.

## If Subagents Are Unavailable

Do not silently skip the gate. Run the same prompt inline and record:

`SUBAGENT REVIEW: unavailable - inline fallback used`

This fallback is less rigorous. Mention it briefly in chat when presenting the
brainstorm.

## Reviewer Prompt

Give the subagent only the context it needs:

```text
You are an independent slide-brainstorm verifier. Do not edit files.

Review this brainstorm HTML:
<absolute-or-repo-relative-path>

Relevant references:
- .agents/skills/slide-brainstorm/references/template.md
- .agents/skills/slide-brainstorm/references/strong-slide-design-checklist.md
- .agents/skills/slide-brainstorm/references/design-vocabulary.md

Known intake facts:
- Audience: <role + technicality>
- Goal: <decision / adoption / training / status>
- Presentation style: <style>
- Slide density: <density>
- Source status: <Provided / Exists but not provided / None>
- Strongest objection or pushback: <verbatim or None raised>

Check:
1. Whether the HTML follows the canonical skeleton and saved path convention:
   `docs/brainstorms/YYYY-MM-DD-<topic>-brainstorm.html`,
   `section.deck > article.slide-panel[data-slide]`, one direct
   `header.slide-head`, and one direct `div.preview` per slide.
2. Whether the visible page stays brainstorm-only: no final deck styling
   decision, no exposed admin/audit scaffolding unless the user asked.
3. Any slide with a weak or unsupported claim.
4. Any slide that hides assumptions, placeholders, or missing sources.
5. Any missing answer to the strongest objection or pushback.
6. Any boring traditional slide pattern: title-plus-bullets, repeated layout,
   too many cards, no visual job, no artifact, no interaction cue.
7. Any slide whose layout does not fit the content shape: comparison, sequence,
   mechanism, relationship, hierarchy, evidence, exception, product state, or
   decision.
8. Any slide without a clear visual protagonist, 3-5 stop scan path, or
   meaningful visual encoding.
9. Any internal `DESIGN INTENT` promise that is not visibly implemented in the
   HTML.
10. Any low-fidelity slide where a complex technical or product idea is reduced
   to generic rectangles, vague placeholders, or shallow bullets instead of a
   production-grade monochrome preview.
11. Any density mismatch or overloaded slide.
12. Any unclear decision ask, weak close, or missing next action.
13. Any likely overflow, tiny text, inaccessible scan path, or confusing visual
   hierarchy.

Return:
- PASS if no material issues.
- Otherwise write BLOCKING ISSUES and a prioritized list of findings, each with:
  - severity: P0 / P1 / P2 / P3
  - slide number
  - issue
  - why it matters
  - concrete fix

Do not comment on final visual theme, colors, or typography unless they hurt
brainstorm clarity or violate the theme-agnostic requirement.
```

## Severity

- **P0**: Fact/source fabrication, missing required slide, broken file, or
  hidden evidence failure.
- **P1**: The deck argument fails, the strongest objection is not answered, or
  a major slide is unintuitive/boring enough to undermine approval.
- **P2**: A slide can be understood but should be improved before handoff.
- **P3**: Small polish note, wording improvement, or optional layout tweak.

P0 and P1 findings must be fixed before presenting unless the user explicitly
accepts the risk on the record.

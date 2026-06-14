# ADR 0004 - Default theme is `micron-dark`

- **Status:** Superseded by the 2026-06-12 amendment below (no default theme)
- **Date:** 2026-05-21

## Context

`html-slides` shipped with `micron-light` as the recommended default in
`SKILL.md`'s **Style Selection** step ("option 1, the recommended
default"). That default was inherited from earlier framing of the skill
as a print/board/training-leaning surface.

In practice at jm-design, the more common case is engineering decks:
internal reviews, roadmaps, postmortems, architecture readouts, rollout
updates, and technical product demos — all of which the **Defaults**
section of `SKILL.md` already routes to `micron-dark`. The recommended
default and the most-frequent occasion have drifted apart.

The discrepancy surfaces during the **Theme Selector** redesign (see
[ADR 0003](./0003-rename-tone-to-role.md)). The redesign surfaces the
recommended default as a visible `RECOMMENDED` pill on the selector
card; making that pill point at a rarely-chosen theme would degrade the
selector instead of improving it.

## Decision

`micron-dark` becomes the recommended default for `html-slides`.

- `SKILL.md` **Defaults** and **Style Selection** sections are rewritten
  to lead with `micron-dark`. `micron-light` is demoted to "use only
  when…" framing (print, board, financial readouts, training where the
  bright fixed-stage cadence is required).
- `themes/themes.json` gains a `"recommended": true` flag on
  `micron-dark`. Exactly one theme carries the flag at any time.
- `themes/selector.html` reads the flag and renders a small
  `RECOMMENDED` pill on that theme's card.

## Considered alternatives

- **Keep `micron-light` as the default.** Rejected: contradicts the
  frequency of actual deck requests and forces users to switch theme on
  most decks.
- **Have no default — always ask without bias.** Rejected: **Style
  Selection** explicitly leads with "option 1, the recommended default"
  to keep the question quick; removing the default would slow every
  deck-building session for marginal benefit.
- **Make the default contextual** (e.g. infer from the brief). Rejected
  for now: adds inference complexity to a workflow whose stated goal is
  a fast last-question. Could be revisited.

## Consequences

- Every future deck that lands in **Style Selection** without an explicit
  theme will be offered `micron-dark` first. Decks that need light
  surfaces must be requested explicitly.
- The **Theme Selector** card for `micron-dark` carries a `RECOMMENDED`
  pill; light's pill is removed.
- This is reversible by flipping the flag and `SKILL.md` lead theme —
  but reversal should travel through an ADR update so the trail stays
  legible.

## Future work

- If frequency shifts (e.g. enablement work grows), revisit the default.
  Track which themes get used over a quarter before flipping again.

## Amendment (2026-06-12): no default theme; dark themes merged

This ADR's decision is reversed. The theme lineup changed:

- The engineering `micron-dark` theme (wafer-portal cover, editorial-ops
  title templates, `engineering-review` role) was **removed**.
- The premium `micron-dark-executive` theme was **renamed to `micron-dark`**,
  keeping its strict gates (photo-title cover, required animated Micron
  primary icon, `premium_corporate_checks`, executive-summary-on-slide-2 for
  decision decks). It is now the single dark theme — used for executive,
  vision, technical, and walkthrough dark decks alike.
- The `"recommended": true` flag was **removed**. No theme is recommended;
  `Style Selection` lists the four stable themes (`micron-dark`,
  `micron-light`, `guided-learning`, `playful`) in plain manifest order with
  no pill. `selector.html` already falls back to the first manifest theme when
  no `recommended` flag is present.

Rationale: the two dark themes were redundant in practice, and a recommended
default biased the selector toward one theme when the choice is genuinely the
user's. Treating all themes equally removes that bias. Reversible, but via a
further amendment so the trail stays legible.

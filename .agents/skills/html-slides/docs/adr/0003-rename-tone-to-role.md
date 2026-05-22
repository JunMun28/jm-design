# ADR 0003 - Rename `tone` to `role` in the theme manifest

- **Status:** Accepted
- **Date:** 2026-05-21

## Context

`themes/themes.json` carries a one-word `tone` field per theme. The values were
split between two distinct ideas before the theme set was reduced:

| theme                   | `tone`           | reads as        |
| ----------------------- | ---------------- | --------------- |
| `micron-dark-executive` | `brand`          | aesthetic       |
| `micron-dark`           | `engineering`    | occasion        |
| `micron-light`          | `editorial-data` | mixed           |
| `guided-learning`       | `learning`       | occasion        |
| `playful`               | `warm`           | aesthetic       |

The field is doing two jobs badly: some values describe aesthetic flavour
("raw", "warm"), others describe the occasion the theme is for
("engineering review", "learning"). The **Theme Selector** (see
[CONTEXT.md](../../../../CONTEXT.md)) renders `tone` as the most prominent
secondary label on each card, so the ambiguity directly degrades **Style
Selection** — the failure mode is "I can't tell when to use which theme."

We are redesigning the **Theme Selector** to optimise for decision speed
(see also discussion captured in CONTEXT.md). The card needs one short,
prominent label that answers "when would I reach for this?". Aesthetic
flavour will continue to be communicated through the screenshot and the
`when` copy.

## Decision

Rename `tone` → `role` in `themes/themes.json` and
`themes/themes.schema.json`. Rewrite the values to describe the
occasion the theme exists for, not the aesthetic register:

| theme                   | old `tone`       | new `role`           |
| ----------------------- | ---------------- | -------------------- |
| `micron-dark-executive` | `brand`          | `executive-cover`    |
| `micron-dark`           | `engineering`    | `engineering-review` |
| `micron-light`          | `editorial-data` | `editorial-data`     |
| `guided-learning`       | `learning`       | `training`           |
| `playful`               | `warm`           | `workshop`           |

The manifest `version` is **not** bumped. The manifest's only consumers
are in-repo (`themes/selector.html` and, in future, `scripts/verify.py`)
and are updated atomically in the same change. Bumping `version` would
falsely signal that external clients exist.

## Considered alternatives

- **Keep `tone`, add a new `role` field.** Rejected: two short labels per
  card crowd the surface and force every theme to invent both. The
  selector card has limited above-the-fold real estate; one sharp label
  is better than two fuzzy ones.
- **Keep `tone`, do not add a field, only rewrite `when` lines.** Rejected:
  preserves the existing ambiguity in the manifest. The mush field would
  stay mush, and future contributors would keep adding mixed values.

## Consequences

- `themes/selector.html` and the in-progress `themes/selector-v2.html`
  render `role` (not `tone`) as the prominent secondary label on the card.
- `themes/themes.schema.json` updates the property name; no new constraint
  beyond `"type": "string"` (values are not enum-locked yet — see future
  work).
- No Python code references `tone` today, so `scripts/verify.py` and
  `scripts/scaffold-deck.py` are not affected.
- `CONTEXT.md` already names the **Theme Selector** term that anchors this
  decision; no new domain term is introduced.

## Future work

- If a third aesthetic label becomes necessary, add it as a separate
  field (e.g. `register`) — do not re-overload `role`.
- Consider enum-locking `role` once the value set stabilises across
  future themes, to keep the **Theme Selector** legible.

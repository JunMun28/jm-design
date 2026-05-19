# Weekly update — design

Use for operational status decks: squad weekly, ops review, release readout. Compact, scannable, no hero rhetoric.

## Visual feel

- White canvas (`--bg-primary: #fff`), black type. Information density is the point.
- Single purple accent reserved for the **one** headline number per slide (shipped count, blocker count, KPI delta).
- Hairline rules separate sections, never heavy panels. Tabular numbers everywhere a number appears.
- Eyebrow with squad + week range at the top-left of every slide. Slide number top-right in mono.

## Default outline

| # | Kind | Content |
|---|---|---|
| 01 | `cover` | Squad name, week range, one-line headline of the week. |
| 02 | `headline` | One sentence + one number. The thing leadership should remember. |
| 03 | `shipped` | What shipped. 3–6 items, one line each, with owner + link affordance. |
| 04 | `in-flight` | What's in flight with target dates. |
| 05 | `blocked` | What's blocked, why, and what unblocks it. |
| 06 | `metrics` | 2–4 metrics in a small grid; one is accented. |
| 07 | `asks` | One ask per row: ask, owner, deadline. |
| 08 | `close` | One sentence on next week. |

Slides 04–07 may be merged or split depending on volume. Keep the deck under 10 slides — if it's longer, the update isn't weekly any more.

## Asks before generating

- Squad / team name.
- Week range (e.g. "wk 19 · 5–11 May").
- Bullet list of shipped items.
- Bullet list of in-flight items with target dates.
- Bullet list of blockers, with whose decision unblocks them.
- 2–4 metrics, each with current value and direction.
- 0–3 asks, each with owner and deadline.

## Don'ts

- No metaphor language ("we crushed it", "rocket ship"). Reserve adjectives for the headline slide.
- No charts beyond sparkline or single bar — this isn't a metrics review.
- No empty sections. If nothing is blocked, drop the blocked slide; do not write "nothing blocked."

## Worked precedent

See `example.html` in this folder.

# Course module — design

Use when the deck is a lesson, training module, workshop, or anything with a learn → recall → apply cadence.

## Visual feel

- Black or near-black canvas (matches Micron dark engineering).
- Cyan (`--micron-cyan`) is the **movement / progress** accent: current step marker, progress bar, "you are here" cues.
- Purple (`--micron-accent`) is reserved for one-key highlights inside a slide (quiz prompt accent bar, the active step glyph).
- A vertical "module rail" repeats on every content slide so the learner always knows where they are in the four-beat structure.
- Headlines stay in sentence case. No serifs, no warm-paper tints.

## Slide rhythm

| # | Kind | Purpose |
|---|---|---|
| 01 | `cover` | Module number (huge, cyan, low opacity), title, one-line "why this matters." |
| 02 | `learn` | 2–3 concept cards. Each card has a number, a short heading, and one short paragraph. |
| 03 | `recall` | One quiz prompt with 3–4 options. Do not reveal the answer in the slide. |
| 04 | `apply` | A checklist the learner can act on next time. |

Optional: insert a second `learn` slide between concepts and recall if the topic is dense. Keep the rail in sync.

## Asks before generating

- Module number and title.
- Audience and prerequisite knowledge.
- 3–5 learning objectives.
- One self-check question with options.
- One concrete action the learner should take afterwards.

## Don'ts

- No speaker notes visible on the slide. Use a hidden `<aside class="notes">` only.
- No serif type. No warm paper colors.
- Do not reveal the quiz answer on the slide; that belongs in instructor notes.

## Worked precedent

See `example.html` in this folder.

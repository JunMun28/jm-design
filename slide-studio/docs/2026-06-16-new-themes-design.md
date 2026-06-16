# Seven new slide templates (2026-06-16)

Expands the `html-slides` selectable theme set from **7 → 14**. All seven are neutral
(non-Micron, free palettes), non-fixed-stage (like `aurora-glass`), `logo_pattern: null`.

## What shipped

| id | role / use when | canvas | accent(s) | display font |
|----|------|--------|-----------|--------------|
| `swiss-international` | data-dense reports, grids | white | international red `#E2231A` (rules/figures only, never on headlines) | Archivo |
| `consulting-navy` | board, exec readouts, strategy | white + navy covers | blue `#1B6EC8` + one rationed gold `#C8A45B` | Source Serif 4 |
| `editorial-serif` | thought leadership, narrative | warm paper `#FBFAF6` | antique gold `#B08D57` | Fraunces |
| `minimal-slate` | calm internal updates, weekly status | off-white `#F7F7F5` | one quiet slate `#4B5563` | Inter Tight |
| `keynote-vivid` | product launches, demos | near-black indigo `#14111F` | electric violet `#6E5BFF` + coral/amber pops | Sora |
| `brutalist-bold` | manifestos, loud launches | white | electric yellow `#FFE600` (fills only, never text) | Archivo Black |
| `soft-pastel` | HR, onboarding, culture | warm off-white `#FFF7F2` | peach + lavender + mint | Quicksand |

## Theme contract (each folder)

`themes/<id>/` = `design.md` (the design spec the agent follows) + `tokens.css`
(frozen palette/type tokens) + `example.html` (a verified ~6–8 slide example deck,
shell inlined) + `screenshots/` (the verifier output; `example-overview-1280x720.png`
is the picker thumbnail). Registered in `themes/themes.json` with a `verify` block:
`palette_lock: true`, `headline_contrast_min: 4.5`, an `accent_rgb` + `accent_max_per_slide`
cap, `require_assertion_titles: true`, and `required_tokens` matching `tokens.css`.

## Build approach

- The token + `verify` contract for each theme was authored centrally in `themes.json`
  (registered as `experimental` first so they stayed hidden from the picker during the build).
- One builder agent per theme implemented `design.md` + `tokens.css` + `example.html`
  to that contract, reusing the `aurora-glass` example as the structural precedent
  (shell markers + player chrome), and iterated `verify.py` to green.
- Inspiration drawn from OpenDesign's Apache-2.0 design systems where useful, but every
  theme was re-authored in our format — no verbatim copy, no attribution burden.
- After all five passed, they were flipped to `stable` and their `preview` paths set.

## Verification

- `verify.py <example> --theme <id> --require-shell --check-overview --fail-on-warnings`
  → **exit 0, no failures/warnings** for all seven (only the recommended-not-required
  source-link NOTE, which is N/A for hand-authored examples).
- Each: action titles (assertions, sentence case), body ≥24px / titles ≥60px, illustrative
  data labelled, charts on solid surfaces, `palette_lock` honored (no off-token hex).
- Registry: 14 themes, all `stable`, all previews present.
- Daemon theme-projection tests (`themes.test.ts`, `themes-http.test.ts`, `theming.test.ts`):
  **19/19 pass** — the picker reads this projection.

Nothing committed.

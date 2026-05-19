# Kubernetes for Non-Engineers — Deck

## What's in this folder

- `kubernetes-for-non-engineers.html` — self-contained 10-slide deck (open in any browser; prints cleanly to PDF as 16:9 pages).
- `assumptions.md` — explicit list of assumptions made because the brief was vague and follow-up questions weren't possible.
- `outline.md` — slide-by-slide outline if you want to repurpose the content (memo, blog post, talk track).

## How to use

1. Open `kubernetes-for-non-engineers.html` in Chrome/Safari/Firefox.
2. Optional: File → Print → "Save as PDF", layout "Landscape", margins "None" — gives a clean exportable deck.
3. Each slide has a small "Speaker note" disclosure on screens that include one (slide 2 currently). Strip these before exporting if you don't want them visible.

## Design choices

- **Editorial dark theme**, restrained palette (deep navy / off-white / muted blue + amber accents). Felt appropriate for a thoughtful explainer to senior non-engineering stakeholders. Easy to re-theme by editing the CSS `:root` variables.
- **Analogy-first** structure: restaurant chain → lunchbox → general manager. One analogy stretched across the deck so the audience never has to remap mid-talk.
- **No code, no kubectl, no YAML** — deliberately. The whole point of "for non-engineers" is to make the value visible without the syntax.
- **One business-value slide + one honest-tradeoffs slide** to keep it credible; non-engineer audiences quickly tune out hype-only pitches.

## What I'd change with more input

See `assumptions.md` for the specific places this would benefit from a follow-up conversation with the speaker / audience owner.

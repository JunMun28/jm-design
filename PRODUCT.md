# Product

## Register

brand

## Users

Micron internal audiences — engineers, technical leadership, and operators. They see this work in scheduled settings: engineering reviews, manufacturing-yield walkthroughs, board updates, and Copilot/Codex enablement sessions. They are technical, time-constrained, and skeptical of stock corporate visuals. The job-to-be-done is to leave each session with a sharper mental model and a clear next action, not to be entertained.

Secondary surface: the skill workspace itself (html-slides, micron-icons, theme-factory, brand-guidelines, pptx). Operators here are agents and the human author running them. Their job is to produce decks that hold up to the brand register above — the tooling exists to enforce that bar, not soften it.

## Product Purpose

`jm-design` is a workspace of reusable skills that author single-file HTML decks and brand artifacts for Micron-internal use. The output is the product: decks that earn their authority through precision, real evidence, and theme discipline. Success is a deck that a technical audience trusts on first read, that survives projection on a 27" monitor in a meeting room, and that an operator can reproduce months later with the same skill and theme.

## Brand Personality

Confident, technical, restrained. Voice is engineer-to-engineer: declarative, specific, free of marketing softening. Tone shifts by deck purpose — yield reviews carry urgency, enablement carries patience — but never reaches for warmth via emoji, casual asides, or aspirational copy. Emotional goal: the audience feels respected, not sold to.

## Anti-references

These are the four reflexes to refuse. If a slide drifts toward any of them, rebuild the slide.

- **Corporate PowerPoint clip-art.** Stock icons, gradient banners, SmartArt, four-bullet "key takeaways" boxes. The default Microsoft Office look.
- **SaaS landing-page tropes.** Hero metric template (big number + small label + gradient accent), identical icon-heading-text card grids, glassmorphism, gradient text. The currently-saturated B2B aesthetic.
- **Consulting-deck density.** Wall-of-text McKinsey slides, 14pt body crammed edge-to-edge, footnotes stacked three deep, "exhibits" labelled like court evidence.
- **Generic "modern minimalism."** Inter on slate gray with one blue accent, `rounded-2xl` everywhere, the AI-generated default. If a stranger could guess the theme from the category alone, it is this trap.

## Design Principles

1. **Show, don't tell.** Use real numbers, real screenshots, real code, real artifacts. Abstract icons and stock metaphors are a failure mode, not a fallback.
2. **Verified before shipped.** Every deck passes the `html-slides` verification gate — fixed stage at 1280×720, screenshots at desktop and mobile, contrast checked, no overflow. Verification is the definition of done, not a nice-to-have.
3. **Theme-honest.** Pick one theme per deck and commit to its rules end-to-end. Don't mix Micron-light typography with brutalist layout, or import a card pattern from a different theme because the slide is hard. Hard slides get rebuilt, not cross-pollinated.
4. **Earn authority through precision.** Density is allowed and often correct, but each element must be defensible — every label, every datapoint, every chart axis. Restraint is not minimalism; it is the absence of anything indefensible.

## Accessibility & Inclusion

WCAG AA is the floor: 4.5:1 contrast on body copy, 3:1 on large text and meaningful non-text elements. `prefers-reduced-motion` is respected — animated Micron icons and any motion moments must have a static fallback. Icons used semantically carry alt text from the Curated Icon Label; decorative icons use `alt=""` with hidden semantics. Body copy stays within a 65–75ch measure even on projected screens.

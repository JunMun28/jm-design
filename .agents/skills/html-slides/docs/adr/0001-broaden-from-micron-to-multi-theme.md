# ADR 0001 — Broaden micron-html-slides into a multi-theme html-slides skill

- **Status:** Accepted
- **Date:** 2026-05-15

## Context

`micron-html-slides` was built as a strict, brand-locked deck system. The skill's top-level non-negotiables encode Micron-specific rules — one purple accent per slide, one gradient per slide, charts only on white or black backgrounds, Micron logo at bottom right of every content slide, fixed Micron tokens pasted before every other style. The five existing themes are all Micron variants (dark, light, dark-engineering, course-module, weekly-update).

A separate skill, `ui-ux-pro-max`, provides broad design intelligence — 67 styles, 96 palettes, 57 font pairings, 99 UX guidelines, 25 chart types, decision rules with anti-patterns. It is being deprecated and will be deleted.

The user wants:
1. To keep producing high-quality Micron decks unchanged.
2. To also produce decks in non-Micron styles (Swiss/minimal, editorial, brutalist, glassmorphism, playful) without leaving the same skill.
3. Zero runtime dependency on `ui-ux-pro-max`, which is going away.

## Decision

Broaden `micron-html-slides` into a general `html-slides` skill. Micron themes become flagship members of a wider theme registry rather than the namespace itself.

**Path chosen — theme registry expands (one skill, many themes).** Each theme owns its full identity: palette, typography, accent rules, chart-surface rules, anti-patterns, density caps, verification config. The top-level `SKILL.md` keeps only universal non-negotiables; everything Micron-specific moves into `themes/micron-*/design.md` (where most of it already lives).

**Scope — Medium.** Five Micron themes stay. Two new neutrals ship in M1 (`swiss-light`, `editorial-dark`). Three more in M2 (`brutalist`, `glassmorphism`, `playful`). No dynamic/runtime style generation — every theme is hand-curated and frozen.

**ui-ux-pro-max integration — author-time only, one-shot mining.** Before deletion, extract:
- UX guidelines (cursor, hover layout-shift, focus, reduced-motion, contrast, smooth-scroll) → `references/process/universal-ux-lints.md` + new lints in `verify.py`
- Chart data-type → chart-type decision table → appended to `references/runtime/svg-charts.md`
- Palette + typography rows for M1/M2 themes → frozen into each new theme's `tokens.css`
- "Common Rules" and "Pre-Delivery Checklist" tables → merged into existing process docs

The CSV/Python search infrastructure does not come over. Markdown only. No-build.

**Sequence — refactor-first (X).** (1) Demote Micron specifics from `SKILL.md` into theme `design.md` files. (2) Generalize `verify.py` to read per-theme rules from `themes.json`. (3) Mine `ui-ux-pro-max` into frozen files; commit. (4) Author M1 themes. (5) Rename skill `micron-html-slides` → `html-slides`. (6) Delete `ui-ux-pro-max`. (7) M2 themes.

## Alternatives considered

**Path 2 — Two skills.** Keep `micron-html-slides` strict; create a separate `html-slides` skill for non-Micron decks. Rejected: forces the user to know which skill to invoke, duplicates runtime/tokens/verification scaffolding, and the existing `themes/themes.json` chooser is already multi-theme-shaped.

**Large/dynamic theme scope.** Generate a theme on the fly per deck by running design-system reasoning against the brief. Rejected: the curated freeze is precisely why Micron decks don't look like generic AI output. Dynamic generation reintroduces the inconsistency problem Micron's strictness was built to solve.

**Plug-in B/C — runtime cross-skill dependency.** Have `verify.py` or the chart picker call into `ui-ux-pro-max` at runtime. Rejected: `ui-ux-pro-max` is being deleted. Any runtime dependency would break.

**Sequence Y — mine-first, refactor-later.** Pull content out of `ui-ux-pro-max` before refactoring `SKILL.md` or `verify.py`. Rejected: leaves mined content sitting unwired in the repo with no consumer, easy to rot.

## Consequences

**Positive.**
- One skill, one chooser, one workflow for all HTML decks.
- Micron brand integrity preserved — Micron themes carry their own non-negotiables.
- `ui-ux-pro-max` can be deleted cleanly once mining is committed.
- Adding future themes is purely additive: new folder + manifest entry, no SKILL.md edits.

**Negative.**
- `SKILL.md` non-negotiables shrink. Some rules that previously applied to every deck (e.g., "one purple accent") now apply only to Micron themes; a non-Micron deck losing those rules is intentional but worth verifying per-theme rules are equally strict.
- `verify.py` grows a manifest-driven config layer. More moving parts; harder to reason about than hardcoded Micron checks.
- Non-Micron themes must each be authored to Micron-level quality. Without that discipline, the chooser will surface lower-quality options and the skill's reputation suffers.

**Mitigations.**
- Every new theme's `design.md` must follow the same schema (palette source, accent rules, chart-surface, anti-patterns, density caps). Schema enforced by review, not code.
- M1 ships only two non-Micron themes to pressure-test the architecture before scaling to M2.
- `themes.json` `status` field gates experimental themes from the default chooser.

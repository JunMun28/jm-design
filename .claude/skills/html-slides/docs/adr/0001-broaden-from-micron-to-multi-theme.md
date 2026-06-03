# ADR 0001 - Broaden micron-html-slides into a multi-theme html-slides skill

- **Status:** Accepted
- **Date:** 2026-05-15
- **Updated:** 2026-05-21 to remove the Brutalist theme from the stable set.

## Context

`micron-html-slides` began as a strict, brand-locked deck system. The skill's
top-level rules encoded Micron-specific constraints: purple accent discipline,
chart-surface rules, Micron logo placement, and fixed Micron tokens.

A separate skill, `ui-ux-pro-max`, provided broad design intelligence but was
being deprecated. The user wanted one HTML slide skill that kept Micron quality
while supporting a small number of curated non-Micron themes.

## Decision

Broaden `micron-html-slides` into a general `html-slides` skill. Micron themes
become flagship members of a wider theme registry rather than the namespace
itself.

Each theme owns its identity: palette, typography, accent rules, chart-surface
rules, anti-patterns, density caps, and verification config. The top-level
`SKILL.md` keeps universal non-negotiables only; Micron-specific rules live in
`themes/micron-*/design.md`.

The stable theme set is intentionally small:

- `micron-dark-executive`
- `micron-dark`
- `micron-light`
- `guided-learning`
- `playful`

`themes/themes.json` is the source of truth. Adding or removing themes happens
through the manifest plus the corresponding theme folders and verification
matrix.

## Alternatives Considered

**Two skills.** Keep a strict Micron-only skill and create a separate generic
HTML slides skill. Rejected because it duplicates runtime, verification, and
theme-selection workflow.

**Dynamic theme generation.** Generate a fresh theme per deck. Rejected because
the curated freeze is why the outputs stay consistent.

**Runtime dependency on deprecated design tooling.** Rejected because any
runtime dependency would break after deletion.

## Consequences

**Positive.**

- One chooser, one runtime, one verification path.
- Micron brand integrity is preserved in Micron theme files.
- Future theme changes are manifest-driven.

**Negative.**

- The manifest, examples, scaffold, screenshots, and verifier can drift if only
  one deck is tested.
- Non-Micron themes must be curated to the same quality bar or removed.

**Mitigations.**

- `themes.json` gates the default chooser to `stable` themes.
- After changing themes, examples, scaffold output, runtime, overview behavior,
  or verifier logic, run `scripts/audit-theme-matrix.py`.

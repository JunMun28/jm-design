# Vendored slide skills

The generation engine is the **existing slide skills**, not reimplemented logic
(plan §9.1, §9.6). For a self-contained distributable, the skills are vendored
here from the upstream source of truth in `jm-design/.claude/skills`.

- **Upstream (source of truth):** `jm-design/.claude/skills/{slide-brainstorm,slide-consultant,slide-quick,html-slides,html-to-pptx}` plus `theme-factory`, `micron-icons`, `pptx`.
- **One-way sync only.** Run `pnpm --filter @slide-studio/daemon sync:skills` (see `scripts/sync-skills.mjs`) to refresh this folder from upstream. Do **not** edit vendored copies — fix upstream and re-sync, to avoid fork-and-drift.

The walking skeleton (issue #3) established the daemon ↔ web ↔ agent spine and
injected only the consultant persona. **Slice 2 (issue #4)** now stages the real
`slide-brainstorm` + `slide-consultant` SKILL.md bodies into the composed prompt
(`apps/daemon/src/skills.ts` → `stageSkills` / `composePrompt`), alongside the
full conversation transcript, so the agent runs the brainstorm in context and
keeps the one-question-at-a-time rhythm.

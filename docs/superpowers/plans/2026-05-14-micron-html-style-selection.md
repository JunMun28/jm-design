# Micron HTML Style Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update `micron-html-slides` so new deck requests ask users to choose a style when no clear style was requested.

**Architecture:** Add a static style-selector HTML preview plus focused style-selection policy in `SKILL.md`. The workflow links the preview and asks for style before theme references, outline, and deck generation.

**Tech Stack:** Markdown skill instructions, shell verification with `rg` and `sed`.

---

### Task 1: Add Style Selection Instructions

**Files:**
- Create: `.agents/skills/micron-html-slides/references/style-selector.html`
- Modify: `.agents/skills/micron-html-slides/SKILL.md`
- Reference: `docs/superpowers/specs/2026-05-14-micron-html-style-selection-design.md`

- [ ] **Step 1: Review the current defaults section**

Run:

```bash
sed -n '1,80p' .agents/skills/micron-html-slides/SKILL.md
```

Expected: The file has `## Defaults` and no dedicated `## Style Selection` section.

- [ ] **Step 2: Insert the Style Selection section after Defaults**

Add this section after the existing default bullets and before `## Read First`:

```markdown
## Style Selection

For new deck requests, select the style before outlining or building.

- If the user clearly names a style, use it directly and skip the chooser.
- If the user does not name a style, show this list first and ask the user to choose:
  1. Micron original dark theme
  2. Micron dark engineering theme
  3. Micron light theme
  4. Course module
  5. Operational status update
- When asking the user to choose, include a link to the HTML preview: `references/style-selector.html`.
- Do not apply a default style when style is missing. Stop and ask first.
- If the user asks you to choose after seeing the list, choose the best fit for the content and state the chosen style.
- Do not include Open Design landing deck in the selector.
```

- [ ] **Step 3: Update workflow step 1**

Replace workflow step 1 with:

```markdown
1. Select the requested style directly when clear. If style is missing or ambiguous, show the style list from `Style Selection`, include a link to `references/style-selector.html`, and ask the user to choose before reading style references, outlining, or building. Do not apply a default style for an unspecified request.
```

- [ ] **Step 4: Verify no Open Design selector mention**

Run:

```bash
rg -n "Open Design|open-design|Style Selection|style-selector.html|Micron original dark|Course module|Operational status update" .agents/skills/micron-html-slides/SKILL.md
```

Expected: `Open Design` appears only in the explicit exclusion line, not as a selectable option.

- [ ] **Step 5: Review final diff**

Run:

```bash
git diff -- .agents/skills/micron-html-slides/SKILL.md
```

Expected: The diff adds style-selection guidance, links `style-selector.html`, and updates workflow step 1.

### Task 2: Final Verification

**Files:**
- Read: `.agents/skills/micron-html-slides/SKILL.md`
- Read: `.agents/skills/micron-html-slides/references/custom-templates.md`

- [ ] **Step 1: Confirm custom templates stay limited**

Run:

```bash
sed -n '1,60p' .agents/skills/micron-html-slides/references/custom-templates.md
```

Expected: The template selector lists only `Course module` and `Weekly update`.

- [ ] **Step 2: Confirm selector order**

Run:

```bash
sed -n '1,120p' .agents/skills/micron-html-slides/SKILL.md
```

Expected: `Style Selection` appears before `Read First`, and `Workflow` starts with selection before PDF confirmation and reference reading.

- [ ] **Step 3: Commit implementation**

Run:

```bash
git add .agents/skills/micron-html-slides/SKILL.md docs/superpowers/plans/2026-05-14-micron-html-style-selection.md
git commit -m "docs: add micron html style selector"
```

Expected: Commit succeeds and includes only the skill update plus this implementation plan.

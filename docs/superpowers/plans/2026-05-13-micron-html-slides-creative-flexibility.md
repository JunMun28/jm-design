# Micron HTML Slides Creative Flexibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decouple `micron-html-slides` from `micron_engineering_slide_demo_d_3.html` so content slides use Micron dark principles without repeating demo layouts.

**Architecture:** Keep the skill as markdown-driven instructions. Extract title-template guidance into a standalone reference doc, rewrite dark engineering guidance around principles, and remove every demo-matched content dependency from the skill docs.

**Tech Stack:** Markdown skill docs, single-file HTML slide runtime guidance, existing Python Playwright verifier.

---

## File Structure

- Modify: `.agents/skills/micron-html-slides/SKILL.md`
  - Entrypoint behavior. Remove demo-match defaults, point to new title-template reference, and make content slides creative/freeform.
- Modify: `.agents/skills/micron-html-slides/references/micron-engineering-dark.md`
  - Core dark engineering design rules. Rewrite demo-dependent sections into principles-only guidance.
- Create: `.agents/skills/micron-html-slides/references/micron-engineering-title-templates.md`
  - Canonical title templates as reusable recipes/snippets. This replaces using the demo HTML as title source.
- Modify: `.agents/skills/micron-html-slides/references/frontend-slides-architecture.md`
  - Remove the demo-matched fixed-stage exception. Keep flexible runtime constraints.
- Modify: `.agents/skills/micron-html-slides/references/verification.md`
  - Remove demo-matched verification exception.
- Delete: `.agents/skills/micron-html-slides/references/micron-engineering-demo-fidelity.md`
  - Remove obsolete demo-matched mode reference.

Do not modify `micron_engineering_slide_demo_d_3.html`; the point is to make it safe for the user to delete later.

---

### Task 1: Add Standalone Title Template Reference

**Files:**
- Create: `.agents/skills/micron-html-slides/references/micron-engineering-title-templates.md`

- [ ] **Step 1: Create title-template reference**

Use `apply_patch` to create `.agents/skills/micron-html-slides/references/micron-engineering-title-templates.md` with this content:

```markdown
# Micron engineering title templates

Use this after `micron-engineering-dark.md` when creating title slides for
Micron dark engineering decks.

These templates are standalone recipes. Do not read or depend on
`micron_engineering_slide_demo_d_3.html`.

## Rules

- Every generated deck starts with a title slide unless the user explicitly asks for a standalone content slide.
- Use a title template only for slide 1, section dividers, or closing moments.
- Content slides must not copy these layouts unless the user asks for a title-style slide.
- Keep title text left aligned.
- Use official `assets/micron-logo-white-tm-rgb.png` if present; otherwise omit logo.
- Use one visual protagonist: wafer object, diagonal band, grain field, wave field, or screen stack.
- Do not include template labels in visible slide content.

## Template pool

| Template | Use when | Visual recipe |
|---|---|---|
| `wafer-hero` | Strategy, launch, technical overview | Black field, left title block, right wafer/semiconductor object, quiet radial purple/blue glow |
| `divider-band` | Fast update, sober status, internal briefing | Dark blue/black field, large diagonal gradient band from lower right, strong left title |
| `grain-wave` | Research, data, infrastructure | Subtle noise/grain field, left black readability overlay, cyan/purple energy on right |
| `silk-wave` | Transformation, architecture, premium keynote | Flowing ribbon or wave across right side, black overlay behind copy |
| `purple-silk` | High-energy milestone | `silk-wave` variant with stronger `#BD03F7`; use sparingly |
| `screen-stack` | Product demo, workflow walkthrough | Stacked interface cards on right using real workflow labels, left title block |

## Selection

- If the user names a title template, use it.
- If topic strongly implies a template, choose that template.
- If there is no direction, vary selection across decks.
- Prefer CSS/SVG/canvas built inside the single HTML file.
- Use Three.js only when title motion carries the slide and the deck can depend on CDN runtime.

## Title anatomy

- Logo: official white Micron logo when available.
- Eyebrow: audience, section, or topic label.
- H1: 56-72px at 16:9 desktop, max two lines.
- Subtitle: 20-26px, max two lines.
- Accent: one short purple line or one active glow.
- Footer note: useful metadata only, such as audience, date, program, or confidentiality.

## Reusable CSS tokens

```css
:root {
  --black: #000000;
  --white: #ffffff;
  --gray-a: #262626;
  --gray-c: #8c8c8c;
  --gray-d: #bfbfbf;
  --gray-e: #e6e6e6;
  --purple: #bd03f7;
  --purple-b: #ff8cff;
  --blue: #2044ff;
  --cyan: #32c8ff;
  --radius: 8px;
}

.title-copy {
  position: relative;
  z-index: 3;
  max-width: 760px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.accent-line {
  width: 84px;
  height: 7px;
  margin-top: 28px;
  border-radius: 999px;
  background: var(--purple);
}
```

## Screen-stack snippet

```html
<div class="screen-stack" aria-hidden="true">
  <div class="screen-card">
    <div class="screen-topbar">Workflow preview</div>
    <div class="screen-row"><strong>Input</strong><span>Real user task</span></div>
    <div class="screen-row"><strong>Gate</strong><span>Review / approve</span></div>
    <div class="screen-row"><strong>Output</strong><span>Trusted result</span></div>
  </div>
</div>
```

Keep snippet labels tied to the actual deck topic. Do not use fake metrics.
```

- [ ] **Step 2: Verify file exists**

Run:

```bash
test -f .agents/skills/micron-html-slides/references/micron-engineering-title-templates.md
```

Expected: command exits `0`.

- [ ] **Step 3: Commit title-template reference**

Run:

```bash
git add .agents/skills/micron-html-slides/references/micron-engineering-title-templates.md
git commit -m "docs: add micron title template reference"
```

Expected: commit succeeds.

---

### Task 2: Update Skill Entrypoint

**Files:**
- Modify: `.agents/skills/micron-html-slides/SKILL.md`

- [ ] **Step 1: Replace demo-dependent defaults**

In `.agents/skills/micron-html-slides/SKILL.md`, replace the `## Defaults` bullets with:

```markdown
## Defaults

- Default to Micron dark engineering when theme is unspecified.
- Use Micron dark engineering as a visual language, not as a fixed layout system.
- Use Micron light only when the user explicitly asks for light/white slides or the deck is mainly print-style data tables.
- Use Micron dark only when requested or when content clearly needs dark mode.
- For practical technical or engineering decks in Micron dark, use the engineering dark style reference.
- For a new Micron dark engineering deck, pick or adapt one title template from `references/micron-engineering-title-templates.md` unless the user names a specific title direction.
- Content slides should be custom to the topic. Do not reuse fixed demo layouts by default.
- If the user asks for `.pptx`, PowerPoint, or editable Office output, use `micron-pptx-slides` instead of generating HTML first.
- Ask only when theme/template choice changes the outcome materially.
- Confirm HTML only vs HTML plus PDF when delivery is unclear.
```

- [ ] **Step 2: Update read-first table**

In the `Read First` table:

Replace:

```markdown
| Dark engineering style and title templates | `references/micron-engineering-dark.md` |
| Demo-matched dark engineering fidelity | `references/micron-engineering-demo-fidelity.md` |
```

With:

```markdown
| Dark engineering style | `references/micron-engineering-dark.md` |
| Dark engineering title templates | `references/micron-engineering-title-templates.md` |
```

- [ ] **Step 3: Replace demo-matched non-negotiable**

Replace:

```markdown
- Use full `viewport-base.css` for light/simple decks. For demo-matched dark engineering decks, start from the fixed 1600x900 stage runtime in `micron_engineering_slide_demo_d_3.html`, not the generic fluid HTML skeleton.
```

With:

```markdown
- Use full `viewport-base.css` for light/simple decks. For Micron dark engineering decks, choose the runtime model that best fits the content while preserving navigation, fit, and verification requirements.
```

- [ ] **Step 4: Replace Micron dark engineering theme rules**

Replace the entire `Micron dark engineering:` bullet list with:

```markdown
Micron dark engineering:

- Read `references/micron-dark-design.md` first, then `references/micron-engineering-dark.md`.
- For title slides, also read `references/micron-engineering-title-templates.md`.
- Treat Micron dark engineering as a visual language: black canvas, precise grid, strong hierarchy, dark panels, restrained purple/cyan accents, and useful technical visuals.
- Do not read or depend on `micron_engineering_slide_demo_d_3.html`.
- Do not use demo-matched content layouts. Content slides should be custom to the topic and message.
- Use a black engineering canvas, crisp typography, purposeful contrast, and one visual protagonist per slide.
- Avoid generic AI slide tropes: random neon blobs, decorative bento grids, fake dashboards, and meaningless visual noise.
```

- [ ] **Step 5: Replace workflow demo step**

Replace workflow steps 3-8 with:

```markdown
3. Read relevant design reference plus runtime checklist.
4. If using dark engineering, read `references/micron-engineering-dark.md`; read `references/micron-engineering-title-templates.md` only for title slide direction.
5. Build outline from user content.
6. Add slide 1 as a title page with title, short subtitle, optional audience/date/source note, and a suitable Micron title treatment.
7. Put the requested explanatory/content material after the title page.
8. Define deck system: title treatment, background, type, rhythm, visual protagonists, and approved runtime tech. Make content layouts custom to the topic.
```

- [ ] **Step 6: Verify no demo references in entrypoint**

Run:

```bash
rg -n "micron_engineering_slide_demo_d_3|demo-matched|micron-engineering-demo-fidelity|visual source of truth|demo stage" .agents/skills/micron-html-slides/SKILL.md
```

Expected: no output and exit code `1`.

- [ ] **Step 7: Commit entrypoint update**

Run:

```bash
git add .agents/skills/micron-html-slides/SKILL.md
git commit -m "docs: decouple micron slide skill from demo file"
```

Expected: commit succeeds.

---

### Task 3: Rewrite Dark Engineering Reference Around Principles

**Files:**
- Modify: `.agents/skills/micron-html-slides/references/micron-engineering-dark.md`

- [ ] **Step 1: Replace opening and demo contract**

Replace everything from the top of `.agents/skills/micron-html-slides/references/micron-engineering-dark.md` through the paragraph ending `fully fluid light layout.` with:

```markdown
# Micron engineering dark style

Use this after `micron-dark-design.md` when creating practical Micron dark decks
for engineering reviews, rollout updates, process sharing, system architecture,
data pipelines, technical launches, training, or product demos.

This file defines visual principles for content slides. It is not a fixed layout
template and does not depend on `micron_engineering_slide_demo_d_3.html`.

For title-slide recipes, read `micron-engineering-title-templates.md`.

## Core contract

Make production-grade technical slides, not generic generated UI.

- Black primary field with restrained blue/purple/cyan energy.
- Precise alignment, strong reading order, and enough negative space.
- Left-aligned text by default, sentence case headings, compact labels, useful chrome.
- Dark panels with 8px radius, subtle borders, inset highlights, and deep shadows.
- One accent role per slide: active gate, key metric, selected node, or current phase.
- One visual protagonist per slide: diagram, object, timeline, comparison, quote, chart, workflow, screenshot, or generated visual.
- Content layout is chosen per topic. Do not reuse fixed process boards, dashboard grids, or demo-like topbar patterns by default.
- Avoid random blobs, filler icons, fake stats, fake product screenshots, and decorative bento cards.

## Runtime preference

Keep the canonical slide runtime from `frontend-slides-architecture.md`.
Use one no-build HTML file. Authored CSS and JS stay inline.

Choose the stage model based on content:

- Use fluid viewport layouts for editorial explainers, simple visual stories, and responsive decks.
- Use fixed 16:9 stage layouts for dense presentation-native boards or precise diagrams.
- Use full-bleed layouts for title, closing, object-focused, or image-led moments.
- Preserve keyboard, wheel, touch/swipe, nav dots, progress bar, and ESC overview.
```

- [ ] **Step 2: Replace title template picker section**

Replace the full `## Title template picker` section through the end of `Title anatomy` with:

```markdown
## Title templates

Title templates live in `micron-engineering-title-templates.md`.

- Use title templates for title slides, section dividers, or closing moments.
- Do not use title templates as default content-slide layouts.
- Vary title treatment across generated decks unless the user names a specific direction.
- Do not include visible template labels in generated decks.
```

- [ ] **Step 3: Replace content layout preferences section**

Replace the full `## Content layout preferences` section through `Avoid a white two-column handout layout unless the user explicitly asks for light.` with:

```markdown
## Content slide principles

Content slides are freeform per topic. Do not start from a fixed pattern unless
the user asks for a specific layout.

Before designing each content slide, decide:

- What is the single message?
- What visual protagonist best explains it?
- What can be removed?
- What should purple highlight?
- What should cyan indicate?
- Does the slide need a dense fixed stage, a fluid editorial layout, or a full-bleed visual?

Use layout families only as mental prompts, not templates:

- Comparison: before/after, tradeoff, current/future, risk/control.
- Flow: system, process, data, handoff, dependency, journey.
- Evidence: chart, table, metric, source excerpt, test result.
- Narrative: quote, statement, object spotlight, sequence, closing.
- Tool: dashboard, checklist, SOP, action tracker, command board.

Each generated deck with five or more slides should include at least two clearly
different content compositions.
```

- [ ] **Step 4: Replace demo vocabulary paragraph**

Replace:

```markdown
Also preserve the demo vocabulary when useful:

- `.topbar`, `.section-label`, `.subtitle`, `.accent-line`
- `.card`, `.card.white`, `.card.accented`, `.status`, `.metric`
- `.process-board`, `.process-map`, `.process-control`
- `.timeline`, `.timeline-status`, `.timeline-board`
- `.change-board`, `.change-panel`, `.change-bridge`
- `.screen-swap-stage`, `.screen-swap-card`, `.screen-kpis`
```

With:

```markdown
Use component vocabulary only when it fits the content:

- `.section-label`, `.subtitle`, `.accent-line`
- `.engineering-card`, `.status`, `.metric`
- `.visual-field`, `.diagram-field`, `.comparison-field`
- `.timeline-item`, `.source-note`, `.callout`
- `.screen-frame`, `.workflow-node`, `.evidence-row`
```

- [ ] **Step 5: Update quality gates**

In `## Quality gates`, replace:

```markdown
- No visible title-option labels left from the demo.
```

With:

```markdown
- No visible template labels or copied demo wording.
- Content slides do not repeat one layout structure across the whole deck.
```

- [ ] **Step 6: Verify no demo coupling in engineering reference**

Run:

```bash
rg -n "Source preference|Demo fidelity|local demo|demo's|demo-native|micron_engineering_slide_demo_d_3|process-control panel|fixed-stage shell" .agents/skills/micron-html-slides/references/micron-engineering-dark.md
```

Expected: no output and exit code `1`.

- [ ] **Step 7: Commit engineering reference update**

Run:

```bash
git add .agents/skills/micron-html-slides/references/micron-engineering-dark.md
git commit -m "docs: make micron dark guidance principles-only"
```

Expected: commit succeeds.

---

### Task 4: Remove Demo-Matched Mode References

**Files:**
- Modify: `.agents/skills/micron-html-slides/references/frontend-slides-architecture.md`
- Modify: `.agents/skills/micron-html-slides/references/verification.md`
- Delete: `.agents/skills/micron-html-slides/references/micron-engineering-demo-fidelity.md`

- [ ] **Step 1: Replace frontend architecture demo exception**

In `.agents/skills/micron-html-slides/references/frontend-slides-architecture.md`, replace the entire `## Demo-matched engineering exception` section with:

```markdown
## Micron dark engineering runtime choice

For Micron dark engineering decks, choose the runtime model that best fits the
content instead of matching a demo file.

- Keep `.slide { width: 100vw; height: 100vh; height: 100dvh; overflow: hidden; scroll-snap-align: start; }`.
- Use the generic fluid `.slide-content` model for editorial, training, and simple explainer decks.
- Use a fixed 16:9 stage only when precise presentation geometry is useful for dense boards, diagrams, or title visuals.
- When using a fixed stage, set scale from `min(1, window.innerWidth / stageWidth, window.innerHeight / stageHeight)`.
- Preserve the same `SlidePresentation` controller, nav dots, progress bar, touch/wheel/keyboard nav, and ESC overview.
- Do not use fixed-stage mode as a reason to copy a previous content layout.
```

- [ ] **Step 2: Replace verification demo note**

In `.agents/skills/micron-html-slides/references/verification.md`, replace:

```markdown
- For demo-matched dark engineering decks, transformed 1600x900 stages are valid; verify visual fit, not raw unscaled scroll dimensions.
```

With:

```markdown
- For fixed-stage dark engineering decks, transformed 16:9 stages are valid; verify visual fit, not raw unscaled scroll dimensions.
```

- [ ] **Step 3: Delete demo-fidelity reference doc**

Run:

```bash
rm -f .agents/skills/micron-html-slides/references/micron-engineering-demo-fidelity.md
```

Expected: file no longer exists.

- [ ] **Step 4: Verify obsolete references are gone from skill docs**

Run:

```bash
rg -n "micron-engineering-demo-fidelity|demo-matched|Demo-matched|Demo fidelity|micron_engineering_slide_demo_d_3|local demo|visual source of truth" .agents/skills/micron-html-slides
```

Expected: no output and exit code `1`.

- [ ] **Step 5: Commit cleanup**

Run:

```bash
git add .agents/skills/micron-html-slides/references/frontend-slides-architecture.md .agents/skills/micron-html-slides/references/verification.md
git add -u .agents/skills/micron-html-slides/references/micron-engineering-demo-fidelity.md
git commit -m "docs: remove micron demo matched mode"
```

Expected: commit succeeds.

---

### Task 5: Add Final Validation Notes

**Files:**
- Modify: `.agents/skills/micron-html-slides/references/micron-engineering-dark.md`

- [ ] **Step 1: Add anti-repetition guardrail**

Append this subsection before `## React Flow diagram rules`:

```markdown
## Anti-repetition guardrails

When generating a new deck:

- Do not reuse the same hero/content split on every deck.
- Do not make every content slide a topbar plus card grid.
- Do not use process boards, dashboards, or timelines unless the topic calls for them.
- Do not invent data to make a dashboard look real.
- Prefer one strong custom visual over many small decorative panels.
- For decks with five or more slides, make the slide set visually varied enough that thumbnails are distinguishable at a glance.
```

- [ ] **Step 2: Run final reference scan**

Run:

```bash
rg -n "micron_engineering_slide_demo_d_3|demo-matched|micron-engineering-demo-fidelity|local demo|visual source of truth|demo-native" .agents/skills/micron-html-slides
```

Expected: no output and exit code `1`.

- [ ] **Step 3: Confirm title template reference is linked**

Run:

```bash
rg -n "micron-engineering-title-templates.md" .agents/skills/micron-html-slides/SKILL.md .agents/skills/micron-html-slides/references/micron-engineering-dark.md
```

Expected output includes both files.

- [ ] **Step 4: Commit final guardrails**

Run:

```bash
git add .agents/skills/micron-html-slides/references/micron-engineering-dark.md
git commit -m "docs: add micron dark anti repetition guardrails"
```

Expected: commit succeeds.

---

### Task 6: Manual Acceptance Check

**Files:**
- Read-only validation across `.agents/skills/micron-html-slides`

- [ ] **Step 1: Check success criteria manually**

Read these files:

```bash
sed -n '1,130p' .agents/skills/micron-html-slides/SKILL.md
sed -n '1,220p' .agents/skills/micron-html-slides/references/micron-engineering-dark.md
sed -n '1,220p' .agents/skills/micron-html-slides/references/micron-engineering-title-templates.md
```

Expected:

- `SKILL.md` does not mention the demo HTML file.
- `micron-engineering-dark.md` guides content slides by principles, not fixed layouts.
- `micron-engineering-title-templates.md` contains title recipes independent of the demo file.

- [ ] **Step 2: Check git status**

Run:

```bash
git status --short
```

Expected: no uncommitted changes from this implementation plan except unrelated pre-existing user changes.

- [ ] **Step 3: Final summary**

Report:

```text
Implemented docs-only skill refactor.
Demo HTML file is no longer referenced by micron-html-slides skill docs.
Title templates now live in micron-engineering-title-templates.md.
Content-slide guidance is principles-only and freeform per topic.
```

Do not delete `micron_engineering_slide_demo_d_3.html`.

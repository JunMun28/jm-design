---
name: slide-quick
description: Fast slide path — editable PPTX in ~15 minutes with 2 user replies. Use when the user asks for a quick/simple deck, an internal or training deck with PPTX/PDF delivery, says "quick slides", or invokes /slide-quick. NOT for executive/investor/persuasion/brand-locked (Micron) decks or HTML delivery — route those to slide-brainstorm + html-slides.
---

# Slide Quick

One skill, one pass: intake → outline → consultant review → wireframe →
native PPTX. No HTML intermediate, no conversion, no theme server, no
reviewer subagents (except the single consultant pass).

**First turn, always:** state the path and the exit:
"Using the quick path (~15 min). Say 'full pipeline' for the rigorous one
(executive/persuasion decks, HTML delivery, designed themes)."

Route OUT to the full pipeline when: executive/investor/board audience,
persuasion or high-stakes decision deck, Micron branding, HTML delivery,
or the user asks for rigor. To route out, do not build here — invoke
slide-brainstorm (Skill tool) and tell the user you are switching to the
full pipeline because <reason>.

## Flow (Targets 2 user replies (intake + wireframe approval); wireframe edits add more)

```
- [ ] 1. Intake — ONE batched question (or zero with prefs/skip)
- [ ] 2. Outline (no user gate)
- [ ] 3. slide-consultant pass (improve mode, on the outline)
- [ ] 4. Wireframe HTML → user approval (reply #2)
- [ ] 5. Build native PPTX → QA-lite → deliver
```

### 1 · Intake

Read the topic/content first. Derive recommendations, then ask ONE
`AskUserQuestion` call (≤4 questions), every recommendation pre-marked:

1. Audience + goal (one combined question; guess from the topic)
2. Slide count — recommend from this heuristic:
   | Source | Slides |
   |---|---|
   | bare topic / <1000 words | 5–8 |
   | 1000–3000 words | 8–14 |
   | >3000 words | 12–18 (suggest splitting beyond) |
3. Theme: 1. midnight (dark) · 2. light (clean corporate)
4. Delivery: 1. PPTX · 2. PPTX + PDF

**Skip rules (baoyu policy):** if the user said "just make it", "use
defaults", or equivalent — skip intake, state the assumed
audience/count/theme/delivery in the next message, and proceed.
`skip_intake:true` means proceed with no questions — use audience_default
(or infer from topic), the slide-count heuristic, and theme/delivery from
PREFS (falling back to midnight/pptx). State all assumed values in the
next message before proceeding. If `PREFS.md` exists in this skill
directory, its values replace the matching questions (ask only what it
doesn't cover).

`PREFS.md` schema (user-created, all keys optional):

```markdown
theme: midnight | light
delivery: pptx | pptx+pdf
audience_default: <free text>
language: en | zh | ...
skip_intake: true | false
```

### 2 · Outline

Draft a table — one row per slide:
`# | action title (full-sentence claim, ≤12 words) | layout | key points`.
Choose layouts from content shape (comparison → two panels; sequence/
mechanism → node diagram; evidence → table/big number; code → code panel).
Do not show this to the user yet.

### 3 · Consultant pass

Invoke `slide-consultant` (Skill tool) in **improve** mode on the outline.
Pass the outline table inline as text (it is not yet saved to a file);
apply the rewritten table it returns. This is the only quality gate — do
not add others.

Per-slide checks (details in `../slide-consultant/references/frameworks.md`):
Pyramid, SCQA, Action titles + skim test, One message, So-what, MECE,
Evidence honesty, Chart & number integrity, Comparison integrity.

### 4 · Wireframe

Copy `../slide-brainstorm/references/wireframe-skeleton.html` and fill it:
one `article.slide-panel` per slide — number, action title, layout label,
gray `[visual]` boxes, 2–4 bullets. Save to
`docs/brainstorms/YYYY-MM-DD-<topic>-wireframe.html`. Keep it dumb: no JS,
no CDN, no previews, no screenshots.

Show the user the path + the outline table in chat. Ask: "Reply 'go' to
build, or tell me what to change." Patch edits into the wireframe; do not
re-run the flow.

### 5 · Build (native PptxGenJS)

Write a per-deck build script modeled on `templates/example-build.js`,
using `templates/builder.js` + `templates/themes.js`. Save it next to the
output (e.g. `decks/<topic>/build.js`); output `decks/<topic>/<topic>.pptx`.
Run from the repo root so `pptxgenjs` resolves.

Rules:
- Slide 1 is a title slide. Diagrams are real shapes. Code ≤10 lines,
  Consolas. Unsourced numbers get a visible "ILLUSTRATIVE" tag.
- **Use the layout rail, do not hand-pick `y` coordinates.** Route every
  content slide's blocks through `B.cursor()` and every cover/section (hero)
  slide through `B.heroLayout([...])` (see `templates/example-build.js`).
  `cursor.take(h, gap, label)` returns the block top and **throws a build
  error** the moment a block's bottom would cross `CONTENT_MAX_Y` (6.70"),
  so footer overlap / off-slide content fails the *build* instead of slipping
  through to the QA render pass. `heroLayout` budget-centers the whole block
  stack on the canvas. If a slide overflows, reduce a block height, trim a gap,
  or split the slide — never raise the rail.
- **Make it look designed, not "just boxes."** Read
  `references/visual-playbook.md` and apply it: one action title + one real
  visual per slide; reach for icons / a diagram / an image-led layout over flat
  panels + bullets; keep ~20–25% whitespace; honor the type floors (title ≥32pt,
  body ≥20pt, caption ≥14pt); use a 3-colour 60-30-10 palette with AA contrast;
  write copy with concrete numbers and a clear "so what".
- Honor PptxGenJS pitfalls — read `../pptx/pptxgenjs.md` before writing
  the script (no "#" hex, no 8-char hex, fresh option objects, no
  negative shadow offsets).
- PDF delivery: convert with
  `python3 ../pptx/scripts/office/soffice.py --headless --convert-to pdf <file>.pptx`.

### QA-lite (main agent, no subagent)

1. Render: soffice → pdf → `pdftoppm -jpeg -r 130`.
2. Inspect the rendered per-page JPEGs yourself against this checklist:
   overlap, clipped text, text touching panel edges, low contrast,
   misaligned columns, arrows missing targets. PLUS the visual-playbook bar:
   each slide has one real visual (not just boxes/bullets), type floors met
   (title ≥32pt, body ≥20pt), ~20–25% whitespace, a 3-colour palette, and a
   "so what" title. A slide that is only a titled box of bullets fails.
3. Report findings as a **severity table + root cause**, not prose. Use the
   format in `../html-to-pptx/references/audit-table-template.md`: a
   `| Slide | Issue | Severity 🔴🟠🟡🟢 |` table, then a **Root causes**
   paragraph naming the 2–3 systemic causes ("fix the rule, not slide 5 alone").
   Note: the cursor rail (Build step) should already have caught footer overlap
   / off-slide content at build time — a 🔴 overflow here means a slide bypassed
   the rail, so fix the build script, not the pixels.
4. Fix and re-render once if needed. Stop after one fix cycle unless
   something is still broken.
5. `--strict` (user asked for extra checking): spawn one visual-QA
   subagent with the rendered per-page JPEGs, fix P0/P1 only.

### Deliver

Send the .pptx (and PDF) with SendUserFile. Report: file path, theme,
slide count, consultant change count, what to say to iterate
("change slide N", "switch theme", "full pipeline").

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
or the user asks for rigor.

## Flow (2 user replies total)

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
audience/count/theme/delivery in the next message, and proceed. If
`PREFS.md` exists in this skill directory, its values replace the
matching questions (ask only what it doesn't cover).

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
Apply its rewrites. This is the only quality gate — do not add others.

### 4 · Wireframe

Copy `../slide-brainstorm/references/wireframe-skeleton.html` and fill it:
one `.wf-slide` per slide — number, action title, layout label, gray
`[visual]` boxes, 2–4 bullets. Save to
`docs/brainstorms/YYYY-MM-DD-<topic>-wireframe.html`. Keep it dumb: no JS,
no CDN, no previews, no screenshots.

Show the user the path + the outline table in chat. Ask: "Reply 'go' to
build, or tell me what to change." Patch edits into the wireframe; do not
re-run the flow.

### 5 · Build (native PptxGenJS)

Write a per-deck build script modeled on `templates/example-build.js`,
using `templates/builder.js` + `templates/themes.js`. Save it next to the
output (e.g. `decks/<topic>/build.js`); output `decks/<topic>/<topic>.pptx`.
Run from the repo root so `pptxgenjs`/`sharp` resolve.

Rules:
- Slide 1 is a title slide. Diagrams are real shapes. Code ≤10 lines,
  Consolas. Unsourced numbers get a visible "ILLUSTRATIVE" tag.
- Honor PptxGenJS pitfalls — read `../pptx/pptxgenjs.md` before writing
  the script (no "#" hex, no 8-char hex, fresh option objects, no
  negative shadow offsets).
- PDF delivery: convert with
  `python3 ../pptx/scripts/office/soffice.py --headless --convert-to pdf <file>.pptx`.

### QA-lite (main agent, no subagent)

1. Render: soffice → pdf → `pdftoppm -jpeg -r 130`.
2. Inspect the montage yourself against this checklist: overlap, clipped
   text, text touching panel edges, low contrast, misaligned columns,
   arrows missing targets.
3. Fix and re-render once if needed. Stop after one fix cycle unless
   something is still broken.
4. `--strict` (user asked for extra checking): spawn one visual-QA
   subagent with the montage, fix P0/P1 only.

### Deliver

Send the .pptx (and PDF) with SendUserFile. Report: file path, theme,
slide count, consultant change count, what to say to iterate
("change slide N", "switch theme", "full pipeline").

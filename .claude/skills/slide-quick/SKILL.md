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
3. Theme: 1. midnight (dark) · 2. light (clean corporate) · 3. playful
   (warm cream, bold color blocks — friendly/energetic, not corporate)
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
theme: midnight | light | playful
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
- **Make it look designed, not "just boxes."** Read
  `references/visual-playbook.md` and apply it: one action title + one real
  visual per slide; reach for icons / a diagram / an image-led layout over flat
  panels + bullets; keep ~20–25% whitespace; honor the type floors (title ≥32pt,
  body ≥20pt, caption ≥14pt); use a 3-colour 60-30-10 palette with AA contrast;
  write copy with concrete numbers and a clear "so what".
- **Evidence slides lead with the number, not bullets.** For any data/metric
  slide use the big-number exhibit helpers — `B.stat(...)` (hero value + label +
  colored delta) or `B.statBand(...)` (2–4 KPIs, hairline dividers, NO card
  chrome — a row of bordered cards is the AI-slop tell). The number is the
  protagonist; a bulleted list of figures is a fail.
- **Trends and comparisons get a real chart, not a faked one.** For a series
  over time or across categories use `B.chart(s, 'col'|'bar'|'line', series, opts)`
  — a real, editable PptxGenJS chart with the chartjunk stripped (no title, no
  gridlines, hidden value axis, labels on the data, ONE accent series/bar with the
  rest muted; Knaflic declutter). `'col'` = vertical, `'bar'` = horizontal ranking,
  `'line'` = trend; `opts.highlight` is the index to accent. Never paste a chart
  image or fake a chart with shapes/bars-as-rectangles.
- **Comparisons get a decision matrix, never two panels of bullets.** For "which
  option / how do these stack up" use `B.compareTable(s, y, {options, rows,
  highlight})` — options across the top, criteria down the side (4–8), hairline
  row rules only, the recommended column accented. Cells are short: a 1–3 word
  string, `"✓"`/`"—"`, or a **number 0–4** rendered as a `B.harvey` ball (the
  Big-Three "how good" ideogram). Keep the matrix honest — the recommended option
  need not win every row. Two bordered panels of three bullets each is the slop tell.
- **Plans / roadmaps get a timeline, not a row of boxes.** For phases over time use
  `B.timeline(s, y, items, {current})` — one horizontal axis, circular markers, a date
  above + phase + one line below each (3–6 nodes). `current` accents the axis/markers
  up to "you are here" to show progress; later nodes are hollow. Keep node copy to one
  short line; let the axis carry the story.
- **Concepts get real icons, never flat boxes or emoji.** The engine ships a
  vendored Tabler set (`assets/icons/`, MIT). Load once at the top of the build —
  `const I = await B.loadIcons(["bolt","shield","target"])` (tinted to the accent)
  — then place with `B.icon(s, I.bolt, x, y, size)` or, for a "3–4 pillars" slide,
  `B.iconRow(s, y, [{icon:I.bolt,label,body}, …])`. `iconRow` is deliberately
  chrome-less; a row of equal bordered cards is the slop tell. Add more icons by
  dropping the outline SVG into `assets/icons/`. (The build script must be `async`
  to await `loadIcons` — see `templates/example-build.js`.)
- **Vary the composition — not every slide is full-width stacked.** For a slide
  whose point is carried by one exhibit, use `B.split(s, {kicker, title, body,
  side, ratioText})` — it lays the narrative in a LEFT column and returns the
  visual-zone rect for the RIGHT (Western reading gravity: claim first, proof
  where the eye settles). Drop a chart/icon/stat into the zone, e.g.
  `const z = B.split(s, {...}); B.chart(s, 'col', data, {x:z.x, y:z.y, w:z.w, h:z.h})`.
  Set `side:'left'` to flip the visual to the left for variety across the deck.
- **Playful theme is a DISTINCT mode, not a recolour.** When the theme is
  `playful`, lead with the block primitives — `B.solidKicker` (filled pill, white
  text), `B.block` (solid saturated rounded block), and `B.blockRow` (bold
  multi-colour blocks with white icon + heading + line, the playful "pillars"
  exhibit) — plus big friendly titles and flat solid accent circles bleeding off a
  corner. Do NOT just feed the warm palette into the premium hairline layouts; that
  is the recolour trap. Block text is white and the fills are deep enough to clear
  AA. Model it on `templates/example-playful.js`. (Premium themes keep the hairline
  panel/kicker look; never mix the two in one deck.)
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
3. Fix and re-render once if needed. Stop after one fix cycle unless
   something is still broken.
4. `--strict` (user asked for extra checking): spawn one visual-QA
   subagent with the rendered per-page JPEGs, fix P0/P1 only.

### Deliver

Send the .pptx (and PDF) with SendUserFile. Report: file path, theme,
slide count, consultant change count, what to say to iterate
("change slide N", "switch theme", "full pipeline").

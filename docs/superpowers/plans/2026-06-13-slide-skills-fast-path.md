# Slide Skills Fast Path Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a ≤15-minute slide fast path (`slide-quick` + `slide-consultant`), merge `slide-layout-designer` into `slide-brainstorm`, and lighten the brainstorm artifact to wireframe fidelity.

**Architecture:** Two new self-contained skills under `.claude/skills/`. `slide-quick` owns a native PptxGenJS template library (ported from `decks/native-build/build.js`) and calls `slide-consultant` once. The full pipeline keeps all content-rigor gates but renders its brainstorm artifact as a low-fi wireframe. One canonical wireframe skeleton lives in `slide-brainstorm/references/` and is shared by both paths.

**Tech Stack:** Markdown skills, PptxGenJS (repo-root `node_modules`), sharp (glow PNGs), LibreOffice + pdftoppm (render QA), python-pptx + Pillow via `uv run` (validation).

**Spec:** `docs/superpowers/specs/2026-06-13-slide-skills-fast-path-design.md`

**⚠️ Commit policy:** The repo owner's rule is "never commit unless asked." At execution start, ask the user once: "Commit after each task, or skip commits?" If they say skip, skip every commit step below.

---

## File Structure

```
.claude/skills/
├── slide-consultant/                    NEW
│   ├── SKILL.md                         reviewer skill: modes, process, output contracts
│   └── references/frameworks.md         Pyramid/SCQA/MECE/action-title guidance + examples
├── slide-quick/                         NEW
│   ├── SKILL.md                         fast path: intake → outline → consultant → wireframe → build
│   ├── templates/builder.js             theme-agnostic PptxGenJS helper library
│   ├── templates/themes.js              midnight + light theme token objects
│   ├── templates/example-build.js       4-slide sample build (doubles as smoke test)
│   ├── scripts/gen-glows.js             regenerates glow PNGs
│   └── assets/glow-{cyan,magenta,teal}.png   copied from decks/native-build/assets/
├── slide-brainstorm/                    CHANGED
│   ├── SKILL.md                         wireframe-fidelity rules; routing note; updated refs
│   └── references/
│       ├── wireframe-skeleton.html      NEW canonical low-fi skeleton (shared)
│       ├── html-companion-skeleton.html DELETED
│       ├── layout-blueprint.md          NEW (adapted from slide-layout-designer/SKILL.md)
│       ├── archetypes.md                MOVED from slide-layout-designer/references/
│       ├── lora-reference.md            MOVED from slide-layout-designer/references/
│       ├── template.md                  CHANGED (Layout Fidelity → Wireframe Fidelity)
│       └── subagent-review-verifier.md  CHANGED (fidelity checks reworded)
├── slide-layout-designer/               DELETED entirely
└── html-slides/SKILL.md                 CHANGED (pointers + routing note)
```

---

### Task 1: `slide-consultant` skill

**Files:**
- Create: `.claude/skills/slide-consultant/SKILL.md`
- Create: `.claude/skills/slide-consultant/references/frameworks.md`

- [ ] **Step 1: Create the skill directory and SKILL.md**

Write `.claude/skills/slide-consultant/SKILL.md` with exactly this content:

````markdown
---
name: slide-consultant
description: McKinsey-grade slide content reviewer. Reviews and improves slide copy using Pyramid Principle, SCQA, MECE, and action-title discipline. Use when the user asks to "review my slides", "improve slide copy", "consultant review", "make titles stronger", or when slide-quick auto-invokes it. Works on outlines, wireframe HTML, deck HTML, or .pptx files.
---

# Slide Consultant

Review and improve slide content copy like a top-tier consulting reviewer.
Scope: **content and copy only** — storyline, titles, grouping, evidence.
Visual design is out of scope (that belongs to the build skills).

## Modes

| Mode | Behavior | Output |
|---|---|---|
| `improve` (default for slide-quick) | Rewrite copy in place | Changed artifact + change log |
| `review` | No edits | Findings list: severity, slide #, issue, why, fix |

If the user does not name a mode: standalone invocation defaults to `review`;
being called by another skill defaults to what that skill asked for.

## Accepted inputs

- Outline markdown (`# | title | layout | key points` table)
- Wireframe or deck HTML (read the file)
- `.pptx` — extract text first: `python3 -m markitdown <file>.pptx`

## Process

1. Read the artifact. List every slide title in order.
2. **Storyline check (horizontal logic):** read titles alone, in order. They
   must retell the full argument with no gaps and no duplicate claims. For
   decision decks, the recommendation must appear by slide 2.
3. **Per-slide checks**, in this order (details + examples in
   `references/frameworks.md`):
   - Action title: full-sentence claim someone could dispute, ≤12 words.
     Data slides carry the key number in the title.
   - One message per slide; body argues the title, nothing else.
   - So-what test: if the slide vanished, would the argument miss it?
   - MECE grouping: one cutting dimension, 2–5 items, no overlap, one
     rhetorical type per list.
   - Pyramid: answer first, support below. SCQA across the opening slides.
   - Evidence honesty: every number/quote traced or labeled "Illustrative".
     NEVER invent a stat, quote, or source to strengthen copy.
4. Output per mode (formats below).

## Output contracts

`review` mode — findings list, most severe first:

```
P1 · Slide 4 · Title is a label ("Architecture"), not a claim.
Why: a reader skimming titles loses the argument here.
Fix: "Three services share one queue — the queue is the bottleneck."
```

Severity: P0 fabricated/contradictory content · P1 storyline breaks,
uninterpretable slide · P2 weak but understandable · P3 polish.

`improve` mode — apply the fixes directly to the artifact (Edit the file, or
return the rewritten outline if given inline), then a short change log:

```
CHANGES
- S4 title: label → claim ("Three services share one queue…")
- S7: merged bullet 3 into 2 (overlap); now 4 MECE items
- S9: marked unsourced "40%" as Illustrative
```

## Hard rules

- Never invent facts, numbers, quotes, or sources. If evidence is missing,
  reframe the claim or label it.
- Never change the user's meaning — sharpen, don't redirect.
- Keep the user's language (English copy stays English, etc.).
- In `improve` mode on a file, edit the file; do not just describe edits.
````

- [ ] **Step 2: Create references/frameworks.md**

Write `.claude/skills/slide-consultant/references/frameworks.md` with exactly this content:

````markdown
# Consulting Frameworks for Slide Copy

## Pyramid Principle (Minto)

Answer first, then grouped support. The deck states its conclusion early
(slide 2–3), each slide states its point in the title, and the body holds
only the support for that point.

Bad: 5 evidence slides building to a conclusion on slide 9.
Good: conclusion on slide 2; slides 3–8 each prove one supporting pillar.

## SCQA opening

Slides 1–3 cover: **S**ituation (context nobody disputes),
**C**omplication (what changed / the problem), **A**nswer (the core
message). The Question is implicit. If slide 2 is still background, the
opening is too slow.

## Action titles + horizontal logic

Every content-slide title is a complete sentence making a disputable claim,
≤12 words, with a verb. Read ONLY the titles, in order — they must retell
the whole argument (the "skim test").

| Label (bad) | Claim (good) |
|---|---|
| Q3 results | Q3 revenue grew 18%, driven by the enterprise tier |
| Architecture | Three services share one queue — the queue is the bottleneck |
| Next steps | Approve the pilot now; results land in 6 weeks |

Title repair recipe: ask "what does this slide prove?" — write that
sentence; cut to ≤12 words; put the key number in if the slide shows data.

## One message per slide

A slide arguing two points becomes two slides. A body element that argues
something other than the title gets moved or cut.

## So-what test

For each slide ask: if it vanished, would the argument miss it? If no —
cut it or merge its one useful element into a neighbor.

## MECE grouping

Each group of bullets/cards/zones must:
- Name one cutting dimension ("4 risks, cut by failure mode").
- Hold 2–5 items, mutually exclusive, collectively exhaustive
  (use an explicit "Other"/"Out of scope" instead of silently dropping).
- Mix only one rhetorical type — all causes, all actions, or all findings,
  never a blend.

Quick test: if two items could swap half their content, the cut is wrong.

## Evidence honesty

Every numeral, quote, and named source traces to user-supplied material or
carries a visible "Illustrative" label. Strengthening copy by inventing
specifics is the one unforgivable edit.
````

- [ ] **Step 3: Verify the skill triggers and works (review mode)**

Run the consultant inline against an existing artifact:

```bash
python3 -m markitdown decks/what-is-an-ai-agent-native.pptx | head -50
```

Then apply the SKILL.md process to that extract (storyline check + per-slide
checks) and produce a `review`-mode findings list.

Expected: output follows the contract — each finding has severity, slide #,
issue, why, fix. The titles storyline check passes (that deck has action
titles), so findings should be P2/P3 only. If the output format diverges
from the contract, fix SKILL.md wording until an agent following it
produces the contract format.

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/slide-consultant/
git commit -m "feat: add slide-consultant skill (content copy reviewer)"
```

---

### Task 2: `slide-quick` assets and scaffolding

**Files:**
- Create: `.claude/skills/slide-quick/scripts/gen-glows.js`
- Create: `.claude/skills/slide-quick/assets/glow-cyan.png` (copied)
- Create: `.claude/skills/slide-quick/assets/glow-magenta.png` (copied)
- Create: `.claude/skills/slide-quick/assets/glow-teal.png` (copied)

- [ ] **Step 1: Create directories and copy the glow assets**

```bash
mkdir -p .claude/skills/slide-quick/{templates,scripts,assets}
cp decks/native-build/assets/glow-*.png .claude/skills/slide-quick/assets/
ls .claude/skills/slide-quick/assets/
```

Expected: `glow-cyan.png glow-magenta.png glow-teal.png`

- [ ] **Step 2: Write the glow regeneration script**

Write `.claude/skills/slide-quick/scripts/gen-glows.js`:

```js
/* Regenerate the soft radial-glow PNGs used by the midnight theme.
   PptxGenJS has no gradient fills; a transparent radial PNG is the
   sanctioned way to fake a glow. Run: node scripts/gen-glows.js */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const dir = path.join(__dirname, "..", "assets");
fs.mkdirSync(dir, { recursive: true });

function glow(name, rgb) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900">
    <defs><radialGradient id="g" cx="50%" cy="50%" r="50%">
      <stop offset="0%"  stop-color="rgb(${rgb})" stop-opacity="0.55"/>
      <stop offset="42%" stop-color="rgb(${rgb})" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="rgb(${rgb})" stop-opacity="0"/>
    </radialGradient></defs>
    <rect width="900" height="900" fill="url(#g)"/></svg>`;
  return sharp(Buffer.from(svg)).png().toFile(path.join(dir, `glow-${name}.png`));
}

Promise.all([
  glow("cyan", "0,210,255"),
  glow("magenta", "196,123,255"),
  glow("teal", "45,212,191"),
]).then(() => console.log("glow assets written to", dir));
```

- [ ] **Step 3: Verify the script runs (from repo root so sharp resolves)**

```bash
cd /Users/wongjunmun/development/ai-development/jm-design && node .claude/skills/slide-quick/scripts/gen-glows.js
```

Expected: `glow assets written to … /assets`

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/slide-quick/
git commit -m "feat: scaffold slide-quick assets (glow PNGs + generator)"
```

---

### Task 3: Native engine — builder, themes, smoke test (TDD)

**Files:**
- Create: `.claude/skills/slide-quick/templates/example-build.js` (the test)
- Create: `.claude/skills/slide-quick/templates/themes.js`
- Create: `.claude/skills/slide-quick/templates/builder.js`

- [ ] **Step 1: Write the failing test first — example-build.js**

This sample deck exercises every helper and doubles as the usage example
the skill points agents at. Write
`.claude/skills/slide-quick/templates/example-build.js`:

```js
/* Sample 4-slide deck exercising every builder helper.
   Usage: node example-build.js <out.pptx> <midnight|light> */
const pptxgen = require("pptxgenjs");
const { THEMES } = require("./themes");
const { createBuilder } = require("./builder");

const out = process.argv[2] || "sample.pptx";
const T = THEMES[process.argv[3] || "midnight"];
if (!T) { console.error("Unknown theme"); process.exit(1); }

const P = new pptxgen();
P.layout = "LAYOUT_WIDE";
P.title = "slide-quick sample";
const B = createBuilder(P, T);
const DECK = "slide-quick sample";

/* 01 — cover: kicker, glow, title runs, closer */
{
  const s = B.newSlide();
  B.glow(s, 12.6, -0.4, 9, "cyan");
  B.kicker(s, "Sample · slide-quick", 1.5);
  s.addText([
    { text: "The native engine ", options: { color: T.ink } },
    { text: "works", options: { color: T.accentText } },
  ], { x: B.MX, y: 2.5, w: 11, h: 1.4, fontFace: T.fonts.head, fontSize: 54, bold: true, margin: 0 });
  B.closer(s, [{ text: "Four slides exercising every helper.", options: {} }], 4.4);
  B.footer(s, DECK, 1, 4);
}

/* 02 — comparison: two panels + bullets + accent border */
{
  const s = B.newSlide();
  B.glow(s, -0.3, 6.8, 6.5, "teal");
  B.kicker(s, "01 · Comparison");
  B.title(s, [{ text: "Panels hold bulleted comparisons", options: {} }]);
  const py = 2.5, ph = 2.6, pw = 5.55;
  [{ x: B.MX, lbl: "LEFT", lit: false }, { x: B.MX + pw + 0.43, lbl: "RIGHT", lit: true }].forEach((c) => {
    B.panel(s, c.x, py, pw, ph, { border: c.lit ? T.accent : T.border });
    s.addText(c.lbl, { x: c.x + 0.4, y: py + 0.3, w: pw - 0.8, h: 0.35, fontFace: T.fonts.mono, fontSize: 13, color: c.lit ? T.accentText : T.muted, charSpacing: 2, margin: 0 });
    s.addText([
      { text: "First point.", options: { breakLine: true } },
      { text: "Second point.", options: { breakLine: true } },
      { text: "Third point.", options: {} },
    ], { x: c.x + 0.4, y: py + 0.85, w: pw - 0.8, h: ph - 1.1, fontFace: T.fonts.body, fontSize: 18, color: T.ink, valign: "top", lineSpacingMultiple: 1.3, margin: 0, bullet: { code: "2022", indent: 14 } });
  });
  B.footer(s, DECK, 2, 4);
}

/* 03 — diagram: nodes, arrows, diamond, dashed box, feedback line */
{
  const s = B.newSlide();
  B.kicker(s, "02 · Diagram");
  B.title(s, [{ text: "Diagrams are real, editable shapes", options: {} }]);
  B.panel(s, B.MX, 2.3, B.CW, 3.5);
  const nW = 2.6, nH = 0.95, ny = 2.8;
  const xs = [B.MX + 0.6, B.MX + B.CW / 2 - nW / 2, B.MX + B.CW - 0.6 - nW];
  ["Input", "Process", "Output"].forEach((t, i) => {
    B.node(s, xs[i], ny, nW, nH);
    s.addText(t, { x: xs[i], y: ny, w: nW, h: nH, align: "center", valign: "middle", fontFace: T.fonts.head, bold: true, fontSize: 16, color: T.ink, margin: 0 });
    if (i < 2) B.arrow(s, xs[i] + nW + 0.06, ny + nH / 2, xs[i + 1] - xs[i] - nW - 0.12, 0);
  });
  const ocx = xs[2] + nW / 2, diaY = 4.15;
  s.addShape(P.shapes.DIAMOND, { x: ocx - 0.7, y: diaY, w: 1.4, h: 0.8, fill: { color: T.node }, line: { color: T.nodeBorder, width: 1.25 } });
  s.addText("ok?", { x: ocx - 0.7, y: diaY, w: 1.4, h: 0.8, align: "center", valign: "middle", fontFace: T.fonts.head, bold: true, fontSize: 13, color: T.ink, margin: 0 });
  B.arrow(s, ocx, ny + nH + 0.02, 0, diaY - ny - nH - 0.04);
  s.addShape(P.shapes.ROUNDED_RECTANGLE, { x: ocx - 1.1, y: diaY + 0.95, w: 2.2, h: 0.42, rectRadius: 0.07, fill: { type: "none" }, line: { color: T.accentText, width: 1.25, dashType: "dash" } });
  s.addText("Done", { x: ocx - 1.1, y: diaY + 0.95, w: 2.2, h: 0.42, align: "center", valign: "middle", fontFace: T.fonts.head, bold: true, fontSize: 12, color: T.accentText, margin: 0 });
  B.arrow(s, xs[0] + nW / 2, diaY + 0.4, ocx - 0.7 - (xs[0] + nW / 2), 0, { begin: "triangle", end: "none" });
  B.footer(s, DECK, 3, 4);
}

/* 04 — code: panel + codeText with comment runs */
{
  const s = B.newSlide();
  B.glow(s, 13.4, 7.0, 7, "magenta");
  B.kicker(s, "03 · Code");
  B.title(s, [{ text: "Code renders in Consolas, ≤10 lines", options: {} }]);
  B.panel(s, B.MX, 2.4, B.CW, 2.6);
  B.codeText(s, B.MX + 0.45, 2.75, B.CW - 0.9, [
    { text: "while True:", options: { color: T.ink, breakLine: true } },
    { text: "    step()", options: { color: T.ink } },
    { text: "  # the loop", options: { color: T.muted, breakLine: true } },
    { text: "    if done: break", options: { color: T.ink } },
  ], 14);
  B.closer(s, [{ text: "Sample content. ● ILLUSTRATIVE", options: {} }], 5.4);
  B.footer(s, DECK, 4, 4);
}

P.writeFile({ fileName: out }).then((f) => console.log("Wrote", f));
```

- [ ] **Step 2: Run it — expect failure (modules don't exist yet)**

```bash
cd /Users/wongjunmun/development/ai-development/jm-design && node .claude/skills/slide-quick/templates/example-build.js tmp/quick-test/sample-midnight.pptx midnight
```

Expected: `Error: Cannot find module './themes'`

- [ ] **Step 3: Write themes.js**

Write `.claude/skills/slide-quick/templates/themes.js`:

```js
/* Theme token objects for the slide-quick native engine.
   Colors are 6-char hex WITHOUT "#" (PptxGenJS corrupts files on "#"). */
const path = require("path");
const ASSET_DIR = path.join(__dirname, "..", "assets");
const FONTS = { head: "Calibri", body: "Calibri", mono: "Consolas" };

const THEMES = {
  /* Dark theme — port of decks/native-build (2026-06-13). */
  midnight: {
    name: "midnight",
    bg: "08090A", panel: "16171B", node: "1C1D22",
    border: "2A2C33", nodeBorder: "3A3D47",
    ink: "F7F8F8", muted: "8A8F98", dim: "5A5F68",
    accent: "5E6AD2", accentText: "828FFF",
    kickerFill: "121317", footerColor: "6A6F78",
    glows: true, assetDir: ASSET_DIR, fonts: FONTS,
  },
  /* Light corporate theme. No glow images (they are dark-canvas art). */
  light: {
    name: "light",
    bg: "FFFFFF", panel: "F4F5F7", node: "FFFFFF",
    border: "D9DCE1", nodeBorder: "C2C7CF",
    ink: "16181D", muted: "5A6068", dim: "9AA0A8",
    accent: "5E6AD2", accentText: "4F5BD5",
    kickerFill: "EFF0F3", footerColor: "9AA0A8",
    glows: false, assetDir: ASSET_DIR, fonts: FONTS,
  },
};

module.exports = { THEMES };
```

- [ ] **Step 4: Write builder.js**

Write `.claude/skills/slide-quick/templates/builder.js`:

```js
/* Theme-agnostic PptxGenJS helper library for slide-quick.
   Ported from decks/native-build/build.js (2026-06-13).
   Every helper creates FRESH option objects per call — PptxGenJS mutates
   option objects in place, so sharing one corrupts the second shape. */
const path = require("path");

const SW = 13.33, SH = 7.5, MX = 0.9;     // LAYOUT_WIDE inches
const CW = SW - 2 * MX;                    // content width

function createBuilder(P, T) {
  const F = T.fonts;

  function newSlide() {
    const s = P.addSlide();
    s.background = { color: T.bg };
    return s;
  }

  /* Soft glow image. No-op on themes with glows:false. name: cyan|magenta|teal */
  function glow(s, cx, cy, d, name) {
    if (!T.glows) return;
    s.addImage({
      path: path.join(T.assetDir, `glow-${name}.png`),
      x: cx - d / 2, y: cy - d / 2, w: d, h: d,
    });
  }

  function panel(s, x, y, w, h, opts = {}) {
    s.addShape(P.shapes.ROUNDED_RECTANGLE, {
      x, y, w, h, rectRadius: 0.09,
      fill: { color: opts.fill || T.panel },
      line: { color: opts.border || T.border, width: 1 },
    });
  }

  function node(s, x, y, w, h) {
    s.addShape(P.shapes.ROUNDED_RECTANGLE, {
      x, y, w, h, rectRadius: 0.07,
      fill: { color: T.node },
      line: { color: T.nodeBorder, width: 1.25 },
    });
  }

  /* Pill label above the title, with a small accent dot. */
  function kicker(s, text, y = 0.62) {
    const w = Math.min(8.6, 0.8 + text.length * 0.122);
    s.addShape(P.shapes.ROUNDED_RECTANGLE, {
      x: MX, y, w, h: 0.38, rectRadius: 0.19,
      fill: { color: T.kickerFill }, line: { color: T.border, width: 1 },
    });
    s.addShape(P.shapes.OVAL, {
      x: MX + 0.2, y: y + 0.155, w: 0.07, h: 0.07,
      fill: { color: T.accent }, line: { type: "none" },
    });
    s.addText(text.toUpperCase(), {
      x: MX + 0.36, y, w: w - 0.5, h: 0.38, valign: "middle", align: "left",
      fontFace: F.mono, fontSize: 10, color: T.muted, charSpacing: 1.5, margin: 0,
    });
  }

  /* Action title. runs = pptxgenjs rich-text array. */
  function title(s, runs, y = 1.15, size = 34) {
    s.addText(runs, {
      x: MX, y, w: CW, h: 1.0, valign: "top", align: "left",
      fontFace: F.head, fontSize: size, bold: true, color: T.ink,
      lineSpacingMultiple: 1.0, margin: 0,
    });
  }

  function footer(s, deckName, idx, total) {
    s.addText(deckName.toUpperCase(), {
      x: MX, y: 7.02, w: 7, h: 0.3, fontFace: F.mono, fontSize: 9,
      color: T.footerColor, charSpacing: 2, valign: "middle", margin: 0,
    });
    s.addText(String(idx).padStart(2, "0") + " / " + String(total).padStart(2, "0"), {
      x: SW - MX - 3, y: 7.02, w: 3, h: 0.3, align: "right",
      fontFace: F.mono, fontSize: 9, color: T.footerColor,
      charSpacing: 2, valign: "middle", margin: 0,
    });
  }

  /* Italic takeaway line near the bottom. */
  function closer(s, runs, y = 6.5) {
    s.addText(runs, {
      x: MX, y, w: CW, h: 0.5, fontFace: F.body, italic: true,
      fontSize: 15, color: T.muted, valign: "top", margin: 0,
    });
  }

  /* Straight connector. opts: color, width, end, begin, dash.
     Up-arrows: positive offset + begin:"triangle", never negative h. */
  function arrow(s, x, y, w, h, opts = {}) {
    s.addShape(P.shapes.LINE, {
      x, y, w, h,
      line: {
        color: opts.color || T.muted, width: opts.width || 1.75,
        endArrowType: opts.end || "triangle",
        beginArrowType: opts.begin || "none",
        dashType: opts.dash || "solid",
      },
    });
  }

  /* Monospace block. runs = rich-text array (use breakLine per line). */
  function codeText(s, x, y, w, runs, size = 13) {
    s.addText(runs, {
      x, y, w, fontFace: F.mono, fontSize: size, color: T.ink,
      align: "left", valign: "top", lineSpacingMultiple: 1.32, margin: 0,
    });
  }

  return { SW, SH, MX, CW, newSlide, glow, panel, node, kicker, title, footer, closer, arrow, codeText };
}

module.exports = { createBuilder, SW, SH, MX, CW };
```

- [ ] **Step 5: Run the test — both themes, expect success**

```bash
cd /Users/wongjunmun/development/ai-development/jm-design && mkdir -p tmp/quick-test \
  && node .claude/skills/slide-quick/templates/example-build.js tmp/quick-test/sample-midnight.pptx midnight \
  && node .claude/skills/slide-quick/templates/example-build.js tmp/quick-test/sample-light.pptx light
```

Expected: two `Wrote …` lines, no errors.

- [ ] **Step 6: Validate structure and render**

```bash
cd /Users/wongjunmun/development/ai-development/jm-design
uv run --with python-pptx python3 -c "
from pptx import Presentation
for f in ['tmp/quick-test/sample-midnight.pptx','tmp/quick-test/sample-light.pptx']:
    p = Presentation(f)
    assert len(p.slides) == 4, f
    print(f, 'slides:', len(p.slides))
"
python3 .claude/skills/pptx/scripts/office/soffice.py --headless --convert-to pdf --outdir tmp/quick-test tmp/quick-test/sample-midnight.pptx
pdftoppm -jpeg -r 100 tmp/quick-test/sample-midnight.pdf tmp/quick-test/mid
uv run --with pillow python3 -c "
from PIL import Image; import glob
import statistics as st
for f in sorted(glob.glob('tmp/quick-test/mid-*.jpg')):
    im = Image.open(f).convert('L')
    px = list(im.getdata())
    assert st.pstdev(px) > 8, f + ' looks blank'
    print(f, 'ok')
"
```

Expected: `slides: 4` twice; 4 pages `ok`. Then visually open the 4 JPGs
(Read tool) and check: no overlap, no clipping, readable contrast in BOTH
themes (render light theme too if anything looks off).

- [ ] **Step 7: Commit**

```bash
git add .claude/skills/slide-quick/templates/
git commit -m "feat: slide-quick native engine (builder, themes, sample build)"
```

---

### Task 4: Canonical wireframe skeleton

**Files:**
- Create: `.claude/skills/slide-brainstorm/references/wireframe-skeleton.html`

- [ ] **Step 1: Write the skeleton**

Write `.claude/skills/slide-brainstorm/references/wireframe-skeleton.html`:

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{{DECK_TITLE}} — Wireframe</title>
<style>
  :root { --ink:#222; --muted:#777; --line:#ccc; --box:#e9e9e9; --paper:#fafafa; }
  * { box-sizing: border-box; margin: 0; }
  body { font-family: ui-sans-serif, system-ui, sans-serif; background: var(--paper);
         color: var(--ink); line-height: 1.4; padding: 24px; }
  main { max-width: 980px; margin: 0 auto; display: grid; gap: 28px; }
  .banner { font: 700 12px/1 ui-monospace, monospace; letter-spacing: .12em;
            color: #a33; text-transform: uppercase; }
  h1 { font-size: 28px; }
  .wf-slide { border: 1px solid var(--line); background: #fff; border-radius: 6px;
              padding: 18px 20px; display: grid; gap: 10px; }
  .wf-head { display: flex; gap: 12px; align-items: baseline; }
  .wf-num { font: 700 12px/1 ui-monospace, monospace; color: var(--muted); }
  .wf-title { font-size: 19px; font-weight: 700; }
  .wf-layout { font: 600 11px/1 ui-monospace, monospace; color: var(--muted);
               text-transform: uppercase; letter-spacing: .08em; }
  .wf-box { background: var(--box); border: 1px dashed #bbb; border-radius: 4px;
            min-height: 64px; display: grid; place-items: center;
            color: var(--muted); font: 600 13px/1.3 ui-monospace, monospace;
            padding: 10px; text-align: center; }
  .wf-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .wf-row3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
  .wf-bullets { padding-left: 18px; color: var(--ink); font-size: 14px; }
  .wf-bullets li { margin: 2px 0; }
</style>
</head>
<body>
<main>
  <p class="banner">Wireframe — draft, not final deck</p>
  <h1>{{DECK_TITLE}}</h1>

  <!-- One .wf-slide per slide. Patterns:
       single box:   <div class="wf-box">[loop diagram]</div>
       two-column:   <div class="wf-row"><div class="wf-box">…</div><div class="wf-box">…</div></div>
       three-column: <div class="wf-row3">…</div>
       Keep box labels short: [code ~10 lines], [table 4 rows], [photo: team]. -->
  <section class="wf-slide">
    <div class="wf-head">
      <span class="wf-num">01</span>
      <span class="wf-title">{{ACTION_TITLE_SENTENCE}}</span>
    </div>
    <div class="wf-layout">{{LAYOUT_SIGNATURE}}</div>
    <div class="wf-box">[{{VISUAL_LABEL}}]</div>
    <ul class="wf-bullets">
      <li>{{KEY_POINT_1}}</li>
      <li>{{KEY_POINT_2}}</li>
    </ul>
  </section>
  {{MORE_SLIDES}}
</main>
</body>
</html>
```

- [ ] **Step 2: Verify it renders (quick browser check)**

```bash
cd /Users/wongjunmun/development/ai-development/jm-design && python3 - <<'PY'
from html.parser import HTMLParser
class P(HTMLParser): pass
P().feed(open('.claude/skills/slide-brainstorm/references/wireframe-skeleton.html').read())
print("parses ok")
PY
```

Expected: `parses ok`

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/slide-brainstorm/references/wireframe-skeleton.html
git commit -m "feat: canonical low-fi wireframe skeleton (shared by both pipelines)"
```

---

### Task 5: `slide-quick` SKILL.md

**Files:**
- Create: `.claude/skills/slide-quick/SKILL.md`

- [ ] **Step 1: Write SKILL.md**

Write `.claude/skills/slide-quick/SKILL.md` with exactly this content:

````markdown
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
````

- [ ] **Step 2: Verify every path the skill references exists**

```bash
cd /Users/wongjunmun/development/ai-development/jm-design/.claude/skills/slide-quick
for p in templates/builder.js templates/themes.js templates/example-build.js \
         ../slide-brainstorm/references/wireframe-skeleton.html \
         ../pptx/pptxgenjs.md ../pptx/scripts/office/soffice.py \
         assets/glow-cyan.png; do
  [ -e "$p" ] && echo "ok  $p" || echo "MISSING  $p"
done
```

Expected: all `ok`, no `MISSING`.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/slide-quick/SKILL.md
git commit -m "feat: slide-quick skill (fast path, 2 user replies)"
```

---

### Task 6: Merge slide-layout-designer into slide-brainstorm

**Files:**
- Create: `.claude/skills/slide-brainstorm/references/layout-blueprint.md`
- Move: `.claude/skills/slide-layout-designer/references/archetypes.md` → `.claude/skills/slide-brainstorm/references/archetypes.md`
- Move: `.claude/skills/slide-layout-designer/references/lora-reference.md` → `.claude/skills/slide-brainstorm/references/lora-reference.md`
- Modify: `.claude/skills/html-slides/SKILL.md` (2 pointer sites)
- Delete: `.claude/skills/slide-layout-designer/` (entire directory)

- [ ] **Step 1: Move the reference files**

```bash
cd /Users/wongjunmun/development/ai-development/jm-design
git mv .claude/skills/slide-layout-designer/references/archetypes.md .claude/skills/slide-brainstorm/references/
git mv .claude/skills/slide-layout-designer/references/lora-reference.md .claude/skills/slide-brainstorm/references/
```

- [ ] **Step 2: Create layout-blueprint.md from the layout-designer SKILL.md**

Copy `.claude/skills/slide-layout-designer/SKILL.md` to
`.claude/skills/slide-brainstorm/references/layout-blueprint.md`, then make
exactly these edits to the copy:

1. Replace the opening (title + the two paragraphs starting "You are the
   layout architect…" and the "This skill does not replace…" list) with:

```markdown
# Layout Blueprint Pass

The layout-architecture pass for slides. Run this inside `slide-brainstorm`
after the narrative arc is approved (it produces the internal DESIGN INTENT
lines and the per-slide blueprint), and inside `html-slides` when a deck
needs a full spatial blueprint before implementation.
```

2. Replace every occurrence of `references/archetypes.md` with
   `archetypes.md` and `references/lora-reference.md` with
   `lora-reference.md` (they are now siblings in the same folder).
3. Everything else (Core Standard, Action Titles, Research Pass, Reference
   Image Extraction, Technical Infographic Archetype, Evidence Form
   Selection, Grouping Discipline, Layout Workflow, Output Format,
   Review Mode, Visual Verification, Hard Rules) stays verbatim.

- [ ] **Step 3: Repoint html-slides/SKILL.md**

In `.claude/skills/html-slides/SKILL.md`, Read the file, then:

1. Defaults bullet — replace:
   `consult the sibling ../slide-layout-designer/SKILL.md before writing HTML. Treat its output as the slide layout blueprint.`
   with:
   `consult ../slide-brainstorm/references/layout-blueprint.md before writing HTML. Treat its output as the slide layout blueprint.`
2. Workflow step 7 — replace:
   `read ../slide-layout-designer/SKILL.md and produce a layout blueprint before implementation.`
   with:
   `read ../slide-brainstorm/references/layout-blueprint.md and produce a layout blueprint before implementation.`

(Anchor wording may differ slightly — grep `slide-layout-designer` in the
file and repoint every hit to the new reference path.)

- [ ] **Step 4: Delete the old skill and sweep for stale references**

```bash
cd /Users/wongjunmun/development/ai-development/jm-design
git rm -r .claude/skills/slide-layout-designer/
grep -rn "slide-layout-designer" .claude/ --include="*.md" --include="*.json" || echo "clean"
```

Expected: `clean`, or only hits inside `docs/` (historical specs/plans —
leave those). If any hit remains under `.claude/` (e.g.
`slide-pipeline-test`, commands, settings), update each to point to
`slide-brainstorm/references/layout-blueprint.md`, then re-run the grep.

- [ ] **Step 5: Commit**

```bash
git add -A .claude/skills/
git commit -m "refactor: merge slide-layout-designer into slide-brainstorm references"
```

---

### Task 7: Lighten slide-brainstorm to wireframe fidelity

**Files:**
- Modify: `.claude/skills/slide-brainstorm/SKILL.md`
- Modify: `.claude/skills/slide-brainstorm/references/template.md`
- Modify: `.claude/skills/slide-brainstorm/references/subagent-review-verifier.md`
- Delete: `.claude/skills/slide-brainstorm/references/html-companion-skeleton.html`

Read each file before editing; anchors below are from the 2026-06-13
versions — verify with grep first.

- [ ] **Step 1: SKILL.md — swap the skeleton and the fidelity rules**

In `.claude/skills/slide-brainstorm/SKILL.md`:

1. Replace every occurrence of `html-companion-skeleton.html` with
   `wireframe-skeleton.html` (grep shows ~3 sites: HTML rules bullet, "One
   canonical format" list, references table).
2. Replace the bullet beginning
   `- Show slide content only: one panel per slide with the visible slide text and a **full-fidelity monochrome layout preview**.`
   (through the end of that bullet) with:

```markdown
- Show slide content only: one panel per slide with the slide number, the
  action title, a layout-signature label, gray placeholder boxes with short
  text labels for every visual (`[loop diagram]`, `[code ~10 lines]`,
  `[table 4 rows]`), and 2–4 key bullets. The wireframe is for judging
  narrative, structure, and layout choice — NOT rendered design.
```

3. Delete these bullets entirely (they demand full fidelity / CDN runtimes):
   - the bullet starting `- Render complex visuals at near-final structural fidelity:`
   - the bullet starting `- Theme-agnostic does **not** mean visually plain.`
   - the bullet starting `- CDN libraries are allowed when they materially improve`
   - the bullet starting `- Use diagrams as real slide content when they clarify`
   Replace them with one bullet:

```markdown
- No JS, no CDN, no Mermaid, no screenshots in the wireframe. Diagram
  structure is conveyed by labeled gray boxes plus the DESIGN INTENT
  comment — the build skill implements the real visual.
```

4. In the "Density and strong-slide verification" checklist, replace check
   9 (`**Layout fidelity** — every slide's internal DESIGN INTENT line is visibly implemented in the HTML…`) with:

```markdown
9. **Wireframe completeness** — every slide panel carries its number,
   action title, layout-signature label, labeled placeholder boxes for
   each promised visual, and key bullets; every DESIGN INTENT line is
   recorded in the HTML comment for the build skill.
```

5. Update the `references/` list in "One canonical format": the
   `html-companion-skeleton.html` entry becomes `wireframe-skeleton.html —
   the canonical low-fi wireframe skeleton (shared with slide-quick)`; add
   two entries: `layout-blueprint.md — the layout-architecture pass (was
   the slide-layout-designer skill)` and `archetypes.md — the layout
   archetype library`.
6. Add a routing note at the end of the "When to use" section:

```markdown
Routing: simple internal/training decks delivered as PPTX/PDF belong to
the `slide-quick` skill (fast path, no full brainstorm). Use this skill
for executive, persuasion, brand-locked, or HTML-delivery decks — and say
so on the first turn so the user can switch.
```

- [ ] **Step 2: template.md — Layout Fidelity → Wireframe Fidelity**

In `.claude/skills/slide-brainstorm/references/template.md`:

1. Replace both occurrences of `html-companion-skeleton.html` with
   `wireframe-skeleton.html`.
2. Replace the entire `## Layout Fidelity` section body with:

```markdown
The brainstorm is a **wireframe**: theme-less AND low-fidelity by design.
Every promised visual appears as a gray placeholder box with a short
label. The DESIGN INTENT comment carries the real layout contract
(signature, protagonist, scan path, encoding) for the build skill.
Do not render matrices, charts, mocks, or diagrams in the wireframe.
```

3. Delete the `## CDN Dependencies` section entirely (wireframes carry no
   runtime). Keep `## Professional Visual Choice` (it drives DESIGN INTENT
   lines) but change its lead-in sentence to point at
   `layout-blueprint.md` instead of `presentation-design-decisioning.md`
   if that file name appears; otherwise leave as is.
4. In `## Slide Panels`, replace the line
   `- The internal `DESIGN INTENT` choice, rendered as a full-fidelity monochrome preview`
   with `- Labeled gray placeholder boxes for each visual the DESIGN
   INTENT promises`.

- [ ] **Step 3: subagent-review-verifier.md — reword fidelity checks**

Grep for `fidelity` and `production-grade` in
`.claude/skills/slide-brainstorm/references/subagent-review-verifier.md`.
In the reviewer prompt's numbered checks, replace check 9 (the one about
DESIGN INTENT promises "not visibly implemented in the HTML") with:

```text
9. Any internal `DESIGN INTENT` line that is missing from the HTML
   comment, or that names a visual with no matching labeled placeholder
   box in that slide's panel.
```

and replace check 10 (the one about ideas "reduced to generic rectangles…
instead of a production-grade monochrome preview") with:

```text
10. Any slide panel whose placeholder boxes are unlabeled or so vague
   ("[visual]") that the build skill could not tell what to draw.
```

Keep all content/argument checks unchanged.

- [ ] **Step 4: Delete the old skeleton and verify**

```bash
cd /Users/wongjunmun/development/ai-development/jm-design
git rm .claude/skills/slide-brainstorm/references/html-companion-skeleton.html
grep -rn "html-companion-skeleton\|full-fidelity" .claude/skills/slide-brainstorm/ && echo "STALE REFS REMAIN" || echo "clean"
```

Expected: `clean`.

- [ ] **Step 5: Commit**

```bash
git add -A .claude/skills/slide-brainstorm/
git commit -m "refactor: brainstorm artifact drops to wireframe fidelity; rigor gates unchanged"
```

---

### Task 8: End-to-end verification

**Files:** none created (verification only)

- [ ] **Step 1: Fast-path dry run**

Simulate `slide-quick` on the topic "what is an AI agent" using the
skip-intake path ("just make it"): draft a 6-slide outline, run the
consultant improve pass on it, fill the wireframe skeleton, then write and
run a build script using the templates (midnight theme), and run QA-lite.

Expected: a valid .pptx in `decks/` opening with 6 slides; consultant
change log produced; whole run completes without invoking html-slides,
html-to-pptx, theme servers, or any reviewer subagent.

- [ ] **Step 2: Full-pipeline regression**

Invoke the `slide-pipeline-test` skill (it generates a test deck through
the gated pipeline and runs all verifiers).

Expected: the pipeline passes with the merged layout references and the
wireframe-fidelity brainstorm. If it fails on a stale
`slide-layout-designer` or `html-companion-skeleton` reference, fix the
pointer and re-run.

- [ ] **Step 3: Final sweep**

```bash
cd /Users/wongjunmun/development/ai-development/jm-design
grep -rn "slide-layout-designer\|html-companion-skeleton" .claude/ && echo "STALE" || echo "clean"
ls .claude/skills/ | sort
```

Expected: `clean`; skill list contains `slide-quick`, `slide-consultant`,
no `slide-layout-designer`.

- [ ] **Step 4: Commit any fixes + update project memory**

```bash
git add -A && git commit -m "test: e2e verification fixes for slide fast path"
```

Update the auto-memory file
`~/.claude/projects/-Users-wongjunmun-development-ai-development-jm-design/memory/project_slide_design_research.md`
(or add a new memory) noting: slide-quick + slide-consultant shipped,
layout-designer merged into brainstorm, brainstorm HTML is wireframe
fidelity now.

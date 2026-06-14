---
name: html-slides
description: Use when creating or editing single-file HTML slide decks across multiple themes — Micron (dark, light, dark engineering), guided learning, playful, PDF exports, or PPTX-to-HTML slide conversions. Theme is chosen per deck; brand-locked Micron themes coexist with neutral-style themes.
---

# HTML Slides

## Defaults

- If the user asks for a deck/slides/presentation but has not provided detailed slide-by-slide content or an approved wireframe/spec, invoke `slide-brainstorm` first. Do not build the HTML deck from a vague prompt.
- When theme is unspecified, the `Style Selection` theme question (a plain numbered list of every `stable` theme from `themes/themes.json` + `themes/selector.html` link) is the **last question asked** — after content and delivery are settled, immediately before building. `slide-brainstorm` never asks this — selection lives here.
- **There is no default/recommended theme — all stable themes are equal** (see [ADR 0004](docs/adr/0004-default-theme-is-micron-dark.md)). The theme is always the user's choice via the `Style Selection` question. Never apply a theme silently.
- Use Micron dark for dark decks — executive, vision, technical reviews, roadmaps, rollouts, and walkthroughs. It is a premium dark style: fixed 1600×900 stage, the approved `photo-title` cover, and at least one official animated Micron primary icon per deck (`verify.py` enforces both).
- For a new Micron dark deck, use only the `photo-title` treatment from `themes/micron-dark/title-templates.md` and the theme-owned photo asset in `themes/micron-dark/assets/`. It has no other title treatment.
- Use Micron light for light/white slides, print-style data tables, or bright managerial training / enablement decks with the fixed-stage cadence shown in `docs/brainstorms/2026-05-15-github-copilot-for-everyone-deck.html`.
- For Micron themes, use the standalone `micron-icons` skill when official Micron iconography or decorative Micron icon texture would improve the deck. Do not browse icon folders manually.
- For any slide animation, first consult the project-local `../emil-design-engineering/SKILL.md` and especially `../emil-design-engineering/animations.md`. Use purposeful motion only, animate `transform`/`opacity` or library-rendered chart entry states, avoid `transition: all`, prevent layout shift, and include `prefers-reduced-motion` handling.
- When the user asks for a better/impressive/non-boring layout, attaches a slide image as style reference, or the deck is a diagram-heavy technical explainer, consult the sibling `../slide-brainstorm/references/layout-blueprint.md` before writing HTML. Treat its output as the slide layout blueprint.
- Content slides should be custom to the topic. Do not reuse fixed demo layouts by default.
- If the user asks for `.pptx`, PowerPoint, or editable Office output for a **new** deck, build the gated HTML deck here first, then convert with the sibling `html-to-pptx` skill (`--mode layered` keeps titles/body editable; `--mode image` for pure fidelity). This keeps every gate — verify.py content lints and the final-deck review — on the PPTX path. Use the `pptx` skill directly only to edit an existing `.pptx`, work inside a given template, or when the user explicitly asks for native PPTX authoring.
- Ask only when theme/template choice changes the outcome materially.
- Confirm HTML only vs HTML plus PDF when delivery is unclear.

## Style Selection

Theme selection happens **here**, not in `slide-brainstorm`, and it is the
**last question you ask** — only after content is approved and delivery
format is settled. Everything else is resolved first; the very last thing
before building is "which theme."

The brainstorm decided content and structure only; the `.txt` may carry a
`STYLE NOTE:` line if the user volunteered something — treat it as a hint,
still confirm with the theme question.

Order of operations:

1. **Content readiness first.** If the request lacks a complete outline,
   approved ASCII wireframes, or a final deck spec, hand off to
   `slide-brainstorm` and wait. Do not ask about theme yet.
2. **Delivery format next.** Confirm HTML-only vs HTML+PDF if unclear.
3. **Theme question last** — the final question before building.

The theme question (skip it only if the user already named a theme, or the
brainstorm `STYLE NOTE:` pins one and the user confirms it):

- Ask the user to **select a theme**. Read `themes/themes.json` for the
  authoritative `stable` list and present **every** stable theme by name in
  manifest order — do not hard-code the list. No theme is recommended; all are
  equal, so present them in plain manifest order with no "(Recommended)" tag
  (see [ADR 0004](docs/adr/0004-default-theme-is-micron-dark.md)).
- Before asking, make sure the chooser is reachable over HTTP. From the
  `html-slides` skill root, run `python3 -m http.server 8787 --bind
  127.0.0.1`; if that port is already in use, reuse it when it serves this
  skill root, otherwise pick another port. In Codex desktop, prefer a detached
  server that survives the shell turn, e.g. `tmux new-session -d -s
  html-slides-theme-selector 'cd <html-slides-skill-root> && python3 -m
  http.server 8787 --bind 127.0.0.1'`. Give the actual URL:
  `http://127.0.0.1:<port>/themes/selector.html`. Do not give a bare
  `file://` path or `themes/selector.html` as the only preview link because
  the selector fetches `themes.json`.
- One question, as a **plain numbered text list** — do *not* use the
  `AskUserQuestion` tool here. List every stable theme `1`, `2`, `3`, … so
  the user replies with a single number; this keeps all themes visible
  rather than truncating to four. **Always include the served chooser URL**
  so the user can preview each theme first.

  ```
  Last thing — pick a theme (preview all: http://127.0.0.1:<port>/themes/selector.html):
    1. <first stable theme from themes.json — name + one-line summary>
    2. <next stable theme from themes.json>
    3. <next stable theme from themes.json>
    4. <next stable theme from themes.json>
  Or paste a path (HTML / PPTX / PDF / screenshot) to match its style.
  ```

  The numbered list follows manifest order exactly — no theme is promoted to
  the top and none is tagged recommended.

  The list length always equals the number of `stable` themes in the
  manifest — four today, but render whatever the manifest has, never a fixed
  count.

- If the user pastes a path instead of picking, Read it, extract palette /
  typography / layout grammar, and match the closest `stable` theme or
  restate the extracted tokens in the deck's design system, using real
  class/token names from the source.
- If the user asks you to choose, pick the best `stable` fit for the content
  and state the chosen theme.
- `micron-light` is the only sanctioned default and applies *only* because
  the user explicitly chose it — never apply any theme silently.
- Only offer themes whose `status` is `stable`. `experimental` themes are
  used only when the user names them explicitly.

## Read First

Two top-level homes:

- **`themes/`** — one folder per theme (`design.md`, `example.html`, optional `title-templates.md`, optional `preview.png`). `themes/themes.json` is the manifest. `themes/selector.html` is built from the manifest and is the user-facing chooser; serve the skill root over HTTP before showing it because it fetches `themes.json`.
- **`references/`** — cross-theme infrastructure grouped by purpose: `tokens/` (always paste), `runtime/` (skeleton + charts), `patterns/` (opt-in), `process/` (gates). See `references/README.md` for the directory key.

Read only what applies:

| Need | File |
|---|---|
| Theme manifest (start here) | `themes/themes.json` |
| Theme chooser (show to user) | Serve skill root, then open `http://127.0.0.1:<port>/themes/selector.html` |
| Theme rules + example | `themes/<id>/design.md` and `themes/<id>/example.html` |
| Micron dark exhibit library (waterfall, driver tree, 2×2, harvey table, annotated trend, gated roadmap) | `themes/micron-dark/exhibits.md` |
| Micron light managerial training precedent | `docs/brainstorms/2026-05-15-github-copilot-for-everyone-deck.html` plus `themes/micron-light/design.md` |
| Micron iconography | Use sibling skill `../micron-icons/SKILL.md`; call `../micron-icons/bin/find-icon.py` for paths/snippets |
| Tokens (always paste, in order) | `references/tokens/micron-tokens.css`, `references/tokens/viewport-base.css`, `references/tokens/layout-kit.css` |
| HTML skeleton + controller | `references/runtime/html-template.md` |
| Fixed 16:9 stage (opt-in; micron-light mandates it) | `references/runtime/fixed-stage.md` |
| Chart runtime choice | `references/runtime/svg-charts.md` |
| Animation patterns | `references/runtime/animation-patterns.md` |
| Image pipeline (opt-in) | `references/patterns/image-pipeline.md` |
| Inline editing (opt-in) | `references/patterns/inline-editing.md` |
| Architecture checklist | `references/process/frontend-slides-architecture.md` |
| Production rules | `references/process/production-grade-slide-philosophy.md` |
| Verification | `references/process/verification.md` |
| Final-deck content review (mandatory pre-delivery gate) | `references/process/final-deck-review-subagent.md` |
| PDF export | `references/process/export-workflows.md` |
| PPTX output (new deck) | Build the gated HTML deck, then sibling skill `../html-to-pptx/SKILL.md` (`--mode layered` = editable) |
| PPTX editing (existing file/template) | Project skill `pptx` |

For a blank deck, start with `scripts/scaffold-deck.py --theme <id>` or adapt `references/runtime/html-template.md`. The scaffold supports every stable theme listed in `themes/themes.json`.

## Non-Negotiables

Universal across every theme. Theme-specific rules (palette, accent, gradient, chart surface, typography, logo placement, sentence case, etc.) live in `themes/<id>/design.md`.

- One no-build `.html`; inline CSS/JS by default.
- Paste the chosen theme's tokens first, in the order the theme's `design.md` specifies. Never redefine `:root` color or scale tokens in the deck. (Micron themes paste `references/tokens/micron-tokens.css` → `viewport-base.css` → `layout-kit.css`; non-Micron themes paste `themes/<id>/tokens.css` → `references/tokens/non-micron-contract.css` → `viewport-base.css` → `layout-kit.css`.)
- Use approved CDN runtimes only when the selected reference explicitly calls for them, such as React Flow for complex diagrams, ECharts for non-trivial charts, or Three.js for shader/canvas title systems. Pin versions and include SRI hashes where the CDN supports them.
- For charts, use a charting library such as ECharts when the visual has axes, thresholds, annotations, multi-series data, tooltips, resizing concerns, or dashboard-like complexity. Inline SVG is only for tiny static primitives: one sparkline, one bar strip, one gauge, or decorative mini-chart.
- One `<section class="slide">` per slide.
- Every generated HTML deck starts with a dedicated title slide. This applies even when the user asks for "a slide"; make the requested content slide 2 unless they explicitly ask for a standalone content slide only.
- Vertical scroll-snap is main flow.
- Hide browser scrollbars for presentation mode; keep scroll-snap navigation functional.
- `window.presentation = new SlidePresentation()`.
- Keyboard, wheel, touch/swipe, nav dots, progress bar.
- If a theme shows right-edge nav dots, they should read as a tight progress rail: compact vertical stack, no large 44px visual slots. Use about `32px` wide by `18px` high button lanes with a 6-8px centered dot, or a similarly close visual rhythm. Theme rules may hide the dots and surface progress elsewhere, such as `micron-dark` using a top-right hover/focus progress chip beside `Present`.
- Top-right hover hotspot for presentation mode: `.presentation-hotspot` contains a hidden-until-hover/focus `.present-toggle` pill with play icon + `Present`, requesting fullscreen on click and with `P`.
- ESC opens clickable overview thumbnails.
- No slide-internal scrolling; split overflow into another slide.
- Fixed-stage decks must expose a real 16:9 slide canvas. Paint the centered stage, not the whole browser viewport; non-16:9 browser windows should show neutral letterbox space outside the slide.
- Build for presentation-room readability. On a 1600x900 / 1920x1080-equivalent stage, body text must be at least 24px, table/caption/label text at least 20px, and titles at least 60px. If content only fits by shrinking below those floors, split it into another slide.
- One message and one visual protagonist per slide.
- **Action titles.** Every content-slide headline is a full-sentence assertion stating the takeaway — a claim someone could dispute, with a verb, never a topic label ("Q3 results") and never a sentence about the slide or template itself. If the slide shows data, the headline carries the key number. Target ≤12 words / 2 lines. Covers and section dividers (`data-slide-kind="section"`) are exempt. `verify.py` lints this and prints the full title storyline every run; read the titles in order — they must retell the argument (the skim test).
- Do not invent stats, quotes, logos, products, or claims. Illustrative or placeholder data carries `data-illustrative="true"` (or `data-placeholder="true"`) **and** a visible "Illustrative" label — `verify.py` fails unlabeled placeholders.
- For **training walkthrough** decks, at least two content slides must show
  concrete artifacts instead of text-only rows/cards: prompt-output specimen,
  spreadsheet/file mock, slide thumbnail, chart/data summary, or document
  excerpt. If the brainstorm names examples such as spreadsheets, slides, or
  data analysis, those examples must become visible artifacts.
- Preserve the canonical runtime from `references/runtime/html-template.md` even when adapting theme-specific visuals.
- Verify before final with `scripts/verify.py <deck>.html --theme <id> --check-overview --fail-on-warnings`. `--theme` is required (the verifier errors without it) so per-theme rules from `themes/themes.json` (required tokens, accent overuse, chart-surface, headline contrast, logo) and universal lints, including readable font-size floors, actually run. Use `--skip-brand` only to deliberately run universal-only.

## Theme Rules

Theme rules live in each theme's `design.md`. Read `themes/<id>/design.md` for the chosen theme; treat `themes/<id>/example.html` as a *visual* precedent, not a runtime to copy verbatim. Add a new theme by creating a folder under `themes/` and a manifest entry in `themes/themes.json` — do not edit this SKILL.md for new themes.

## Micron Icons

For `micron-light` and `micron-dark`, use the sibling
`micron-icons` skill whenever a slide needs official Micron icons, semantic
category icons, or restrained decorative icon texture.

Use the finder instead of guessing filenames:

```sh
python3 ../micron-icons/bin/find-icon.py --group technical-capability --theme micron-dark --limit 3
python3 ../micron-icons/bin/find-icon.py wafer --media mp4 --style pos --format html
python3 ../micron-icons/bin/find-icon.py --group title-hero --theme micron-light --format html --decorative
```

Rules:

- PNG is the default. MP4 is opt-in for title, hero, transition, or one focused visual protagonist.
- `--theme micron-light` implies `pos`; `--theme micron-dark` implies `rev`.
- Do not mix primary, secondary, or category-specific icon families on the same slide unless the hierarchy is intentional and visually obvious. For KPI rows, process rows, and repeated semantic anchors, use one consistent family across the set; prefer primary `png/<polarity>/...` icons for Micron executive decks.
- After adding icons, inspect the rendered slide and replace any icon that looks like a different illustration system. A passing asset path is not enough; the icon set must read as one visual language.
- Use `--decorative` for decorative HTML snippets so the finder emits hidden decorative accessibility.
- Non-Micron themes do not use Micron icons unless the user explicitly asks.
- Finder paths are relative to the `micron-icons` skill root. When embedding in a deck outside that folder, prefix or rewrite the path from the deck file location, e.g. a root-level deck uses `.agents/skills/micron-icons/assets/...`.
- Package assets through a slide export workflow when portability matters; do not embed data URIs.

## Workflow

1. Check content readiness. If the user has not provided detailed slide content, an approved slide-by-slide outline, approved ASCII wireframes, or a final deck spec, invoke `slide-brainstorm` first and stop. Resume only after the user approves the brainstormed wireframes/spec.
2. Confirm delivery format (HTML-only vs HTML+PDF) if unclear. Also confirm whether the deck is **presented live or circulated standalone**, and record it as `data-deck-mode="live|standalone"` on the deck root (`.deck` or `<body>`). Standalone relaxes the word budget ×1.5 but makes the chart-takeaway lint a hard fail (no presenter to explain the chart). Decision/approval decks also set `data-deck-kind="decision"` on the deck root — executive themes then require an executive-summary slide right after the cover.
3. **Theme question — the last question, asked only after steps 1–2 are settled.** If the user named a theme or confirmed a brainstorm `STYLE NOTE:`, use it. Otherwise start or reuse a local HTTP server from the skill root, verify `themes/themes.json` is reachable, then ask the `Style Selection` theme question: a plain numbered text list (not `AskUserQuestion`) of every `stable` theme from `themes/themes.json` by name in manifest order (none recommended), with the served selector URL. A pasted path ⇒ read it and match. Never silently apply a default.
4. Read relevant design reference plus runtime checklist.
5. Read the chosen theme's `design.md` plus the manifest `extras` it points to: `title-templates.md` for title-slide direction, and (Micron dark) `exhibits.md` for the consulting exhibit recipes content slides should default to.
6. For Micron themes, call `../micron-icons/bin/find-icon.py` when the deck needs official iconography, semantic category icons, or decorative icon texture.
7. When layout quality is a primary concern, when the user provides a style reference image, or when the deck needs an infographic/system-diagram treatment, read `../slide-brainstorm/references/layout-blueprint.md` and produce a layout blueprint before implementation. Use that blueprint for grids, zones, visual protagonists, semantic color roles, and text budgets.
8. Build outline from approved user content. When building from an approved brainstorm, keep the approved slide titles; after the build, diff each final headline against the brainstorm title and list any meaning change in the delivery summary with a one-line reason.
9. Add slide 1 as a title page with title, short subtitle, optional audience/date/source note, and a title treatment that fits the chosen theme.
10. Put the requested explanatory/content material after the title page.
11. Define deck system: title treatment, background, type, rhythm, visual protagonists, and approved runtime tech. Make content layouts custom to the topic.
   - For Micron light training / enablement decks, use the Copilot reference as the pattern language: fixed 16:9 sheet, large left headline, one right-side subject mark or diagram, section labels, hairline comparisons, prompt/demo slides, progressive build fragments, and one soft-purple wash moment.
   - For Micron light decks, make purple visibly present: section labels, active data/chart states, focal panel accents, and one or two soft-purple wash moments. The title slide must include the faint purple dot-grid texture from `themes/micron-light/design.md`; if the dot-grid is absent, the title slide is unfinished.
   - For Micron light RAG / AI / data-flow / architecture explainers, use the icon-rich technical explainer map in `themes/micron-light/design.md` §4A.5: colorful semantic icon chips, source strip, numbered pipeline, right proof rail, artifact/nutshell card, and bottom "why it matters" strip with a curved purple edge.
   - For Micron dark training / enablement decks, do not simply invert the
     light deck into white text rows. Use dark UI specimens: prompt/output
     windows, artifact strips, data-summary panels, and visible work products.
     Step-by-step build slides should show all steps faintly from the start and
     highlight the active step, so the first build state does not look empty.
   - If the approved brainstorm says `Presentation style: training
     walkthrough`, include one prompt-output slide before the guardrails/closing
     section unless the user explicitly rejects it.
12. For decks >=5 slides, make 2 visually different showcase slides when interaction allows.
13. Name the generated HTML file from the deck content: lowercase kebab-case from the title or core topic, such as `ai-roadmap-board-review.html`. Do this for every theme, including Micron themes. Avoid generic names like `micron-slides.html`, `slides.html`, or `deck.html` unless the user explicitly names that file.
14. Run verification at desktop, mobile, and a non-16:9 browser viewport when fixed-stage output is used, such as `1127x1084`, to confirm the slide canvas letterboxes instead of stretching.
   After verification, inspect screenshots using the per-slide rubric in
   `references/process/verification.md` (glance test, focal point, vertical
   logic, artifact tally) and run its Skim test on the title storyline the
   verifier prints. If more than half the content slides
   are text rows, generic cards, or panels without a concrete visual artifact,
   revise before delivery. If screenshot text looks too small for a room,
   split the content or enlarge the layout; do not satisfy fit by shrinking
   copy below the readability floors. Passing `verify.py` is necessary but not
   a design review.
15. **Final-deck content review (mandatory).** After `verify.py` passes, run
   `references/process/final-deck-review-subagent.md`: spawn one reviewer
   subagent over the deck and its screenshots. Fix all P0/P1 findings before
   delivery and record the result as a `FINAL DECK REVIEW:` HTML comment. If
   subagents are unavailable, run the same prompt inline and record the
   fallback — never silently skip the gate.
16. After changing theme examples, scaffold output, runtime, overview behavior, or verifier logic, run `scripts/audit-theme-matrix.py --output tmp/html-slides-audit`. This verifies shipped examples and freshly scaffolded decks for every stable theme at `1280x720`, `375x667`, and `1127x1084`.
17. Export PDF only when requested.

## Density Limits

| Slide type | Max content |
|---|---|
| Title | 1 heading, 1 subtitle, optional date |
| Content | 1 heading + 4-6 bullets or 2 short paragraphs |
| Grid | 6 cards max |
| Code | 8-10 lines |
| Quote | 1 quote, max 3 lines |
| Image | 1 heading + 1 image |
| Data | 1 chart/table + one takeaway |
| Headline | ≤12 words target — one full-sentence assertion |
| Body copy | 25–50 words ideal; hard budget 90 words/slide (60 on executive themes, ×1.5 standalone) |

`verify.py` enforces the budgets mechanically: body word cap, >6 list items,
>6 repeated cards, >10 code lines, and >3 exhibits per slide all fail. If a
slide busts a budget, split it — do not shrink or cram.

## Readability Floors

These are hard floors for generated decks:

| Text role | Minimum |
|---|---:|
| Body copy, bullets, table cells | 24px |
| Labels, captions, small callouts | 20px |
| Slide titles / section heads | 60px |
| Decorative chrome only | 12-14px |

Decorative chrome means nav dots, progress, slide number, footer, tiny brand
mark, and overview UI. Anything the audience must read to understand the slide
is not chrome. When the verifier reports small readable text, enlarge it or
split the slide.

## Final Response

Report only:

- File path
- Theme used
- Title template used, when applicable
- External runtimes used, when applicable
- Slide count
- Confirm title slide included
- Navigation: arrows, space, vertical scroll/swipe, nav dots, Esc overview
- Final-deck review status (`PASS` / findings fixed / inline fallback)
- Title changes vs the approved brainstorm, when one exists

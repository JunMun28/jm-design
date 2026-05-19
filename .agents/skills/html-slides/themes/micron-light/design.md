# Micron light — design system

Purpose: light-theme Micron slide reference. Style, philosophy, gotchas only — **no fixed layouts.** Use this for the look-and-feel; invent the layout for whatever the deck needs.

Compiled: May 2026. Canonical live precedent:
`docs/brainstorms/2026-05-15-github-copilot-for-everyone-deck.html`
(a managerial training deck — Apple/Cursor restraint).

---

## 1. When to reach for this theme

Micron light is the right pick when **any** of these are true:

- The deck is read by people in good light (managers, customers, training rooms, print-friendly handouts)
- The narrative wants to feel **calm, premium, factual** — not theatrical
- Content is text-heavy, data-heavy, or both, and clarity matters more than mood
- The audience is non-technical and needs the slides to do less, not more
- It will be exported to PDF for circulation

Common deck types: training / onboarding, board reviews, financial readouts, agendas, data tables, vision-with-numbers, internal explainers, comparison decks.

It is **not** the right pick for: theatrical pitches that need black canvas drama, conference keynotes that lean on imagery, brand storytelling decks (use Micron dark for those).

---

## 2. The feel — five words

**Bright. Precise. Calm. Editorial. Quiet.**

Light theme decks earn their impact by **restraint**. The brand presence (purple, mono kicker, italic accent) is small but unmistakable. White is the protagonist. Type does most of the work.

The reader should feel: *this team is confident enough to leave space.*

---

## 3. Color tokens

Inherits `references/tokens/micron-tokens.css`. The theme is a thin layer on top.

```css
:root {
  /* required (verify.py checks these) */
  --micron-black: #000;
  --micron-white: #fff;
  --micron-accent: #bd03f7;
  --micron-accent-display: var(--micron-accent); /* optional alias for large display accents */

  /* light-theme working palette */
  --ink: #0f172a;            /* near-black with a slate undertone — softer than #000 */
  --muted: #475569;           /* secondary text, footer, captions */
  --hairline: #d0d7de;        /* every divider in the deck */
  --letterbox: #eef0f4;       /* outside the 16:9 stage */
  --soft-purple-wash: color-mix(in srgb, var(--micron-accent) 8%, white);  /* the deck's one focal panel */

  /* gray ramp (use sparingly) */
  --gray-a: #262626; --gray-b: #4d4d4d; --gray-c: #8c8c8c;
  --gray-d: #bfbfbf; --gray-e: #e6e6e6; --gray-f: #f2f2f2;
}
```

### Where each color is allowed

| Color | Allowed for | Banned for |
|---|---|---|
| `--micron-white` | Stage background, panel background | — |
| `--ink` (or `--micron-black`) | Headlines, body, primary text | Backgrounds (use white) |
| `--muted` | Captions, footer text, attribution, supporting clauses | Headlines |
| `--micron-accent` (purple) | Section-label kicker, italic accent word in H2, soft-purple wash, progress bar, ONE chart highlight, tiny accent dot | Headline color, body copy, table fills, gradients behind text |
| `--hairline` | All dividers, table row rules | Anything heavier than 1px |
| `--soft-purple-wash` | The deck's ONE focal panel (use it once) | Frame for every slide |
| `--letterbox` | Browser viewport outside the 16:9 stage | Inside the stage |

The accent (purple) is precious. **One accent word per H2**, **one wash per deck**, **one highlight per chart**. If you spend it on chrome, you can't spend it on emphasis.

For illustrated training decks, count accent by **role**, not by SVG path:
one headline accent, one active state, one visual cluster, one focal wash.
The verifier allows this because a single diagram can contain many accent
strokes; the human rule is still that purple marks the point, not decoration.

---

## 4. Reference deck recipe: Copilot for managers

When asked for a light Micron deck like
`2026-05-15-github-copilot-for-everyone-deck.html`, reproduce the **system**,
not the subject matter:

- **Physical scene:** managers in a bright meeting room, reading a training deck
  on a projector and later as a PDF. Light theme is forced by the room and use.
- **Fixed 16:9 sheet:** white 1600×900 stage centered in a cool letterbox with a
  soft shadow. Do not stretch the slide to the browser viewport.
- **Cover:** big left title, italic purple subtitle or accent phrase, one
  inspectable product/subject mark on the right, subtle dotted purple fields.
  Micron logo sits in the footer block, not as a huge hero logo.
- **Narrative rhythm:** evolution → shift → how it works → examples → live try
  → deeper concept → progressive discovery. Use this cadence for training:
  name the change, show the old/new split, give the action loop, then rehearse.
- **Layouts:** vary signatures every slide. Use timelines, two-column then/now
  comparisons, prompt tables, a centered live-demo prompt, and progressive flow
  diagrams. Avoid repeated card grids.
- **Visual protagonists:** custom inline SVG diagrams, product marks, prompt
  tables, and progressive build fragments. Icons are drawn as thin-line figures,
  not emoji or stock clipart.
- **Interaction:** build fragments are allowed for teaching sequences. Arrow /
  space advances the staged build before moving slides.
- **One wash moment:** reserve `--soft-purple-wash` for the memorable quote or
  prompt slide. Do not make it the default panel style.
- **Brand marks:** content slides may place the black Micron logo on the
  fixed-stage pseudo-element (`.slide-stage::after`) or use the text fallback.
  The verifier accepts stage-level marks.

The reference deck is intentionally more elaborate than the small data example:
it is the standard for managerial training / enablement decks in `micron-light`.

---

## 5. Typography

```css
:root {
  --font-display: "Plus Jakarta Sans", "Micron Basis", system-ui, sans-serif;
  --font-body:    "Plus Jakarta Sans", "Micron Basis", system-ui, sans-serif;
  --font-mono:    "JetBrains Mono", ui-monospace, Menlo, monospace;
  --scale-ratio: 1.333;
}
```

Type roles:

- **Section label / kicker** — mono, uppercase, ~22px, accent color, with a 60×4 underbar in accent. Lives top-left of the content frame. Anchors the eye and gives the deck rhythm.
- **H2** — display sans, 800 weight, 46–72px range, line-height 1.08, max ~30ch. **One italic accent word** in `--micron-accent` carries the meaning.
- **Body / supporting clause** — display sans, ~22px, ink. Short. Period at the end.
- **Italic closer** — italic display sans, slightly larger than body, ink at 92% opacity. The slide's emotional resolution. Optional but earns its place often.
- **Footer** — mono, uppercase, muted (~54% ink). Deck-level identity, not a tagline.
- **Mono is reserved** for: kickers, footers, action lines (`Open · Type · Watch.`), and small UI labels. **Never body copy.**

Restraint rules that the brand depends on:

- **Sentence case** for headlines. Never Title Case.
- **Left-align** all text. No centered body copy. Centered single-line italic closers are the only exception.
- **Periods are loud.** Short declarative sentences with full stops. The brand's voice. ("Three steps. Forever.")
- **One italic accent word per H2.** Never two. Never zero. The italic + purple together carry the tone — neither alone is enough.
- **Max 2–3 weights per slide.** Usually 800 (H2), 400/500 (body), 600 (mono).

---

## 6. The restraint principles

These are *the* rules of this theme. They apply whether you're building a data slide, a training slide, or a poster slide.

### 6.1 Hairlines, not boxes

A page covered in rounded rectangles looks spreadsheety. Use **1px hairline rules** (`--hairline`) and **whitespace** to do the gridding work cards used to. A vertical hairline split makes the same comparison feel as a split-card without the borders.

If you reach for a card, ask: *would a hairline + whitespace work here instead?* If yes, use the hairline.

### 6.2 Card budget for the entire deck: 1

A whole deck should have **at most one visible panel** — almost always the soft-purple wash, used once at the climactic moment. If you find yourself drawing a second panel, you're telling two climaxes. Cut one.

The wash is not chrome. It is a focal point. Don't frame every slide in it.

### 6.3 White is the protagonist

The 16:9 stage is white. The browser viewport outside the stage is `--letterbox` (a near-white #eef0f4) so the slide reads as a printed sheet on a desk. Don't fill the slide with grey to "soften" it — use whitespace.

`--gray-f` is allowed for the rare grouping panel, but never as a full-slide background.

### 6.4 Each slide answers one question

If you can't write the slide's question down on a sticky note, the slide hasn't earned its place. Two slides answering the same question = merge or kill one.

### 6.5 Variety map across the deck

No two adjacent slides should share the same layout signature. If slide 03 is a three-row stack, slide 04 is not another three-row stack. Restraint at the slide level + variety at the deck level keeps the rhythm awake.

### 6.6 Refuse decoration

No drop shadows on text. No glow on type. No gradients behind body. No 3D charts. No emoji used as bullet markers. No clipart. No floating card stacks.

The accent's job is to make one moment loud, and silence is the rest of the deck's job.

---

## 7. Brand chrome (what every content slide reuses)

These are *available* — not mandatory. Use the ones the slide actually needs.

- **Top progress bar** — 3px, accent color, with a soft accent glow. Spans the viewport.
- **Right-edge nav dots** — vertical column at viewport right, muted dots, accent on active.
- **Section-label kicker + 60×4 underbar** — top of the content frame.
- **Italic closer** — bottom of the content frame, optional.
- **Micron logo** — bottom-right of the stage on content slides. Black logo, full opacity. Title slides use the logo inline in their footer block instead.
- **Footer text** — optional. Mono uppercase, muted, bottom-left. Use only if the deck-level identity needs to be visible per slide; many decks read better without it.

**Hidden in this theme**: Micron's `.module-rail` (the vertical chapter navigation) is set to `display: none` for light decks. Don't draw one — the top progress bar + right nav dots are the wayfinding.

---

## 8. Stage geometry

Light theme decks are **fixed-stage**: a 16:9 white canvas, centered in a `--letterbox` viewport, with a subtle drop shadow.

Recommended stage dimensions: **1600 × 900** (or 1280 × 720 for smaller decks). Pick once per deck and stick with it.

Why fixed-stage: a white slide that stretches edge-to-edge in a 1440×900 browser feels like a webpage, not a slide. The letterbox treatment makes it read as a printed sheet — and is what makes premium audiences trust the deck on first glance.

The non-negotiable from the skill (`Fixed-stage decks must expose a real 16:9 slide canvas`) applies here. **Do not hand-roll it** — paste the shared `references/runtime/fixed-stage.md` overlay (after `viewport-base.css`) and set `--stage-w/--stage-h`. That file is the single source for the fixed-stage CSS + scale JS; micron-light always uses it.

Decks copied from the Copilot precedent may wrap each slide's content in an
explicit `.slide-stage`. That is acceptable when the wrapper stays 1600×900,
letterboxes correctly, and keeps the canonical controller (`window.presentation
= new SlidePresentation()`).

---

## 9. Motion

Single ease, single duration, single transform pattern.

```css
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
--duration-normal: 0.6s;

.reveal { opacity: 0; transform: translateY(22px);
  transition: opacity .6s var(--ease-out-expo),
              transform .6s var(--ease-out-expo); }
.slide.visible .reveal { opacity: 1; transform: none; }
```

Stagger by ~70ms via `:nth-child` delays. Six steps max — beyond that, the slide is doing too much.

No bouncing eases. No spring physics. No parallax. The motion is editorial — it ushers content in, then gets out of the way.

---

## 10. Gotchas

The recurring failure modes when building in this theme:

- **Purple in the wrong place.** Headline is purple → fail. Body has a purple word that isn't italic → fail. Accent on chrome (border, divider) → wastes the budget. Accent reads as emphasis only because it's rare; spending it on furniture kills the signal.
- **Cards-on-cards.** A 3-card use-cases slide followed by a 3-card steps slide followed by a 3-card pricing slide all blur together. Replace one with manuscript rows or a hairline split — variety map saves the deck.
- **Accent word on H2 is bold but not italic.** The italic is half the brand. Bold purple alone reads as a typo.
- **Recoloured logo.** The micron logo ships in black or white only. Don't tint it accent. Don't add effects. The Anthropic-style "purple Micron" is not a thing.
- **Letterbox color drift.** When the body background is pure white (`#fff`), there's no visible distinction between viewport and stage. The stage shadow + the slightly-grey letterbox (`#eef0f4`) do the work — keep both.
- **Mono creeping into body copy.** Mono is for kickers, footers, action lines (verbs joined by `·`), and small ALL-CAPS labels. The moment you set a paragraph in mono, the slide loses its editorial register.
- **Centered body copy.** The brand is left-aligned. Centered text reads as a poster, not an editorial page. The exceptions are short single-line italic closers and stat-row hero numbers — which usually only earn centering once or twice in a deck.
- **Drawing the `.module-rail` rail.** Light theme hides it (`display: none`). Use the top progress bar + right nav dots for wayfinding instead.
- **More than one wash per deck.** The soft-purple wash works because it's rare. Two washes = no focal point.
- **Sentence-end punctuation drift.** "Three steps · Forever" feels conversational; "Three steps. Forever." feels brand. The full stops are the voice.

---

## 11. Voice the type carries

Sample H2s that fit this theme — note the cadence:

- *Three steps. **Forever.***
- *A different **kind** of help.*
- *Same name. Different **software**.*
- *What to type **tomorrow morning**.*
- *Anyone. Anything. **Today**.*

Note the ingredients: short clauses, period-after-each, one italic+purple accent word that flips the sentence's meaning if removed. If you find yourself writing an H2 longer than ~10 words, break it.

---

## 12. Data viz (when the deck has charts/tables)

The theme stays calm even in data slides:

- **Chart background**: white. Never a panel.
- **Grid / dividers**: `--hairline` (1px).
- **Base data**: `--gray-d` (so it reads but recedes).
- **Suppressed data**: `--gray-c`.
- **Highlight**: `--micron-accent` — exactly one series, one bar, one cell, or one point per chart.
- **Direct labels** beat legends; legends beat colour-only encoding.
- **Tabular numbers**: `font-variant-numeric: tabular-nums`. Always.
- **No 3D, no shadows, no gradients inside charts, no icons-as-data.**
- **Tables**: hairline row dividers; one accent row max; left-aligned text; right-aligned numbers; never full-row colour fills.

If the chart needs more than one accent to read, the chart is doing too much — split it.

---

## 13. Imagery (when the deck has images)

Light decks tolerate imagery if it's crisp and inspectable:

- Product render on white or `--gray-f`
- Bright manufacturing / lab environment
- Macro wafer detail as cropped accent
- Light cinematic people imagery, natural

Avoid: dark cinematic image as full-bleed background, blurry atmospherics, busy image with overlay text, generic stock.

If using an image, give it room. One image per slide, max. The image is a quote — let it speak alone.

---

## 14. Quick acceptance checklist

Before you ship a slide:

- [ ] White stage, ink (not pure black) headline
- [ ] One italic + purple accent word in the H2
- [ ] At most one panel anywhere in the deck (the soft-purple wash)
- [ ] Hairlines used wherever a divider is needed (no thick rules)
- [ ] Section-label kicker present, with underbar
- [ ] Logo bottom-right (content slides), full opacity, black variant
- [ ] No centered body copy; sentence case headlines
- [ ] Periods at the end of declarative lines
- [ ] Mono only on chrome (kicker / footer / action lines / ALL CAPS labels)
- [ ] At most one accent highlight per chart
- [ ] No two adjacent slides share a layout signature

If a slide passes this list, it'll feel like Micron light — regardless of what its actual layout is.

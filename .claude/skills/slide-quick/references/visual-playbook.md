# Slide Visual Playbook

Concrete materials for making decks look designed, not "just boxes." Applies to
the native PptxGenJS engine here and (the universal parts) to `html-slides`.
The fast path should reach for these instead of flat panels + bullets.

## The bar (what passes)

Judge every deck as if it's presented where failure costs millions or a career — a
McKinsey/BCG boardroom, a world-class professor's seminar, a Fortune-500 pitch — or a
billion-view YouTube lesson that must be genuinely fun and engaging. Decks must hit this
across the full STYLE range, each a distinct, intentional look (never a recolour):

- **Premium / professional** — restraint, hairlines, one accent, generous whitespace,
  crisp data exhibits. (Consulting, exec, investor.)
- **Playful** — bold blocks, warm palette, big friendly type, energy — still composed.
- **Hand-drawn** — sketch/marker texture, handwritten headings, doodle arrows; charming,
  not childish. (Education, explainers, YouTube.)

NO AI SLOP (auto-fail, redo it): rows of equal cards, an accent line under the title,
emoji-as-icons, everything centred, gradient soup, decorative bars that explain nothing,
clip-art overload, filler copy, three-bullets-forever. "Fine" is not good enough.
Stay effortless: the skill does the heavy lifting — minimal user input, excellent deck.

## The 10 moves (impact-for-effort order)

1. **One action title + one visual per slide.** Title is a full-sentence
   assertion (≤15 words, 2 lines), body proves it with ONE chart/diagram/icon
   row/image/big-number exhibit. Kill bullet lists. (Minto Pyramid Principle.)
   For metrics, the native engine has `B.stat` (hero value + label + colored
   delta) and `B.statBand` (2–4 KPIs, hairline dividers, NO card chrome — a row
   of bordered cards is slop). The number is the protagonist. For a series (trend
   over time, ranking across categories) use `B.chart` — see "Charts" below.
2. **Real icons, not boxes or emoji.** Use an open icon set; render SVG→PNG and
   `addImage`. See the pipeline below.
3. **Generous whitespace — leave ~20–25% of the slide empty.** Cut 30–40% of
   content before shrinking type. Empty space reads as confidence.
4. **Enforce the type scale (floors below). Never shrink body to fit** — split
   the slide instead.
5. **3-colour palette, 60-30-10.** Dominant 60% / secondary 30% / accent 10%.
   Pick from the ready palettes below; verify text contrast ≥ AA.
6. **One decorative SVG per slide, code-generated** — soft gradient blob, hairline
   grid, corner accent. Zero latency, no licence. (Already have glow PNGs.)
7. **Open illustrations for hero/section slides only** (1 per ~8 slides) — unDraw,
   Humaaans, Open Doodles/Peeps (CC0). Too many = clip-art.
8. **Image-led layouts.** Full-bleed or half-bleed image/illustration (left 50%),
   text on the right. Asymmetry + focal hierarchy beats side-by-side boxes.
9. **AI image generation: hero art only**, max 1/deck, no text in the image
   (misspells), slow + inconsistent. Use SVG/code for anything with labels.
10. **Copy = concrete numbers + contrast.** Every number gets a unit and a
    comparison ("↓ 28% vs last quarter"). Title states the "so what", not a topic.
    (Cole Nussbaumer Knaflic.)

## Hard numbers (enforce as floors)

| Thing | Floor / rule |
|---|---|
| Title | ≥ 32pt (40 preferred), weight 600+ |
| Body / evidence | ≥ 20pt, weight 400 (never Thin/Light) |
| Caption / label | ≥ 14pt |
| Title length | ≤ 15 words, ≤ 2 lines |
| Colours | 3 roles, 60-30-10 |
| Whitespace | ~20–25% of slide empty |
| Body text contrast | ≥ 4.5:1 (AA); large text ≥ 3:1 |
| Icon raster | ≥ 256px via sharp |
| AI images | ≤ 1/deck, hero only, no text-in-image |
| Bullet lists | 0 — assertion + one visual instead |

## PptxGenJS asset pipeline (icon/illustration → slide)

```js
// 1. SVG source: @tabler/icons or @phosphor-icons (MIT) -> SVG string
//    illustrations: download unDraw/Humaaans/Open Doodles SVG, strip width/height
// 2. SVG -> PNG (PowerPoint SVG support is uneven; always rasterize)
const sharp = require("sharp");
const png = await sharp(Buffer.from(svgString)).resize(256, 256).png().toBuffer();
const data = "image/png;base64," + png.toString("base64");
// 3. place
slide.addImage({ data, x: 0.3, y: 0.3, w: 0.5, h: 0.5 }); // fresh options each call
// Decorative blobs: generate once at build, store as a base64 constant (like glows).
```
Licences: Tabler/Phosphor = MIT; unDraw = free (no redistribution); Humaaans /
Open Doodles / Open Peeps = CC0. Brand logos: Simple Icons.

## Charts (Knaflic declutter) — `B.chart` in the native engine

A real, editable chart beats a box of bullets and a faked-with-shapes "chart" both.
The engine's `B.chart(s, type, series, opts)` emits a native PptxGenJS chart with the
clutter already removed, so good is the default:

- **No chart title** — the slide's action title already carries the message.
- **No gridlines, no chart border** — pure noise; they raise cognitive load.
- **Value axis hidden; numbers labeled directly on the data** — the reader's eye
  goes to the mark, not back to an axis.
- **One highlight colour** — the series/bar that matters is the accent; the rest are
  muted, so attention lands on the point. (`opts.highlight` = the index to accent.)
- **Types:** `'col'` vertical (change over a few periods), `'bar'` horizontal (ranking
  many categories — labels read left-to-right), `'line'` (trend over many periods).

Rule of thumb: ≤ ~5 categories and a "which is biggest / where did it jump" message →
`col` with the key bar highlighted. Many ranked items → `bar`. A continuous trend →
`line`. Never use pie/3-D/area for a serious deck. (Knaflic, *Storytelling with Data*,
ch. 3–4: declutter, then draw the eye with one deliberate colour.)

## Ready palettes (60-30-10; all text pairs pass WCAG AA)

**Dark Pro** — dominant `0F1623` (bg) · secondary `1E2D40` (panels) · accent
`3B82F6` (titles/icons) · text `F1F5F9` · muted `94A3B8`. (text 13.5:1; accent 4.7:1)

**Light Clean** — dominant `FFFFFF` · secondary `F1F5F9` · accent `4338CA` ·
text `1E293B` · muted `64748B`. (text 16:1; accent 7.2:1)

**Vibrant** — dominant `121212` (not pure black) · secondary `1E1E2E` · accent
`06BEE1` · text `FFFFFF` · muted `A1A1AA`. (text 19.6:1; accent 5.1:1)

## Font pairings (Google Fonts; native engine substitutes if not installed)

- **Inter 600 / Inter 400** — clean modern, dark or light (Linear/Vercel feel).
- **Playfair Display Bold / Inter 400** — authoritative, light/consulting decks.
- **Poppins 600 / Roboto Flex 400** — geometric friendly, dark product decks.

(Native engine currently uses Calibri/Consolas for guaranteed availability. To use
the above in `.pptx`, install the TTF in the environment or embed; otherwise they
substitute — keep Calibri as the safe fallback.)

## Sources

Minto Pyramid Principle; Nancy Duarte / Garr Reynolds (whitespace, one idea);
Cole Nussbaumer Knaflic, *Storytelling with Data* (copy); McKinsey/BCG slide
conventions (deckary.com); Tabler/Phosphor/Lucide (open icons); unDraw, Humaaans,
Open Doodles (illustrations); Haikei, fffuel.co (SVG generators); Open Color /
Tailwind / Coolors (palettes); WebAIM (contrast); PptxGenJS images API (SVG→PNG).

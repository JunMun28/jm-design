# Editorial serif

Magazine thought-leadership style. A warm paper canvas; a high-contrast serif display voice; generous leading and wide margins; antique-gold hairlines that organize the page; one deep-ink section divider and exactly one pull-quote moment per deck. Quiet, literary, print-light, confident.

Reference lineage: literary essay magazines and longform features (The New York Times Magazine, The Atlantic, Aeon, Increment), editorial book design, and the high-contrast revival serifs (Fraunces, Newsreader).

## When to choose this theme

- Thought-leadership essays, opinion pieces, manifestos, points of view.
- Narrative decks that argue a position rather than report a status.
- Brand / strategy storytelling where a literary, considered voice is the point.
- Keynote essays read in a calm room, on a light projector, or circulated as a standalone read.

## When not

- Dense tabular reporting or financial reviews (use a Micron theme; the wide leading wastes the room).
- Dashboard / multi-exhibit data decks — this theme rewards one quiet exhibit, not six.
- Dark "midnight demo" product launches (use aurora-glass or keynote-vivid).
- High-energy workshops (use playful) or sketchnote teaching (use hand-drawn).

## Tokens (frozen)

Paste `themes/editorial-serif/tokens.css` first.

| Hex / value | Token | Role | Contrast on #FBFAF6 |
|---|---|---|---|
| `#FBFAF6` | `--bg` | warm paper canvas | — |
| `#F3F0E7` | `--surface` | solid ground for exhibits + cards — **never a gradient** | — |
| `#1A1A1A` | `--ink` | primary text + display | ~15.5:1 |
| `#5A564E` | `--ink-muted` | secondary text, ledes, captions | ~6.6:1 |
| `#B08D57` | `--accent` | antique gold — hairlines, rules, numerals, small marks (rgb 176,141,87) | ~3.9:1 — see accent rule |
| `#E3DECF` | `--rule` | hairline borders / gridlines | decorative |
| `#2B2B28` | `--deep` | deep-ink section-divider panel + folios | — (paper on it: ~13:1) |
| `#B08D57` | `--chart-1` | gold — the focal data series | — |
| `#1A1A1A` | `--chart-2` | ink — the comparison series | — |
| `#9A958A` | `--chart-3` | warm grey — context series | — |
| `#CFC9BA` | `--chart-4` | pale grey — faint background bars | — |

```
--font-display: "Fraunces"        (headlines, pull quotes, drop caps, numerals)
--font-body:    "Newsreader"      (body, ledes, subtitles, side notes)
--font-mono:    "IBM Plex Mono"   (kickers, folios, legends, axis chrome, badges)
```

All three load from Google Fonts via the `@import` at the top of tokens.css. Fraunces is the high-contrast display serif and Newsreader the readable body serif — do **not** swap in another family unless you also load it. (Playfair Display / Source Serif 4 are sanctioned alternates if you change the `@import` to match.)

## Typography

- **The high-contrast serif is the whole identity.** Fraunces at the optical display size gives thick-thin stroke contrast and real italics; that contrast is the theme. Set h1/h2/h3 in Fraunces 600, line-height ~1.06, tracking −0.012em (tighter, −0.025em, on the cover title).
- **Fixed px sizes only — never vw-clamped type.** Desktop scale: cover title ~104px, section headline ~84px, content h2 62px, body 24–27px, mono chrome 18–20px. Small screens get their own media query with smaller *fixed* px values.
- Newsreader 400 for body, with **generous leading** (1.5–1.62). Ledes and subtitles run in *italic* Newsreader in `--ink-muted` — the italic is a signature, not decoration.
- IBM Plex Mono 500, uppercase, 0.12–0.22em tracking for every kicker, folio, legend, axis label, and badge. Mono is the connective chrome that keeps the serif from feeling like a Word document.
- One drop cap per essay slide via `.dropcap` (gold, Fraunces, on the lede paragraph only). Two drop caps on one slide is a bug.
- Readability floors at desktop: body/bullets/table cells ≥ 24px, labels/captions/legends ≥ 20px (axis text and the "Illustrative" badge included), slide h1/h2 ≥ 60px. Footer/folio chrome may run 14–18px.

## Accent rule

- `--accent` (#B08D57, antique gold) is for **hairlines, rules, numerals, the drop cap, italic emphasis words, the quote mark, and small marks** — restrained, never a large filled area, never body text.
- Gold on the paper canvas is ~3.9:1, **below the 4.5:1 floor** — so gold is never the only thing carrying a sentence's meaning. Use it for the *emphasis* word inside an ink headline (`<em>` in display type reads at large size), for numerals, and for chrome. Running body text and any text the audience must read is always `--ink` or `--ink-muted`.
- The `accent_max_per_slide` budget is **8**. The verifier counts every element whose computed color/border/background/fill/stroke contains `176, 141, 87` (all accent marks inside one `<svg>` count as a single hit). The example runs 2–6 per slide (kicker rule, drop cap, a numeral column, one chart series, the badge).
- On the deep-ink section divider, gold flips to the *bright* accent on dark — the italic emphasis word and the ghost numeral — and paper (`--bg`) carries the headline.

## Layout grammar

- Outer margins ~104px (`--margin-outer`); 84px vertical padding; content max-width ~1180px. **Whitespace is the luxury** — do not fill the page.
- Every slide carries a mono **folio strip** at the foot (deck name left, section right) above a 1px `--rule` hairline. It reads like a running head in a magazine.
- One message and one visual protagonist per slide. No slide-internal scrolling; split overflow into another slide.
- Density caps: cover = masthead + kicker + title + one italic subtitle. Essay slide = headline + ≤2 short paragraphs + one side note. Tenets ≤ 4 rows. Data = 1 exhibit + 1 takeaway. Pull quote = 1 quote, ≤3 display lines.
- Archetypes shipped in `example.html`: cover (masthead rule + gold "Essay №"), essay (drop-cap body column + gold-rule side note), numbered tenets (Fraunces numerals on hairline rows), data exhibit (grouped bars on the solid surface), pull quote (the one big quote moment), section divider (deep-ink panel + ghost Roman numeral), closing (sign-off rule).

## Signature details

1. **Antique-gold hairlines.** A 1px gold rule before every kicker; gold or `--rule` hairlines separating tenet rows; a hairline above every folio. The rules organize the page the way a magazine grid does — they are structure, not ornament.
2. **The pull-quote moment.** Exactly **one** slide per deck is a large Fraunces pull quote with a gold quote mark and a gold-rule mono attribution. It is the emotional center; do not dilute it with a second quote slide.
3. **Drop cap.** The lede paragraph of an essay slide opens with a gold Fraunces drop cap (`.dropcap`). One per slide, lede only.
4. **Italic emphasis in display type.** A single word inside a headline or quote goes gold italic (`<em>`) — "the case for *slow* software," "skip the *argument*." At most one emphasis word per headline.
5. **Deep-ink divider.** Section dividers invert to the `--deep` panel with a giant low-opacity gold Roman-numeral ghost index. It gives the deck a chapter break and is the only dark surface — one or two per deck, never more.

## Chart / surface rule

- Charts and data exhibits sit on the **solid `.surface`** (`--surface`, #F3F0E7) — never on the paper canvas alone, and **never on any gradient** (`forbid_chart_on_gradient: true`; the verifier walks the ancestors of `svg[role="img"]`).
- Inline SVG only, in the editorial chart palette: gold (`--chart-1`) for the focal series, ink (`--chart-2`) for the comparison, warm/pale grey (`--chart-3/4`) for context. **No SVG gradients** — they break in overview clones, which strip `id`s — and no gradient fills anywhere.
- Axis labels and legend: IBM Plex Mono, ≥ 20px, `--ink-muted`. Gridlines in `--rule`. Put the key number in value labels on the bars/points so the chart proves its own point.
- Every chart needs a one-line takeaway beside it (a hard fail in `standalone` mode). The action title carries the figure; the takeaway names the so-what.

## Made-up data

- Any invented figure, sample chart, or paraphrased quote carries `data-illustrative="true"` **and** a visible "Illustrative" label (the gold pill on the exhibit, the word "illustrative" in the attribution / takeaway). The verifier fails an unlabeled placeholder.

## Export mode

This theme is paper-light with no blur or backdrop-filter, so export is nearly free. Set `<html data-export="true">` before capture and `.reveal` elements are forced visible (opacity/transform reset). Charts already live on the opaque surface and need no special handling.

## Anti-patterns

| Don't | Why |
|---|---|
| A sans-serif headline, or a low-contrast serif (Georgia/Lora) | The high-contrast Fraunces display *is* the theme; a flat serif makes it generic |
| Gold (`--accent`) as running body text or the sole carrier of meaning | ~3.9:1 on paper — below the floor; use `--ink`/`--ink-muted` for anything read in full |
| Two pull quotes, or two drop caps on one slide | The quote and the drop cap are rationed accents; repeating them kills the reward |
| A chart on the bare paper canvas, on a gradient, or with SVG gradient fills | Verifier failure + weak figure-ground; always use the solid `.surface` and flat fills |
| Filling the page edge-to-edge | Editorial whitespace is the luxury; crowding reads as a memo, not a feature |
| More than one or two deep-ink dividers | The dark panel is a chapter break; overuse turns it into a dark theme |
| vw-clamped type | Type must be fixed px at each breakpoint |
| Title-case headlines / topic-label titles ("Our results") | Use sentence-case action titles that assert the takeaway; the verifier lints this |
| A cool grey or pure-white background | The warmth of `--bg`/`--surface` is the paper; cool neutrals break the magazine feel |
| Body lines set tight (line-height < 1.45) | Generous leading is the reading experience; tight leading fights the serif |

## Verifier notes

- Run: `uv run scripts/verify.py themes/editorial-serif/example.html --theme editorial-serif --require-shell --check-overview --fail-on-warnings`
- Required tokens: `--bg --ink --ink-muted --accent --rule --font-display --font-body --font-mono`.
- The accent lint resolves `#B08D57` to `rgb(176, 141, 87)` and counts every element carrying it in any paint property; all accent elements inside one `<svg>` count as a single hit. Budget ≤ 8 per slide.
- `require_assertion_titles: true` and `max_body_words_per_slide: 90` (×1.5 in `standalone` mode). Keep headlines as full-sentence assertions and watch the body word count on essay slides.
- Keep decorative text (`.qmark`, `.ghost-index`, the kicker `::before` rule, legend swatches) `aria-hidden="true"` where it carries no reading meaning.
- Content is vertically centered with an absolutely-positioned folio; when a headline grows to 3 lines, trim the body so the stack still clears the folio (no internal scroll). The example was tuned this way — re-check screenshots after any copy change.

## Verify config

```json
{
  "required_tokens": ["--bg","--ink","--ink-muted","--accent","--rule","--font-display","--font-body","--font-mono"],
  "accent_rgb": "176, 141, 87",
  "accent_max_per_slide": 8,
  "logo_pattern": null,
  "require_logo_on_content_slides": false,
  "forbid_chart_on_gradient": true,
  "headline_contrast_min": 4.5,
  "palette_lock": true,
  "require_assertion_titles": true,
  "max_body_words_per_slide": 90
}
```

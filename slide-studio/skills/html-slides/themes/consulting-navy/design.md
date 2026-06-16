# Consulting navy

Boardroom strategy recommendation. Navy structure on a white sheet; an authoritative serif headline voice over a clean sans body; blue rationed for data and accents; one gold emphasis per slide and no more; action titles that state the takeaway; a source line under every exhibit. Crisp, sourced, decision-ready.

Reference lineage: McKinsey/BCG/Bain board decks, IB pitchbooks, FT/Economist exhibit discipline, navy-and-white annual-report covers.

## When to choose this theme

- Board strategy reviews, recommendations, and decision/approval decks.
- Management consulting deliverables: situation → findings → recommendation → ask.
- Investor or executive readouts where figures must be sourced and defensible.
- Any "navy on white, serif headline, one chart that earns its place" moment.

## When not

- Dark-room product launches or vision keynotes (use `aurora-glass`).
- Warm workshop / training energy (use `playful` or `guided-learning`).
- Brand-locked Micron reporting (use a Micron theme).
- Decks with no data or no argument — this theme's discipline is wasted on pure narrative.

## Tokens (frozen)

Paste `themes/consulting-navy/tokens.css` first.

| Hex / value | Token | Role | Contrast |
|---|---|---|---|
| `#FFFFFF` | `--bg` | white deck canvas | — |
| `#F5F7FA` | `--surface` | pale slate — **solid** ground for exhibits + cards | — |
| `#0A2540` | `--ink` | navy — body + headlines | 15.5:1 on white |
| `#5A6B7B` | `--ink-muted` | secondary text | 5.5:1 on white |
| `#1B6EC8` | `--accent` | blue — data series + accents | 5.1:1 on white, 4.8:1 on surface |
| `#C8A45B` | `--accent-2` | gold — ONE rationed emphasis per slide; **fills/rules only** | 2.4:1 on white (never text on white), 6.6:1 on navy |
| `#DCE3EA` | `--rule` | hairline borders + gridlines | decorative |
| `#0A2540` | `--navy` | cover / section background | — |
| `#FFFFFF` | `--ink-on-navy` | text on navy | 15.5:1 |

Chart tokens (solid surfaces only): `--chart-1 #1B6EC8`, `--chart-2 #5B9BE0`, `--chart-3 #0A2540`, `--chart-gold #C8A45B`.

```
--font-display: "Source Serif 4"   (authoritative headlines, card heads, section statements)
--font-body:    "Inter"            (body, ledes, findings, table cells)
--font-mono:    "IBM Plex Mono"    (eyebrows, indices, axis chrome, table headers, footers, source lines)
```

All three load from Google Fonts via the `@import` at the top of tokens.css. Do **not** reference any other family unless you also load it.

## Typography

- **Fixed px sizes only — never vw-clamped type.** Desktop scale: cover h1 ~96px, section h2 ~76px, content h2 60px, body 24px, mono chrome 20px. Small screens get their own media query with smaller *fixed* px values.
- Source Serif 4 600 for h1/h2/h3, tracking −0.01em to −0.02em, line-height ~1.08. The serif is the theme's authority — headlines and card heads are serif; everything else is sans or mono.
- Inter 400 for body and findings; secondary copy in `--ink-muted`.
- IBM Plex Mono 500–600, uppercase, 0.04–0.16em tracking for every eyebrow, index, axis label, legend, table header, footer, and source line. Mono is the connective chrome.
- Readability floors at desktop: body / bullets / `td` / `th` ≥ 24px, labels / captions / source lines ≥ 20px (axis text included), slide h1/h2 ≥ 60px. Footer/nav chrome may run 12–16px. The `.source` line and `.illus` tag are **not** chrome — keep them ≥ 20px and never wrap a source line in a `<p>` (a `<p>` triggers the 24px floor; use a `<div class="source">`).

## Accent rule

- **Blue `--accent` (#1B6EC8) is the only data/accent color; gold `--accent-2` is the single emphasis.** Blue carries chart series, card top-borders, finding rules, inline stat numbers, and the eyebrow. The verifier counts every element whose computed color/border/background/fill/stroke contains `27, 110, 200`; budget ≤ 10 per slide (all blue marks inside one `<svg>` count as a single hit). Keep inline `.num` stats navy when a slide is dense, or you will blow the budget.
- **Gold is rationed to exactly one emphasis per slide and is never text on white** (2.4:1 — fails contrast). Use gold as a fill, a rule, a left-edge focus marker, a single highlighted bar, or text on the navy ground (6.6:1). Two gold elements on one white slide is a bug.
- Headlines and body are always navy `--ink`. Gold and blue are accents, never the headline color.

## Layout grammar

- Outer margins ~92px (`--margin-outer`); 76px vertical padding; content max-width ~1180px.
- One message and one visual protagonist per slide. No slide-internal scrolling.
- Every content slide: mono eyebrow → serif action headline → (gold accent-rule) → payload, plus a mono footer strip (deck name left, label right).
- Density caps: cover = 1 heading + 1 subtitle + meta. Executive summary = 1 headline + 3 findings. Data slide = 1 exhibit + 1 source line + 1 takeaway. Three-move slide = exactly 3 cards, one lead. Closing = 1 ask + ≤3 next-step rows. Executive word budget ≤ ~70 words/slide.
- Archetypes shipped in `example.html`: cover (navy), executive summary (lede-as-headline + numbered findings), data-exhibit (blue bars + one gold bar on a solid surface), section divider (navy + ghost serif index), three-moves (column cards, one gold lead), data-table (navy header + gold focus row), closing/next-steps (numbered owner+timing rows).

## Chart / surface + source-line rule

- **Exhibits sit on the solid `.surface` (`#F5F7FA`) or a navy-headed table — never on a gradient.** `forbid_chart_on_gradient` is on; keep every wrapper between an `svg[role="img"]` and its `.slide` free of gradient backgrounds. This theme has no gradients at all, by design.
- Inline SVG only for the shipped primitives (a small bar strip). Use a real charting library for anything with axes, thresholds, multi-series, or tooltips.
- One blue series carries the comparison; **one gold mark** is the focus (the latest bar, the target row). Axis labels, legends, and table headers: IBM Plex Mono, ≥ 20px, `--ink-muted` or `--ink-on-navy`.
- **Every exhibit carries a source line** directly beneath it (`<div class="source">Source: … </div>`), mono, ≥ 20px. Made-up figures additionally carry `data-illustrative="true"` on the exhibit **and** a visible gold `.illus` "Illustrative" tag — the verifier fails unlabeled placeholders.

## Action titles

- Every content headline is a full-sentence assertion that states the takeaway, in **sentence case** (capitalize only the first word + proper nouns; the verifier fails a headline with ≥2 title-cased meaningful words after the first). Data slides put the **key number in the headline**. Covers and section dividers are exempt.
- Read the title storyline the verifier prints top to bottom — the headlines alone must retell the argument (situation → gap → recommendation → build → ask).

## Anti-patterns

| Don't | Why |
|---|---|
| Gold as headline or body text on white | 2.4:1 — fails contrast; gold is fills/rules/markers, or text on navy only |
| Two gold emphases on one slide | The emphasis is rationed — one gold mark per slide, full stop |
| Blue on every stat + every border + every label | Blows the ≤10 accent budget; keep dense-slide `.num` stats navy |
| A gradient anywhere (cover, card, chart wrapper) | This theme is flat navy/white; gradients break the authority and the chart-on-gradient lint |
| Chart or table on anything but `.surface` / navy header | Verifier failure + weaker contrast; exhibits need a solid ground |
| An exhibit with no source line | Boardroom decks cite; the source line is mandatory under every exhibit |
| Unlabeled made-up figures | `verify.py` fails placeholders without `data-illustrative` + a visible "Illustrative" tag |
| Title-cased Headlines Like This | Use sentence case; the verifier fails ≥2 title-cased words after the first |
| Topic-label titles ("Results", "Next steps") | Action titles assert a takeaway; data titles carry the number |
| vw-clamped type | Type must be fixed px at each breakpoint |
| Sans-serif headlines | The serif headline is the theme's voice; body stays sans, chrome stays mono |
| `<p class="source">` | A `<p>` triggers the 24px floor; wrap source lines in `<div class="source">` (20px caption floor) |

## Verifier notes

- Run: `uv run scripts/verify.py themes/consulting-navy/example.html --theme consulting-navy --require-shell --check-overview --fail-on-warnings`
- The accent lint resolves `#1B6EC8` to `rgb(27, 110, 200)` and counts every element carrying it in any paint property; all blue marks inside one `<svg>` count as a single hit. Budget ≤ 10/slide.
- `forbid_chart_on_gradient: true`, `palette_lock: true`, `headline_contrast_min: 4.5`, `enforce_sentence_case_headlines: true`, `require_assertion_titles: true`, `max_body_words_per_slide: 70` (×1.5 in `standalone` mode).
- Headline floor is 60px for h1/h2 — the 60px content-h2 token is the floor, not a suggestion.
- Eyebrows use `.eyebrow`; footers use `.footer`; both are exempt small-chrome. Keep decorative text (`.ghost-index`) `aria-hidden="true"`.

## Verify config

```json
{
  "required_tokens": ["--bg","--ink","--ink-muted","--accent","--accent-2","--rule","--font-display","--font-body","--font-mono"],
  "accent_rgb": "27, 110, 200",
  "accent_max_per_slide": 10,
  "logo_pattern": null,
  "require_logo_on_content_slides": false,
  "forbid_chart_on_gradient": true,
  "headline_contrast_min": 4.5,
  "palette_lock": true,
  "enforce_sentence_case_headlines": true,
  "require_assertion_titles": true,
  "max_body_words_per_slide": 70
}
```
</content>

# Slide Style Research — New Theme Lineup

Date: 2026-06-12
Scope: proposed new themes for the `html-slides` multi-theme registry.
Status: research only. Nothing is built yet. Waiting for approval.

---

## 1. TLDR

We researched the slide-design landscape and distilled it into ten proposed themes. Each theme owns one clear job that the current five themes do not cover: dark luxury, quiet-luxury editorial, financial print, Swiss poster, terminal tech, glassy product launch, riso print craft, warm 70s storytelling, academic lecture, and photo documentary. Twenty-five other directions were considered and dropped — most were merged into a stronger sibling or overlapped an existing theme. An adversarial reviewer checked every spec for contrast math, font delivery, and verifier rules. Four themes passed review as written (salmon-ledger, phosphor-terminal, aurora-glass, seventies-sunset). Six have known blockers with concrete written fixes (gilded-noir, ivory-atelier, zurich-poster, riso-overprint, oxford-monograph, field-atlas). All issues are fixable on paper before any build starts.

| Theme | Role | One-line look | Best for | Reviewer verdict + scores |
|---|---|---|---|---|
| Gilded noir | luxury-showcase | Warm matte black, engraved gold hairline frames, serif display, jewel-tone charts | Premium reveals, brand showcases, awards | Not approved (fixable) — distinct 8, feasible 8 |
| Ivory Atelier | editorial-lookbook | Warm ivory paper, huge light Fraunces, hairlines, clay accents, espresso beat slides | Brand strategy, lookbooks, quiet-luxury pitches | Not approved (fixable) — distinct 9, feasible 8 |
| Salmon ledger | financial-briefing | FT-salmon paper, serif takeaway headlines, one claret chart series, no card chrome | Financial reviews, analyst briefings | **Approved** — distinct 8, feasible 9 |
| Zurich poster | keynote-poster | Paper white, enormous flush-left grotesque type, exposed grid, one signal red | Keynotes, vision talks, type-led statements | Not approved (fixable) — distinct 9, feasible 8 |
| Phosphor Terminal | technical-briefing | All-mono on green-cast black, box-drawing panels, boot sequence, diff colors | Engineering reviews, infra and dev decks | **Approved** — distinct 9, feasible 8 |
| Aurora glass | product-launch | Near-black canvas, frosted glass panels, lit gradient hairlines, one aurora orb | Product launches, SaaS and AI announcements | **Approved** — distinct 8, feasible 8 |
| Riso overprint | print-craft | Cream paper, fluorescent inks that truly multiply, grain, misregistered plates | Creative reviews, zine-energy internal talks | Not approved (fixable) — distinct 7, feasible 8 |
| Seventies sunset | storytelling | Cream paper, heavy soft serif, terracotta-gold sun arcs, arch frames, film grain | Story-led talks, culture and vision decks | **Approved** — distinct 8, feasible 9 |
| Oxford monograph | academic-lecture | Ivory paper, journal serif, figure plates, oxford-blue cover, one rubric-red mark | Lectures, research readouts, papers-as-talks | Not approved (fixable) — distinct 8, feasible 6 |
| Field atlas | photo-documentary | Full-bleed photos under warm scrims, EXIF caption strips, bone-paper data pages | Impact reports, field stories, photo-led decks | Not approved (fixable) — distinct 8, feasible 7 |

---

## 2. Existing lineup and the gaps

Current five themes:

- **micron-dark-executive** — premium corporate dark with Micron branding; cinematic chrome and gradients.
- **micron-dark** — dark engineering look with Micron purple grids.
- **micron-light** — bright editorial data theme; white panels and crisp tables.
- **guided-learning** — soft lavender-gray training app shell; calm and instructional.
- **playful** — warm bold-outline workshop energy; stickers and chunky shadows.

What the new lineup adds:

- **Brand-neutral options.** Three of five current themes are Micron-locked. The new ten are all brand-neutral.
- **Luxury and editorial.** Nothing today does dark luxury (gilded-noir) or quiet-luxury print (ivory-atelier).
- **Type-as-hero.** No current theme leads with typography alone (zurich-poster).
- **Recognizable publication style.** Salmon-ledger gives financial gravitas that micron-light's cool panels do not.
- **Modern tech looks.** Terminal mono (phosphor-terminal) and glassmorphism launch style (aurora-glass) are both missing.
- **Expressive print craft.** Riso-overprint is clearly different from playful's cartoon warmth.
- **Warm storytelling.** Seventies-sunset fills the slow, serif-led narrative slot.
- **Academic and documentary.** Oxford-monograph and field-atlas serve lectures and photo-led reports.

---

## 3. Proposed themes

### 3.1 Gilded noir — luxury-showcase

**When:** Jewelry-house dark style with warm matte-black surfaces, engraved champagne-gold hairline frames, high-contrast serif display type, and emerald-and-sapphire jewel data series.

**Palette**

| Hex | Role |
|---|---|
| `#0E0C0A` | bg — warm matte near-black stage |
| `#1A1612` | surface — raised panel fill |
| `#F5EFE4` | ink — warm ivory text (17.1:1) |
| `#B8AE9C` | ink-muted — secondary text (8.9:1) |
| `#C9A961` | accent — champagne gold rules, numerals, stats |
| `#E8D5A3` | accent-bright — foil highlight end of gold gradient |
| `#8C6F3F` | accent-deep — bronze shadow end; display sizes only |
| `#1E7A66` | jewel — emerald chart secondary series |
| `#3D6394` | jewel-2 — sapphire chart tertiary series |
| `#155F4F` | jewel-panel — deep-emerald quote panel fill |

**Fonts:** Cormorant Garamond (display serif) + Cinzel (ceremonial tracked caps) + Jost (geometric sans body). System mono for chrome only.

**Slide archetypes:** title (ziggurat-corner frame + sunburst fan), agenda (gold numerals on hairline rows), divider (280px foil chapter numeral), three-column (gold hairlines with diamond finials), data (gold + emerald + sapphire on bare black), quote (giant gold quote mark; emerald panel variant), closing (mirror of title).

**Signature wow details**

- Engraved double-hairline gold frame on every slide; ziggurat Art Deco corners on title, divider, closing.
- CSS gold-foil type via `background-clip: text` on one headline word and hero numerals, with a slow shimmer.
- Pure-CSS sunburst fan (repeating-conic-gradient) unfolding behind the title.
- 8px rotated gold diamond finials carry the whole theme: legends, bullets, separators.
- Restrained motion: 600ms crossfades, 900ms hairline draws, nothing bounces.

**Reviewer verdict: NOT approved (distinct 8, feasible 8). Issues + fixes**

- **Blocker:** the accent counter in verify.py counts every gold element. The frame plus ziggurat corners alone push four of seven archetypes past the declared budget of 10. **Fix:** render the frame as background-image layers (counted as 0) or raise the budget to 18–20 with a written note.
- **AA failure:** `--ink-muted` on the emerald quote panel is 3.44:1, under 4.5:1. **Fix:** use `--ink` for the attribution there, or add a dedicated `--ink-muted-on-panel: #D6CEBE` (4.83:1).
- **Inconsistency:** spec claims a 4.5:1 headline gate, but the foil gradient's darkest stop is 4.15:1. **Fix:** brighten the stop to `#967845` (4.71:1) or write an explicit large-text exemption.
- **Minor:** the 1600x900 stage note must use the literal registry keys (`require_fixed_stage`, `stage_width`, `stage_height`, `enforce_stage_overflow`).

**References:** [Awwwards luxury collection](https://www.awwwards.com/websites/luxury/) · [The Alkemistry](https://www.awwwards.com/sites/the-alkemistry-luxury-jewellery) · [Luxury brand colors](https://zoviz.com/blog/luxury-brand-colors-meanings) · [MAD Paris Art Deco centenary](https://madparis.fr/1925-2025-One-Hundred-Years-of-Art-Deco) · [Dezeen Art Deco hub](https://www.dezeen.com/art-deco-centenary/) · [99designs Art Deco branding](https://99designs.com/inspiration/branding/art-deco)

---

### 3.2 Ivory Atelier — editorial-lookbook

**When:** Quiet-luxury lookbook style on warm ivory paper with enormous light-weight Fraunces display, one italic emphasis word per headline, hairline rules, clay and olive accents, fashion-credit microtype, and periodic full-bleed espresso quote slides.

**Palette**

| Hex | Role |
|---|---|
| `#F6F1E7` | bg — warm ivory paper |
| `#EDE5D4` | surface — ecru panel / image mat |
| `#FFFDF7` | surface-bright — white photo-plate mat |
| `#26201A` | ink — espresso text (14.3:1) |
| `#6B6053` | ink-muted — taupe secondary text (5.4:1) |
| `#9C4A2F` | accent — clay kickers, numerals, quote marks |
| `#5C6047` | accent-2 — dry olive, charts only |
| `#C9BFAD` | rule — hairlines and ghosted folio numerals |
| `#1F1B16` | inverse-bg — espresso beat slides |
| `#E8D5A3` | inverse-ink — champagne text on espresso (11.8:1) |

**Fonts:** Fraunces variable (display, weight 300–400, one italic word per headline) + DM Sans (body and 11–13px tracked-caps microtype).

**Slide archetypes:** title (magazine masthead with credits), agenda (fashion-credits list with dotted leaders), divider (giant "No. 03" folio cropped off the edge), 3-column points (uncontained columns), photo plate (matted image with margin-hung caption), data (bare-paper chart with serif numerals), espresso-beat quote (full-bleed inverted), closing (espresso page with credits).

**Signature wow details**

- Cropped 280–380px hairline folio numerals bleeding off the slide edge.
- Exactly one italic Fraunces word per headline, entering 150ms after the roman words.
- The espresso beat: every 4–6 slides, one full-bleed dark slide with champagne italic type.
- Extreme scale contrast: 140px+ display against 11–13px tracked microtype.
- Bare-paper charts: no chrome, no legend, espresso + clay + olive, Fraunces axis numerals.

**Reviewer verdict: NOT approved (distinct 9, feasible 8). Issues + fixes**

- **Blocker (verified):** the Google Fonts URL does not request the Fraunces SOFT axis, so Google strips it and the signature "SOFT raised" setting silently does nothing. **Fix:** use the corrected URL that requests `SOFT,WONK` axes (verified HTTP 200).
- **Blocker:** vw-based clamp() sizes contradict the fixed 1600x900 stage. Type drifts with window size. **Fix:** fixed px values (margin 128px, title 152px, headline 96px, body 21px, folio 340px).
- **Minor:** value callouts claim both mono and Fraunces. **Fix:** all visible numerals are Fraunces; demote mono to a contract-only token.
- **Minor:** the "exactly one italic word" verify rule would fail the all-italic quote slides. **Fix:** scope the rule to h1/h2 on paper slides only.
- **Note:** the ghosted folio numeral is 1.62:1 — fine only because the clay kicker carries the section label. State this redundancy as mandatory.

**References:** [Quiet luxury branding 2025](https://trivision.com/uncategorized/quiet-luxury-branding-trends-2025/) · [Fraunces specimen](https://fonts.google.com/specimen/Fraunces) · [Kinfolk redesign — Alex Hunting](https://alexhunting.studio/blogs/projects/kinfolk) · [Kinfolk Issue 23 — D&AD](https://www.dandad.org/awards/professional/2017/magazine-newspaper-design/25864/kinfolk-magazine-issue-23/) · [Siteinspire luxury](https://www.siteinspire.com/websites/category/luxury) · [Fashion fonts 2026](https://fontfinds.com/21-gorgeous-modern-fashion-fonts-lookbook-projects-2026/) · [Awwwards editorial layout](https://www.awwwards.com/inspiration/editorial-layout)

---

### 3.3 Salmon ledger — financial-briefing

**When:** Warm salmon newsprint with literary serif takeaway headlines, black hairline mastheads, and claret-led publication charts plotted straight on the paper with no card chrome.

**Palette**

| Hex | Role |
|---|---|
| `#FFF1E5` | bg — FT paper salmon, full bleed |
| `#F2DFCE` | surface — wheat row stripes and callouts |
| `#262A33` | ink — slate text (~13:1) |
| `#5B5650` | ink-muted — captions, axis labels (6.6:1) |
| `#000000` | rule — black masthead rules and hairlines |
| `#990F3D` | accent — claret: the one emphasized series (7.6:1) |
| `#0F5499` | data-1 — oxford blue second series |
| `#0D7680` | data-2 — teal third series |
| `#758D99` | data-muted — de-emphasized strokes, never text |
| `#CCE6FF` | highlight — sky chart bands, non-text |

**Fonts:** Source Serif 4 (headlines, quotes) + Figtree (body, labels) + IBM Plex Mono (all figures, dates, source lines).

**Slide archetypes:** title (double masthead rule + claret slab), agenda (newspaper contents list), three-column (newsprint columns with hairlines), data-chart (headline-is-the-finding, naked chart, one claret series, Source: footer), quote (mostly empty paper), divider (giant claret mono numeral), closing (inverted end-slug rule).

**Signature wow details**

- Newspaper folio masthead on every slide: 3px bar + 4px gap + 1px hairline, deck title in small caps, mono date and slide number.
- One-claret-series discipline: exactly one line or bar carries the story; competitors drop to gray-blue; a hand-placed claret arrow narrates.
- Charts sit naked on the salmon — no card, no panel, no border.
- Headline-as-takeaway: every headline is a sentence finding, never a topic label.
- Print restraint: rules draw in 300ms, radius 0 and shadow none everywhere.

**Reviewer verdict: APPROVED (distinct 8, feasible 9). Issues + fixes (none blocking)**

- Font query lacks Source Serif weight 500 used by the quote slide. **Fix:** add 500 to the query (or use 600).
- The sky highlight band is 1.16:1 — invisible on bad projectors. **Fix:** require hairline edges or a mono date label on every band.
- The "radius 0 on all elements" check would fail shared nav chrome. **Fix:** scope the check to theme-authored elements.
- Figtree has no real small caps. **Fix:** use uppercase + 0.78em + 0.14em tracking instead of `font-variant`.
- Axis-label font ambiguity. **Fix:** all chart numerals are mono; Figtree only for text labels.
- The palette is verbatim FT colors. **Fix:** note in design.md — fine internally; shift hexes slightly if a deck ships externally.

**References:** [FT Visual Vocabulary](https://github.com/Financial-Times/chart-doctor/tree/main/visual-vocabulary) · [Interactive version](https://ft-interactive.github.io/visual-vocabulary/) · [FT o-colors](https://www.npmjs.com/package/@financial-times/o-colors) · [Economist chart style guide](https://sa.ipaa.org.au/wp-content/uploads/2026/02/Economist-CHARTstyleguide_20170505.pdf) · [Mistakes, we've drawn a few](https://www.niemanlab.org/reading/mistakes-weve-drawn-a-few-learning-from-our-errors-in-data-visualization/) · [FT colors with hex](https://www.schemecolor.com/financial-times-web-site.php)

---

### 3.4 Zurich poster — keynote-poster

**When:** Paper-white Swiss poster style with enormous flush-left grotesque type, an exposed 12-column grid, vast empty counter-space, and exactly one vermilion signal red per slide.

**Palette**

| Hex | Role |
|---|---|
| `#F7F5F0` | bg — paper-white stage |
| `#FFFFFF` | surface — rare white card/table |
| `#141413` | ink — near-black text (16.9:1) |
| `#55534E` | ink-muted — secondary text (7.0:1) |
| `#E63322` | accent — signal vermilion; display sizes and shapes only |
| `#B3261E` | accent-deep — AA-safe red for text under 48px (6.0:1) |
| `#D9D6CF` | rule — exposed-grid hairlines |
| `#0E0E0D` | inverse-bg — full-black poster slides |
| `#F7F5F0` | inverse-ink — paper type on black (17.7:1) |

**Fonts:** Inter Tight 600/700/800 (display, -0.03em tracking, reads like Neue Haas) + Inter 400/500 (kickers, labels). System mono for chrome.

**Slide archetypes:** title (Beethoven-poster concentric arcs + cropped mega headline), agenda (exposed grid rows), divider (giant red numeral cropped at the edge), content (three flush-left columns), data (ink bars, one red highlight, huge callout), quote (one massive red-deep sentence), closing (inverse black poster with one red element).

**Signature wow details**

- Pure-CSS Beethoven title: off-center concentric ink arcs cropped mid-sweep behind the headline.
- Deliberate headline bleed off the stage edge — poster tension, never accidental clipping.
- A rotated vertical running label up the left margin is the only persistent chrome.
- One divider weight rule: 1px hairlines and a single 2px ink bar; charts inherit this.
- Stamp motion: type snaps in at 150ms; the slide's single red element lands last.

**Reviewer verdict: NOT approved (distinct 9, feasible 8). Issues + fixes**

- **Blocker:** the 4.5:1 headline gate fails the spec's own red headline word and red divider numeral (3.96:1). **Fix:** add a large-text carve-out (>=48px checks 3:1), or move red type to accent-deep.
- **Blocker:** vw-based type sizes drift inside the fixed stage and move the designed bleed crop point. **Fix:** fixed px sizes (title 200px, headline 150px, numeral 240px, body 18px).
- Undefined `--type-xs` token referenced by the data slide. **Fix:** define it (13px) or reuse body scale.
- "Exactly one red" prose vs budget of 3. **Fix:** reword to "one red moment (max three elements)".
- "Ring widths growing outward" is impossible with one repeating gradient. **Fix:** one non-repeating gradient with a hand-tuned stop list.
- Accent-deep on the black inverse slide is 2.95:1. **Fix:** forbid small red text on inverse slides entirely.

**References:** [Swissted](https://www.swissted.com/) · [Müller-Brockmann gallery](https://www.neugraphic.com/muller-brockmann/gallery.html) · [Swiss Style — PRINT](https://www.printmag.com/featured/swiss-style-principles-typefaces-designers/) · [Studio 2am Swiss deck template](https://studio2am.co/products/swiss-style-brand-presentation-template) · [Awwwards typography](https://www.awwwards.com/websites/typography/)

---

### 3.5 Phosphor Terminal — technical-briefing

**When:** All-monospace terminal style on near-black green-cast surfaces with box-drawing panel frames, shell-prompt kickers, a status-bar footer, and phosphor-green accents plus diff-style green/red data coloring.

**Palette**

| Hex | Role |
|---|---|
| `#0A0E0C` | bg — near-black with green cast |
| `#101612` | surface — panel / code-block fill |
| `#E7EFE9` | ink — phosphor-white text (16.6:1) |
| `#7C8A80` | ink-muted — comments, annotations (5.4:1) |
| `#00E599` | accent — phosphor green: prompts, [OK], up-deltas (11.7:1) |
| `#FFB454` | accent-2 — amber warnings; documented alternate accent mode |
| `#FF6B6B` | negative — diff red for risks and down-deltas (7.0:1) |
| `#1E2A22` | rule — hairlines, panel frames, gridlines |

**Fonts:** Geist Mono (display 500/700) + JetBrains Mono (body, tables, code). No proportional type anywhere.

**Slide archetypes:** title (typing boot sequence + blinking cursor), agenda (`$ tree ./agenda` file tree), 3-column (man-page panels with [OK]/[WIP] chips), data (block-character bars with count-up numerals), quote (`/* ... */` comment block), divider (`$ cd 02-execution/` with ghost numeral), closing (exit-log summary, "process exited 0").

**Signature wow details**

- Boot sequence: slide 1 types its prompt character by character, prints [OK], then the headline snaps in.
- Persistent status-bar footer, optionally a slow KPI ticker rail with green/red deltas.
- Box-drawing panel grammar: 1px frames, radius 0, header label sitting on the top border.
- Diff coloring everywhere: `+` green, `-` red, amber only for warnings; tabular numerals count up.
- Character-grid discipline (1ch units) plus a deck-wide Bloomberg-amber alternate mode.

**Reviewer verdict: APPROVED (distinct 9, feasible 8). Issues + fixes (none blocking)**

- Amber mode introduces `#050505` outside the locked palette and leaves green-tinted neutrals under amber. **Fix:** cut amber mode from v1, or define a complete `[data-accent="amber"]` override block.
- vw clamps vs fixed stage. **Fix:** fixed px (title 84px, headline 52px, body 24px).
- Body and title size prose do not match the clamp math. **Fix:** one-line doc corrections.
- No headline length budget for huge mono type. **Fix:** max ~24 chars per title line, 2 lines; verifier flags overruns.

**References:** [The Monospace Web](https://owickstrom.github.io/the-monospace-web/) · [Departure Mono](https://departuremono.com/) · [Geist Mono — Vercel](https://vercel.com/font) · [Bloomberg Terminal color accessibility](https://www.bloomberg.com/ux/2021/10/14/designing-the-terminal-for-color-accessibility/) · [Terminal aesthetic essay](https://medium.com/@phazeline/the-terminal-aesthetic-and-the-return-of-texture-to-the-web-ed37ee8183bd) · [Best monospace fonts 2026](https://madegooddesigns.com/best-monospace-fonts-2026/)

---

### 3.6 Aurora glass — product-launch

**When:** Midnight product-launch style with a near-black blue-tinted canvas, frosted glass panels on lit gradient hairlines, one rationed aurora glow per slide, pill-badge eyebrows, and mono-set chrome.

**Palette**

| Hex | Role |
|---|---|
| `#08090A` | bg — near-black blue-tinted canvas |
| `rgba(255,255,255,0.04)` | surface — frosted glass card fill |
| `#16171B` | surface-solid — opaque ground for charts and export |
| `#F7F8F8` | ink — primary text (18.7:1) |
| `#8A8F98` | ink-muted — secondary text (6.1:1) |
| `#5E6AD2` | accent — indigo fills and dots, never text |
| `#828FFF` | accent-text — brightened indigo for links and stats (6.9:1) |
| `#00D2FF` | aurora-1 — cyan orb / gradient stop |
| `#C47BFF` | aurora-2 — magenta orb / gradient stop |
| `#2DD4BF` | aurora-3 — teal orb for section moods |
| `#2A2C33` | rule — hairline borders |

**Fonts:** Space Grotesk (display) + Inter (body) + Geist Mono (eyebrows, badges, axis chrome).

**Slide archetypes:** title (one orb + gradient word + pill badge), agenda (stacked glass rows, lit active row), bento-features (asymmetric glass grid with one hero cell), data-chart (opaque sheet, one glowing series, orb pushed off-canvas), quote (glass panel + ghosted 280px quote mark), section-divider (orb jumps corner and color), closing (horizon orb rising).

**Signature wow details**

- Horizon-glow hairline: a 1px gradient strip plus inner highlight makes panels read as lit glass.
- One-orb light system: a single blurred radial orb, repositioned and recolored per archetype, drifting slowly.
- Pill badge eyebrow with a pulsing 6px accent dot above every headline.
- Rationed gradient text: at most one word or stat per slide gets the cyan-to-magenta clip.
- Mono chrome: all indices, dates, and axis labels in uppercase Geist Mono.

**Reviewer verdict: APPROVED (distinct 8, feasible 8). Issues + fixes (none blocking)**

- Muted text over orb-lit panels can fall to ~2.2:1. **Fix:** ink-only text on orb-backed panels, or cap orb opacity at 0.15 behind secondary text; add a composite-contrast check.
- vw clamps vs fixed stage. **Fix:** fixed px (title 120px, headline 88px, body 24–30px, margin 96px).
- A gradient cannot be a border-color on the pill chip. **Fix:** standardize the 1px `::before` strip technique everywhere.
- Doc drift (104px claim, Inter Tight in stack but not loaded). **Fix:** correct claims; drop or load Inter Tight.
- Export risk with backdrop blur. **Fix:** export mode swaps glass to surface-solid and orbs to static gradients.

**References:** [Linear](https://linear.app) · [LogRocket on Linear design](https://blog.logrocket.com/ux-design/linear-design/) · [Chronicle](https://chroniclehq.com/) · [Linear design analysis](https://getdesign.md/linear.app/design-md) · [Aceternity Aurora Background](https://ui.aceternity.com/components/aurora-background) · [Mesher gradient generator](https://csshero.org/mesher/) · [Glassmorphism 2025](https://www.everydayux.net/glassmorphism-apple-liquid-glass-interface-design/)

---

### 3.7 Riso overprint — print-craft

**When:** Screen-native risograph zine style with warm paper cream, soft riso-black type, fluorescent ink layers that truly multiply where they overlap, film grain, misregistered plate shadows, and Swiss poster bones underneath.

**Palette**

| Hex | Role |
|---|---|
| `#F5F0E1` | bg — warm riso paper cream |
| `#FFFFFF` | surface — bright paper plate for charts |
| `#1A1818` | ink — soft riso black (15.5:1) |
| `#5C5650` | ink-muted — secondary text (6.3:1) |
| `#FF48B0` | accent — fluorescent pink; decorative/large only |
| `#0078BF` | accent-2 — riso blue; overprint shapes, charts |
| `#FF6C2F` | accent-3 — riso orange; markers, chips |
| `#00838A` | accent-4 — riso teal; chart series |
| `#233C8B` | deep — overprint indigo (what pink x blue makes) |

**Fonts:** Archivo Black (display) + Space Grotesk (body) + Space Mono (specimen labels, figure captions).

**Slide archetypes:** title (pink circle x blue rectangle multiply overlap), agenda (specimen sheet with thick ink rules), content-3col (color-coded column rules), data (white plate with offset pink shadow, hatch/halftone fills), quote (true misregistered double print), divider (three stacked numeral plates like a registration test), closing (printer's color bar sign-off).

**Signature wow details**

- True overprint physics: `mix-blend-mode: multiply` makes pink crossing blue produce real indigo — and that indigo is a palette token.
- Misregistered plate shadow: every display headline carries a 3px fluorescent-pink offset.
- Full-stage film grain (SVG feTurbulence at 6%) unifies everything into one printed page.
- Specimen-sheet chrome: mono "FIG. 03" labels, oversized numerals instead of bullets, 5px ink rules.
- Press-stamp motion and hatch/halftone chart fills — never flat color, never gaussian shadows.

**Reviewer verdict: NOT approved (distinct 7, feasible 8). Issues + fixes**

- **Blocker (accessibility):** ink headlines over the pink-x-blue overlap zone compute to 1.60:1. **Fix:** keep the overlap zone away from glyphs; glyphs may sit only on cream and pink (5.92:1); add a geometry check.
- Ink over the blue plate is 4.22:1, under the 4.5 gate. **Fix:** keep blue behind text, or drop blue layer opacity to ~0.70 under display type.
- Overlap with the existing playful theme: rotated sticker chips and chunky offset shadows are playful's furniture. **Fix:** swap to riso-native devices (rubber-stamp ellipse, registration crosses) and forbid playful's chip style in design.md.
- Small factual errors in contrast notes (pink on white is 3.1:1, not 2.7:1). **Fix:** correct the numbers.
- `multiply` is unreliable in print-to-PDF. **Fix:** verify via raster export; add a print fallback with precomputed solid fills.

**References:** [It's Nice That — 2026 trends](https://www.itsnicethat.com/features/forward-thinking-graphic-trends-2026-graphic-design-120126) · [Slidesgo 2026 deck trends](https://slidesgo.com/slidesgo-school/ai-presentations/presentation-design-trends-2026) · [Stencil Wiki riso colors](https://www.stencil.wiki/colors) · [The Rise of Riso](https://www.commarts.com/columns/the-rise-of-riso) · [Riso overprint effect — Behance](https://www.behance.net/gallery/138157999/Risograph-Overprint-Effect-by-Edmund)

---

### 3.8 Seventies sunset — storytelling

**When:** Warm 70s editorial style with cream paper surfaces, heavy soft-serif espresso type, terracotta-to-gold concentric sun arcs, arch-shaped frames, faint film grain, and slow golden-hour pacing.

**Palette**

| Hex | Role |
|---|---|
| `#F7EFE2` | bg — warm cream paper |
| `#EFE2CC` | surface — sand panels and chart areas |
| `#3B2A20` | ink — espresso text (12.0:1) |
| `#6B5240` | ink-muted — secondary text (6.3:1) |
| `#A8431B` | accent — burnt terracotta (darkened to pass AA) |
| `#D99A2B` | accent-2 — harvest gold; fills only on light, text on espresso |
| `#5C5C22` | accent-3 — deep olive (darkened to pass AA) |
| `#8A3324` | deep — rust for pull quotes and chart axes |

**Fonts:** Fraunces variable (display 600–900, SOFT raised, WONK swash italics) + DM Sans (body) + Space Mono (kickers, data labels).

**Slide archetypes:** title (CSS concentric sun rising from the bottom edge), agenda (swash-numeral rail), content-3col (arch-topped sand cards), data-chart (rounded-top bars in terracotta/gold/olive), quote (light and dark golden-hour variants), divider (arch doorway with clip-path wipe), closing (sunset inversion on espresso).

**Signature wow details**

- CSS-only giant sun: five hard-stop terracotta-to-gold rings from one radial-gradient, rising at the open and sinking at the close.
- Faint film grain (~5%) over every gradient so it reads analog.
- Arch-window frames (`border-radius: 999px 999px 24px 24px`) and a doorway clip-path wipe on dividers.
- 280px swash chapter numerals in Fraunces italic with WONK on.
- Earth-stripe bands and rust axes; gold is strictly a fill color on light surfaces.

**Reviewer verdict: APPROVED (distinct 8, feasible 9). Issues + fixes (none blocking)**

- Gold chart bars are under the 3:1 non-text floor on sand. **Fix:** add a darker chart-gold token or a 1px rust stroke on gold bars.
- Cream corner labels on the title are geometrically fragile over the sun rings. **Fix:** default to espresso-on-cream; permit cream only inside the outer terracotta ring.
- Token vs archetype mismatch on the arch radius feet. **Fix:** add `--radius-arch-full` or accept 24px feet.
- The grain data-URI has unencoded angle brackets. **Fix:** percent-encode it.

**References:** [Fraunces — Google Fonts](https://fonts.google.com/specimen/Fraunces) · [Fraunces design rationale](https://fraunces.undercase.xyz/) · [70s earth-tone palette guide](https://graphicloads.com/70s-earth-tones-the-complete-color-palette-guide-with-hex-codes/) · [Envato 2026 trends](https://hub.author.envato.com/graphic-design-trends-2026/) · [Modern Nostalgia — Pictufy](https://pictufy.com/insights/modern-nostalgia)

---

### 3.9 Oxford monograph — academic-lecture

**When:** Scholarly clothbound-book style with warm ivory paper, journal-grade STIX serif type, true small caps and old-style figures, hairline double rules, numbered figure plates, and a single oxford-blue accent with one rubric-red highlight per deck.

**Palette**

| Hex | Role |
|---|---|
| `#F6F2E9` | bg — warm ivory paper |
| `#FFFEF9` | surface — figure plates and theorem cards |
| `#211E1A` | ink — text (14.9:1) |
| `#5C564A` | ink-muted — captions and footers (6.5:1) |
| `#002147` | accent — oxford blue: kickers, links, cover field |
| `#CDD9E5` | accent-wash — theorem/result box fill |
| `#D8D1C2` | rule — hairlines, plate borders, dot leaders |
| `#8F2D1C` | rubric — one red mark per deck, for the key result |

**Fonts:** STIX Two Text (display + body serif) + Spectral SC (true small-caps label voice) + IBM Plex Mono (axis ticks, code).

**Slide archetypes:** title (full-bleed oxford-blue cover with cream double rule), agenda (book contents with dot leaders), content (assertion-evidence: the headline is the claim), three-column (run-in heads, no cards), data (numbered "Fig. N" plates), quote (epigraph page), closing (colophon mirror of the cover).

**Signature wow details**

- Clothbound binding: the deck opens and closes on oxford-blue fields framed by inset cream double rules.
- Journal masthead kicker on a double hairline on every content slide.
- Plate discipline: every chart lives on a bordered plate with a sequential figure caption and source line.
- Book figures: old-style numerals in prose, tabular lining numerals in tables; dot-leader contents.
- One rubrication per deck, plus a Metropolis-style progress ink line along the bottom.

**Reviewer verdict: NOT approved (distinct 8, feasible 6). Issues + fixes**

- **Blocker (verified):** Google Fonts strips the `onum`/`tnum`/`lnum` features from STIX Two Text, so the old-style-figure signature silently fails. **Fix:** self-host a subset built with fonttools keeping those features (~20–40KB base64), or rewrite the figure story around STIX's default tabular lining digits.
- Overstated math coverage: the Google build has almost no math operators. **Fix:** soften the claim, or extend the self-hosted subset with math ranges.
- vw clamps vs fixed stage. **Fix:** fixed px (title 84px, headline 68px, body 26px).
- "One rubric per deck" is not machine-checkable with current per-slide schema keys. **Fix:** encode rubric as a second locked accent and add a deck-level counter to verify.py.

**References:** [Metropolis Beamer theme](https://github.com/matze/mtheme) · [Tufte CSS](https://edwardtufte.github.io/tufte-css/) · [quarto-revealjs-clean](https://github.com/grantmcdermott/quarto-revealjs-clean) · [STIX Two Text](https://fonts.google.com/specimen/STIX+Two+Text) · [Spectral SC](https://googlefonts.github.io/spectral/) · [Ten simple rules for slides — PLOS](https://pmc.ncbi.nlm.nih.gov/articles/PMC8638955/) · [Oxford Blue #002147](https://www.color-name.com/oxford-blue.color)

---

### 3.10 Field atlas — photo-documentary

**When:** Photography-first documentary style with full-bleed images under warm cinematic scrims, oversized humanist-grotesque headlines in a fixed type-safe corner, mono EXIF caption strips, and bone-paper data pages carried by amber, terracotta, and sage accents.

**Palette**

| Hex | Role |
|---|---|
| `#F5F1E8` | bg — bone paper for non-photo slides |
| `#0E0C09` | photo-bg — warm near-black behind photos |
| `#1C1814` | ink — warm text on paper (15.6:1) |
| `#5C5546` | ink-muted — secondary text (6.5:1) |
| `#FFFFFF` | ink-photo — text over photos and scrims |
| `#A89F8D` | stone — hairlines and axes only, never text |
| `#E8A33D` | accent — expedition amber: rules, ticks, chart series 1 |
| `#C9572E` | accent-2 — terracotta: chart series 2, large highlights |
| `#A8431F` | accent-2-ink — darkened terracotta for small text |
| `#6E7F72` | accent-3 — sage olive: chart series 3 |

**Fonts:** Bricolage Grotesque (display 700/800) + Hanken Grotesk (body) + IBM Plex Mono (kickers, EXIF captions) + Source Serif 4 Italic (pull quotes only).

**Slide archetypes:** title (full-bleed photo + corner scrim + EXIF strip), agenda (paper page with thin photo band), divider (outlined 300px chapter numeral over a heavier scrim), content (three columns on paper), data (charts on paper only; photo-stat variant), quote (portrait with left scrim), closing (filmstrip contact-sheet recap).

**Signature wow details**

- The EXIF caption strip: a 1px amber rule plus a mono metadata line (PLACE — COORDS — DATE) on a blur band; it looks like field reportage and quietly guarantees caption legibility.
- Two-layer warm scrim discipline: the gradient ramps only into the text corner; headlines never sit centered over faces.
- Per-slide art direction via `--focal-x/--focal-y` feeding `object-position`.
- Outlined chapter numerals with a clip-path wipe pace the deck into acts.
- Photo-paper-photo rhythm so the deck breathes like a magazine spread.

**Reviewer verdict: NOT approved (distinct 8, feasible 7). Issues + fixes**

- **Blocker:** 13px amber kicker text over the scrim can fall to 2.87:1 at the permitted scrim floor. **Fix:** set photo-slide kickers in white with a short amber leading rule; amber text only on solid dark surfaces.
- **Blocker:** amber chart fills on paper are 1.91:1, under the 3:1 non-text floor. **Fix:** add a darkened chart-amber token (or 1px ink strokes plus direct labels).
- No image-sourcing policy for single-file HTML. **Fix:** define a base64 budget (<=6MB, WebP/JPEG at 1600px) and a no-photo fallback variant per archetype.
- The "scrim alpha >= 0.65 under headlines" rule is unverifiable. **Fix:** pin the gradient stops as a token so the verifier checks a static string.
- The outlined divider numeral is 3.65:1 over bright photos. **Fix:** mark it decorative (aria-hidden) with the chapter kicker carrying the label.

**References:** [Smashing — accessible text over images](https://www.smashingmagazine.com/2023/08/designing-accessible-text-over-images-part1/) · [NN/g — text over images](https://www.nngroup.com/articles/text-over-images/) · [charity: water 2022 report](https://downloads.ctfassets.net/2w85ks0ylymt/hfzzkR7IGq78ZPrV8lkQP/179836ea739a7a440d6632540eb6955a/CW_AnnualReport2022.pdf) · [Constructive — nonprofit report inspiration](https://constructive.co/insight/2025-nonprofit-annual-report-inspiration/) · [National Geographic design — Retinart](https://retinart.net/graphic-design/timeless-beauty-national-geographic/) · [Awwwards storytelling](https://www.awwwards.com/websites/storytelling/) · [Pure CSS focal points](https://henry.codes/writing/pure-css-focal-points/)

---

## 4. Directions considered and dropped

| Dropped direction | Why |
|---|---|
| deco-noir | Merged into gilded-noir: same black + gold + serif luxury formula. Its sunburst fan, ziggurat frame corners, Cinzel title-card option, and emerald/sapphire jewel chart series were carried into the merged spec. |
| slow-editorial | Merged into ivory-atelier: same ecru paper + variable Fraunces + hairline-and-whitespace formula. Its photo-plate layout with margin-hung captions and its extreme display-to-microtype scale contrast were carried over. |
| heritage-atelier | Merged into ivory-atelier: near-duplicate limestone quiet-luxury direction. Its single-italic-emphasis-word device and ghosted chapter numerals were carried over. |
| red-tab-briefing | Merged into salmon-ledger: both are prestige-financial-paper chart decks. Its headline-as-takeaway rule, one-emphasis-series discipline, direct labeling, and source-line footer were carried over. The Economist off-white ground itself sits too close to micron-light; FT salmon is the more ownable color. |
| amber-terminal | Merged into phosphor-terminal: same all-mono-on-black terminal language. Its KPI ticker-rail footer, typing boot sequence, and count-up tabular numerals were carried over; Bloomberg amber survives as the secondary accent and a documented alternate accent mode. |
| aurora-glass-dark | Merged into aurora-glass: duplicate Linear-style dark glassmorphism. Its bento grid, pill badges, horizon-glow gradient hairline, and proven #08090A token set lead the merged spec. |
| aurora-glass (light pastel variant) | The second raw finding named aurora-glass (Sora/Gamma pastel light glass) was folded into the merged aurora-glass entry conceptually but its light direction was dropped: pale lavender glass over soft pastels brushes too close to guided-learning's soft lavender-gray app shell, and the dark expression is far more distinctive in this lineup. |
| velvet-cinema | Strong, ownable concept (oxblood + letterbox) but it is a second dark-luxury-serif-with-gold theme next to gilded-noir, and "cinematic dark" is literally micron-dark-executive's description — users would hesitate. First reserve if the registry later wants a dedicated storytelling-drama slot. |
| ink-broadsheet | A third light print-editorial direction; the publication slot was consolidated into salmon-ledger, which has the more instantly recognizable identity. Newspaper drop-cap typesetting also competes with micron-light for research-readout jobs. |
| global-briefing | Dense modular briefing overlaps micron-light (data density on light ground) and the publication cluster won by salmon-ledger. Its moderate headline scale gives it the weakest thumbnail distinctiveness of the editorial group. |
| unigrid-editorial | Sits between zurich-poster (modernist grid discipline) and ivory-atelier (warm paper + serif counterpoint); a user wanting "modernist editorial" would hesitate. The black-band device is excellent but does not justify a third slot in that territory. |
| rams-instrument | Warm-gray restrained minimalism reads close to guided-learning's calm app-shell at a distance, and the slot for disciplined minimalism went to zurich-poster. Dial-gauge/hardware skeuomorphism narrows appeal for general business content. |
| swiss-punk-poster | Same Swissted lineage as zurich-poster with louder color fields — keeping both forces a hesitation between two Swiss-poster themes. riso-overprint already owns loud print energy in the lineup. |
| new-wave-pigment | Full-bleed color-field poster duplicates swiss-punk-poster's territory (both dropped for the same reason): it competes with zurich-poster on Swiss type discipline and with riso-overprint for the expressive slot. |
| ink-marquee-broadsheet | Brutalist condensed-caps-on-paper overlaps zurich-poster's stark type territory, and its mono detailing overlaps phosphor-terminal. A perpetual marquee ticker is also a liability for typical business and teaching content. |
| acid-club-flyer | The most niche direction: acid lime, chrome, and starburst stickers fail the "must look excellent for typical business/teaching content" bar. The fresh-unexpected requirement is already covered by salmon-ledger and riso-overprint, which have far broader appeal. |
| ion-hud | Third dark-technical direction behind phosphor-terminal and the existing micron-dark; sci-fi HUD chrome risks reading as costume over content for business audiences. |
| structured-scrapbook | Tape-and-paper craft overlaps the existing playful theme's warm workshop territory and its sibling pastel-notebook. Realistic torn edges and tape shadows are also the costliest of the craft cluster to polish in single-file CSS. riso-overprint won the craft slot. |
| pastel-notebook | Sticky notes + doodles sits directly on top of the existing playful theme (high-energy warm craft) and guided-learning (training shell). Weakest differentiation in the craft cluster. |
| field-journal | Charming, but it is the same taped-paper craft family as scrapbook/notebook and aims at the teaching audience guided-learning already serves. Dropped with the rest of the craft cluster in favor of riso-overprint. |
| ivory-ink | Warm ivory + Fraunces + terracotta would force a direct hesitation with ivory-atelier; the lookbook merge is the stronger, more distinctive expression of warm-minimal. Its terracotta double-underline device is noted as a nice idea but not enough to carry a separate slot. |
| blueprint-grid | Excellent execution-safe direction, but near-monochrome light minimalism collides with zurich-poster for the minimal slot, and its mono-label engineering voice is already represented by phosphor-terminal. micron-light also covers light technical-adjacent content. |
| blurple-mesh | Light corporate SaaS overlaps micron-light's job, the mesh-gradient signature duplicates aurora-glass's core move, and the look is so strongly associated with Stripe that it undercuts the brand-neutral requirement. |
| restorative-arch | Warm sand + Fraunces + arch geometry would hesitate directly against seventies-sunset, which is the bolder and more distinctive expression of warm-organic. Its arch-window image mask was folded into seventies-sunset's spec. |
| archival-index | Strong devices (dotted-leader TOC, doc-number stamps) but its identity splits between phosphor-terminal (mono metadata texture) and the editorial/publication cluster (document gravitas) — no unique slot remains for it in a MECE lineup. |

---

## 5. Recommended next steps

**Build order**

1. **Salmon ledger** — approved, highest feasibility (9), and the most instantly ownable look. Only small fixes (font weight, band edges, check scoping).
2. **Seventies sunset** — approved, feasibility 9, pure CSS, fills the empty storytelling slot. Fixes are minor token work.
3. **Phosphor terminal** — approved, very distinctive (9). Decide first: ship green-only v1, or build the full amber override block.
4. **Aurora glass** — approved and in high demand for launches. Needs the orb-contrast rule and the export fallback written into the spec first.
5. **Zurich poster and ivory-atelier** — highest distinctiveness (9 each) but each has two blockers. Fix the specs (px sizing, font URL, contrast carve-outs), then build.
6. **Gilded noir, riso overprint, oxford monograph, field atlas** — build after their blockers are resolved in the spec. Oxford-monograph needs a self-hosted font subset decision; field-atlas needs an image-asset policy.

**What every theme needs to ship**

- `design.md` — the written design rules and anti-patterns.
- `tokens.css` — the full token set, with the non-micron contract mappings.
- `example.html` — a full example deck covering all archetypes.
- Screenshots — verified renders of the example deck.
- A `themes.json` entry with a complete verify block (accent rules, palette lock, fixed stage keys).

**Important:** nothing is built until the user approves this plan. All reviewer fixes should be folded into each spec before the first line of CSS is written.

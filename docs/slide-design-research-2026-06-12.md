# Slide Design Research: Framework Audit and Improvement Plan

This report covers four skills: `slide-brainstorm`, `html-slides`, `slide-layout-designer`, and `theme-factory` (plus a small note on `html-to-pptx`). It compares them against ten professional slide-design frameworks. It ends with a prioritized plan of 14 items.

All paths are relative to the repo root unless stated otherwise.

---

## 1. Executive summary

**The bottom line: the skill suite teaches good slide design, but it does not check it. The enforcement budget went to brand and rendering. It must now go to content.**

What we found:

- **The guidance is strong.** One idea per slide, claim titles, claim+evidence blocks, density limits, chart selection, and anti-clutter rules are all encoded — often deeply, across several files.
- **The enforcement is one-sided.** `verify.py` is a serious 1000-line gate, but it checks brand, geometry, and a few accessibility floors. It never checks what a slide *says*. A title like "Financial results" passes. A 141-word slide passes. A chart with no numbers passes.
- **The proof is in the outputs.** The q3 board deck is consulting-grade — but its quality was authored, not verified. The Micron executive deck shipped titles that narrate the template ("Commitments read best as a compact metric wall") and charts with no data. Nothing in the pipeline could catch this.
- **Some existing machinery is silently broken.** `slide-brainstorm` points to a rigor-audit section in `template.md` that does not exist. Its reviewer subagent reads from a wrong path. Its deepest rigor rules have zero eval coverage.

What should change, in order:

1. **Add a content-review gate on the final deck** (a reviewer subagent, like the one slide-brainstorm already has for brainstorms).
2. **Add action-title doctrine and a headline lint.** This is the single largest gap. Every framework we researched demands it; no file in the suite does.
3. **Enforce word and element budgets in `verify.py`.** The budgets already exist as prose. Make them lints.
4. **Add the titles-only "skim test"** at every stage: brainstorm, blueprint, and final deck.
5. **Repair the broken rigor machinery** in slide-brainstorm (dangling references, missing ARGUMENT placeholders, wrong reviewer paths, missing evals).

The named frameworks (Minto, MECE, BLUF, SCQA) are mostly *not* missing as ideas — they exist under home-grown names. The real gaps are: assertion titles, answer-first ordering for executive decks, MECE grouping tests, chart integrity rules, and — above all — mechanical or reviewer-based enforcement of all of these.

---

## 2. Framework cheat sheet

Ten frameworks were researched. Each section gives the core rules and the heuristics a script or LLM verifier can check.

### 2.1 Pyramid Principle + SCQA (Barbara Minto)

Answer first, then grouped support. Built at McKinsey in the 1960s.

**Core rules**

- Lead with the answer (the "governing thought"). Think bottom-up, communicate top-down.
- Vertical logic: each statement raises a question ("Why?" / "How?"); the layer below answers exactly that question.
- Horizontal logic: siblings are the same kind of idea, MECE, and ordered by one principle (deductive, chronological, structural, or by importance).
- Cap each group at 3–5 items (working-memory limit).
- Open with SCQA: Situation (context the audience accepts), Complication (the change that creates urgency), Question, Answer.
- Deck mapping: governing thought = exec summary; key line = section assertions; each slide = one support, stated as a full-sentence action title.

**Checkable heuristics**

- Every title is a full declarative sentence with a verb, not a topic label. [script: POS/regex + banned-label list; LLM for borderline cases]
- The first content slide states the recommendation before any evidence slide. [LLM; script checks position]
- 2–5 children per parent node; never 1, never more than 5. [script, if an outline tree exists]
- Titles-only read-through retells the whole argument. [script extracts; LLM judges]
- One claim per title — no "and"-chained independent claims. [script flags conjunctions; LLM counts claims]

**Sources:** [barbaraminto.com](https://www.barbaraminto.com/) · [StrategyU summary](https://strategyu.co/pyramid-principle-partone/) · [think-cell guide](https://www.think-cell.com/en/resources/content-hub/using-the-pyramid-principle-to-build-better-powerpoint-presentations) · [ModelThinkers: Minto + SCQA](https://modelthinkers.com/mental-model/minto-pyramid-scqa)

### 2.2 McKinsey SCR + MBB deck craft

Situation → Complication → Resolution, plus the production discipline around it.

**Core rules**

- SCR storyline: shared context → why the status quo fails → what to do. Use answer-first (RSC) when the audience already leans yes.
- Dot-dash storyboarding: write the storyline as an outline first. Dots become action titles; dashes become slide bodies. Approve before building.
- Action titles: full-sentence "so-what" claims, max ~15 words, max 2 lines, quantified when the slide has data.
- Horizontal-flow test: titles alone tell the complete story. Exposes duplicates and gaps.
- Vertical logic: everything on the slide proves the title. Two insights = two slides.
- Executive summary slide: the whole SCR argument on one page, Resolution taking 60–70%.
- Ghost decks: review a ~20%-complete skeleton (titles + sketched exhibits) before producing real slides.

**Checkable heuristics**

- Final deck titles must match the approved outline; diff and justify changes. [script diff]
- No two titles assert the same point. [script: embedding similarity; LLM confirms]
- Exec summary exists as first content slide, answer-first. [script: position + markup; LLM: content]
- Titles over data exhibits contain the key number. [script: digit check]

**Sources:** [Slideworks: SCR](https://slideworks.io/resources/how-to-use-McKinseys-scr-framework-with-examples) · [Working With McKinsey: dot-dash](http://workingwithmckinsey.blogspot.com/2013/07/McKinsey-storyline-dot-dash.html) · [Working With McKinsey: ghost decks](http://workingwithmckinsey.blogspot.com/2013/07/McKinsey-presentations-ghost-decks.html) · [Slideworks: action titles](https://slideworks.io/resources/how-to-write-action-titles-like-mckinsey) · [SWD: horizontal logic](https://www.storytellingwithdata.com/blog/2013/12/horizontal-logic)

### 2.3 MECE (Minto)

Mutually Exclusive, Collectively Exhaustive. Every list is a true partition along one dimension.

**Core rules**

- Mutually exclusive: every item fits exactly one bucket.
- Collectively exhaustive: the buckets cover the whole space; numbers sum to the total.
- One cutting dimension per level. Nest dimensions; never mix them in one list.
- Prefer known-MECE cuts: math decomposition, X/not-X, process steps, value chain, stakeholders, segments, 2x2.
- Keep 2–5 buckets per level.
- It is an ideal, not a law: close gaps with a small explicit "Other" bucket.

**Checkable heuristics**

- Name the single dimension that classifies the list in one phrase. [LLM]
- No item fits two buckets; build an adversarial example to test. [LLM]
- Sibling counts between 2 and 5. [script]
- One rhetorical type per group — all causes, all steps, or all asks; never mixed. [LLM; script proxy: parallel grammar of first tokens]
- Pies / 100%-stacked bars only on MECE data that sums to the total. [script]

**Sources:** [Wikipedia: MECE](https://en.wikipedia.org/wiki/MECE_principle) · [McKinsey alumni: Minto on MECE](https://www.mckinsey.com/alumni/news-and-events/global-news/alumni-news/barbara-minto-mece-i-invented-it-so-i-get-to-say-how-to-pronounce-it) · [Slideworks: MECE](https://slideworks.io/resources/mece-mutually-exclusive-collectively-exhaustive) · [StrategyU: MECE](https://strategyu.co/wtf-is-mece-mutually-exclusive-collectively-exhaustive/)

### 2.4 BLUF + executive presentation norms

Bottom Line Up Front (US Army AR 25-50) plus modern executive deck norms.

**Core rules**

- State the conclusion and the ask before any support. Never build suspense.
- Survive the 30-second test: if the meeting ends after slide 3, the audience still knows what you recommend, why, and what you need.
- Make the ask explicit and quantified: decision, amount, date, owner.
- Detail goes to a question-mapped appendix. Core deck capped at ~10–12 slides.
- Density caps make cramming impossible (Kawasaki 10/20/30: font floor 30pt).
- Pre-wire decisions before the meeting; the deck ratifies, not surprises.

**Checkable heuristics**

- Slide 2 (after cover) states the recommendation and the ask. [script: position/markup; LLM: content]
- Max ~40 body words, max 5 bullets, minimum font size. [script — fully mechanical]
- Last core slide restates the ask with owners and dates. [script pre-check: date and owner tokens; LLM confirms]
- No "background"/"methodology" slide before the recommendation slide. [LLM labels slide types]

**Sources:** [Wikipedia: BLUF](https://en.wikipedia.org/wiki/BLUF_(communication)) · [Duarte / MIT Sloan: slides for superiors](https://sloanreview.mit.edu/article/how-to-create-slides-that-suit-your-superiors-11-tips/) · [Kawasaki: 10/20/30](https://guykawasaki.com/the_102030_rule/) · [PowerSpeaking: executive tips](https://blog.powerspeaking.com/executive-presentation-tips)

### 2.5 Storytelling with Data (Cole Nussbaumer Knaflic)

Explanatory data communication, not exploratory chart dumps.

**Core rules**

- Context first: audience, action, mechanism (live vs standalone), and a one-sentence Big Idea.
- Pick the simplest visual: big text for 1–2 numbers, table for lookup, line for trends, bar for categories.
- Hard bans: pie, donut, 3D, secondary y-axes. Bars always start at zero.
- Declutter: remove borders, heavy gridlines, legends (direct-label instead).
- One accent color against gray; the "where are your eyes drawn?" test.
- Put the takeaway in words on the chart, starting with the title.
- Narrative arc ends in an explicit call to action.

**Checkable heuristics**

- Title is a takeaway sentence, not a topic label. [script + LLM]
- Forbidden chart types and properties. [script — fully mechanical on chart config/SVG]
- One accent hue per slide; accent on the message-carrying data only. [script: color counting]
- Standalone decks: every chart carries a nearby one-line takeaway. [script: text-node presence; LLM: is it a conclusion?]
- Numbers in titles/annotations must be derivable from the plotted data. [script cross-check]

**Sources:** [SWD books](https://www.storytellingwithdata.com/books) · [SWD: where are your eyes drawn?](https://www.storytellingwithdata.com/blog/whereareyoureyesdrawn) · [SWD: so what?](https://www.storytellingwithdata.com/blog/2017/3/22/so-what) · [Big Idea worksheet](https://formations.imt-atlantique.fr/data_storytelling/files/BigIdeaWorksheet.pdf)

### 2.6 Assertion-Evidence (Michael Alley, Penn State)

Sentence headline states the claim; visual evidence proves it. Empirically validated.

**Core rules**

- Every body slide opens with a complete-sentence headline (subject + verb), max 2 lines (~8–14 words), top-left, sentence case.
- Body = visual evidence (photo, diagram, graph). No bullet lists.
- Text budget: the audience reads no more than ~20 words per minute; cap body text at ~20–40 words.
- Fixed typography: bold sans serif, 28pt headline, 18–24pt body.
- Research: sentence headlines beat phrase headlines on retention (Alley et al. 2006, p < .01); A-E decks beat default decks on comprehension and cognitive load (Garner & Alley 2013).

**Checkable heuristics**

- Title parses as a declarative sentence with a finite verb. [script: POS; LLM: "could this be true or false?"]
- Body word count under budget; no `ul`/`ol` bullet columns; lists capped at 2–4 visually-arranged items. [script]
- One visual evidence element occupying the majority of the body. [script: bounding boxes]
- The visual actually proves the exact title assertion. [LLM with slide image]

**Sources:** [assertion-evidence.com](https://www.assertion-evidence.com/) · [A-E checklist (PDF)](http://www.writing.engr.psu.edu/AE_checklist.pdf) · [Alley & Neeley 2005 (PDF)](http://writing.engr.psu.edu/2005_alley_neeley.pdf) · [Garner & Alley 2013](https://pure.psu.edu/en/publications/how-the-design-of-presentation-slides-affects-audience-comprehens/)

### 2.7 Duarte (Resonate, slide:ology) + Presentation Zen (Reynolds)

Story structure plus glance-media visual discipline.

**Core rules**

- Big Idea: one sentence = arguable point of view + what is at stake.
- Sparkline: alternate "what is" and "what could be"; end in the "new bliss" + call to action.
- Audience is the hero; the presenter is the mentor.
- Glance Test: the slide's point must land in ~3 seconds.
- Six arrangement tools: contrast, flow, hierarchy, unity, proximity, whitespace.
- Maximize signal-to-noise; one strong image beats many small ones; slides are not documents.

**Checkable heuristics**

- One focal point per slide; eyes land on the evidence for the title. [vision-LLM; partial script via color/size]
- ~30 body words max, ≤5 bullets, ~30–40% whitespace, ≤5 top-level blocks. [script]
- Glance-test proxy: a fresh LLM, shown only the rendered slide, states its point in one sentence; must match the intended takeaway. [LLM pipeline]
- Deck declares a Big Idea; every slide maps to it. [LLM]

**Sources:** [Duarte: Glance Test](https://www.duarte.com/resources/guides-tools/the-glance-test/) · [HBR: Do your slides pass the glance test?](https://hbr.org/2012/10/do-your-slides-pass-the-glance-test) · [Duarte: sparklines](https://www.duarte.com/blog/creating-moments-of-impact-using-sparklines-for-strategic-conversations/) · [Reynolds: design tips](https://www.garrreynolds.com/design-tips)

### 2.8 Mayer CTML + Sweller Cognitive Load Theory

The science behind "one idea per slide."

**Core rules**

- Working memory holds ~4 chunks (Cowan). One idea per slide is mechanics, not style.
- Coherence: cut everything that does not serve the slide's point.
- Signaling: one highlighted element; if everything is highlighted, nothing is.
- Redundancy: never narrate identical on-screen text. Live slides carry the visual channel; the speaker carries the verbal channel.
- Spatial contiguity: labels on elements, not in separate legends or footnotes.
- Segmenting: split processes of more than ~4–5 steps across builds or slides.
- Mode matters: live decks need sparse text; standalone decks need fuller annotation.

**Checkable heuristics**

- ≤4 distinct content chunks per slide; ≤40 body words. [script]
- One accent emphasis per slide (max 2). [script]
- No legends when ≤4 series; direct labels. [script on chart config]
- Steps/nodes >5 without staging flagged. [script]
- Deck-level mode flag required; different budgets per mode. [script]

**Sources:** [Mayer's 12 principles](https://www.digitallearninginstitute.com/blog/mayers-principles-multimedia-learning) · [Chartered College: CLT for slides](https://my.chartered.college/impact_article/using-cognitive-load-theory-to-improve-slideshow-presentations/) · [Cowan: the magical number 4](https://www.researchgate.net/publication/11830840_The_Magical_Number_4_in_Short-Term_Memory_A_Reconsideration_of_Mental_Storage_Capacity)

### 2.9 Zelazny "Say It with Charts" + IBCS SUCCESS

Chart-selection grammar plus reporting integrity standards.

**Core rules**

- Message first, chart second: state the message, classify the comparison (component, item, time series, distribution, correlation), then pick the form.
- The matrix: share → 100%-stacked bar; ranking → sorted horizontal bar; trend → column/line; distribution → histogram; correlation → scatter.
- A chart is a sentence: the title states the conclusion, not the metric.
- Scale integrity (IBCS CHECK): bar/column axes start at zero; no 3D; no dual y-axes; identical scales for comparable charts.
- Sort item bars by value; cap pies at ~5–6 segments, lines at ~3–4.
- IBCS UNIFY: scenario notation — Actual solid dark, Previous Year light gray, Plan outlined, Forecast hatched. Time runs horizontal.
- Table vs chart: table for exact-value lookup or mixed units; chart for pattern.

**Checkable heuristics**

- Chart type matches the comparison implied by the title's trigger words. [script keyword-match; LLM resolves ambiguity]
- Axis min == 0 for bar/column types. [script]
- Bars sorted unless category axis is ordinal/time. [script]
- Series/segment caps; "Other" bucket when truncating. [script]
- One saturated accent hue per chart; consistent color-to-meaning mapping deck-wide. [script]

**Sources:** [Say It With Charts Workbook (PDF)](https://www.macrolake.com/sites/default/files/say%20it%20with%20charts.pdf) · [StrategyU: Think before you chart](https://strategyu.co/think-before-you-chart/) · [IBCS Standards](https://www.ibcs.com/ibcs-standards-1-2/) · [Zebra BI: IBCS notation](https://zebrabi.com/ibcs/)

### 2.10 Micron CXO principles (assessed against this repo)

The five CXO principles — BLUF, MECE, one idea per slide, action titles, visual simplicity — map onto public frameworks (AR 25-50, Minto, Alley, Duarte, Mayer). No internal Micron CXO playbook exists in the repo. The repo finding: **one idea per slide and visual simplicity are well covered; action titles, BLUF, and MECE are absent.** Worse, the existing executive-update arc puts the decision *last* — the inverse of BLUF.

**Key repo-aligned heuristics**

- Slide 2 BLUF: `data-slide-kind="executive-summary"` (the convention already used in the micron-dark-executive demo). [script]
- Promote the existing per-deck word budgets (25–50 body words, title <12–15) into a `verify.py` lint. [script]
- An assertion-title lint composable with the existing headline style checks. [script + LLM]
- Decision-deck closer: decision, scope, owner, date. [script pre-check + LLM]

**Sources:** [Wikipedia: BLUF](https://en.wikipedia.org/wiki/BLUF_(communication)) · [Management Consulted: Pyramid Principle](https://managementconsulted.com/pyramid-principle/) · [A-E tutorial](https://www.assertion-evidence.org/tutorial.html) · [Duarte: one idea per slide](https://www.duarte.com/blog/perfect-your-slide-design/)

---

## 3. Current state: what already works

### 3.1 slide-brainstorm (narrative and argument)

This skill has unusually deep argument rigor, mostly under home-grown names:

- **Claim titles** (= action titles): enforced in the Phase 3 verification, the "Make it punchier" pass, the template's verification table, and the final checklist.
- **One idea per slide** (= "slide job"): one question per slide in the arc format, density rules, reviewer check #11.
- **Claim + evidence per slide**: the mandatory ARGUMENT block (CLAIM+EVIDENCE or "ROLE: structural"), with fabrication hard-banned. Rationale recorded in ADR 0001.
- **Steelman objection coverage**: verbatim objection capture at intake, user-confirmed stress-test lines, a required rebutting slide, rigor audit check 2, reviewer item 5.
- **Storyboard-before-build** (= dot-dash twin): the gated Phase 2 Proposed Arc with title, purpose, main point, evidence, and builds-to per slide. User approval required before any HTML.
- **Layered enforcement**: phase exit gates, a 10-point verification, a 17-row anti-boring checklist, an independent subagent reviewer with P0/P1 blocking, a ~20-item final checklist, and 10 eval scenarios.

Do not re-add these. They exist.

### 3.2 html-slides (generation and verification)

- **One message + one visual protagonist**: repeated in SKILL.md, the production philosophy, and three theme docs.
- **Structural density limits** per slide type (bullets, cards, code lines).
- **Excellent chart-selection matrix** in `svg-charts.md`, including "don't chart ≤6 data points" and per-chart accessibility notes.
- **Anti-slop rules**: hero-metric template ban, identical-card-grid ban, no data-as-decoration.
- **Accent discipline mechanically enforced** (per-theme accent counting in `verify.py`).
- **Readability floors mechanically enforced** (24/20/60px text walker).
- **Executive norms** in Micron theme docs: focal KPI + action strip, 35–50% negative space, Decision/Close slides.
- **Honest about its limits**: "Passing verify.py is necessary but not a design review," plus a "Mechanically checked?" column in the UX lints doc.
- **Regression infrastructure**: `audit-theme-matrix.py` re-verifies all shipped examples and fresh scaffolds at three viewports.

### 3.3 slide-layout-designer + theme-factory (layout and visual)

- **Hierarchy operationalized**: required Primary/Secondary/Tertiary assignment.
- **One focal point**: "Visual protagonist" is a mandatory blueprint field.
- **Grid discipline**: the "canvas contract" (stage, margins, columns, gutters, rails) plus one fully worked archetype.
- **Reading-path design** with a quality gate.
- **Semantic color** with an explicit role mapping (blue=base, green=change, purple=active, orange/red=risk, gray=neutral).
- **Anti-text-wall discipline**: short labels, prose to rails, card grids banned as a default.
- **Reference-image extraction**: a 10-item layout-grammar checklist.
- theme-factory contributes a human-confirmation gate before applying a theme.

### 3.4 Output quality (real decks)

- The q3 board deck proves the pipeline *can* produce consulting-grade output: assertion titles, a complete titles-only story arc, one idea per slide (~44 words/slide), interpreted data, owners and dates on the ask.
- `verify.py` is a genuinely deep rendering/brand gate, and `--theme` is required so brand lints cannot be skipped.
- The brainstorm-stage reviewer subagent is a real enforcement pattern (P0–P3 severities, fix-or-record, inline fallback).
- `html-to-pptx` has a complete conversion-fidelity loop.

---

## 4. Gap analysis

Severity: **H** = high, **M** = medium, **L** = low. "Plan" links each gap to a plan item in section 5.

| # | Area | Framework | Gap | Sev | Recommendation (short) | Target file | Plan |
|---|------|-----------|-----|-----|------------------------|-------------|------|
| 1 | brainstorm | Minto / McKinsey horizontal logic | No titles-only read-through test anywhere (not in verification, rigor audit, or reviewer) | H | Add check 11 + final-checklist box + reviewer item | `.claude/skills/slide-brainstorm/SKILL.md` | P0-4 |
| 2 | brainstorm | MECE | No overlap/coverage/single-dimension test for takeaways, arc sections, or groups | H | Add "Grouping discipline" rule + verification item + reviewer item | `.claude/skills/slide-brainstorm/SKILL.md` | P1-7 |
| 3 | brainstorm | BLUF / SCR | Buried-lede bar is slide ≤3, persuasion-only; exec arc puts decision last | M | Answer-first arc row; tighten check to slide 2 for decision decks; extend to dense-exec informational decks | `.claude/skills/slide-brainstorm/SKILL.md` | P1-6 |
| 4 | brainstorm | SCQA | Opening discipline untaught; setup slides may assert contested claims | M | "Opening discipline" note; label S/C/A roles in arc Purpose lines; reviewer line | `.claude/skills/slide-brainstorm/SKILL.md` | P1-6 |
| 5 | brainstorm | Pyramid (gate integrity) | SKILL.md and iteration-patterns point to a rigor-audit section in template.md that does not exist; SOURCES block location undefined | H | Add Rigor Audit section + canonical ARGUMENT/SOURCES comment format | `.claude/skills/slide-brainstorm/references/template.md` | P0-5 |
| 6 | brainstorm | Assertion-Evidence (structure) | Canonical skeleton has zero ARGUMENT/SOURCES placeholders | M | Add placeholder comments per slide panel | `.claude/skills/slide-brainstorm/references/html-companion-skeleton.html` | P0-5 |
| 7 | brainstorm | MBB independent review | Reviewer prompt reads stale `.agents/skills/...` paths; rubric files cannot load | M | Fix paths; add step-0 "PATH FAILURE = P0" assertion | `.claude/skills/slide-brainstorm/references/subagent-review-verifier.md` | P0-5 |
| 8 | brainstorm | All rigor frameworks | No eval exercises the persuasion rigor path (ARGUMENT blocks, rigor audit, objection, lede) | H | Add one persuasion-deck eval with ~8 assertions | `.claude/skills/slide-brainstorm/evals/evals.json` | P1-10 |
| 9 | html-slides | Minto / Alley / SWD | Action-title doctrine completely absent; headline rules are form-only | H | Non-negotiable + theme-doc lines + `verify.py` assertion-title lint | `.claude/skills/html-slides/SKILL.md` | P0-2 |
| 10 | html-slides | BLUF / Minto answer-first | No answer-first requirement for executive decks; Decision/Close slides sit at the end | H | "Lead with the answer" section + `require_executive_summary_slide` check | `.claude/skills/html-slides/themes/micron-dark-executive/design.md` | P1-6 |
| 11 | html-slides | Mayer / Kawasaki / A-E / BLUF | No word budget anywhere; density table entirely unenforced | H | Word + bullet + card + code-line lints in `verify.py`; budget rows in SKILL.md | `.claude/skills/html-slides/scripts/verify.py` | P0-3 |
| 12 | html-slides | Minto horizontal flow | No skim test exists | M | `--print-titles` flag + skim-test checklist step | `.claude/skills/html-slides/references/process/verification.md` | P0-4 |
| 13 | html-slides | Zelazny / SWD | "Chart + takeaway" rule unverified | M | Chart-takeaway lint reusing the chart selector set | `.claude/skills/html-slides/scripts/verify.py` | P1-8 |
| 14 | html-slides | MECE | No grouping discipline for lists/cards | M | "Grouping discipline" subsection + checklist line | `.claude/skills/html-slides/references/process/production-grade-slide-philosophy.md` | P1-7 |
| 15 | html-slides | Duarte / SWD / Minto vertical logic | Step-14 screenshot inspection has no per-slide rubric | M | Per-slide rubric: glance, focal point, vertical logic, artifact tally | `.claude/skills/html-slides/references/process/verification.md` | P2-14 |
| 16 | html-slides | SWD / source honesty | "No invented stats" is one line; no provenance mechanism | M | Numeral-trace procedure + `data-placeholder` convention + script check | `.claude/skills/html-slides/references/process/verification.md` | P2-12 |
| 17 | html-slides | Zelazny / IBCS CHECK | No scale-integrity rules (zero baseline, dual axes, shared scales) | M | "Scale integrity" subsection + checklist line | `.claude/skills/html-slides/references/runtime/svg-charts.md` | P1-8 |
| 18 | html-slides | Mayer mode switch | Never asks live vs standalone | L | Step-2 question + `data-deck-mode` + budget profiles | `.claude/skills/html-slides/SKILL.md` | P2-11 |
| 19 | layout | Zelazny / IBCS / SWD | Charts entirely absent from the layout authority; no evidence-form grammar | H | "Evidence Form Selection" section + required blueprint field | `.claude/skills/slide-layout-designer/SKILL.md` | P1-9 |
| 20 | layout | A-E / Minto / SWD | Blueprint accepts label titles; no title-evidence link | H | Sentence-title rule + "Title-evidence link" and "Horizontal flow" gates | `.claude/skills/slide-layout-designer/SKILL.md` | P0-2 |
| 21 | layout | Mayer / Duarte / Kawasaki | All density and whitespace guidance unquantified | H | "Default Budgets" block in the canvas contract | `.claude/skills/slide-layout-designer/SKILL.md` | P0-3 |
| 22 | layout | Zelazny / Duarte / MECE | 7 of 8 archetypes are bare names | H | Create `references/archetypes.md` with triggers, wireframes, budgets | `.claude/skills/slide-layout-designer/references/archetypes.md` | P1-9 |
| 23 | layout | Mayer redundancy / SWD | No delivery-mode concept | M | Required "Mode: live \| standalone" canvas-contract line | `.claude/skills/slide-layout-designer/SKILL.md` | P2-11 |
| 24 | layout | MECE / Mayer segmenting | No caps or dimension rules for zones/steps/cards; long processes uncapped | M | Grouping rule (named dimension, 2–5 items) + segmenting rule (>5 steps split) | `.claude/skills/slide-layout-designer/SKILL.md` | P1-7 |
| 25 | layout | Mayer contiguity / SWD | No label-adjacency rules; legends and footnotes allowed | M | Direct-label rules + "Contiguity" quality gate | `.claude/skills/slide-layout-designer/SKILL.md` | P1-9 |
| 26 | layout | SWD / IBCS / Mayer signaling | theme-factory hands over 4 hexes with zero deployment rules; no mapping to semantic roles | H | "Color Deployment Rules" + per-theme semantic role mapping | `.claude/skills/theme-factory/SKILL.md` | P2-13 |
| 27 | layout | SWD accessibility | theme-factory contrast guidance is one line | M | WCAG thresholds + per-theme approved-pairs tables + verify.py hook | `.claude/skills/theme-factory/SKILL.md` | P2-13 |
| 28 | layout | Duarte Glance / SWD | Squint test is unfalsifiable self-attestation | M | Screenshot-based visual verification with defined fail conditions | `.claude/skills/slide-layout-designer/SKILL.md` | P2-14 |
| 29 | layout | Checkable-gates discipline | Evals are unscored prose; eval 1 and SKILL.md reference a missing "LoRA" asset | M | Bundle the asset; rewrite evals as rubrics; add a chart-grammar eval | `.claude/skills/slide-layout-designer/evals/evals.json` | P1-10 |
| 30 | layout | Duarte unity / A-E typography | Font-pairing claim is false (all themes share one pair); no type scale | L | Fix the claim; add per-theme type-scale blocks | `.claude/skills/theme-factory/themes/*.md` | P2-13 |
| 31 | output | McKinsey ghost-deck / Minto | No content-quality gate on the FINAL deck; titles get rewritten with zero re-review | H | Final-deck reviewer subagent + mandatory workflow step | `.claude/skills/html-slides/references/process/final-deck-review-subagent.md` (new) | P0-1 |
| 32 | output | Minto / Alley action titles | `verify.py` checks headline style, never content; "Financial results" passes | H | `require_assertion_titles` lint (banned labels, length, template-meta regex, digit check) | `.claude/skills/html-slides/scripts/verify.py` | P0-2 |
| 33 | output | BLUF / Mayer / repo's own budgets | 141-word slide with 4–5 exhibits passes all checks | H | `max_body_words_per_slide` lint + exhibit-block cap | `.claude/skills/html-slides/scripts/verify.py` | P0-3 |
| 34 | output | Zelazny / SWD / IBCS | Valueless charts, unlabeled heatmaps, "illustrative" pies pass | H | No-naked-charts lint with `data-illustrative` opt-out | `.claude/skills/html-slides/scripts/verify.py` | P1-8 |
| 35 | output | Minto / McKinsey dot-dash | Skim test never executed; final titles never diffed against the approved brainstorm | M | "Title storyline" output block + handoff title-diff rule | `.claude/skills/html-slides/scripts/verify.py` | P0-4 |
| 36 | output | Minto / SWD | Brainstorm reviewer lacks narrative checks (label titles, story order, naked exhibits, apples-to-oranges) | M | Append reviewer checks 14–17 | `.claude/skills/slide-brainstorm/references/subagent-review-verifier.md` | P1-10 |
| 37 | output | BLUF / Minto answer-first | Exec arc trains suspense ordering for decision decks | M | Answer-first default arc for decision decks + reviewer check | `.claude/skills/slide-brainstorm/SKILL.md` | P1-6 |
| 38 | output | MECE | No enumeration check anywhere; grid caps advisory only | M | Reviewer MECE check + sibling-count lint | `.claude/skills/slide-brainstorm/references/subagent-review-verifier.md` | P1-7 |
| 39 | output | BLUF executive norms | Final deck's closing ask never verified (owners/dates) | L | Closer criterion in final-deck reviewer + script NOTE pre-check | `.claude/skills/html-slides/references/process/final-deck-review-subagent.md` | P0-1 |
| 40 | output | McKinsey process discipline | html-to-pptx packages unverified decks with no signal | L | Precondition line in the Review Checklist | `.claude/skills/html-to-pptx/SKILL.md` | P2-14 |

Minor housekeeping (no plan item, fix opportunistically): SKILL.md says "six today" stable themes but `themes.json` lists five; the `verify.py` cursor lint early-returns on cursor values like `grab`; readability floors skip below 900px viewports (documented as intentional).

---

## 5. Prioritized improvement plan

Duplicates across areas are merged. 14 items: 5 × P0, 5 × P1, 4 × P2. Every item names its enforcement — a checklist step, a reviewer criterion, or a script check. Prose alone does not count.

### P0 — do first (highest leverage)

**P0-1. Final-deck content review subagent (html-slides)**
*Implements:* McKinsey ghost-deck review, Minto vertical/horizontal logic, SWD, Duarte Glance Test. *Merges gaps:* 31, 39.

- Create `.claude/skills/html-slides/references/process/final-deck-review-subagent.md`, modeled on slide-brainstorm's `subagent-review-verifier.md` (same P0–P3 severities, fix-or-record flow, inline fallback, `SUBAGENT REVIEW:` status token).
- Reviewer input: the final deck HTML plus the screenshots `verify.py` already emits.
- Criteria: (1) every content title is a business assertion, not a label or a sentence about the template; (2) skim test on the ordered titles — state the recommendation and ask, fail if unrecoverable; (3) one claim per slide; (4) every chart is interpretable (values, units, adjacent takeaway) or visibly marked illustrative; (5) decision decks close with decision + owner + date — placeholders ("TBD", "leadership") are P1.
- Wire into `.claude/skills/html-slides/SKILL.md` as mandatory step 14.5: run verify.py, spawn the reviewer, fix P0/P1 before delivery.
- **Enforced by:** mandatory workflow step; P0/P1 findings block delivery, same as the existing brainstorm gate.

**P0-2. Action-title doctrine + headline-assertion lint**
*Implements:* Minto action titles, McKinsey, Alley A-E, SWD takeaway titles. *Merges gaps:* 9, 20, 32.

- `.claude/skills/html-slides/SKILL.md`: add a Non-Negotiable directly after the one-message line: every content-slide headline is a full-sentence assertion stating the takeaway — a claim someone could dispute, with a verb, never a topic label; if the slide shows data, the headline carries the key number; max ~12 words / 2 lines. Mirror one line in each theme `design.md` and a checklist item in `references/process/verification.md`.
- `.claude/skills/html-slides/scripts/verify.py` + `themes/themes.json`: add a `require_assertion_titles` flag (on for executive themes; warning-level elsewhere). Extend the existing h1/h2 loop: (a) fail titles ≤3 words; (b) fail bare-label regex matches ("overview", "agenda", "background", "summary", "update", "results", "roadmap", "next steps", "team", "financials" as the full title); (c) flag titles >16 words; (d) flag template-meta patterns ("can be shown as", "reads best as", "this layout", "this slide", "template", "deserves the active state") — every bad Micron-deck title matches these; (e) when the slide contains a chart/table, flag titles with no digit. Print all titles in the report.
- `.claude/skills/slide-layout-designer/SKILL.md`: blueprint titles must be complete declarative sentences (6–15 words); add "Title-evidence link" and "Horizontal flow" quality gates.
- **Enforced by:** `verify.py` lint (cheap 80%) + final-deck reviewer criterion 1 (semantic judgment) + required blueprint gates.

**P0-3. Word and element budgets, mechanically enforced**
*Implements:* Mayer/Sweller working-memory limits, BLUF/Kawasaki density caps, A-E 20-words rule. *Merges gaps:* 11, 21, 33.

- `.claude/skills/html-slides/scripts/verify.py`: reuse the existing readability text-walker (chrome exclusions already exist) to: (a) count visible non-chrome body words per content slide, fail above a `themes.json` `max_body_words_per_slide` (default ~90 universal, ~60 executive); (b) fail any `ul`/`ol` with >6 `li`; (c) fail grids with >6 cards; (d) fail `pre`/`code` over 10 lines; (e) fail slides with >3 distinct chart/table/figure containers. Report per-slide counts.
- `.claude/skills/html-slides/SKILL.md`: add word-budget rows to the Density Limits table ("Body copy: 25–50 words; Title: ≤12 words") so the budget is doctrine, not just a lint.
- `.claude/skills/slide-layout-designer/SKILL.md`: add a "Default Budgets" block to the Canvas Contract: body ≤40 words (live) / ≤80 (standalone), title ≤15 words, ≤4 content chunks, ≤6 top-level blocks, ≤2 callouts per visual, ~30% whitespace floor, groups of 3–5. Change the `Text budget:` field spec to `Text budget: <N words> (default 40)` so an unfilled field is a visible violation.
- **Enforced by:** `verify.py` failures; blueprint field is required.

**P0-4. The titles-only skim test, at every stage**
*Implements:* Minto/McKinsey horizontal logic, dot-dash title fidelity. *Merges gaps:* 1, 12, 35.

- `.claude/skills/html-slides/scripts/verify.py`: print a "Title storyline" block at the end of every run — the ordered h1/h2 of every slide as a numbered list (the texts are already extracted). Add `--print-titles` as a standalone flag.
- `.claude/skills/html-slides/references/process/verification.md`: add a mandatory "Skim test" section: read the dumped titles alone; pass only if (a) they read as one argument from context to recommendation, (b) no two titles assert the same point, (c) for executive decks the recommendation appears in the first two titles. Reference from SKILL.md step 14.
- `.claude/skills/html-slides/SKILL.md` step 8: after building from an approved brainstorm, diff each final h2 against the brainstorm slide title; list any meaning change in the delivery summary with a one-line reason.
- `.claude/skills/slide-brainstorm/SKILL.md`: add check 11 "Horizontal logic — titles-only read-through" to the Phase 3 verification list, plus a matching final-checklist box. Add reviewer item to `references/subagent-review-verifier.md`: "Read only the slide titles in order. Can you retell the argument and the ask? Flag duplicate claims and gaps."
- **Enforced by:** script output forces the title sequence into view; checklist + reviewer items make the judgment a recorded pass/fail.

**P0-5. Repair the broken rigor machinery in slide-brainstorm**
*Implements:* Pyramid claim-evidence enforcement; gate integrity. *Merges gaps:* 5, 6, 7.

- `.claude/skills/slide-brainstorm/references/template.md`: add the missing "Rigor Audit" section: (a) the five checks verbatim; (b) the printed-in-HTML comment format (`<!-- RIGOR AUDIT: 1 PASS / 2 PASS ... -->`); (c) the canonical per-slide block: `<!-- ARGUMENT - CLAIM: <one sentence> | EVIDENCE: <data/demo/source> | SOURCES: <origin or ASSUMPTION> -->`, with the structural variant. Both dangling pointers (SKILL.md ~line 694, iteration-patterns.md) then resolve.
- `.claude/skills/slide-brainstorm/references/html-companion-skeleton.html`: add the placeholder comments to every slide panel (`<replace>` slots). An unreplaced `<replace>` is a failed slide under the existing "blank EVIDENCE" rule.
- `.claude/skills/slide-brainstorm/references/subagent-review-verifier.md`: fix the three `.agents/skills/...` paths to `.claude/skills/...`; add step 0: "Confirm you could read all three reference files; if not, report PATH FAILURE as a P0 finding."
- **Enforced by:** greppable comment format gives the reviewer (and any future script) a mechanical target; PATH FAILURE stops silent gate degradation.

### P1 — next

**P1-6. Answer-first (BLUF) for executive and decision decks**
*Implements:* BLUF (AR 25-50), Minto answer-first, McKinsey SCR exec summary, SCQA opening discipline. *Merges gaps:* 3, 4, 10, 37.

- `.claude/skills/slide-brainstorm/SKILL.md`: (a) add an answer-first arc row ("Decision → Status → Change → Implications"; title → decision/ask → where we are → what changed → what it means) and make it the default when intake Goal = decision/approval; (b) tighten rigor check 3 to "core message and ask on slide 2 for decision decks and dense-executive density; slide ≤3 otherwise"; (c) extend the buried-lede check to informational decks with dense-executive density; (d) add an "Opening discipline" note under the arc table: the first 2–3 slides cover Situation (uncontested context), Complication (verbatim from intake), Answer — and label these roles in the arc's `Purpose:` lines. Record the change as a note on ADR 0001.
- `.claude/skills/html-slides/themes/micron-dark-executive/design.md`: add a "Lead with the answer" section — decision decks place an executive-summary slide right after the cover, marked `data-slide-kind="executive-summary"`, stating the recommendation, the quantified ask, and the 2–4 key supports the sections mirror in order; the closing slide restates, never introduces.
- `.claude/skills/html-slides/themes/themes.json` + `scripts/verify.py`: add `require_executive_summary_slide` to `premium_corporate_checks`; verify slide 2 carries the marker (the cover check already keys on `data-slide-kind`, and the demo deck already uses this convention).
- **Enforced by:** `verify.py` check + tightened rigor-audit check + reviewer check ("recommendation by slide 2–3; only restatement after the evidence").

**P1-7. MECE grouping discipline**
*Implements:* MECE (Minto), Mayer segmenting. *Merges gaps:* 2, 14, 24, 38.

- `.claude/skills/slide-brainstorm/SKILL.md` Phase 2: when writing takeaways and arc sections — (a) name the single classifying dimension in one phrase; (b) probe pairs for overlap; add an explicit "Out of scope" line instead of silently dropping content; (c) cap sibling groups at 2–5 items of one rhetorical type. Add "Grouping discipline" to the Phase 3 verification list.
- `.claude/skills/html-slides/references/process/production-grade-slide-philosophy.md`: add a "Grouping discipline" subsection with the five testable rules (one nameable dimension; no two-bucket items; 2–5 items; parallel grammar; explicit small "Other"). Matching line in `verification.md`.
- `.claude/skills/slide-layout-designer/SKILL.md`: zones/steps/cards must state their cutting dimension ("3 zones, cut by pipeline stage"), hold 2–5 items, and not overlap; processes >5 steps split across slides or staged reveals (deepens the progressive-disclosure one-liner). Add a "Grouping" quality gate.
- `.claude/skills/slide-brainstorm/references/subagent-review-verifier.md` (+ the new final-deck reviewer): add the MECE check — name the dimension; flag overlapping pairs, obvious missing buckets, mixed cause/action/finding lists, groups of 1 or >5.
- `.claude/skills/html-slides/scripts/verify.py`: mechanical half — count direct children of repeated-card/list containers and fail above 6 (promotes the density table to a lint; overlaps with P0-3c).
- **Enforced by:** sibling-count lint + reviewer criterion + verification checklist lines.

**P1-8. Chart integrity: scale rules, no naked charts, takeaway required**
*Implements:* Zelazny "a chart is a sentence", IBCS CHECK, SWD bans. *Merges gaps:* 13, 17, 34.

- `.claude/skills/html-slides/references/runtime/svg-charts.md`: add a "Scale integrity" subsection after "Picking the chart": (1) bar/column value axes start at zero; (2) non-zero line baselines only with visible range labels; (3) no dual y-axes — split into stacked charts sharing an x-axis; (4) comparable charts share identical ranges or carry an annotation; (5) no 3D ever. Checklist line in `verification.md`.
- `.claude/skills/html-slides/scripts/verify.py`, reusing the existing chart selector set (`svg[role="img"]`, `canvas`, `.chart`, `[data-chart]`):
  - **Chart-takeaway lint:** any non-title slide with a chart must contain visible text outside the chart subtree of ≥5 words at ≥20px (figcaption, `.takeaway`, or `p`). Fail with slide index.
  - **No-naked-charts lint:** each chart needs ≥2 visible text nodes containing digits inside or adjacent to it (values/axis labels). Opt-out: `data-illustrative="true"` passes only when a visible "Illustrative" label renders on the slide — showcase decks stay legal but must declare themselves.
- Final-deck reviewer criterion: "Name the number this chart proves; if you cannot, the chart is decoration."
- **Enforced by:** two `verify.py` lints + reviewer criterion; doctrine first so ECharts configs can be linted later.

**P1-9. Evidence-form grammar + archetype library (slide-layout-designer)**
*Implements:* Zelazny message-first selection, IBCS, Mayer contiguity, Duarte arrangement. *Merges gaps:* 19, 22, 25.

- `.claude/skills/slide-layout-designer/SKILL.md`: add an "Evidence Form Selection" section with Zelazny's lookup: state the slide message in one sentence; classify the comparison (component / item / time-series / distribution / correlation); map to 100%-stacked bar / sorted horizontal bar / line-or-column / histogram / scatter; plus "table for exact lookup or >2 units, big-number text for 1–2 numbers, diagram for mechanism or flow." Hard rules: zero baselines, ≤6 pie segments (prefer stacked bar), ≤4 lines, time left-to-right, no 3D, no dual axes, shared scales. Make `Evidence form: <type> proving <comparison>` a required Per-Slide field.
- Add contiguity rules to step 6 and Hard Rules: direct-label series and diagram parts (no legend boxes when ≤4 series; no footnote asterisks for essential info); the element proving the title carries the annotation or accent; explanatory text sits adjacent. Add "Contiguity" to the quality gates and Review Mode weak patterns.
- Create `.claude/skills/slide-layout-designer/references/archetypes.md`: one block per archetype (all 8) with selection triggers, ASCII zone map, protagonist type, reading path, semantic color use, default text budget. Update Workflow step 2 to require `Archetype: <name> because <trigger>`.
- **Enforced by:** required blueprint fields — a blueprint without "Evidence form" on a data slide or "Archetype: X because Y" is incomplete by definition, like a missing Visual protagonist.

**P1-10. Strengthen the brainstorm reviewer + close the eval gap**
*Implements:* checkable-gates discipline across all frameworks. *Merges gaps:* 8, 29, 36.

- `.claude/skills/slide-brainstorm/references/subagent-review-verifier.md`: append checks 14–17: (14) titles that are labels or statements about the slide/template itself; (15) titles-only read in order — name the first slide where the storyline breaks (overlaps P0-4; one file edit covers both); (16) any data exhibit whose numbers, units, or takeaway a reader cannot state from the slide alone; (17) any headline comparison vulnerable to an apples-to-oranges challenge (mismatched cohorts, windows, denominators) with no caveat — this targets the q3 deck's unhedged 79x claim.
- `.claude/skills/slide-brainstorm/evals/evals.json`: add one persuasion-deck scenario (budget approval to a skeptical VP, partial evidence) with ~8 assertions: deck classified persuasion + evidence intake; objection captured verbatim; stress-test lines + named rebutting slide; ARGUMENT block on every panel; rigor audit printed and PASS-or-waived; core message by the required slide; SOURCES/ASSUMPTION on every stat; titles-only read-through performed.
- `.claude/skills/slide-layout-designer/evals/evals.json` + `references/`: bundle a real reference asset (fixes the dangling "LoRA reference" pointer at SKILL.md line 81 and eval 1's empty files array); rewrite expected_outputs as field-by-field rubrics; add a fourth eval feeding a trend + a ranking and checking line and sorted-bar evidence forms.
- **Enforced by:** eval assertions are the regression protection; reviewer items are blocking at P0/P1.

### P2 — later

**P2-11. Live vs standalone delivery mode**
*Implements:* Mayer redundancy/mode switch, SWD mechanism question. *Merges gaps:* 18, 23.

- `.claude/skills/html-slides/SKILL.md` step 2: alongside HTML vs PDF, confirm "presented live or circulated standalone." Record as `data-deck-mode="live|standalone"` on the deck root.
- Consequences: standalone makes the chart-takeaway lint (P1-8) a hard fail; live uses the strict word budget, standalone relaxes ~1.5x via a `themes.json` multiplier read by the density lint (P0-3).
- `.claude/skills/slide-layout-designer/SKILL.md`: required `Mode: live | standalone` line in the Canvas Contract, tied to the Default Budgets.
- **Enforced by:** `verify.py` reads the mode attribute and applies the matching budget profile; a blueprint without Mode is incomplete.

**P2-12. Source honesty: provenance, not trust**
*Implements:* SWD annotate-the-evidence, Micron CXO source honesty. *Covers gap:* 16.

- `.claude/skills/html-slides/references/process/verification.md`: add a "Source honesty" procedure — (1) before delivery, extract every numeral and quoted string (grep) and trace each to user-supplied material or the approved brainstorm; (2) illustrative values carry `data-placeholder="true"` AND a visible "Illustrative" tag.
- `.claude/skills/html-slides/scripts/verify.py`: check every `[data-placeholder]` element has visible placeholder labeling; optional `--source <file>` flag diffs deck numerals against the source corpus and lists orphans as NOTES.
- Upgrade the checklist line to "Every numeral traced to source or visibly marked illustrative."
- **Enforced by:** script check + executable checklist procedure (grep, not judgment).

**P2-13. theme-factory: deployment rules, contrast pairs, type scale**
*Implements:* SWD one-accent-vs-gray, IBCS Unify, Duarte unity, WCAG. *Merges gaps:* 26, 27, 30.

- `.claude/skills/theme-factory/SKILL.md`: add "Color Deployment Rules" — background 60–70% of any slide; primary accent on ≤~10% of elements and only on the message-carrying content (one accent moment per slide); secondary accent for de-emphasized context. Replace the contrast one-liner with WCAG thresholds matching the html-slides verify.py gates (4.5:1; 7:1 body-on-light), and an instruction to run `html-slides/scripts/verify.py --fail-on-warnings` when the artifact is an HTML deck.
- Each `themes/*.md`: add a "Semantic role mapping" line binding the palette to slide-layout-designer's roles (e.g. ocean-depths: Teal=active, Seafoam=context, Cream=text, Deep Navy=base), an "Approved pairs" contrast table, and a "Type scale" block (60/36/24/20px to match the html-slides floors). Fix or honestly amend the "complementary font pairings" claim (all themes currently ship the same DejaVu pair).
- `.claude/skills/slide-layout-designer/SKILL.md` step 6: "when a theme-factory theme is active, take semantic role hexes from its mapping table" — pins the cross-skill contract in both directions.
- **Enforced by:** whitelist tables (pick, don't judge) + the existing mechanical contrast/font-size gates downstream.

**P2-14. Falsifiable visual checks + conversion precondition**
*Implements:* Duarte Glance Test, SWD eyes-drawn test, McKinsey gate ordering. *Merges gaps:* 15, 28, 40.

- `.claude/skills/html-slides/references/process/verification.md`: replace the loose step-14 prose with a per-slide screenshot rubric: (1) Glance — state the slide's single point in one sentence within 3 seconds; (2) Focal point — where do the eyes land first, and is it the evidence for the headline; (3) Vertical logic — name any body element arguing something else; (4) Artifact tally toward the existing >50% text-row revise trigger. Record pass/fail per slide; any fail = the existing mandatory revise trigger. Point SKILL.md step 14 at the rubric.
- `.claude/skills/slide-layout-designer/SKILL.md` Review Mode: add a "Visual Verification" procedure — render per-slide screenshots (verify.py already emits them), answer "where do the eyes land first?" and "what is the point in one sentence?" cold from the image; fail if the answers do not match the declared protagonist and the slide title. Record per slide.
- `.claude/skills/html-to-pptx/SKILL.md` Review Checklist: add the precondition — if the source is an html-slides deck, confirm verify.py passed and (for executive decks) the final-deck review recorded PASS or accepted-risk; otherwise run the gates first or state in the final response that the PPTX packages an unverified deck. Apply to both skill copies.
- **Enforced by:** recorded per-slide pass/fail with a defined fail condition; the revise trigger already exists — this makes it falsifiable.

---

## 6. Sync note

**Every change under `.claude/skills/<skill>/` must be mirrored to `.agents/skills/<skill>/`.** The two copies must stay identical. This applies to every file touched by this plan:

- `slide-brainstorm` (SKILL.md, references/*, evals/*)
- `html-slides` (SKILL.md, scripts/verify.py, themes/*, references/*)
- `slide-layout-designer` (SKILL.md, references/*, evals/*)
- `theme-factory` (SKILL.md, themes/*)
- `html-to-pptx` (SKILL.md) — this skill already has an explicit two-copy sync convention.

Two extra points:

1. **P0-5 is partly a sync bug.** The reviewer prompt's stale `.agents/skills/...` paths show what happens when the copies drift. After fixing, the added step-0 path assertion ("PATH FAILURE = P0") protects against future drift.
2. **Recommended habit:** make each plan item one commit that touches both copies, then diff the two trees (`diff -r .claude/skills/<skill> .agents/skills/<skill>`) before finishing. A small CI or pre-commit check that runs this diff would make the sync rule mechanical too.

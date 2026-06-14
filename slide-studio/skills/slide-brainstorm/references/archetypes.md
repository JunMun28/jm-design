# Layout Archetype Library

One block per archetype. Pick by trigger, declare in the blueprint as `Archetype: <name> because <trigger>`, then adapt the zone map to the content. Text budgets are live-mode defaults; standalone mode relaxes them 1.5x.

Semantic color roles used below: base = blue, change/trainable = green, active = purple, action/risk = orange/red, scaffolding = neutral gray. When a theme-factory theme is active, take the hex for each role from its "Semantic role mapping" table.

## Technical Infographic

**Pick when:** "How X works", ML/AI mechanisms, architecture explanations, workflows, developer training — one mechanism must be understood, not compared. (Matches `references/lora-reference.md`.)

```text
+------------------------------------------------------+
| TITLE (large, centered)  + one explanatory subtitle  |
+--------------+--------------+--------------+--------+
| [1] input /  | [2] the      | [3] output / | RAIL   |
|     base     |   mechanism  |    result    | state, |
|   (diagram)  |   (diagram)  |   (diagram)  | notes, |
|              |  -> arrows ->|              | warns  |
+--------------+--------------+--------------+--------+
| BOTTOM BAND: why it matters / takeaways / checklist  |
+------------------------------------------------------+
```

- **Protagonist:** the composed mechanism diagram spanning the 3 numbered zones.
- **Reading path:** title → zones 1→2→3 via numbered badges and arrows → right rail → bottom band.
- **Semantic color:** blue base/frozen, green trainable/change, purple active flow, orange/red training/action/risk, gray labels and inactive paths.
- **Text budget:** 40 words; labels ≤4 words; sentences only in rail and bottom band.

## Process Pipeline

**Pick when:** sequential flows — build/deploy pipelines, lifecycles, request handling, step-by-step procedures with 2–5 stages (more than 5: split or stage reveals).

```text
+------------------------------------------------------+
| TITLE (assertion about the flow)                     |
+------------------------------------------------------+
| (1)====>(2)====>(3)====>(4)   stage chips + arrows   |
|          ^ active stage emphasized                   |
+------------------------------------------------------+
| DETAIL STRIP: expanded view of the active stage      |
+------------------------------------------------------+
| OUTCOME BAND: what exits the pipeline / why it works |
+------------------------------------------------------+
```

- **Protagonist:** the pipeline band itself, with one active stage enlarged.
- **Reading path:** title → stages left-to-right → detail strip → outcome band.
- **Semantic color:** purple active stage, green completed, gray pending/inactive, orange failure/retry paths.
- **Text budget:** 35 words; stage labels ≤3 words; detail strip carries the only sentences.

## System Architecture Map

**Pick when:** "what talks to what" — service topology, data flow, integration landscape, layered platforms.

```text
+------------------------------------------------------+
| TITLE (assertion about the system)                   |
+--------------------------------------------+---------+
| TIER 1: clients / entry points             | RAIL    |
|    |            |             |            | limits, |
| TIER 2: services [A]--[B]--[C]             | SLAs,   |
|    |            |             |            | risks   |
| TIER 3: data stores / external systems     |         |
+--------------------------------------------+---------+
| LEGEND-FREE: every node and edge direct-labeled      |
+------------------------------------------------------+
```

- **Protagonist:** the layered component map with its connectors.
- **Reading path:** top tier to bottom tier, or source-to-sink along the highlighted data path.
- **Semantic color:** blue stable infrastructure, purple the active/request path the slide argues about, orange bottleneck or risk node, gray everything not in the story.
- **Text budget:** 40 words; node labels ≤3 words; constraints live in the rail.

## Decision Cockpit

**Pick when:** the audience must choose — option selection, go/no-go, vendor or approach decision with explicit criteria.

```text
+------------------------------------------------------+
| TITLE = the recommendation (with key number)         |
+-------------+--------------+--------------+----------+
| CRITERIA    | OPTION A     | OPTION B *   | OPTION C |
| cost        |   ...        |  ... (rec.)  |   ...    |
| risk        |   ...        |  ...         |   ...    |
| time        |   ...        |  ...         |   ...    |
+-------------+--------------+--------------+----------+
| VERDICT BAND: the ask — decision, amount, owner, date|
+------------------------------------------------------+
```

- **Protagonist:** the recommended option column, visibly accented.
- **Reading path:** title (the answer) → recommended column → criteria comparison → verdict band.
- **Semantic color:** green recommended column, gray alternatives, red blocking criteria; one accent only.
- **Text budget:** 40 words; cells are values or icons, not sentences.

## Comparison Matrix

**Pick when:** items vs attributes with no single decision attached — feature support, before/after, capability coverage across 2–5 items.

```text
+------------------------------------------------------+
| TITLE (assertion: who/what wins and by how much)     |
+------------+-----------+-----------+-----------------+
| ATTRIBUTE  | ITEM 1    | ITEM 2 *  | ITEM 3          |
| attr A     |  x        |  ok       |  ok             |
| attr B     |  ok       |  ok       |  x              |
| attr C     |  x        |  ok       |  ok             |
+------------+-----------+-----------+-----------------+
| TAKEAWAY BAND: the one-line so-what                  |
+------------------------------------------------------+
```

- **Protagonist:** the matrix with one highlighted winning column or row.
- **Reading path:** title → highlighted column → row-wise scan → takeaway band.
- **Semantic color:** one accent on the winning column; check/cross icons over text; gray grid scaffolding.
- **Text budget:** 30 words; cells are icons, numbers, or ≤2-word phrases.

## Evidence Board

**Pick when:** several independent data points must prove one claim — results readouts, benchmark roundups, audit findings, quarterly numbers.

```text
+------------------------------------------------------+
| TITLE = the claim, carrying the key number           |
+-------------------------------+----------------------+
| HERO EXHIBIT (~60% width)     | SUPPORT 1 + takeaway |
| the chart/stat that proves    +----------------------+
| the title, direct-labeled,    | SUPPORT 2 + takeaway |
| accent on the message data    +----------------------+
|                               | SUPPORT 3 + takeaway |
+-------------------------------+----------------------+
| SOURCE BAND: provenance, period, caveats             |
+------------------------------------------------------+
```

- **Protagonist:** the hero stat or chart at largest scale; supports visibly smaller.
- **Reading path:** title → hero exhibit → supporting strip top-to-bottom → source band.
- **Semantic color:** one accent on the message-carrying data only; all other series gray.
- **Text budget:** 40 words; every exhibit carries a one-line adjacent takeaway; pick forms via Evidence Form Selection.

## Training Walkthrough Specimen

**Pick when:** teaching by example — annotated code, worked example, real config, before/after artifact for learners.

```text
+------------------------------------------------------+
| TITLE (assertion about what the specimen shows)      |
+----------------------------------------+-------------+
| SPECIMEN (~65% width)                  | CALLOUTS    |
|   real artifact: code / config /       | (1) why     |
|   document, near-full scale,           | (2) gotcha  |
|   highlighted lines or regions         | (3) change  |
+----------------------------------------+-------------+
| WHY BAND: what changed / what to remember            |
+------------------------------------------------------+
```

- **Protagonist:** the specimen itself — a real artifact, not a stylized summary of one.
- **Reading path:** specimen top-to-bottom, following numbered callouts anchored to lines/regions.
- **Semantic color:** purple/accent on active lines, green additions, red removals, gray surrounding context.
- **Text budget:** 50 words (teaching decks are often standalone: up to 80); callouts ≤12 words each.

## Executive Proposal Sheet

**Pick when:** decision or approval asks to senior audiences — budget, headcount, strategy ratification. This is the BLUF slide.

```text
+------------------------------------------------------+
| TITLE = the recommendation as a sentence             |
+-------------------------------+----------------------+
| THE ASK (big number block):   | RISK RAIL            |
| amount, date, owner           | top risk +           |
+-------------------------------+ mitigation           |
| SUPPORT 1 | SUPPORT 2 | SUPPORT 3 (one row, equal)   |
+------------------------------------------------------+
| NEXT-STEP BAND: decision needed, by whom, by when    |
+------------------------------------------------------+
```

- **Protagonist:** the quantified ask as a big-number/statement block.
- **Reading path:** title → ask block → supports left-to-right → risk rail → next-step band.
- **Semantic color:** single brand accent on the ask, gray support scaffolding, red reserved for risk.
- **Text budget:** 35 words, strict; supports are one clause each.

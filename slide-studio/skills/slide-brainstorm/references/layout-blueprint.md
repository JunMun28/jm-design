# Layout Blueprint Pass

The layout-architecture pass for slides. Run this inside `slide-brainstorm`
after the narrative arc is approved (it produces the internal DESIGN INTENT
lines and the per-slide blueprint), and inside `html-slides` when a deck
needs a full spatial blueprint before implementation.

## Core Standard

Make slides that pass the squint test: from a distance, the viewer should see the hierarchy, grouping, and reading path before reading any text.

Prefer layouts that feel designed, not merely arranged:

- One visual protagonist per slide.
- A visible grid with intentional zones.
- Strong hierarchy through scale, weight, position, and whitespace.
- Grouping by proximity, borders, rhythm, and semantic color.
- Diagrams, specimens, tables, and artifacts instead of generic cards.
- Repetition across a deck, but variation between slide types.

## Action Titles

- Every blueprint slide title is a complete declarative sentence (6–15 words) stating the slide's takeaway — a claim someone could dispute, never a topic label.
- If the slide shows data, the title carries the key number.
- Title-evidence link: the visual protagonist must prove the title.
- Horizontal flow: the blueprint titles read in order must tell the full story.

## Research Pass

If the user asks for research, attaches a style reference, or wants a higher-quality layout system, do a short research pass before designing.

Use research to extract principles, not to copy templates. Favor stable design ideas:

- Visual hierarchy: size, position, contrast, and alignment guide attention.
- Gestalt grouping: proximity, similarity, common region, and continuity make complex content readable.
- CRAP principles: contrast, repetition, alignment, and proximity.
- Whitespace: use empty space as an active separator and focus tool.
- Grid discipline: place content into repeatable columns, rows, rails, and gutters.
- Progressive disclosure: show the full system faintly, then emphasize the active step; split processes of more than 5 steps across slides or staged reveals.

When web research is used, mention sources briefly in the final answer. Do not paste long quotes.

## Reference Image Extraction

When the user attaches an image or points to a visual example, extract its layout grammar:

1. Canvas and aspect ratio.
2. Margins, gutters, and major grid.
3. Reading path.
4. Title/subtitle treatment.
5. Primary content zones.
6. Supporting rails, sidebars, or summary bands.
7. Color semantics.
8. Shape language.
9. Icon and annotation style.
10. Density limits and text hierarchy.

Name what makes the reference work, then adapt it to the current content. Do not blindly recreate the exact slide unless the user asks for a clone.

## Technical Infographic Archetype

Use this for "How X works", ML/AI mechanisms, architecture explanations, workflows, and developer training.

Layout grammar:

- Top title stack: large centered title, one explanatory subtitle.
- Main canvas: 3 numbered zones across the middle, each with a clear role.
- Right rail: runtime/state notes, training vs inference, warnings, or decision cues.
- Bottom band: why it matters, benefits, takeaways, or checklist.
- Vertical separators: use lightly to show major groups.
- Semantic colors:
  - Blue for base/frozen/stable.
  - Green for trainable/change/update.
  - Purple for active flow/current step.
  - Orange/red for training/action/risk.
  - Neutral gray for labels, scaffolding, and inactive paths.
- Visual primitives: matrix grids, adapter blocks, arrows, badges, small equation cards, icon bullets, and mini before/after artifacts.
- Text rhythm: labels are short; explanatory text lives in side rail or bottom band.

This archetype matches the bundled LoRA reference (`lora-reference.md`): it explains a technical mechanism as a single composed diagram, not as a sequence of generic cards.

## Evidence Form Selection

Message first, form second. For every data slide:

1. State the slide message in one sentence.
2. Classify the comparison: component, item, time-series, distribution, or correlation.
3. Map it: component → 100%-stacked bar; item → sorted horizontal bar; time-series → line or column; distribution → histogram; correlation → scatter.
4. Override the chart when it fits better: table for exact lookup or more than 2 units; big-number text for 1–2 numbers; diagram for mechanism or flow.

Hard rules for chart forms:

- Bar and column charts start at a zero baseline.
- Max 6 pie segments; prefer a 100%-stacked bar.
- Max 4 lines per line chart.
- Time runs left-to-right.
- No 3D. No dual axes.
- Comparable charts share scales.

Record the choice in the blueprint as `Evidence form: <type> proving <comparison>` — required for every data slide.

## Grouping Discipline

- Every set of zones, steps, or cards states its cutting dimension ("3 zones, cut by pipeline stage").
- Groups hold 2–5 items of one rhetorical type — all causes, all steps, or all asks, never mixed — and items must not overlap.
- Use an explicit small "Other" bucket instead of silently dropping items.
- Split processes of more than 5 steps across slides or staged reveals.

## Layout Workflow

1. **Inventory the content.**
   - Identify entities, relationships, states, formulas, examples, and decisions.
   - Remove copy that belongs in speaker notes.

2. **Choose the layout archetype.**
   - Technical infographic.
   - Process pipeline.
   - System architecture map.
   - Decision cockpit.
   - Comparison matrix.
   - Evidence board.
   - Training walkthrough specimen.
   - Executive proposal sheet.
   - Declare it as `Archetype: <name> because <trigger>`. Selection triggers, zone maps, reading paths, and budgets per archetype are in `archetypes.md`.

3. **Set the canvas contract.**
   - Use a 16:9 stage unless the delivery target says otherwise.
   - Declare `Mode: live | standalone` — live keeps the strict Default Budgets; standalone relaxes them 1.5x.
   - Define margins, column count, gutters, title area, content zones, and persistent rails.
   - Reserve whitespace before placing details.

4. **Assign hierarchy.**
   - Primary: the one idea or mechanism.
   - Secondary: the parts or steps.
   - Tertiary: labels, equations, caveats, and captions.

5. **Design the reading path.**
   - Use numbered badges, arrows, alignment, and common regions.
   - Avoid layouts where every element competes equally.

6. **Specify visual primitives.**
   - Define the reusable shapes: matrices, cards, chips, rails, formula boxes, icons, connectors, states.
   - Make color semantic, not decorative.
   - When a theme-factory theme is active, take semantic role hexes from its "Semantic role mapping" table.
   - Contiguity: direct-label series and diagram parts — no legend boxes when 4 or fewer series, no footnote asterisks for essential info.
   - The element proving the title carries the annotation or accent; explanatory text sits adjacent to what it explains.

7. **Write implementation notes.**
   - Include CSS grid/flex structure, fixed dimensions, and overflow risks.
   - For `html-slides`, name useful classes and stage-safe constraints.

## Output Format

When asked to design layout, return a layout blueprint:

```markdown
## Layout Blueprint

**Direction:** <one-sentence design direction>

**Reference Grammar:** <what style/reference is being adapted>

**Canvas Contract:**
- Stage:
- Mode: live | standalone
- Margins:
- Grid:
- Persistent elements:
- Default Budgets: body ≤40 words (live) / ≤80 (standalone); title ≤15 words; ≤4 content chunks; ≤6 top-level blocks; ≤2 callouts per visual; ~30% whitespace floor; groups of 3–5

**Slide Patterns:**
1. <pattern name> — <where to use it>
   Wireframe:
   ```text
   [ASCII wireframe]
   ```
   Notes:

**Per-Slide Layout Plan:**
1. <slide title — complete declarative sentence, 6–15 words>
   - Archetype: <name> because <trigger>
   - Visual protagonist:
   - Evidence form: <type> proving <comparison> (required for data slides)
   - Zones: <N zones, cut by <dimension>>
   - Text budget: <N words> (default 40)
   - Implementation notes:

**Quality Gates:**
- Squint test:
- Reading path:
- Title-evidence link:
- Horizontal flow:
- Grouping:
- Contiguity:
- Semantic color:
- Overflow risks:
```

If the user asks you to implement the slides, produce the blueprint first, then continue into `html-slides` or `pptx`.

## Review Mode

When reviewing an existing deck that feels unimpressive:

1. Identify repeated weak patterns: same-size cards, text rows, no protagonist, weak grouping, contiguity breaks (legend boxes, footnoted essentials, annotations far from their evidence), too many equal accents, no artifacts.
2. Pick 2-4 slides that should become showcase slides.
3. Replace generic layouts with archetypes.
4. Preserve content truth; upgrade spatial storytelling.
5. Verify the final deck visually after implementation, using Visual Verification below.

### Visual Verification

After implementation, judge each slide from its rendered image, not the code:

1. Render per-slide screenshots (`html-slides`' `verify.py` already emits them).
2. Cold from the image, answer: "Where do the eyes land first?" and "What is the point in one sentence?"
3. Fail the slide if the answers do not match the declared visual protagonist and the slide title.
4. Record pass/fail per slide.

## Hard Rules

- Do not use decoration as a substitute for structure.
- Do not make every slide a card grid.
- Do not shrink text below presentation readability just to fit a dense layout.
- Do not copy an attached slide's exact branding, icons, or protected artwork unless the user owns it and asks for that.
- Do not invent facts or metrics to fill a layout.
- Do not use legend boxes when a chart has 4 or fewer series; direct-label the series and diagram parts.
- Do not push essential information into footnote asterisks; place explanatory text adjacent to what it explains.

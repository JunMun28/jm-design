---
name: slide-brainstorm
description: >-
  Use this skill BEFORE generating any html-slides deck when the user asks for a
  deck, slides, or presentation. This skill runs a structured discovery process:
  ask targeted questions about audience, narrative, content, and tone;
  synthesize the framing; generate and revise a lightweight HTML visual
  companion during brainstorming; then use that same HTML brainstorm artifact
  for review and approval. Only after the user approves the brainstorm should
  the html-slides skill be invoked. Trigger
  this whenever a user asks to "create a
  deck", "make slides", "build a presentation", or describes a presentation goal
  without already providing a detailed slide-by-slide spec. Do NOT skip this
  skill just because the request seems clear; clarity in the prompt rarely
  equals clarity in the final deck.
---

# Slide Brainstorming Skill

Use this skill to align on content and structure before any html-slides
rendering.

Most deck failures are not design failures. They are framing failures: wrong
audience, wrong narrative arc, wrong tone for the room. A beautiful deck that
says the wrong thing is worse than an ugly deck that says the right thing.

This skill forces alignment before pixels.

## When to use

Trigger this before the `html-slides` skill any time a user requests a deck,
slide, or presentation unless they already provided a complete slide-by-slide
spec.

Examples that trigger:

- "Make me a deck about X"
- "Create slides for my presentation on Y"
- "Build a pitch deck for Z"
- "I need to present X to my team. Help me."

Examples that can skip:

- User provides a complete outline with title and bullets for each slide.
- User is editing or regenerating an existing deck they already approved.
- User explicitly says "just make it, don't ask questions."

When in doubt, run this skill. A short discovery exchange prevents deck rework.

Routing: simple internal/training decks delivered as PPTX/PDF belong to
the `slide-quick` skill (fast path, no full brainstorm). Use this skill
for executive, persuasion, brand-locked, or HTML-delivery decks — and say
so on the first turn so the user can switch.

## Workflow

```
Phase 1: Discovery        -> Ask targeted questions
Phase 2: Visual companion -> Create/update the brainstorm HTML while thinking
Phase 3: Synthesis        -> Confirm understanding, propose narrative
Phase 4: Review + audit   -> Finalize the HTML brainstorm for approval
Phase 5: Handoff          -> Pass the approved brainstorm HTML to the build skill
```

Each phase has an exit condition. Do not move forward until it is met. The HTML
companion is not a final deck and does not count as invoking `html-slides`; it
is the brainstorming surface.

## Phase 1 - Discovery

**Tone: helpful and collaborative — a guide helping the user think their
deck through, never an interrogator.** Warm, curious, on their side. One
question at a time, in plain language, and wait for the answer before the
next. Walk the discovery tree one branch at a time, letting each answer
inform the next question. Never dump a numbered list of questions in one
turn. When an answer is thin, help rather than challenge: offer a starting
point, an example, or two options to react to — make answering easy.

There are two kinds of question and they behave differently:

- **Framing** (audience, technicality, goal, length, presentation style,
  slide density) — give the user
  **numbered options**:
  a short list `1`–`4` answered with a single digit, via the
  `AskUserQuestion` tool. ~6 questions, kept light. Mark "(Recommended)"
  **only when a recommendation is genuine** — a defensible default or a
  strong inference (legit for length; not for audience, which is the user's
  own fact). Never auto-tag option 1. Every option label literally starts
  with its number (`1. `, `2. `…) — no unnumbered choice is ever shown to
  the user, anywhere. See `references/intake-questions.md`.
- **Content** (subject, key takeaways, source material, concrete
  examples/data, photos/image placeholders) — **explore in depth,
  open-ended.** This is where deck
  quality is won or lost, so it's worth a real conversation. Keep going
  (typically 3–5 questions) until you could draft the deck's spine yourself
  without inventing anything. Don't rush it to hit a question count, and
  don't reduce it to a menu — but keep it a friendly back-and-forth: if an
  answer is too thin to build from, gently say what's still fuzzy and
  suggest a way to fill it.

Prefix intake turns with a compact progress label (`Framing 1/6`,
`Content 2/4`, `Visual companion`, `HTML brainstorm`) so the user understands
where they are. If an option answer is invalid, say that only choices `1`–`4`
exist and invite a custom answer in words; do not just say "No option 5."

**A bare acknowledgement is not a content answer.** On the content
questions, "ok", "sure", "yeah", "you choose", "whatever you think", silence,
or repeating the question back is **not** an answer — it is the user
deferring. Never take your own example as their answer just because they
didn't object. When this happens:

1. Say plainly that you only have a placeholder, not their real content, and
   that for this question it matters (a teaching deck you invented teaches
   your guess, not their practice).
2. Offer a concrete, *accurate* proposal they can ratify — clearly labelled
   as your proposal — and ask them to confirm it, correct it, or replace it.
3. Only proceed on real substance **or** an explicit, informed "yes, use
   your version, I accept it's a proposal" — recorded as such in the
   brainstorm HTML (`ASSUMPTION:` line, not presented as the user's content).

When the user selects from proposed content, tell them up front that
multi-select is allowed (`reply with numbers to keep, or edit wording`) and
accept answers such as `1,2,5`. If selected items came from your proposal,
they are still `ASSUMPTION:` entries unless the user supplied the wording.

**Detect disengagement.** If two or more content questions in a row come
back as non-answers, stop collecting and surface it: "I'm filling in the
substance myself here — that usually means the deck won't say what you want.
Want to give me the real content, or should I draft a clearly-marked
proposal for you to react to?" A deck silently built from your own guesses
is a failure even when every box is ticked. This is the content analogue of
the Phase 4 "direction keeps changing" pause.

### Proposal sharpener mode

Use a tighter decision-tree flow when the user is asking for a **proposal,
adoption idea, campaign, pilot, manager ask, executive ask, or single-slide
recommendation**. This is where a generic deck intake can feel polished but not
sharp: the missing work is not "what slides?" yet, it is "what decision are we
making?"

In proposal sharpener mode, borrow the useful rhythm of `grill-me`:

- Ask one dependency-resolving question at a time.
- Provide your recommended answer every time, with a one-sentence reason.
- Let each answer narrow the next branch of the decision tree.
- Prefer concrete proposal choices over generic deck metadata.
- Stop when you can write the slide's spine in plain English.

For a one-slide proposal, the minimum resolved spine is:

1. Audience / owner of the action.
2. Desired action or decision.
3. Main blocker or tension.
4. Program / mechanism being proposed.
5. Concrete manager or sponsor ask.
6. Success measure.
7. Examples or proof that make it easy to picture.
8. Slide structure and takeaway line.

Good proposal sharpener questions look like:

```
What do you want managers to do after seeing this?
My recommended answer: run a simple team adoption program, because "promote
AI usage" is too vague unless managers leave with a repeatable action.

1. Approve an AI awareness campaign
2. Run a team AI adoption program (Recommended)
3. Nominate AI champions
4. Make AI usage part of team goals
```

This mode still respects source honesty. If the user accepts your proposed
content, record it as `ASSUMPTION:` unless they supplied the wording or facts.
If the user confirms the result is a **single standalone slide**, Phase 2 may
use the compact one-slide proposal brief below instead of a multi-slide arc.
That brief is enough handoff for `html-slides` once the user approves it.

Question wording, the numbered option sets, and the full content block live
in `references/intake-questions.md` — use them.

Open with context, not interrogation. Reflect what you heard, then ask the
single biggest missing piece first.

Example opening (one question, with options):

```
Before I draft anything, I want to frame this right.

Who's the audience? (reply with a number — no "recommended" here, it's your call)
  1. Internal team / colleagues
  2. Executives / leadership
  3. Customers / prospects
  4. Investors / board
```

Then, one per turn: technicality, goal, length, presentation style, slide density
(framing — options). Then the **content block**, open-ended, one per turn:
subject → key takeaways → source material → concrete examples/data →
photos/image placeholders → pushback. Don't stop at "subject"; the content block is where the deck is
actually decided.

### Required information

Have clear answers for all of these before moving on.

**Framing:**

1. **Audience** - Who is in the room? What do they know? What do they care
   about? Always capture both role and rough technicality.
2. **Goal** - What should the audience think, feel, or do after the deck?
3. **Setting** - Live presentation, async doc, leave-behind? How long?
4. **Tone** - Formal/casual? Provocative/measured? Technical/accessible?
5. **Presentation mode / style** - Ask a content-aware four-option menu that
   fits the subject, audience, goal, and setting, then normalize the selected
   answer for handoff. Examples: executive decision briefing, product demo
   narrative, training walkthrough, story pitch, technical review, or
   leave-behind / async deck. This controls pacing and communication mode, not
   visual theme.
6. **Slide density** - Sparse, balanced, dense executive, or leave-behind
   dense. This resolves ambiguous words like "compact": compact can mean
   concise/low-text or condensed/high-information. Do not guess; record the
   resolved density and let it drive per-slide content structure.
7. **Constraints** - Slide count? Brand guidelines? Things to avoid?

**Content (worth the most attention — it decides the deck):**

6. **Subject** - The one-line slice actually being covered.
7. **Key takeaways** - The 3–5 things the audience must leave knowing or
   believing. The most important one is the **core message**.
8. **Source material** - Any doc/data/spec/prior deck to build from, mined
   for content (or an explicit source status: `Provided`, `Exists but not
   provided`, or `None`).
9. **Concrete specifics** - The real numbers, examples, stories, or
   demos to feature. Captured verbatim; never invented.
10. **Photos / image placeholders** - Whether the user wants photos or image
    placeholders, which slide/topic each belongs to, what each should show,
    and whether the asset is provided, placeholder-only, or needs sourcing.
11. **Pushback** - For informational decks, explain the purpose first:
    this answer decides whether the deck needs a short limits, trust, or
    guardrails slide. Then ask what someone might push back on. For persuasion
    decks, capture the strongest objection from evidence intake.
12. **Assumptions** - Every agent-proposed content item the user explicitly
    accepted, recorded as `ASSUMPTION:` rather than as user-supplied fact.

### Optional but valuable

- Stakes - routine update or make-or-break pitch.
- Objections - likely audience pushback.

Ask about **presentation mode / style** during brainstorm because it changes
the narrative shape and pacing. Do not use the same fixed four options every
time; tailor the menu to the content. A platform proposal might offer
executive decision briefing, product demo narrative, training walkthrough, and
leave-behind deck. A technical architecture deck might offer technical review,
decision briefing, implementation walkthrough, and async design memo. Then ask
**slide density** separately so usage mode and detail level do not blur. Do
**not** ask about visual theme, palette, or a reference deck to match —
template/theme selection happens later, inside `html-slides`. If the user
volunteers one, record it verbatim as a `STYLE NOTE:` line in the brainstorm
HTML and carry on; don't act on it here.

### Adaptive follow-ups

- "Just my team" -> "How many people, and what is their familiarity with the
  topic?"
- "I want them to understand X" -> "Understand it, or do something about it?"
- "Make it look nice" -> "Do you mean presentation style — keynote, compact,
  walkthrough, leave-behind — or visual theme? Theme happens later in
  html-slides."

### Deck class and evidence intake

Derive the **deck class** from the Goal already given — do not ask separately:

- **Persuasion deck** — Goal is _Decision_, _Pitch_, or _Adoption_. The audience
  must change its mind or act, so the central claim must survive scrutiny.
- **Informational deck** — Goal is _Awareness_, _Status_, or _Training_. The
  audience must understand, not be argued past resistance.

For **persuasion decks**, the content block's "concrete specifics" question
is sharpened into two — still one at a time, waiting for each answer (this
replaces the generic specifics question, it is not extra interrogation):

> First: what's the hardest evidence behind this — data, a result, a reference
> customer?

then, on the next turn:

> And the single strongest objection a skeptic in the room would raise?

For **informational decks**, ask one light prompt only: _"Anything you're
claiming here that someone might push back on?"_

If the user has no real evidence, say so and offer to frame it as a proposal,
not a proven case. Never invent proof to fill the gap. See
`references/intake-questions.md` for full wording.

For live walkthroughs with a demo, resolve demo pacing before synthesis:
should a slide hand off into the live demo, or should the demo stay outside
the slide flow? Put the decision in `Format` or `Constraints`.

### Phase 1 exit condition

You can write one confident paragraph that states:

- Who the audience is and what they care about.
- What the deck should accomplish.
- The one-sentence core message **and the 3–5 key takeaways** under it.
- The concrete specifics (numbers, examples, stories) the deck will use,
  and what source material they came from.
- Any requested photos/image placeholders, with slide/topic, visual detail,
  and asset status.
- Source status (`Provided`, `Exists but not provided`, or `None`),
  assumptions, and any pushback.
- Tone, setting, and presentation style.
- The deck class, and (persuasion decks) the evidence and the strongest
  objection, captured verbatim.

If you would have to invent any of the content to draft the spine, keep the
conversation going — a couple more content questions, gently asked, not more
framing ones. Content that came from your own example and was only
rubber-stamped ("ok") does **not** satisfy this exit condition; either get
the real version or record it explicitly as an `ASSUMPTION:` the user
knowingly accepted. "Every question got a reply" is not the bar; "I am not
inventing what the deck says" is.

## Phase 2 - Synthesis

Before drafting slides, write back a synthesis paragraph and propose the
narrative arc. This gives the user a cheap correction point.

Use this format:

```
Here's what I'm hearing - correct anything that's off:

**Audience:** [who, what they care about, prior knowledge]
**Goal:** [what should happen after the deck]
**Core message:** [one sentence]
**Tone:** [adjectives + reference points]
**Presentation mode:** [visible option selected by the user]
**Presentation style:** [normalized handoff category]
**Slide density:** [sparse / balanced / dense executive / leave-behind dense]
**Constraints:** [length, format, anything to avoid]
**Source status:** [Provided / Exists but not provided / None]
**Assumptions:** [ASSUMPTION lines or "None"]
**Pushback:** [informational concern or "None raised"]

[Persuasion decks add these two lines — the thesis stress-test:]
**Strongest objection:** [the single most damaging *true* thing a skeptic says]
**How the deck answers it:** [which slide(s) in the arc do the rebutting]

**Proposed arc** (N slides):
1. **[working title]** — [question this slide answers]
   Purpose: [why this slide exists]
   Main point: [the sentence the audience should remember]
   Evidence/demo/source: [what backs it, or ASSUMPTION / none]
   Builds to: [how it hands off to the next slide]
2. **[working title]** — ...
3. ...

Does this framing land? Anything to add or change before I draft the brainstorm HTML?
```

For a confirmed **single-slide proposal**, use this shorter approval surface
instead of pretending there is a multi-slide narrative arc:

```
Here's the slide brief I'm hearing - correct anything that's off:

**Title:** [slide title]
**Audience:** [who needs to act]
**Goal:** [what they should do after seeing it]
**Core message:** [one sentence]
**Proposal:** [program/mechanism]
**Manager/sponsor ask:** [specific commitment]
**Success measure:** [what proves progress]
**Examples/proof:** [concrete examples, or ASSUMPTION / none]
**Pushback:** [strongest concern, or none raised]
**Source status:** [Provided / Exists but not provided / None]
**Assumptions:** [ASSUMPTION lines or "None"]

**Slide structure:** [for example: Problem -> Program -> Manager ask -> Success measure]
**Takeaway line:** [bottom-line sentence]

Does this one-slide proposal land? Anything to change before I hand it to html-slides?
```

Do not expand a confirmed one-slide proposal into a five-slide deck just to fit
the normal arc pattern. The handoff should preserve the user's constraint.

The proposed arc is the approval surface. It must be detailed enough for the
user to judge the deck's content before the brainstorm HTML. Never ask approval on a
bare list of labels like `What Codex is / Workflow / Demo / Close`. Each
slide needs a working title, purpose, main point, evidence/demo/source status,
and how it moves the story forward. Keep each item compact, and keep the
approval surface focused on narrative and content rather than design mechanics.

**Do not show `Layout / visual design` lines in the Proposed Arc.** The user
should not have to approve a dense design-spec paragraph before the brainstorm
HTML exists. Instead, perform the professional layout/design pass internally
after the arc is approved and before writing HTML. The internal pass must name
the intended layout signature from `references/design-vocabulary.md` and
describe the visible composition in concrete terms. Do not accept vague internal
phrases like "nice visual", "diagram", "clean layout", or "simple flow".
Good internal design-intent lines look like:

- `technical infographic board — protagonist=pretrained matrix W;
  scan=matrix -> A/B adapters -> forward-pass formula -> training/inference
  legend -> benefit strip; encoding=position, border state, labels`
- `prompt-output specimen — protagonist=generated work artifact; scan=prompt
  surface -> output artifact -> review state -> failure note;
  encoding=split position and state`
- `decision cockpit — protagonist=decision surface; scan=decision -> proof
  needed -> risks -> guardrails -> owner/next step; encoding=table position
  and status`

If a slide explains a technical mechanism, prefer a high-information layout
such as `technical infographic board`, `node-edge loop`, `operating loop`, or a
custom SVG/CSS mechanism diagram over a generic title-plus-bullets slide.

Run the designer pass in `references/presentation-design-decisioning.md` after
the Proposed Arc is approved and before writing the brainstorm HTML. For every
content slide, choose the layout from the shape of the content, not from habit:

- comparison -> contrast wall, matrix, vertical hairline split, before/after
  specimen
- sequence / workflow -> workflow path, journey map, manuscript row, operating
  loop
- mechanism / algorithm -> technical infographic board, equation board,
  node-edge loop, system diagram
- relationship / system -> map, architecture board, node-edge loop
- evidence / metrics -> chart, table, stat-row, annotated specimen, scorecard
- product / tool state -> product mock, prompt-output specimen, artifact strip,
  dashboard surface
- decision / ask -> decision cockpit, ask sheet, checklist gate

Each internal `DESIGN INTENT` line should include three things:

1. **Visual protagonist** - the object the eye lands on first.
2. **Scan path** - the 3-5 eye stops, in order.
3. **Encoding** - how the content becomes visual: position, length,
   connection, grouping, contrast, order, size, annotation, or state.

### Narrative arc patterns

Choose the arc based on the goal:

| Arc                                            | When to use              | Slide spine                                                        |
| ---------------------------------------------- | ------------------------ | ------------------------------------------------------------------ |
| Hook -> Frame -> Mechanism -> Example -> CTA   | Explaining a new concept | Title -> what is X -> how it works -> real example -> what to do   |
| Problem -> Tension -> Solution -> Proof -> Ask | Pitching anything        | Title -> problem -> why hard -> approach -> evidence -> ask        |
| Decision -> Status -> Change -> Implications   | Decision/approval ask (answer-first; default when Goal is decision or approval) | Title -> decision/ask -> where we are -> what changed -> what it means |
| Status -> Change -> Implications -> Decision   | Executive update (no decision pending) | Title -> where we are -> what changed -> what it means -> decision |
| Before -> After -> Bridge                      | Selling a transformation | Title -> today -> future -> how to get there                       |
| Five chapters                                  | Workshops, deep dives    | Each chapter is 2-3 slides with transitions                        |

If none fit, propose a custom arc and explain the logic.

**Opening discipline (SCQA).** Whatever the arc, the first 2–3 slides cover:
Situation (context no one in the room disputes), Complication (the change or
problem — use the user's verbatim intake wording), and the Answer (the core
message). Label these roles in the arc's `Purpose:` lines. For decision decks
the Answer is the ask itself, stated on slide 2 — the evidence comes after,
and the closing slide restates the ask, never introduces it.

**Grouping discipline (MECE).** When writing the key takeaways and the arc's
sections or per-slide groups:

- Name the single classifying dimension in one phrase ("3 sections, cut by
  pipeline stage" / "4 takeaways, cut by stakeholder").
- Probe every pair for overlap; if two items could swap content, re-cut.
- Use an explicit "Out of scope" line instead of silently dropping content a
  bucket doesn't fit.
- Cap sibling groups at 2–5 items of one rhetorical type — do not mix causes,
  actions, and findings in one list.

### Slide count guidance

- 5-minute talk: 5-7 slides
- 15-minute talk: 10-15 slides
- 30-minute talk: 15-25 slides
- Leave-behind only: 8-12 slides, denser per slide
- VC-style pitch: 10-12 slides
- One-page cheat sheet / single takeaway: 1 slide (only if explicitly asked)

Fewer, better slides win.

**Never infer the slide count from the request's wording.** "Make me a
slide", "a deck", "some slides" state the request, not the length — the
word "slide" is not an instruction to produce exactly one. Slide count is
the mandatory Length question (`references/intake-questions.md` Q7), always
asked, never assumed. Then **reconcile it against the Setting out loud**: if
the user says "one slide" but also "5–10 min live walkthrough", that is a
contradiction (a 5-min talk is 5–7 slides) — name it and let the user
resolve it before Phase 2, and write the resolved decision into the HEADER
`Format` line. A genuine one-slide deck is valid only on explicit
confirmation.

### Thesis stress-test (persuasion decks)

The two extra synthesis lines are the stress-test, and they are the cheapest
place to discover the argument does not hold — before a single frame exists.
Write the **strongest objection** as the most damaging _true_ statement a
hostile audience member could make, not a strawman. Then name where the arc
answers it. If the arc has no slide that rebuts it, the arc is incomplete:
propose the added/repurposed slide now, in the synthesis, not later.

The user must confirm or correct both lines. "The objection is wrong" is a valid
correction — but then the corrected objection must still be answered.

### Phase 2 exit condition

The user explicitly approves or amends the synthesis and narrative arc. Do not
move to the brainstorm HTML until you have "yes, that works" or equivalent. For
persuasion decks, the strongest-objection line must be confirmed and the arc
must contain its rebuttal. After approval, run the internal layout/design pass
before writing HTML and record the result in the HTML `DESIGN INTENT` comment.

## Phase 3 - HTML brainstorm and rigor audit

Produce one browser-friendly brainstorm artifact at:

`docs/brainstorms/YYYY-MM-DD-<topic>-brainstorm.html`

This is like the Superpowers brainstorming visual companion: it helps the user
think, compare, and react during brainstorm. It is **not** the final deck. It is
the review and handoff artifact for `html-slides`.

HTML brainstorm rules:

- Keep it standalone: one HTML file, inline CSS/JS, no build step.
- Mark the page clearly as `BRAINSTORM — NOT FINAL DECK`.
- Start by copying `references/wireframe-skeleton.html`. Treat that file
  as the canonical skeleton, not an inspiration sample.
- Show a concise core idea at the top.
- Do not add admin/status notes in the header. Keep audience, assumptions,
  source status, and goal out of the visible page unless the user asks.
- Record the internal per-slide layout map in an HTML comment under `DESIGN
  INTENT`, so the brainstorm remains the handoff artifact without cluttering
  the visible page.
- Show slide content only: one panel per slide with the slide number, the
  action title, a layout-signature label, gray placeholder boxes with short
  text labels for every visual (`[loop diagram]`, `[code ~10 lines]`,
  `[table 4 rows]`), and 2–4 key bullets. The wireframe is for judging
  narrative, structure, and layout choice — NOT rendered design.
- Preserve the skeleton's flattened, annotation-friendly DOM:
  `section.deck > article.slide-panel[data-slide]`, with each slide containing
  one direct `header.slide-head` and one direct `div.preview`.
- Always include a real title slide as Slide 01: title/proposal name,
  one-line ask/subtitle, and optional scope. Do not use a bottom metadata row.
- If the user requested photos or placeholders, include image placeholders in
  the relevant slide panels using the skeleton's `.image-placeholder` pattern.
- No JS, no CDN, no Mermaid, no screenshots in the wireframe. Diagram
  structure is conveyed by labeled gray boxes plus the DESIGN INTENT
  comment — the build skill implements the real visual.
- If opened locally, mention the local file path in chat; do not start a dev
  server for this standalone file.

**Write the brainstorm to HTML, not chat-only output.** Create the file (and
`docs/brainstorms/` if needed) once the first slide panel is ready, and keep
writing every Phase 4 revision into it. The chat conversation references the
file and discusses specific slides; it never substitutes for the saved HTML.

### One canonical format

There is exactly one brainstorm format and it lives in `references/`. Do not
invent a competing convention here:

- **`references/template.md`** — the brainstorm HTML structure: HEADER,
  CORE IDEA, and SLIDE PANELS.
- **`references/visual-companion.md`** — standalone HTML review rules and
  minimum sections.
- **`references/wireframe-skeleton.html`** — the canonical low-fi wireframe
  skeleton (shared with slide-quick). Copy this first and replace placeholders;
  do not rebuild the page structure from scratch.
- **`references/layout-blueprint.md`** — the layout-architecture pass (was
  the slide-layout-designer skill).
- **`references/archetypes.md`** — the layout archetype library.
- **`references/design-vocabulary.md`** — the named layout signatures
  (manuscript row, vertical hairline split, stat-row, etc.) the build skill
  understands. Reach for these names instead of describing layouts longhand.
- **`references/presentation-design-decisioning.md`** — the professional
  presentation design pass: content shape, visual protagonist, scan path,
  encoding, proof, and restraint. Use it internally after Phase 2 arc approval
  and before writing the brainstorm HTML.
- **`references/strong-slide-design-checklist.md`** — the anti-boring slide
  design checklist. Use it before presenting the brainstorm HTML whenever a
  deck could become conventional, repetitive, or unintuitive.
- **`references/subagent-review-verifier.md`** — the independent review gate.
  After writing the brainstorm HTML and running self-checks, spawn a reviewer
  subagent to inspect argument quality, source honesty, visual intuition,
  density, and overflow before presenting the file. If subagents are not
  available, run the same prompt inline and record the fallback.

The brainstorm file is saved to
`docs/brainstorms/YYYY-MM-DD-<topic>-brainstorm.html` per
`references/template.md`. **This file is the deliverable and the handoff
artifact** — there is no separate `.txt` deck spec.

### Training walkthrough artifact requirement

When `Presentation style` is **training walkthrough**, the HTML panels must
teach through concrete artifacts, not only explain with rows of text. Before the
handoff, include:

- At least one **prompt-output specimen**: what the user types and what Codex
  returns.
- At least one **work artifact** matched to the user's examples: spreadsheet
  grid, slide thumbnail, chart/data summary, document excerpt, approval note,
  or similar.
- For step-by-step slides, show the full path faintly and highlight the active
  step; do not frame only one visible step unless the user explicitly wants a
  progressive reveal.

If the user selected examples like spreadsheets, slides, or data analysis, those
examples must appear as visible artifacts in the HTML. Do not leave them as
abstract labels only.

### Density and strong-slide verification

Before presenting the brainstorm HTML, run this verification checklist against
the drafted slide panels. This applies to every deck; persuasion decks also run
the rigor audit below.

1. **Density match** — every content slide matches the resolved slide density.
   Dense executive slides use structured information such as a matrix,
   scorecard, decision sheet, operating model, table, or artifact strip; sparse
   slides carry one strong idea without filler.
2. **Slide job** — every slide has one clear job: frame, model, example,
   proof/evidence, guardrail, decision, or ask.
3. **Claim title** — content-slide titles and headlines make a claim, not only a
   label.
4. **Concrete content** — at least one slide shows a concrete workflow,
   artifact, decision frame, or example instead of only describing the idea.
5. **Information design** — content is structured into scannable zones, not
   paragraphs or disconnected bullets. Technical mechanism slides name a rich
   symbolic visual in their DESIGN INTENT (matrices, equations, path diagrams,
   state legends, technical infographic boards) and show it as a labeled
   placeholder box in the wireframe — the build skill renders it for real.
6. **Professional visual choice** — each slide's layout matches the content
   shape: comparison, sequence, mechanism, relationship, hierarchy, evidence,
   exception, product state, or decision. The slide has a clear visual
   protagonist, 3-5 stop scan path, and deliberate encoding.
7. **Source honesty** — if source status is `None` or `Exists but not provided`,
   specifics are framed as proposals or `ASSUMPTION:`, not proof.
8. **Pushback coverage** — the stated pushback or objection is answered by a
   slide with explicit criteria, tradeoff, or guardrail.
9. **Wireframe completeness** — every slide panel carries its number,
   action title, layout-signature label, labeled placeholder boxes for
   each promised visual, and key bullets; every DESIGN INTENT line is
   recorded in the HTML comment for the build skill.
10. **Anti-boring design** — run
   `references/strong-slide-design-checklist.md`; every content slide has a
   named visual job, adjacent slides avoid repeated layout signatures, and at
   least one slide shows a concrete artifact, workflow, checklist, map,
   specimen, scorecard, mission board, or decision surface.
11. **Horizontal logic — titles-only read-through** — read only the slide
   titles, in order. They must retell the argument from context to
   recommendation, with no duplicate claims and no gaps; for decision decks
   the ask appears in the first two titles. If a listener could not retell
   the story from the titles alone, retitle before presenting.
12. **Grouping discipline (MECE)** — every group of zones/steps/bullets/cards
   names one cutting dimension, holds 2–5 non-overlapping items of one
   rhetorical type, and uses an explicit "Out of scope"/"Other" instead of
   silently dropping content.

If any check fails, fix the brainstorm before showing it. Summarize the result
briefly in chat; keep the visible HTML focused on slide content unless the user
asks to see the audit. The checklist may be recorded as an HTML comment for
handoff.

### Independent subagent review gate

Before presenting the brainstorm HTML, run
`references/subagent-review-verifier.md`.

- Spawn one reviewer subagent after the HTML exists and after the self-checks
  above have run.
- The reviewer does **not** edit files. It returns PASS or prioritized findings
  with severity, slide number, issue, why it matters, and a concrete fix.
- Fix all clear P0/P1 findings before presenting. P2/P3 findings may be fixed,
  deferred, or recorded as accepted risk.
- Record the result in the HTML comment, for example:
  `SUBAGENT REVIEW: PASS`, `SUBAGENT REVIEW: fixed P1 on slide 06`, or
  `SUBAGENT REVIEW: unavailable - inline fallback used`.
- If subagents are unavailable in the current environment, run the exact same
  verifier prompt inline and mention the fallback briefly in chat. Do not
  silently skip the gate.

### The ARGUMENT block is mandatory

Every per-slide block carries an `ARGUMENT` block. An argument slide states
`CLAIM` + `EVIDENCE`. A structural slide (title, section, transition, close)
states `ROLE: structural — no claim`. There is no third option — a content slide
cannot omit it, so a claim with no evidence cannot hide behind a clean layout.
`EVIDENCE` that reads "trust me" or is blank is a failed slide.

### Rigor audit gate (persuasion decks)

Before presenting the brainstorm HTML to the user, run the five-check rigor
audit from `references/template.md` against the drafted spine and print it in
the file:

1. **Claim without evidence** — any argument slide whose `EVIDENCE` is blank or
   hand-wavy.
2. **Objection unanswered** — no slide rebuts the Phase 2 strongest objection.
3. **Buried lede** — for decision decks and dense-executive density, the core
   message and the ask are not on slide 2; for other decks, the core message is
   not a single sentence by slide ≤3.
4. **So-what slide** — a slide that conveys information, advances no claim, and
   is not structural.
5. **Unsourced specifics** — a stat, quote, or causal claim with no `SOURCES`.

A non-PASS is a hole in the argument, not a style note. Fix the deck (add
evidence, add a rebuttal slide, move the lede, cut the so-what slide, source the
number) and re-run. Do not present the HTML with an open finding unless the
user explicitly accepts the risk on the record. Informational decks skip this
gate but still carry the `ARGUMENT` block on every slide.

### Presenting the brainstorm

Once the HTML is written and (persuasion decks) the rigor audit is PASS or
explicitly waived, point the user at the saved file and ask:

```
The brainstorm is saved in docs/brainstorms/<topic>-brainstorm.html, with the
argument audit. Before I hand off to build:

- Does the narrative flow? Any slide that should move, merge, or get cut?
- Is the core message landing by slide 3?
- Does any slide make a claim it doesn't back up?
- Anything a sharp, skeptical audience member would still ask?
- Are the assumptions and source status accurate?
- Does the slide density match what you meant by the format (sparse, balanced,
  dense executive, or leave-behind dense)?
- For live demos: is the demo handoff in the right place?

Once you're happy, I'll hand the brainstorm HTML to the html-slides skill.
```

### Phase 3 exit condition

The user reviewed the brainstorm HTML and approved it, or you iterated through
Phase 4 until they did. For persuasion decks, the rigor audit is PASS or the
user accepted the open findings on the record.

## Phase 4 - Iteration

Respond to feedback surgically.

### Add a slide

- Confirm placement.
- Produce only the new HTML section/panel and a note on neighboring slides.
- Do not regenerate the whole deck unless necessary.

### "This slide isn't landing"

- Ask whether the issue is message, layout, or both.
- If message, propose 2-3 alternative framings before updating the HTML.
- If layout, propose 2 alternatives before updating the HTML.

### "Make it shorter"

- Propose specific cuts.
- Target repeated points, slides that do not serve the core message, or
  overbuilt context.
- Example: "Cut slide 5 and merge its example into slide 4."

### "Make it punchier"

- Rewrite label-like titles as claims.
- Turn paragraphs into quotes or big words when useful.
- Propose 2-3 title rewrites before regenerating.

### "I don't like the tone"

- Ask which slide feels off and why: too formal, too casual, too salesy, too
  technical.
- Adjust globally and re-present 2-3 sample slides before redoing all.

### When to pause

After 2-3 revision rounds, if direction keeps changing, ask:

```
Before another round - is there a deeper concern? Sometimes when the brainstorm keeps shifting, it means the core message or audience isn't quite right. Want to revisit the Phase 2 framing?
```

## Phase 5 - Handoff to html-slides

There is no separate "deck spec" to produce. The approved
`docs/brainstorms/YYYY-MM-DD-<topic>-brainstorm.html` file **is** the handoff
artifact — its HEADER, NARRATIVE ARC, DESIGN INTENT, per-slide `COPY` and
`ARGUMENT` blocks already carry the content the build skill needs. The visual
theme/template is _not_ in here by design — `html-slides` selects it after
handoff (using any `STYLE NOTE:` line as a hint).

Only after explicit brainstorm approval (and, for persuasion decks, a PASS or waived
rigor audit):

1. Confirm the brainstorm HTML is current — every Phase 4 change is written into
   it and logged in CHANGES.
2. Confirm delivery format with the user (html / pdf / pptx).
3. Invoke the builder skill, passing the brainstorm HTML path as input:
   `html-slides` for HTML decks. For `.pptx` delivery, still build with
   `html-slides` (so the deck passes verify.py and the final-deck review),
   then convert with `html-to-pptx` — `--mode layered` keeps the text
   editable. Use the `pptx` skill directly only when editing an existing
   `.pptx` or working inside a user-provided template.

The build skill should not need to ask framing questions or re-derive content.
The brainstorm HTML decided all of it. If the build skill finds a gap, that is a
brainstorm defect — fix the brainstorm HTML, do not patch it downstream.

## Principles

1. Ask early, not later.
2. Confirm understanding before producing.
3. Brainstorm HTML is for content and structure, not final aesthetics.
4. One change at a time.
5. The user owns the narrative.
6. Every slide earns its place — claim backed by evidence, or structural.
7. Stop when it is right, not perfect.

## Anti-patterns

Never:

- Skip Phase 1 because the request seems clear.
- Ask all questions at once.
- Generate the brainstorm HTML before synthesis is approved.
- Produce brainstorm content only as chat output instead of writing
  `docs/brainstorms/...-brainstorm.html`.
- Render the final HTML slides before the brainstorm is approved.
- Be sycophantic about weak content; state the issue and propose an alternative.
- Use html-slides design rules in the brainstorm artifact.
- Treat "compact" as self-explanatory. Always resolve whether it means concise
  low-text slides or dense executive slides with more structured information.
- Exceed the agreed slide count without asking first.
- Invent a stat, source, or quote to close an evidence gap — reframe instead.
- Treat "sample data exists but not provided" as evidence. Mark it as source
  status only, and omit or label any inferred detail as `ASSUMPTION:`.
- Treat "ok" / "sure" / "you choose" on a content question as the user's
  answer, or build the deck's substance from your own examples without an
  explicit, recorded `ASSUMPTION:` the user knowingly accepted.
- Keep collecting answers when the user has clearly disengaged — surface it
  instead.
- Infer the slide count from the request's wording ("a slide" → 1). Always
  ask Length; reconcile it against the Setting and resolve contradictions
  with the user.
- Bank a vague-but-present content answer ("add a dashboard") without one
  sharpening follow-up to make it a real anchor.
- Present persuasion-deck brainstorm HTML with an open rigor-audit finding the
  user has not explicitly accepted.
- Define a brainstorm format here that competes with `references/` — the
  brainstorm HTML file is the single canonical artifact.

## Final checklist before html-slides

- [ ] Phase 1: clear answers on audience, goal, setting, presentation style,
      slide density, core message, tone, constraints, deck class
- [ ] Phase 1: audience includes rough technicality, not just role
- [ ] Phase 1: Length explicitly asked (not inferred from wording) and
      reconciled against Setting; resolved count in HEADER `Format`
- [ ] Phase 1: every content answer is real or a recorded `ASSUMPTION:`;
      no vague answer banked without a sharpening follow-up
- [ ] Phase 1: source status recorded as `Provided`, `Exists but not
      provided`, or `None`
- [ ] Phase 1: informational decks captured pushback or `None raised`
- [ ] Phase 1: live demo pacing resolved when a demo is part of the deck
- [ ] Phase 1: persuasion decks — evidence and strongest objection captured
      verbatim
- [ ] Phase 2: user approved synthesis and proposed arc
- [ ] Phase 2: proposed arc stays focused on narrative/content and does not
      show `Layout / visual design` lines
- [ ] Phase 3: before HTML generation, every content slide has an internal
      `DESIGN INTENT` line with a named layout signature, visual protagonist,
      3-5 stop scan path, and encoding choice from the professional designer
      pass
- [ ] Phase 2: persuasion decks — strongest-objection line confirmed and
      rebutted in the arc
- [ ] Phase 3: HTML brainstorm saved under `docs/brainstorms/`
- [ ] Phase 3: every slide carries an `ARGUMENT` block (claim+evidence, or
      structural)
- [ ] Phase 3: density and strong-slide verification passed, including density
      match, slide job, claim title, concrete content, information design,
      professional visual choice, source honesty, pushback coverage, layout
      fidelity, anti-boring design, horizontal logic (titles-only
      read-through), and grouping discipline (MECE)
- [ ] Phase 3: independent subagent review completed and all P0/P1 findings
      fixed, waived by the user, or explicitly recorded as unavailable inline
      fallback
- [ ] Phase 3: persuasion decks — rigor audit is PASS or findings accepted on
      the record
- [ ] Phase 4: user explicitly approved the brainstorm HTML
- [ ] Phase 5: brainstorm HTML is current, CHANGES logged, delivery format
      confirmed

When all boxes are checked, invoke `html-slides` with the brainstorm HTML
path. PPTX delivery converts the gated HTML deck afterwards via
`html-to-pptx` (`--mode layered` for editable output).

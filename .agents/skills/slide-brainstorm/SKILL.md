---
name: slide-brainstorm
description: >-
  Use this skill BEFORE generating any html-slides deck when the user asks for a
  deck, slides, or presentation. This skill runs a structured discovery process:
  ask targeted questions about audience, narrative, content, and tone;
  synthesize the framing; then produce ASCII wireframes for every slide for
  review and approval. Only after the user approves the wireframes should the
  html-slides skill be invoked. Trigger this whenever a user asks to "create a
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

## Workflow

```
Phase 1: Discovery       -> Ask targeted questions
Phase 2: Synthesis       -> Confirm understanding, propose narrative
Phase 3: Wireframes      -> ASCII layouts for every slide
Phase 4: Iteration       -> Refine wireframes based on feedback
Phase 5: Handoff         -> Pass the approved brainstorm .txt to the build skill
```

Each phase has an exit condition. Do not move forward until it is met.

## Phase 1 - Discovery

**Tone: helpful and collaborative — a guide helping the user think their
deck through, never an interrogator.** Warm, curious, on their side. One
question at a time, in plain language, and wait for the answer before the
next. Walk the discovery tree one branch at a time, letting each answer
inform the next question. Never dump a numbered list of questions in one
turn. When an answer is thin, help rather than challenge: offer a starting
point, an example, or two options to react to — make answering easy.

There are two kinds of question and they behave differently:

- **Framing** (audience, technicality, goal, length, presentation style) — give the user
  **numbered options**:
  a short list `1`–`4` answered with a single digit, via the
  `AskUserQuestion` tool. ~5 questions, kept light. Mark "(Recommended)"
  **only when a recommendation is genuine** — a defensible default or a
  strong inference (legit for length; not for audience, which is the user's
  own fact). Never auto-tag option 1. Every option label literally starts
  with its number (`1. `, `2. `…) — no unnumbered choice is ever shown to
  the user, anywhere. See `references/intake-questions.md`.
- **Content** (subject, key takeaways, source material, concrete
  examples/data) — **explore in depth, open-ended.** This is where deck
  quality is won or lost, so it's worth a real conversation. Keep going
  (typically 3–5 questions) until you could draft the deck's spine yourself
  without inventing anything. Don't rush it to hit a question count, and
  don't reduce it to a menu — but keep it a friendly back-and-forth: if an
  answer is too thin to build from, gently say what's still fuzzy and
  suggest a way to fill it.

Prefix intake turns with a compact progress label (`Framing 1/5`,
`Content 2/4`, `Wireframes`) so the user understands where they are. If an
option answer is invalid, say that only choices `1`–`4` exist and invite a
custom answer in words; do not just say "No option 5."

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
   `.txt` (`ASSUMPTION:` line, not presented as the user's content).

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

Then, one per turn: technicality, goal, length, presentation style
(framing — options). Then the **content block**, open-ended, one per turn:
subject → key takeaways → source material → concrete examples/data →
pushback. Don't stop at "subject"; the content block is where the deck is
actually decided.

### Required information

Have clear answers for all of these before moving on.

**Framing:**

1. **Audience** - Who is in the room? What do they know? What do they care
   about? Always capture both role and rough technicality.
2. **Goal** - What should the audience think, feel, or do after the deck?
3. **Setting** - Live presentation, async doc, leave-behind? How long?
4. **Tone** - Formal/casual? Provocative/measured? Technical/accessible?
5. **Presentation style** - Keynote (sparse/story-led), compact executive
   briefing (dense/scannable), training walkthrough (step-by-step), or
   leave-behind / async reading deck (self-contained without a presenter).
   This controls density and pacing, not visual theme.
6. **Constraints** - Slide count? Brand guidelines? Things to avoid?

**Content (worth the most attention — it decides the deck):**

6. **Subject** - The one-line slice actually being covered.
7. **Key takeaways** - The 3–5 things the audience must leave knowing or
   believing. The most important one is the **core message**.
8. **Source material** - Any doc/data/spec/prior deck to build from, mined
   for content (or an explicit source status: `Provided`, `Exists but not
   provided`, or `None`).
9. **Concrete specifics** - The real numbers, examples, stories, or
   demos to feature. Captured verbatim; never invented.
10. **Pushback** - For informational decks, explain the purpose first:
    this answer decides whether the deck needs a short limits, trust, or
    guardrails slide. Then ask what someone might push back on. For persuasion
    decks, capture the strongest objection from evidence intake.
11. **Assumptions** - Every agent-proposed content item the user explicitly
    accepted, recorded as `ASSUMPTION:` rather than as user-supplied fact.

### Optional but valuable

- Stakes - routine update or make-or-break pitch.
- Objections - likely audience pushback.

Ask about **presentation style** during brainstorm because it changes slide
density and pacing: keynote, compact executive briefing, training walkthrough,
or leave-behind. Do **not** ask about visual theme, palette, or a reference
deck to match — template/theme selection happens later, inside `html-slides`.
If the user volunteers one, record it verbatim as a `STYLE NOTE:` line in the
brainstorm `.txt` and carry on; don't act on it here.

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
**Presentation style:** [keynote / compact executive briefing / training walkthrough / leave-behind or async reading deck]
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

Does this framing land? Anything to add or change before I draft the wireframes?
```

The proposed arc is the approval surface. It must be detailed enough for the
user to judge the deck's content before wireframes. Never ask approval on a
bare list of labels like `What Codex is / Workflow / Demo / Close`. Each
slide needs a working title, purpose, main point, evidence/demo/source status,
and how it moves the story forward. Keep each item compact, but make the
decision visible.

### Narrative arc patterns

Choose the arc based on the goal:

| Arc                                            | When to use              | Slide spine                                                        |
| ---------------------------------------------- | ------------------------ | ------------------------------------------------------------------ |
| Hook -> Frame -> Mechanism -> Example -> CTA   | Explaining a new concept | Title -> what is X -> how it works -> real example -> what to do   |
| Problem -> Tension -> Solution -> Proof -> Ask | Pitching anything        | Title -> problem -> why hard -> approach -> evidence -> ask        |
| Status -> Change -> Implications -> Decision   | Executive update         | Title -> where we are -> what changed -> what it means -> decision |
| Before -> After -> Bridge                      | Selling a transformation | Title -> today -> future -> how to get there                       |
| Five chapters                                  | Workshops, deep dives    | Each chapter is 2-3 slides with transitions                        |

If none fit, propose a custom arc and explain the logic.

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

The user explicitly approves or amends the synthesis and arc. Do not move to
wireframes until you have "yes, that works" or equivalent. For persuasion decks,
the strongest-objection line must be confirmed and the arc must contain its
rebuttal.

## Phase 3 - Frames and the rigor audit

Produce the brainstorm artifact: one ASCII frame per slide plus its accompanying
spec blocks. Frames are for content and structure, not finished aesthetics.

**Write the frames to a file, not the chat.** The ASCII frames and every spec
block are authored directly into `docs/brainstorms/YYYY-MM-DD-<topic>-deck.txt`
using the Write tool. This file is the deliverable — do not produce the frames
only as chat output. Create the file (and the `docs/brainstorms/` directory if
needed) the moment the first frame is ready, and keep writing every subsequent
frame and every Phase 4 revision into it. The chat conversation references the
file and discusses specific slides; it never substitutes for the saved `.txt`.

### One canonical format

There is exactly one frame/spec format and it lives in `references/`. Do not
invent a competing convention here:

- **`references/template.md`** — the brainstorm file structure: HEADER box,
  NARRATIVE ARC, INTAKE STATUS, DESIGN PRINCIPLES, SHARED GRAMMAR, the
  per-slide block (frame + `COPY` + **`ARGUMENT`** + `VISUAL` + `TECHNIQUE` +
  optional `SOURCES`), VISUAL VARIETY MAP, RIGOR AUDIT, DESIGN INTENT
  (content-level; no theme), CHANGES.
- **`references/ascii-frames.md`** — box-drawing conventions, frame size, how to
  annotate intent, why the `ARGUMENT` block is mandatory, and how to write
  the `VISUAL` block so each frame is interesting (theme-agnostic).
- **`references/design-vocabulary.md`** — the named layout signatures
  (manuscript row, vertical hairline split, stat-row, etc.) the build skill
  understands. Reach for these names instead of describing layouts longhand.

The brainstorm file is saved to `docs/brainstorms/YYYY-MM-DD-<topic>-deck.txt`
per `references/template.md`. **This file is the deliverable and the handoff
artifact** — there is no separate "deck spec." Read those three references
before drawing; everything about frame width, characters, the per-slide block,
and the variety map is defined there and is authoritative.

### Training walkthrough artifact requirement

When `Presentation style` is **training walkthrough**, the wireframes must teach
through concrete artifacts, not only explain with rows of text. Before the
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
examples must appear as visible artifacts in the frames. Do not leave them as
abstract labels only.

### The ARGUMENT block is mandatory

Every per-slide block carries an `ARGUMENT` block. An argument slide states
`CLAIM` + `EVIDENCE`. A structural slide (title, section, transition, close)
states `ROLE: structural — no claim`. There is no third option — a content slide
cannot omit it, so a claim with no evidence cannot hide behind a clean layout.
`EVIDENCE` that reads "trust me" or is blank is a failed slide.

### Rigor audit gate (persuasion decks)

Before presenting the frames to the user, run the five-check rigor audit from
`references/template.md` against the drafted spine and print it in the file:

1. **Claim without evidence** — any argument slide whose `EVIDENCE` is blank or
   hand-wavy.
2. **Objection unanswered** — no slide rebuts the Phase 2 strongest objection.
3. **Buried lede** — the core message is not a single sentence by slide ≤3.
4. **So-what slide** — a slide that conveys information, advances no claim, and
   is not structural.
5. **Unsourced specifics** — a stat, quote, or causal claim with no `SOURCES`.

A non-PASS is a hole in the argument, not a style note. Fix the deck (add
evidence, add a rebuttal slide, move the lede, cut the so-what slide, source the
number) and re-run. Do not present frames with an open finding unless the user
explicitly accepts the risk on the record. Informational decks skip this gate
but still carry the `ARGUMENT` block on every slide.

### Presenting frames

Once the frames are written to the brainstorm `.txt` and (persuasion decks) the
rigor audit is PASS or explicitly waived, point the user at the saved file and
ask:

```
The full deck is framed in docs/brainstorms/<file>.txt, with the argument
audit. Before I hand off to build:

- Does the narrative flow? Any slide that should move, merge, or get cut?
- Is the core message landing by slide 3?
- Does any slide make a claim it doesn't back up?
- Anything a sharp, skeptical audience member would still ask?
- Are the assumptions and source status accurate?
- For live demos: is the demo handoff in the right place?

Once you're happy, I'll hand the brainstorm file to the html-slides skill.
```

### Phase 3 exit condition

The user reviewed the frames and approved them, or you iterated through Phase 4
until they did. For persuasion decks, the rigor audit is PASS or the user
accepted the open findings on the record.

## Phase 4 - Iteration

Respond to feedback surgically.

### Add a slide

- Confirm placement.
- Produce only the new wireframe and a note on neighboring slides.
- Do not regenerate the whole deck unless necessary.

### "This slide isn't landing"

- Ask whether the issue is message, layout, or both.
- If message, propose 2-3 alternative framings before redrawing.
- If layout, propose 2 alternatives before redrawing.

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
Before another round - is there a deeper concern? Sometimes when wireframes keep shifting, it means the core message or audience isn't quite right. Want to revisit the Phase 2 framing?
```

## Phase 5 - Handoff to html-slides

There is no separate "deck spec" to produce. The approved
`docs/brainstorms/YYYY-MM-DD-<topic>-deck.txt` file **is** the handoff artifact
— its HEADER box, NARRATIVE ARC, DESIGN INTENT, per-slide `COPY` and `ARGUMENT`
blocks already carry the content the build skill needs. The visual
theme/template is _not_ in here by design — `html-slides` selects it after
handoff (using any `STYLE NOTE:` line as a hint).

Only after explicit frame approval (and, for persuasion decks, a PASS or waived
rigor audit):

1. Confirm the brainstorm file is current — every Phase 4 change is written into
   it and logged in CHANGES.
2. Confirm delivery format with the user (html / pdf / pptx).
3. Invoke the builder skill, passing the brainstorm file path as input:
   `html-slides` for HTML decks, the `pptx` skill for editable Office output.

The build skill should not need to ask framing questions or re-derive content.
The brainstorm file decided all of it. If the build skill finds a gap, that is a
brainstorm defect — fix the `.txt`, do not patch it downstream.

## Principles

1. Ask early, not later.
2. Confirm understanding before producing.
3. Frames are for content, not aesthetics.
4. One change at a time.
5. The user owns the narrative.
6. Every slide earns its place — claim backed by evidence, or structural.
7. Stop when it is right, not perfect.

## Anti-patterns

Never:

- Skip Phase 1 because the request seems clear.
- Ask all questions at once.
- Generate frames before synthesis is approved.
- Produce the ASCII frames only as chat output instead of writing them to the
  `docs/brainstorms/...txt` file.
- Render the HTML slides before frames are approved.
- Be sycophantic about weak content; state the issue and propose an alternative.
- Use html-slides design rules in the frames.
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
- Present persuasion-deck frames with an open rigor-audit finding the user has
  not explicitly accepted.
- Define a frame/spec format here that competes with `references/` — the `.txt`
  brainstorm file is the single canonical artifact.

## Final checklist before html-slides

- [ ] Phase 1: clear answers on audience, goal, setting, presentation style,
      core message, tone, constraints, deck class
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
- [ ] Phase 2: persuasion decks — strongest-objection line confirmed and
      rebutted in the arc
- [ ] Phase 3: every slide carries an `ARGUMENT` block (claim+evidence, or
      structural)
- [ ] Phase 3: persuasion decks — rigor audit is PASS or findings accepted on
      the record
- [ ] Phase 4: user explicitly approved the frames
- [ ] Phase 5: brainstorm `.txt` is current, CHANGES logged, delivery format
      confirmed

When all boxes are checked, invoke `html-slides` (or `pptx`) with the brainstorm
file path.

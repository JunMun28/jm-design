# Intake Questions

Use these as starting templates. Keep the tone **helpful and
collaborative** — you're a guide helping the user think the deck through,
not running an interrogation. Match their tone and build on what they've
already said in the opening message.

Ask **one question at a time**, waiting for the answer before the next — the
same one-branch-at-a-time rhythm as the `grill-with-docs` skill, but warm.
Don't batch questions into a numbered list, even if the user is moving fast;
just skip anything they already answered in their opener.

Start each intake turn with a tiny progress label so the user knows where
they are without seeing the whole checklist:

```
Framing 1/5 — Who's the audience?
Content 2/4 — What should they remember?
```

Two kinds of question, and the budget is split:

- **Framing** (audience, technicality, goal, length, presentation style): ~5
  questions, kept tight with numbered options.
- **Content** (subject, key takeaways, source material, concrete
  examples/data): as many as it takes to genuinely understand what the deck
  *says* — typically 3–5 more. A vague deck usually just means the content
  wasn't talked through enough, so it's worth a real conversation here. No
  cap on these; the cap is on *framing* questions. Still one at a time, and
  stop as soon as you could write the deck's spine from memory.

For **framing** questions use the **`AskUserQuestion` tool**: a numbered
list `1`–`4`, single-digit answer, four options max (rarer answers flow
through the tool's free-text path).

**Only mark "(Recommended)" when you can genuinely recommend.** A
recommendation is legitimate only when there is a defensible default or a
strong inference from what the user already said. When the answer is purely
a fact about the user's own situation, you cannot recommend it — don't fake
one. Instead order the options by likelihood (most common first) and leave
them unmarked.

- **Audience** — a fact about their room. **No "(Recommended)".**
- **Goal** — usually their intent, not yours to recommend. Mark one only if
  the opener strongly implies it; otherwise leave unmarked.
- **Length** — a defensible default exists (Medium fits most asks), so
  "(Recommended)" is legitimate here.
- **Presentation style** — recommend based on the goal: training walkthrough
  for onboarding/training, compact executive briefing for leadership updates,
  keynote for adoption/pitch, leave-behind for async.
- Decisions with a sensible default (theme, scope) — recommend the default.

The "(Recommended)" tag is earned per question, never automatic on option 1.

**Every option, everywhere, is numbered.** This is absolute: each option's
label text literally begins with its number and a period — `1. `, `2. `,
`3. `, `4. ` — in `AskUserQuestion` option labels and in any plain-text
list alike. No bare-bullet or unnumbered choice is ever shown to the user.
The user must always be able to answer with a single digit.

If the user gives an invalid option (for example `5` when choices are
`1`–`4`), keep the correction helpful, not scolding:

> I only have options 1-4 here. If you meant a custom answer, tell me in
> words; otherwise pick one number.

For **content** questions use plain open-ended prompts — these answers are
substance, not a menu. If an answer is too thin to build from, help fill it:
name what's still fuzzy and offer an example or a couple of options to react
to, rather than just asking again.

## Question 1 — Audience

**Wording:**
> Who's the audience? Reply with a number (or tell me if it's something else).

**Options** (numbered for the `AskUserQuestion` tool, ordered most-common
first — **no "(Recommended)"**, you can't recommend who their audience is;
anything else the user types lands in "Other", which is fine):
1. Internal team / colleagues
2. Executives / leadership
3. Customers / prospects
4. Investors / board

Common "Other" answers: developers/engineers, external event audience,
students/training participants. Don't add a fifth option — let those flow
through the tool's free-text path.

Always follow up (next turn): "Roughly how technical are they on this topic?
  1. Beginner
  2. Working knowledge
  3. Expert"
This is what distinguishes a developer audience from a non-technical one, so
the four options above don't need a separate "developers" choice.

Write the resolved audience as role + technicality, e.g. `Executives /
leadership; beginner on this topic`. Do not collapse it to just the role.

## Question 2 — Purpose / Goal

**Wording:**
> What does success look like after they see this deck? Reply with a number.

**Options** (numbered for the `AskUserQuestion` tool — the goal is the
user's intent, not yours to recommend; **no "(Recommended)"** unless the
opener strongly implies one, in which case mark that option, not always
`1`):
1. **Adoption** — they leave wanting to try it
2. **Decision / approval** — they leave aligned on a yes/no
3. **Training / onboarding** — they leave able to do something new
4. **Status update** — they leave informed about where things stand

Common "Other" answers: *Pitch* (fund/hire/partner — treat as persuasion,
like Decision) and *Awareness* (they leave knowing it exists — treat as
informational, like Status). Don't add them as fixed options; classify
whatever the user picks or types using the rule below.

This often clarifies what the closing slide should look like (call-to-action vs. summary vs. ask).

**Derive the deck class from the answer — including a free-text "Other" —
do not ask separately:**

- **Persuasion deck** — goal is *Decision*, *Pitch*, or *Adoption*. The
  audience must change its mind or act, so the central claim must survive
  scrutiny. Persuasion decks get the **evidence intake** below.
- **Informational deck** — goal is *Awareness*, *Status update*, or
  *Training*. The audience must understand, not be argued out of
  resistance. These get a single light prompt, not the full intake. Explain
  the purpose first: the answer decides whether the deck needs a short
  limits, trust, or guardrails slide.

The deck class drives the Phase 2 stress-test and the Phase 3 rigor audit.

## Questions 3–6 — Content (the substance of the deck)

These questions decide whether the deck is any good, so it's worth slowing
down and having a real conversation. Ask them one at a time, open-ended, in
a helpful tone. Don't stop at "scope" — keep exploring with the user until
you could draft the spine together without inventing anything.

**"ok" is not an answer here.** A bare acknowledgement, "you choose",
silence, or echoing the question back means the user deferred — it does not
license you to adopt the example you offered as their content. When it
happens:

- Name it kindly: "I only have my placeholder here, not your actual
  <workflow / takeaways> — and since this deck *is* that content, my guess
  would teach my guess."
- Offer one concrete, accurate proposal, clearly flagged as yours, and ask
  them to confirm / correct / replace it.
- Proceed only on real substance, or on an explicit informed "yes, use
  yours" — and then write it into the `.txt` as an `ASSUMPTION:` line, not
  as if the user supplied it.

If **two content questions in a row** come back as non-answers, stop and
surface it rather than quietly filling the deck yourself:

> "I'm writing the substance for you on these — that usually means the deck
> won't say what you actually want. Want to give me the real content, or
> should I draft a clearly-marked proposal you react to instead?"

A polished deck built from rubber-stamped placeholders is still a failed
deck. This protects the user, it is not friction.

**A vague answer gets one concrete follow-up — don't just bank it.** This is
different from a non-answer: the user *did* answer, but too thinly to build
from. "Add a dashboard", "talk about onboarding", "cover the Q3 numbers" are
answers with a hole in them. Do not write them into the `.txt` as-is and
move on (that is exactly how `add a dashboard for X` ended up in a finished
deck). Ask **one** sharpening follow-up before continuing:

- "Add a dashboard" → "To which app, and showing what — and is there a real
  repo/stack, or a generic example?"
- "Talk about onboarding" → "Whose onboarding, and what's the one thing
  that should change after?"
- "Cover the Q3 numbers" → "Which two or three numbers actually matter, and
  what's the story they tell?"

One good follow-up turns a placeholder into an anchor. Keep it to one per
vague answer — sharpen, don't interrogate.

### Q3 — Subject (one line)

> In one sentence, what's actually being covered?

Becomes the deck's working subject line. If it's too broad, help them
narrow it kindly: "That's a big topic — want to focus on the slice that
matters most today?" If they're stuck, offer common slices: "definition +
how it works + use cases + how to start" is a reliable training-deck spine.

### Q4 — Key takeaways

> What are the 3–5 things they must walk away knowing or believing? List
> them — rough is fine.

This is the heart of the content. These bullets become the deck's spine —
roughly one slide cluster per takeaway. If the user can only give one,
that's a short deck; if they give twelve, that's a prioritisation
conversation, not a longer deck. The single most important one is the
deck's **core message** (the Phase 2 synthesis line).

If you propose takeaways for the user to react to, explicitly support
multi-select:

> Proposal — reply with numbers to keep, or edit the wording:
> 1. ...
> 2. ...
> 3. ...

Then accept answers like `1,2,5` as intentional selection. If the user says
`ok`, that is still a non-answer unless they explicitly say to use your
proposal; if they do, record the selected bullets as `ASSUMPTION:`.

### Q5 — Source material

> Do you have existing material I should build from — notes, a doc, data, a
> spec, a previous deck? Paste it or point me to the file.

If they give a path, Read it and mine it for content (not styling — see the
style note below). Pull the real numbers, names, and structure from it
rather than asking the user to retype. If they have nothing, that's fine —
note it; the deck is built from the intake answers alone.

Always classify the source status for the brainstorm file:

- `Provided` — a file, paste, data, screenshot, schema, transcript, or prior
  deck is available now and was read/mined.
- `Exists but not provided` — the user says material exists but asks to skip
  it or will show it later.
- `None` — the user explicitly has no source material.

Do not convert `Exists but not provided` into fake evidence. In the
brainstorm, cite it as source status only; any concrete field names,
numbers, claims, or schema details must be absent or marked as an
`ASSUMPTION:`.

### Q6 — Concrete examples, data, stories

> Anything specific you want featured — real numbers, a customer story, a
> diagram, a demo, a before/after?

Concrete specifics are what stop a deck being generic. Capture them
verbatim — exact figures, exact quotes — but if the specific is itself
vague ("add a dashboard", "a customer story"), apply the **one sharpening
follow-up** rule above before banking it; a demo anchor with an unresolved
"X" in it is not an anchor. If the user doesn't have them and
the deck needs them to land, be upfront and supportive: offer to help
gather them, or suggest reframing at a level the user *can* confidently
support. Never invent a number or quote to fill the gap (Phase 3 rigor
audit will catch it anyway).

Persuasion decks also get the dedicated **evidence intake** below; don't
double-ask — fold Q6 into it if the deck is a persuasion deck.

For **informational decks**, after Q6 ask the required light pushback prompt
before synthesis. Explain why you are asking before asking:

> This helps decide whether the deck needs a short limits, trust, or
> guardrails slide. Anything here someone might push back on, or should I
> treat it as a straightforward training/explainer deck?

Capture the answer in the recap as `Pushback`. If the user says no, record
`None raised`.

## Question 7 — Length / slide count (always ask — never assume)

**This question is mandatory. Always ask it.** "Make me a slide", "build a
deck", "some slides", "a presentation" do **not** answer slide count — they
are the request, not the length. The word "slide" (singular) is *not* an
instruction to produce exactly one slide; treat it as "a deck" and still
ask. Assuming a count from the phrasing is how a 5–10-minute talk ended up
as one slide.

**Wording:**
> Roughly how long should it be? Reply with a number.

**Options** (numbered for the `AskUserQuestion` tool):
1. **Medium** — 6–10 slides · ~15 min talk   (Recommended — fits most asks)
2. **Short** — 3–5 slides · ~5 min talk
3. **Long** — 12–20 slides · 30+ min talk
4. **Workshop** — 20+ slides with breaks / exercises

A genuine one-slide deck (cheat sheet, single takeaway) is valid — but only
when the user *explicitly* confirms "yes, one slide", never as a default
inferred from the word "slide".

### Reconcile length against the setting — out loud

Slide count and the Setting answer must agree. Cross-check before Phase 2:

| Setting says            | Slide count should be | If it doesn't agree |
|-------------------------|-----------------------|---------------------|
| ~5 min live             | 5–7 slides            | flag it |
| ~15 min live            | 10–15 slides          | flag it |
| 30+ min live            | 15–25 slides          | flag it |
| Leave-behind / async    | 8–12 denser slides    | flag it |
| One-page cheat sheet    | 1 slide               | consistent |

If the answers contradict — e.g. "one slide" but "5–10 min live
walkthrough" — **do not silently pick one.** Say it plainly and resolve it
with the user: "A 5–10-minute live walkthrough is usually 5–7 slides, not
one — do you want a short multi-slide deck, or genuinely one slide we stay
on the whole time?" Carry the resolved decision into the HEADER `Format`
line so the build skill can't re-derive it wrong.

If a live demo is involved, factor that in: "Want me to leave a slide as the
'we open the editor now' transition?"

For live demo decks, also resolve demo pacing before Phase 2:

> Should one slide be a handoff into the live demo, or should the demo stay
> outside the slide flow?

Record the decision in `Format` or `Constraints`.

## Question 8 — Presentation style

Ask this after length and before synthesis. This is about communication
style, density, and pacing — not visual theme, palette, typography, or a
reference deck.

**Wording:**
> What presentation style should this use? Reply with a number.

**Options** (numbered for the `AskUserQuestion` tool; mark the goal-matched
option as Recommended):
1. **Keynote** — sparse, memorable, story-led; big statements, low text
2. **Compact executive briefing** — dense and scannable; tables, summaries,
   decision points
3. **Training walkthrough** — step-by-step and example-led; process flows,
   demos, checklists
4. **Leave-behind / async reading deck** — self-contained without a presenter;
   clearer headings, more explanation, less reliance on speaker notes

Recommendation rule:
- Goal is Training / onboarding -> option 3.
- Goal is Status update or Decision / approval for executives -> option 2.
- Goal is Adoption or Pitch -> option 1.
- Setting is async / leave-behind -> option 4.

Record this as `Presentation style` in the recap and brainstorm header.
Frames stay theme-neutral. The build skill still chooses the visual theme
later via `html-slides`; do not ask "which theme / match a reference?" during
brainstorm. If the user volunteers a visual theme or reference file
unprompted, note it verbatim as a `STYLE NOTE:` line for `html-slides`.

## Evidence intake — persuasion decks only

For **persuasion decks**, ask two more questions after the core intake —
one at a time, waiting for each answer; keep it tight, this is not an
interrogation:

**Wording (turn 1):**
> What's the hardest evidence behind this — data, a result, a reference
> customer?

**Wording (turn 2, after the answer):**
> And the single strongest objection a skeptic in the room would raise?

Capture both verbatim. The proof feeds every slide's `Evidence:` line. The
objection becomes the Phase 2 synthesis line *"Strongest objection:"* the
user must confirm, and the thing the Phase 3 rigor audit checks the arc
actually answers.

If the user has no real evidence, say so plainly — do not paper over it:
> "Then the honest move is to frame this as a proposal, not a proven case.
> Want me to position it that way?"

For persuasion decks this *replaces* Q6 — it is the content-evidence
question, sharpened. It is not extra budget on top of the content block;
it's the same block, asked the way a persuasion deck needs.

## When to skip questions

Skip any framing question the user already answered in their opener. Still
walk through the content block (Q3–Q6), though — a quick "deck about X"
request hasn't told you what the deck actually says yet, and that's the part
worth a friendly conversation. Examples:

- "I want a 5-slide deck about X for my CEO" → audience and length answered
  ("5-slide" is a real count); still ask goal, then the full content block.
- "Make a training deck for managers about Y" → goal and audience answered;
  **length still unanswered — ask it**, then the full content block.
- "Create a slide to teach X" → nothing answered. "a slide" is the request,
  **not** a slide count of 1 — still ask length, and reconcile it against
  the setting. This is the exact case that produced a 10-minute talk on one
  slide.
- "Build me a quick brainstorm for Z" → no signal; ask all framing
  questions (length included) and the full content block.

## After intake

Recap their answers in 3–5 lines before drafting. This gives them one last chance to correct before you commit to a direction.

```
Quick recap:
  Audience    – <answer>
  Goal        – <answer>
  Subject     – <one-line answer>
  Key points  – <the 3–5 takeaways, the first one is the core message>
  Material    – <Provided / Exists but not provided / None>
  Specifics   – <the concrete numbers/examples/stories to feature>
  Length      – <answer>
  Style       – <keynote / compact executive briefing / training walkthrough / leave-behind>
  Pushback    – <informational: none raised / concern; persuasion: objection>
  Assumptions – <agent-proposed content the user explicitly accepted, or none>
  Proof       – <persuasion decks only: the evidence>
  Objection   – <persuasion decks only: the strongest counter>

Drafting the brainstorm now. One moment.
```

Then write the file.

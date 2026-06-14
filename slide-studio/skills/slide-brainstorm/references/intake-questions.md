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
Framing 1/6 — Who's the audience?
Content 2/4 — What should they remember?
```

Two kinds of question, and the budget is split:

- **Framing** (audience, technicality, goal, length, presentation style, slide
  density): ~5–6 questions, kept tight with numbered options.
- **Content** (subject, key takeaways, source material, concrete
  examples/data, photos/image placeholders): as many as it takes to genuinely
  understand what the deck *says* and what visual assets it should reserve
  space for — typically 3–5 more. A vague deck usually just means the content
  wasn't talked through enough, so it's worth a real conversation here. No cap
  on these; the cap is on *framing* questions. Still one at a time, and stop as
  soon as you could write the deck's spine from memory.

## Proposal Sharpener Route

Use this route when the user's ask is a proposal, adoption plan, pilot,
campaign, manager ask, executive ask, or confirmed single-slide
recommendation. The goal is to shape the **decision** before shaping the deck.
This route should feel closer to `grill-me`: one branch at a time, each answer
narrowing the next question.

Instead of asking generic ingredient questions first, ask concrete proposal
questions with a recommended answer and a short reason. Keep the wording
friendly and decisive:

```
What do you want the audience to do after seeing this?

My recommended answer: commit to a small pilot, because it is specific,
low-risk, and easier to evaluate than a broad campaign.

1. Approve an awareness campaign
2. Commit to a small pilot (Recommended)
3. Nominate champions
4. Add it to team goals
```

Recommended question branches:

| Branch | What to resolve | Example question |
|---|---|---|
| Audience owner | Who must act? | Who is this for: senior leaders, department managers, all employees, or enablement team? |
| Desired action | What should change after the slide? | What do you want them to do after seeing it? |
| Blocker / tension | Why is the proposal needed? | What is the main blocker we need to solve? |
| Mechanism | What repeatable program solves it? | What is the core mechanism of the program? |
| Commitment | What exact ask is realistic? | What should managers be asked to commit to? |
| Success | What behavior proves adoption? | What should count as success? |
| Examples | What makes it concrete? | Should we include examples, and which ones? |
| Structure | How should the one slide scan? | Should it be Problem -> Program -> Ask -> Success, loop diagram, or scorecard? |
| Takeaway | What line should stick? | What is the bottom takeaway line? |

For proposal sharpener questions, a recommendation is expected. If the answer
is purely a user fact, do not fake certainty, but still offer the most useful
default and say why it is only a default. Number every option so the user can
reply with a single digit.

Exit this route when you can write a concise slide brief with:

- Title.
- Audience.
- Goal / desired action.
- Core message.
- Proposal mechanism.
- Specific ask.
- Success measure.
- Examples or proof.
- Slide structure.
- Takeaway line.

If the user confirmed a single slide, do **not** force the normal multi-slide
arc. Hand off the approved one-slide brief to `html-slides`.

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
- **Presentation style** — make the four options content-aware. Recommend the
  mode that best fits the goal and subject matter, such as decision briefing for
  approval asks, product demo flow for tools, training walkthrough for
  enablement, story pitch for adoption, technical review for engineering, or
  leave-behind for async.
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

## Questions 3–7 — Content (the substance of the deck)

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
  yours" — and then write it into the brainstorm HTML as an `ASSUMPTION:`
  line, not as if the user supplied it.

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
answers with a hole in them. Do not write them into the brainstorm HTML as-is and
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

### Q7 — Photos / image placeholders

Ask this for every deck before synthesis:

> Do you want any photos or image placeholders in the slides? If yes, tell me
> which slide, what the image should show, and whether you already have the
> image or only want a placeholder.

Record each requested image as:

- `Image: slide <N or topic> — <what it should show> — <Provided / Placeholder / Need source>`

Rules:

- Do not invent real image content or claim an image exists.
- If the user gives a path or URL, verify/read enough to know what it is before
  using it.
- If they want a placeholder, render a `.wf-box` block in the brainstorm
  HTML labeled with subject, intended crop/role, and asset status
  (Provided/Placeholder/Need source).
- If they say no, omit image placeholders and keep the slides text/artifact-led.
- Photo/image choices are content assets, not final theme selection. Theme still
  happens later in `html-slides`.

For **informational decks**, after Q7 ask the required light pushback prompt
before synthesis. Explain why you are asking before asking:

> This helps decide whether the deck needs a short limits, trust, or
> guardrails slide. Anything here someone might push back on, or should I
> treat it as a straightforward training/explainer deck?

Capture the answer in the recap as `Pushback`. If the user says no, record
`None raised`.

## Question 8 — Length / slide count (always ask — never assume)

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

## Question 9 — Presentation style / usage mode

Ask this after length and before synthesis. This is about how the deck will be
used and how the argument should unfold — not visual theme, palette,
typography, or a reference deck. Do not use one fixed menu for every topic.
Write four options that fit the actual content, audience, goal, and setting,
then map the selected answer to the closest internal presentation style for
handoff.

**Wording:**
> What presentation mode fits this deck best? Reply with a number.

**Options** (numbered for the `AskUserQuestion` tool; customize the labels and
descriptions to the content; mark the best-fit option as Recommended):

Use these as a generator, not a fixed menu:

| Content / goal | Good option label | Internal style |
|---|---|---|
| Executive approval, investment, pilot, sponsor ask | Executive decision briefing — decision-ready, sponsor-scannable | executive briefing |
| Product/tool proposal, platform workflow, feature launch | Product demo narrative — show the experience, workflow, and value moment | product/demo briefing |
| Training, onboarding, employee enablement | Training walkthrough — step-by-step practice with examples | training walkthrough |
| Adoption campaign, vision, pitch, morale shift | Story pitch — memorable, persuasive, emotionally clear | keynote pitch |
| Technical design, architecture, implementation review | Technical review — evidence, tradeoffs, risks, next decisions | technical review |
| Research, analysis, strategy memo, async pre-read | Leave-behind / async deck — self-contained without a presenter | leave-behind deck |

For a gamified Copilot learning platform proposal, a better content-aware menu
would be:

1. **Executive decision briefing** — sponsor-ready, focused on pilot approval
2. **Product demo narrative** — shows missions, loops, and the employee
   experience
3. **Training walkthrough** — teaches how employees would use Copilot through
   missions
4. **Leave-behind / async deck** — self-contained for review without a presenter

Recommendation rule:
- Goal is decision / approval / funding -> include and recommend an executive
  decision briefing option.
- Goal is product concept / platform proposal -> include a product demo
  narrative option.
- Goal is training / onboarding -> include and recommend a training walkthrough
  option.
- Goal is adoption / pitch / culture change -> include and recommend a story
  pitch option.
- Goal is technical alignment -> include and recommend a technical review
  option.
- Setting is async / leave-behind -> include and recommend a leave-behind option.

Record the selected visible label as `Presentation mode` and the normalized
category as `Presentation style` in the recap and brainstorm handoff.
Frames stay theme-neutral. The build skill still chooses the visual theme
later via `html-slides`; do not ask "which theme / match a reference?" during
brainstorm. If the user volunteers a visual theme or reference file
unprompted, note it verbatim as a `STYLE NOTE:` line for `html-slides`.

## Question 10 — Slide density

Ask this after presentation mode. This disambiguates detail level from usage
mode: an executive decision briefing can be balanced or dense; a product demo
narrative can be sparse or balanced; a leave-behind is usually denser.

**Wording:**
> How dense should each slide feel? Reply with a number.

**Options** (numbered for the `AskUserQuestion` tool; recommend the option that
best matches the selected mode, audience, and setting):
1. **Sparse** — one big idea per slide; low text, high presenter reliance
2. **Balanced** — headline plus 3–4 supporting points or one simple visual
3. **Dense executive** — condensed with tables, matrices, scorecards, operating
   models, or decision frames
4. **Leave-behind dense** — self-contained enough to read without a presenter

Recommendation rule:
- Story pitch / keynote -> option 1.
- Product demo narrative or training walkthrough -> option 2 unless the user
  asked for a highly detailed walkthrough.
- Executive decision briefing -> option 2 or 3 depending on whether the user
  wants a crisp live briefing or a detailed sponsor review.
- Technical review -> option 3.
- Leave-behind / async reading deck -> option 4.

Record this as `Slide density` in the recap and brainstorm handoff. If the user
uses words like "compact", "dense", "briefing", "packed", "concise", or
"not wordy", confirm which density meaning they intend instead of guessing.

### Density implications

Use density to shape the brainstorm HTML:

| Density | Good slide content | Avoid |
|---|---|---|
| Sparse | one claim, one image/diagram, one closer | dense tables or long lists |
| Balanced | claim + 3–4 points, simple flow, light artifact | wall-of-text explanations |
| Dense executive | matrices, operating models, scorecards, compact tables, decision sheets | vague summary slides with unused space |
| Leave-behind dense | explanatory headings, compact notes, source callouts | slides that need speaker context to make sense |

For **Dense executive**, each content slide should carry enough information to
support a two-minute discussion while remaining scannable in ten seconds.
Prefer structured artifacts over prose. For example:

`App | Employee mission | Copilot skill practiced | Work artifact | Learning signal`

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
  Mode        – <visible content-aware option selected by user>
  Style       – <normalized category for handoff>
  Density     – <sparse / balanced / dense executive / leave-behind dense>
  Pushback    – <informational: none raised / concern; persuasion: objection>
  Assumptions – <agent-proposed content the user explicitly accepted, or none>
  Proof       – <persuasion decks only: the evidence>
  Objection   – <persuasion decks only: the strongest counter>

Drafting the brainstorm now. One moment.
```

Then write the file.

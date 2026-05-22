# Example excerpt — what good output looks like

This is a real ~80-line excerpt from a brainstorm produced with this skill. Use it as a tonal reference for the level of specificity, the design vocabulary, and the structural rhythm. Full file lives at `docs/brainstorms/2026-05-15-github-copilot-for-everyone-deck.txt`.

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  BRAINSTORM: GitHub Copilot for Everyone                                    ║
║  Audience  : Non-technical managers (semiconductor company)                 ║
║  Goal      : Training — teach the habit, then run a hands-on demo           ║
║  Product   : GitHub Copilot for everyday manager workflows                  ║
║  Style     : TBD — chosen in html-slides                                    ║
║  Format    : 8 slides · ~10 min talk + demo + ~3 min wrap-up                ║
║  Date      : 2026-05-15                                                     ║
╚══════════════════════════════════════════════════════════════════════════════╝

STYLE NOTE: user volunteered Apple / Cursor restraint and editorial layout.


─────────────────────────────────────────────────────────────────────────────
  NARRATIVE ARC
─────────────────────────────────────────────────────────────────────────────

  Core thesis:
    Copilot used to be a tool for coders.
    Now it's a coworker for everyone.
    The new skill isn't typing — it's asking.

  Story spine — one question + slide detail per slide:

    01  TITLE          —  Why are we here?
        Purpose        —  Set the session as practical manager training.
        Main point     —  Copilot is now useful outside coding.
        Evidence/demo  —  User-provided training goal and live demo.
        Builds to      —  A before/after shift in who can use the tool.

    02  THE SHIFT      —  What changed?
        Purpose        —  Reframe Copilot from code helper to work partner.
        Main point     —  The new skill is asking, not typing.
        Evidence/demo  —  Supported by the live workflow examples later.
        Builds to      —  A simple how-to loop.

    03  HOW            —  How do I use it?
        Purpose        —  Give the memorable operating loop.
        Main point     —  Ask, refine, ship.
        Evidence/demo  —  Live demo runs the same three steps.
        Builds to      —  Concrete prompt examples.

    04  REAL PROMPTS   —  Like what, exactly?
        Purpose        —  Translate the loop into everyday manager work.
        Main point     —  Useful prompts sound like real desk work.
        Evidence/demo  —  User-provided workplace examples.
        Builds to      —  End-to-end demo.

    05  IN PRACTICE    —  Show me one end-to-end.
        Purpose        —  Prove the loop can complete a task.
        Main point     —  One request can become a usable artifact.
        Evidence/demo  —  Demo task prepared by presenter.
        Builds to      —  Live editor handoff.

    06  LET'S TRY IT   —  Where do we open the editor?
        Purpose        —  Transition cleanly from slides to demo.
        Main point     —  The workflow is easier to learn by doing.
        Evidence/demo  —  Live demo starts here.
        Builds to      —  Agent-skill explanation after hands-on use.

    07  AGENT SKILLS   —  What problem do they solve?
        Purpose        —  Explain reusable instructions after the demo.
        Main point     —  Skills make repeated work less fragile.
        Evidence/demo  —  Demo shows the cost of repeated context setting.
        Builds to      —  How progressive loading works.

    08  HOW THEY LOAD  —  Why does progressive disclosure matter?
        Purpose        —  Close with the operating principle.
        Main point     —  Load the right context at the right time.
        Evidence/demo  —  Skill-loading behavior explained conceptually.
        Builds to      —  Audience starts trying it.


─────────────────────────────────────────────────────────────────────────────
  INTAKE STATUS
─────────────────────────────────────────────────────────────────────────────

  Source status:
    Provided — user supplied prior notes and a live-demo flow.

  Assumptions:
    ASSUMPTION: None.

  Pushback:
    Informational deck — none raised.

  Demo pacing:
    Slide 06 hands off to live demo.


─────────────────────────────────────────────────────────────────────────────
  DESIGN PRINCIPLES
─────────────────────────────────────────────────────────────────────────────

  Say less, mean more.
    • One idea per slide. Nothing else.
    • Sentences are short. Periods are loud.
    • One italic purple accent word per H2. Never more.
    • Word budget per slide: 25–40 words. Title < 15.

  Hairlines, not boxes.
    • Card grids look spreadsheety. We avoid them.
    • Use vertical and horizontal hairline rules to divide space.
    • Let whitespace do the column work.
    • Allow ONE soft purple wash per deck — used as a focal point, not a frame.
    • Every slide should feel visually distinct from its neighbours.

  Card budget for the entire deck: 1.   (was 20+)


─────────────────────────────────────────────────────────────────────────────
  SLIDE 03 — HOW
  Layout: manuscript-row · three steps · one italic closer
─────────────────────────────────────────────────────────────────────────────

  ┌────────────────────────────────────────────────────────────────────────┐
  │ ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
  │                                                                        │
  │   03 — HOW IT WORKS                                                    │
  │   ───                                                                  │
  │                                                                        │
  │   Three steps.    Forever.                                             │  ← H2 · italic on "Forever"
  │                                                                        │
  │   ─────────────────────────────────────────────────────────────────    │
  │   01    Ask.       Tell it what you want, in your own words.           │
  │   ─────────────────────────────────────────────────────────────────    │
  │   02    Refine.    Read the draft. Push back. Change direction.        │
  │   ─────────────────────────────────────────────────────────────────    │
  │   03    Ship.      Save it. Send it. Present it.                       │
  │   ─────────────────────────────────────────────────────────────────    │
  │                                                                        │
  │   It learns the room as you talk.                                      │  ← italic closer
  │                                                                        │
  │   GitHub Copilot — for everyone                              [GH logo] │
  └────────────────────────────────────────────────────────────────────────┘

  COPY     (~28 words on canvas)
    KICKER   03 — HOW IT WORKS
    H2       Three steps. Forever.
    ROW 01   Ask. Tell it what you want, in your own words.
    ROW 02   Refine. Read the draft. Push back. Change direction.
    ROW 03   Ship. Save it. Send it. Present it.
    CLOSER   It learns the room as you talk.

  ARGUMENT
    CLAIM     The workflow is three repeatable steps, not a tool to master.
    EVIDENCE  Live demo in the next slide runs exactly Ask → Refine → Ship.

  VISUAL
    LAYOUT      manuscript row — three hairline-ruled rows, generous gutter
    PROTAGONIST the numbered verbs (Ask / Refine / Ship) marching down
    FEEL        reads like a recipe card, not a slide — calm, inevitable;
                each hairline a quiet drumbeat saying "this is all there is"
    MOTION      rows wipe in top-to-bottom, one beat apart

  TECHNIQUE
    – Manuscript rows replace what was originally a 3-card "steps grid".
    – Each row is INDEX VERB. SUPPORTING CLAUSE. Baseline-aligned.
    – 1px hairlines separate rows; no borders, no shading.
    – The italic closer is the only emotional line on the slide.
```

## What to notice

- **The header carries metadata.** Audience, goal, format, date — all answerable in one glance. (Style stays `TBD — chosen in html-slides`.)
- **The narrative arc is one question plus slide detail per slide.** Each slide has earned its place because it has a question, purpose, main point, evidence/demo source, and handoff.
- **Design principles are committed to.** The "card budget: 1" line is a real constraint that disciplines every subsequent slide.
- **The frame is annotated.** Arrows explain intent. COPY has the actual words; ARGUMENT states the claim and its proof; VISUAL paints the layout, protagonist, and *feel* in theme-agnostic language so the slide sounds worth building; TECHNIQUE explains why the layout works.
- **Word counts are stated.** "~28 words on canvas" — this is the Apple/Cursor restraint pass made visible.

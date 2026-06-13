# Slide System Self-Improvement Loop — Prompt

Paste the prompt below to run one improvement iteration. Repeat it, or run it on
an interval with `/loop` (e.g. `/loop 30m <paste the prompt>`), or self-paced
with `/loop <paste the prompt>`. It is designed to make exactly one safe,
proven, committed improvement per run and to stop itself when there is nothing
worth changing.

Decisions baked in (from setup): scope = the whole slide system · autonomous
(applies + commits) · two-part gate (mechanical + an excellence bar) — scrap & record
anything mediocre, no AI slop · bounded web research each iteration · must cover the
full style range (hand-drawn → playful → premium) and stay effortless for the user.

---

## THE PROMPT

```
Improve the jm-design slide skill SYSTEM by exactly ONE high-leverage change this
iteration, prove it did not regress anything, then commit it. Quality over motion:
a run that concludes "nothing here is worth changing" and stops is a good outcome.

THE BAR — what "high quality" means (judge EVERY change against this, never "it renders"):
Imagine the deck is presented where failing costs millions or a career — a McKinsey/BCG
consultant in the boardroom, an engineer in front of a world-class professor, a founder
pitching a Fortune 500 CEO, or a billion-view YouTube lesson that must be genuinely fun
and engaging. The system must clear that bar across the FULL style range — hand-drawn,
playful, and premium/professional — each a distinct, excellent mode, not a recolour. And
it must be COMPREHENSIVE yet effortless: the skill does the heavy lifting; the user gives
minimal input and still gets an excellent deck.
NO AI SLOP — reject the generic-AI-slide tells on sight: rows of equal cards, an accent
line under the title, emoji-as-icons, everything centred, gradient soup, decorative bars
that explain nothing, clip-art overload, filler copy, three-bullets-forever. If it looks
"AI-generated," it has already failed. Only excellent changes survive; mediocre is a fail.

THE SYSTEM (all under .claude/skills/ unless noted):
- slide-quick ........ fast path: intake → outline → consultant → wireframe →
                       native PptxGenJS PPTX (templates/builder.js, themes.js,
                       example-build.js; references/visual-playbook.md;
                       assets/ glows; scripts/gen-glows.js)
- slide-consultant ... content reviewer (Pyramid/SCQA/MECE/action titles); refs in
                       references/frameworks.md
- slide-brainstorm ... full discovery + references/layout-blueprint.md,
                       archetypes.md, wireframe-skeleton.html, template.md
- html-slides ........ themed single-file HTML decks (themes/, scripts/verify.py)
- html-to-pptx ....... HTML→PPTX (image + layered modes)
- pptx, theme-factory, micron-icons ... supporting skills
- Workflows: .claude/workflows/slide-quick-test.js , slide-pipeline-test.js
- History: docs/superpowers/specs + plans ; running log: docs/slide-improvement-log.md

DO THESE IN ORDER, ONCE:

0. SETUP. Make sure you are on a dedicated branch (create `slide-loop` from main if
   not). Autonomous commits land here, not on main — the human merges when happy.

1. ORIENT. Read docs/slide-improvement-log.md fully — do NOT repeat anything listed
   there. Skim the system. Name the SINGLE highest-leverage improvement not yet done.
   It may be any of: restructure (split a bloated skill, or combine two that overlap),
   add/upgrade a content framework, add or fix a native or HTML theme, cut friction
   or speed in the fast path, strengthen a gate/eval, apply a researched best
   practice, make the skill do MORE of the heavy lifting (fewer/seamless user inputs,
   smarter defaults, better auto-recommendation), deepen a STYLE into a genuinely
   excellent distinct mode (hand-drawn, playful, or premium/professional — not a
   recolour), or — equally important — improve the VISUAL quality of the OUTPUT decks:
   real icons/graphics/illustrations instead of flat boxes, image-led layouts,
   generous spacing, larger type, a designed colour palette, and more convincing copy
   (see references/visual-playbook.md). Pick ONE and say in one sentence why it is the
   highest leverage right now.

2. RESEARCH (bounded — 1 to 2 focused web searches). Look up current, credible
   slide-design / consulting / tooling best practices for your chosen area, e.g.
   Duarte, Minto Pyramid Principle, Gene Zelazny, Cole Nussbaumer Knaflic
   ("Storytelling with Data"), McKinsey/BCG deck conventions, IBCS, or the relevant
   library (PptxGenJS, Reveal.js, Marp, python-pptx). For VISUAL work, start from
   references/visual-playbook.md (icon→PNG pipeline, ready palettes, font pairings,
   type floors) and research open icon sets (Tabler/Phosphor, MIT), CC0 illustrations
   (unDraw/Humaaans/Open Doodles), palette + contrast (Open Color/Coolors/WebAIM), and
   code-SVG generators (Haikei/fffuel). Extract the PRINCIPLE, not boilerplate. Cite
   the sources you used.

3. PLAN. 3–6 lines for THIS one change: which files, what the change is, and exactly
   how you will prove it works.

4. APPLY. Make the change. You MAY restructure, split, combine, create files, add a
   theme, or add a framework — but change ONE coherent thing; do not sprawl. Hold the
   architecture: the fast path (slide-quick) stays fast (≤2 required user replies,
   native PPTX, no HTML step); the full pipeline stays rigorous (its content-rigor
   gates remain). Never delete a working skill unless its replacement exists AND
   passes the gate. Never invent facts, stats, or sources.

5. GATE (TWO-PART — a change is accepted ONLY if BOTH hold):
   (a) MECHANICAL — must be green:
   - Touched the native engine or a native theme → run
     `node .claude/skills/slide-quick/templates/example-build.js tmp/loop/m.pptx midnight`
     and `... tmp/loop/l.pptx light`; render one with LibreOffice
     (`python3 .claude/skills/pptx/scripts/office/soffice.py --headless --convert-to pdf
     --outdir tmp/loop tmp/loop/m.pptx` then `pdftoppm -jpeg -r 120 tmp/loop/m.pdf
     tmp/loop/s`) and LOOK at the JPEGs.
   - Touched slide-quick or slide-consultant content/flow → run the `slide-quick-test`
     workflow (Workflow name 'slide-quick-test'); require status PASS.
   - Touched the full pipeline (slide-brainstorm / html-slides / html-to-pptx) → run
     the `slide-pipeline-test` workflow; require PASS; and run html-slides
     `scripts/verify.py` on any changed theme (exit 0).
   - Added or changed a THEME → ALSO build a 4–6 slide deck in that theme and visually
     confirm the render (no overlap, clipping, low contrast, or missed arrows).
   - Changed the OUTPUT's LOOK (engine, theme, layout, icons, copy) → render a 4–6
     slide deck and confirm the visual-playbook bar by eye: each slide has one real
     visual (not just boxes/bullets); type floors met (title ≥32pt, body ≥20pt,
     caption ≥14pt); ~20–25% whitespace; a 3-colour 60-30-10 palette with AA text
     contrast; copy carries concrete numbers and a "so what" title. A titled box of
     bullets is a fail.
   (b) EXCELLENCE — judge the rendered deck COLD against THE BAR, as if a hostile
   expert in that boardroom is reviewing it. For any look/copy/theme/flow change do a
   fresh-eyes pass (or run the slide-quick-test visual reviewer; spawn a subagent
   reviewer for a big change). It must look intentionally designed and on-brand for its
   style, carry ZERO AI-slop tells, and read as clearly more convincing/engaging than
   before. "Fine" or "slightly better" is a FAIL — only a clear quality gain passes.

   ACCEPTANCE / SCRAP-AND-RECORD: commit ONLY if (a) and (b) both hold. If the change
   fails either part, can't be verified, or is merely mediocre, SCRAP it — revert
   (`git checkout -- <files>` or `git reset --hard` the working changes) — and RECORD it
   under "## Failed experiments" in docs/slide-improvement-log.md (what you tried, why it
   didn't clear the bar) so it is never retried. Then pick a different improvement or
   stop. Never commit a change that only "renders."

6. COMMIT + LOG. One atomic commit with a clear message (end the body with the
   Co-Authored-By trailer this repo uses). Append one entry to
   docs/slide-improvement-log.md: date · the change · why · evidence (gate result) ·
   research source(s). (Scrapped attempts go under "## Failed experiments" instead —
   they are recorded even though nothing is committed, so the loop never repeats them.)

7. REPORT. Five lines: what changed, the gate result, and the top 2 candidate
   improvements for the next iteration.

STOP CONDITION. If after orienting no candidate clears a real value bar, or two
improvement attempts in a row fail the gate, write "CONVERGED: <reason>" to the log
and STOP rather than forcing a weak change.
```

---

## How to run it as a loop

- **Manual:** paste the prompt, let it finish one iteration, paste again.
- **Self-paced loop:** `/loop` then paste the prompt — the model decides when to
  fire the next iteration.
- **Timed loop:** `/loop 30m` + the prompt for an iteration roughly every 30 minutes.
- The `docs/slide-improvement-log.md` memory is what makes repeated runs additive
  instead of circular — keep it; the loop both reads and appends to it.
- It commits to a `slide-loop` branch on its own (your choice); review and merge to
  main when you like what it has done. To stop, end the `/loop`.

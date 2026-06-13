export const meta = {
  name: 'slide-pipeline-test',
  description: 'Generate a test deck through the gated pipeline (HTML + PPTX), run all verifiers, and review both outputs visually',
  whenToUse: 'After changing any slide skill (slide-quick, slide-brainstorm, slide-consultant, html-slides, html-to-pptx, pptx) to prove the pipeline still produces production-grade decks in both formats. Also as a demo of the full gate chain.',
  phases: [
    { title: 'Generate', detail: 'one agent builds a small decision deck per the html-slides skill and self-verifies' },
    { title: 'Gate', detail: 'independent verify.py run + html-to-pptx layered conversion + validator' },
    { title: 'Review', detail: 'final-deck content review (HTML) + contact-sheet review (PPTX), in parallel' },
  ],
}

// Args (all optional): { runId, theme, mode, topic }
// Paths are repo-relative; agents run from the project root.
const cfg = Object.assign(
  { runId: 'latest', theme: 'micron-dark', mode: 'layered', topic: 'ai-code-review-budget' },
  args || {}
)
const WORKDIR = `tmp/slide-pipeline-test/${cfg.runId}`
const DECK = `${WORKDIR}/deck.html`
const SKILLS = '.claude/skills'

// Fixture source material: every numeral in the deck must trace to this.
const FACTS = `# Source: AI code-review tool pilot — fact sheet (test fixture)
- Pilot: 3 weeks, one team, 14 engineers (Platform team)
- Review turnaround: median 26h before, 9h after the pilot
- Escaped defects: 11/month before, 6/month during the pilot
- Reviewer time saved: 5.5 hours per engineer per week
- Cost: $18k per quarter for 120 seats (whole engineering org)
- Ask: approve $18k/quarter budget; decision needed by 30 June; owner: VP Engineering
- Rollout: Platform team mentors 2 more teams in July, org-wide by September
- Known risk: false-positive review comments measured at 12% in week 1, 7% by week 3`

const GEN_SCHEMA = {
  type: 'object',
  properties: {
    deck_path: { type: 'string' },
    slide_count: { type: 'integer' },
    titles: { type: 'array', items: { type: 'string' } },
    verify_passed: { type: 'boolean' },
    fix_loops: { type: 'integer', description: 'how many build-verify-fix cycles were needed' },
    notes: { type: 'string' },
  },
  required: ['deck_path', 'slide_count', 'titles', 'verify_passed', 'fix_loops', 'notes'],
}

const GATE_SCHEMA = {
  type: 'object',
  properties: {
    verify_exit: { type: 'integer' },
    verify_failures: { type: 'array', items: { type: 'string' } },
    title_storyline: { type: 'array', items: { type: 'string' } },
    pptx_path: { type: 'string' },
    contact_sheet: { type: 'string' },
    screenshots_dir: { type: 'string' },
    validation_passed: { type: 'boolean' },
    roundtrip_mean_delta: { type: 'string', description: 'round-trip render mean delta, or "skipped" if LibreOffice unavailable' },
    notes: { type: 'string' },
  },
  required: ['verify_exit', 'verify_failures', 'title_storyline', 'pptx_path', 'contact_sheet', 'screenshots_dir', 'validation_passed', 'roundtrip_mean_delta', 'notes'],
}

const REVIEW_SCHEMA = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['PASS', 'BLOCKING'] },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          severity: { type: 'string', enum: ['P0', 'P1', 'P2', 'P3'] },
          slide: { type: 'integer' },
          issue: { type: 'string' },
          fix: { type: 'string' },
        },
        required: ['severity', 'slide', 'issue', 'fix'],
      },
    },
    summary: { type: 'string' },
  },
  required: ['status', 'findings', 'summary'],
}

// ---------- Phase 1: Generate ----------
phase('Generate')
log(`Generating a ${cfg.theme} decision deck (${cfg.topic}) in ${WORKDIR}`)

const gen = await agent(`You are testing the slide-generation pipeline. Work from the repo root.

1. Create the workdir \`${WORKDIR}\` and write this fact sheet verbatim to \`${WORKDIR}/source.md\`:

${FACTS}

2. Build a 5–6 slide DECISION deck at \`${DECK}\` using the html-slides skill at \`${SKILLS}/html-slides/\`:
   - Read \`${SKILLS}/html-slides/SKILL.md\`, \`${SKILLS}/html-slides/themes/${cfg.theme}/design.md\`, and the references SKILL.md points to for this theme.
   - Start from \`python3 ${SKILLS}/html-slides/scripts/scaffold-deck.py --theme ${cfg.theme}\` output (write it into the workdir) and replace its content — the scaffold already satisfies brand/runtime requirements.
   - The deck argues: approve the AI code-review tool budget. Audience: VP Engineering (skeptical). Use ONLY numbers from the fact sheet.
   - Apply the content doctrine: full-sentence assertion titles with key numbers; answer-first (mark the deck root \`data-deck-kind="decision"\` and slide 2 \`data-slide-kind="executive-summary"\` stating the recommendation and the $18k/quarter ask); one idea per slide; ≤60 body words per slide (executive budget); a chart or evidence exhibit with visible values and an adjacent takeaway; closing slide restates the ask with owner and date; address the false-positive risk (steelman) on one slide.
   - Mark the deck \`data-deck-mode="standalone"\` (hard chart-takeaway gate).

3. Self-verify until clean: \`cd ${SKILLS}/html-slides && uv run scripts/verify.py <repo-root-relative-or-absolute deck path> --theme ${cfg.theme} --check-overview --fail-on-warnings --output <workdir>/screenshots\`. Fix failures and re-run. Count your fix loops.

Return structured output only: deck_path (repo-relative), slide_count, titles in order, verify_passed, fix_loops, notes (anything you had to work around).`,
  { label: 'generate deck', phase: 'Generate', schema: GEN_SCHEMA })

if (!gen || !gen.verify_passed) {
  return { status: 'FAILED at Generate', gen }
}
log(`Deck built: ${gen.deck_path} (${gen.slide_count} slides, ${gen.fix_loops} fix loops)`)

// ---------- Phase 2: Gate (independent re-verify + PPTX conversion) ----------
phase('Gate')

const gate = await agent(`You are the independent gate runner for a generated slide deck. Work from the repo root. Do NOT edit the deck — you verify and convert only.

Deck: ${gen.deck_path}
Source material: ${WORKDIR}/source.md

1. Re-run the mechanical gate yourself (do not trust the generator):
   \`cd ${SKILLS}/html-slides && uv run scripts/verify.py <absolute deck path> --theme ${cfg.theme} --check-overview --fail-on-warnings --source <absolute source.md path> --output <absolute ${WORKDIR}/screenshots>\`
   Record the exit code, every failure line, and the printed "Title storyline" list.

2. Convert to PPTX with the html-to-pptx skill converter:
   \`node ${SKILLS}/html-to-pptx/scripts/html_to_pptx.mjs <absolute deck path> --out <absolute ${WORKDIR}/deck.pptx> --workdir <absolute ${WORKDIR}/pptx-run> --scale 2 --mode ${cfg.mode} --validate\`
   If node modules are missing, install per the skill's Dependencies section or use the repo's node_modules.

3. Read the validation report JSON in the workdir. Record: validation passed (slide count match, backgrounds, text boxes in bounds), the contact sheet path, and the round-trip render mean delta if LibreOffice ran (else "skipped").

Return structured output only.`,
  { label: 'verify + convert to pptx', phase: 'Gate', schema: GATE_SCHEMA })

if (!gate) return { status: 'FAILED at Gate', gen }
log(`Gate: verify exit ${gate.verify_exit}, validation ${gate.validation_passed ? 'passed' : 'FAILED'}, round-trip delta ${gate.roundtrip_mean_delta}`)

// ---------- Phase 3: Review (both formats, in parallel) ----------
phase('Review')

const [htmlReview, pptxReview] = await parallel([
  () => agent(`Read ${SKILLS}/html-slides/references/process/final-deck-review-subagent.md and execute its reviewer prompt. Do not edit files.

Deck HTML: ${gen.deck_path}
Screenshots: ${gate.screenshots_dir}
Audience: VP Engineering, skeptical, low patience
Goal: decision (approve $18k/quarter budget)
Deck kind: decision; mode: standalone
Approved brainstorm: none (test fixture; source material at ${WORKDIR}/source.md)

Apply every check (assertion titles, skim test, one claim per slide, interpretable exhibits, MECE, comparison integrity, the ask). Return structured output only.`,
    { label: 'review: html content', phase: 'Review', schema: REVIEW_SCHEMA }),
  () => agent(`Read ${SKILLS}/html-to-pptx/references/validator-subagent.md and execute it. Do not edit files.

Source HTML: ${gen.deck_path}
PPTX: ${gate.pptx_path}
Manifest: ${WORKDIR}/pptx-run/manifest.json
Validation report: ${WORKDIR}/pptx-run/validation-report.json
Contact sheet: ${gate.contact_sheet}

Inspect the contact sheet image slide by slide (blank/cropped slides, clipped text, doubled glyphs in ${cfg.mode} mode, black-on-black failures, missing logos/images). Return structured output only.`,
    { label: 'review: pptx visual', phase: 'Review', schema: REVIEW_SCHEMA }),
])

return {
  status: (gate.verify_exit === 0 && gate.validation_passed &&
    (htmlReview ? htmlReview.status : 'missing') === 'PASS' &&
    (pptxReview ? pptxReview.status : 'missing') === 'PASS') ? 'PASS' : 'ISSUES FOUND',
  artifacts: {
    html: gen.deck_path,
    pptx: gate.pptx_path,
    screenshots: gate.screenshots_dir,
    contact_sheet: gate.contact_sheet,
    source: `${WORKDIR}/source.md`,
  },
  generation: { slide_count: gen.slide_count, fix_loops: gen.fix_loops, titles: gate.title_storyline.length ? gate.title_storyline : gen.titles },
  gate: { verify_exit: gate.verify_exit, verify_failures: gate.verify_failures, validation_passed: gate.validation_passed, roundtrip_mean_delta: gate.roundtrip_mean_delta },
  reviews: { html: htmlReview, pptx: pptxReview },
}

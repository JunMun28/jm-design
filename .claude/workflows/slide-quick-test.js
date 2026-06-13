export const meta = {
  name: 'slide-quick-test',
  description: 'Review & improve the slide-quick fast path, generate a deck through it, then review the output (content + visual)',
  whenToUse: 'After changing slide-quick, slide-consultant, the native engine, or the brainstorm wireframe — to surface concrete improvements AND prove the fast path still produces a clean editable PPTX. Improvements are returned for the main agent to apply (not auto-edited).',
  phases: [
    { title: 'Review & improve', detail: 'parallel reviewers over the fast-path skills + a synthesized improvement plan' },
    { title: 'Generate', detail: 'one agent runs the slide-quick path: outline -> consultant pass -> native PPTX -> render' },
    { title: 'Review deck', detail: 'content review (consultant lens) + visual review (rendered slides), in parallel' },
  ],
}

// Args (all optional): { runId, theme, topic }
const cfg = Object.assign(
  { runId: 'latest', theme: 'midnight', topic: 'What is retrieval-augmented generation (RAG)?' },
  args || {}
)
const SK = '.claude/skills'
const WORKDIR = `tmp/slide-quick-test/${cfg.runId}`

const IMPROVE_SCHEMA = {
  type: 'object',
  properties: {
    dimension: { type: 'string' },
    status: { type: 'string', enum: ['PASS', 'ISSUES'] },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          severity: { type: 'string', enum: ['P0', 'P1', 'P2', 'P3'] },
          file: { type: 'string' },
          issue: { type: 'string' },
          fix: { type: 'string', description: 'a concrete, ready-to-apply change' },
        },
        required: ['severity', 'file', 'issue', 'fix'],
      },
    },
    summary: { type: 'string' },
  },
  required: ['dimension', 'status', 'findings', 'summary'],
}

const SYNTH_SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string', description: 'overall health of the fast-path skills in one line' },
    improvements: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          rank: { type: 'integer' },
          severity: { type: 'string', enum: ['P0', 'P1', 'P2', 'P3'] },
          file: { type: 'string' },
          change: { type: 'string' },
        },
        required: ['rank', 'severity', 'file', 'change'],
      },
    },
  },
  required: ['verdict', 'improvements'],
}

const GEN_SCHEMA = {
  type: 'object',
  properties: {
    deck_path: { type: 'string' },
    build_script: { type: 'string' },
    images_dir: { type: 'string' },
    slide_count: { type: 'integer' },
    titles: { type: 'array', items: { type: 'string' } },
    render_ok: { type: 'boolean' },
    consultant_changes: { type: 'array', items: { type: 'string' }, description: 'copy fixes applied during the consultant pass' },
    notes: { type: 'string' },
  },
  required: ['deck_path', 'images_dir', 'slide_count', 'titles', 'render_ok', 'notes'],
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

// ---------- Phase 1: Review & improve the fast-path skills ----------
phase('Review & improve')
log('Reviewing the slide-quick fast path across 4 dimensions')

const DIMENSIONS = [
  {
    key: 'consultant',
    prompt: `Review the slide-consultant skill for completeness and soundness as a content-copy reviewer. Do not edit files.
Read: ${SK}/slide-consultant/SKILL.md and ${SK}/slide-consultant/references/frameworks.md.
Check: are the six checks (Pyramid, SCQA, action titles + skim test, MECE, one-message, evidence honesty) complete and unambiguous? Are the improve/review output contracts clear and machine-followable? Any framework gap (e.g. missing chart-integrity or comparison-integrity guidance)? Any rule that could make the reviewer invent facts? Return concrete, ready-to-apply fixes. dimension="consultant".`,
  },
  {
    key: 'quick-flow',
    prompt: `Review the slide-quick skill's flow and routing for clarity and correctness. Do not edit files.
Read: ${SK}/slide-quick/SKILL.md.
Check: is the 2-reply target realistic and unambiguous? Are the intake skip rules + PREFS coherent? Is the routing (when to hand off to the full pipeline) crisp? Does Step 5 (build) reference real template files and honor the PptxGenJS pitfalls? Is QA-lite actionable? Flag anything an agent following it could get wrong. Return concrete fixes. dimension="quick-flow".`,
  },
  {
    key: 'engine',
    prompt: `Review the slide-quick native PptxGenJS engine for code quality and correctness. Do not edit files.
Read: ${SK}/slide-quick/templates/builder.js, ${SK}/slide-quick/templates/themes.js, ${SK}/slide-quick/templates/example-build.js, and skim ${SK}/pptx/pptxgenjs.md for the pitfall list.
Check: any "#"-prefixed hex, 8-char hex, or shared/mutated option objects across calls? Are both themes (midnight, light) internally consistent (contrast, glow flag)? Do helpers cover the common slide needs (cover, panel, node, arrow, kicker, code, footer)? Any helper that could silently produce an invalid file? Run \`node ${SK}/slide-quick/templates/example-build.js tmp/slide-quick-test/engine-check.pptx light\` from repo root to confirm it still builds. Return concrete fixes. dimension="engine".`,
  },
  {
    key: 'wireframe',
    prompt: `Review the brainstorm wireframe migration for internal consistency. Do not edit files.
Read: ${SK}/slide-brainstorm/references/wireframe-skeleton.html, ${SK}/slide-brainstorm/references/visual-companion.md, ${SK}/slide-brainstorm/references/template.md, and grep ${SK}/slide-brainstorm for "full-fidelity", "html-companion-skeleton", and ".wf-slide".
Check: does any rule still demand full-fidelity previews (contradicting the wireframe policy)? Does the skeleton keep the annotation DOM (section.deck > article.slide-panel[data-slide] > header.slide-head + div.preview) AND use low-fi .wf-box content? Are there dangling references to the deleted skeleton? Are the content-rigor gates (argument audit, MECE, subagent review) still intact? Return concrete fixes. dimension="wireframe".`,
  },
]

const dimResults = (await parallel(
  DIMENSIONS.map((d) => () => agent(d.prompt, { label: `review:${d.key}`, phase: 'Review & improve', schema: IMPROVE_SCHEMA }))
)).filter(Boolean)

const allFindings = dimResults.flatMap((r) => (r.findings || []).map((f) => ({ ...f, dimension: r.dimension })))
log(`Collected ${allFindings.length} findings across ${dimResults.length} dimensions`)

const synth = await agent(`You are synthesizing skill-improvement findings into one ranked, de-duplicated plan for the main agent to apply.
Here are the raw findings as JSON:
${JSON.stringify(allFindings, null, 2)}
De-duplicate overlapping items, drop anything not actionable, and rank by severity then impact (P0 first). Each improvement names the exact file and the concrete change. Give a one-line overall verdict on the fast path's health.`,
  { label: 'synthesize improvements', phase: 'Review & improve', schema: SYNTH_SCHEMA })

// ---------- Phase 2: Generate a deck through slide-quick ----------
phase('Generate')
log(`Generating a ${cfg.theme} deck via slide-quick: "${cfg.topic}"`)

const gen = await agent(`You are exercising the slide-quick fast path end to end. Work from the repo root. Topic: "${cfg.topic}". Theme: ${cfg.theme}. Target ~6 slides. This is a test, so SKIP the user-facing intake — assume audience "engineers, technical", PPTX delivery.

Follow ${SK}/slide-quick/SKILL.md:
1. Draft a 6-slide outline (action-title sentences; slide 1 is a cover).
2. Consultant pass: apply the checks in ${SK}/slide-consultant/SKILL.md to your own outline and improve the titles/copy in place. Record what you changed (consultant_changes).
3. Build the deck natively. Create \`${WORKDIR}/build.js\` that requires the committed engine by absolute path:
   const path = require('path'); const ROOT = process.cwd();
   const { THEMES } = require(path.join(ROOT, '${SK}/slide-quick/templates/themes.js'));
   const { createBuilder } = require(path.join(ROOT, '${SK}/slide-quick/templates/builder.js'));
   Use createBuilder(new (require('pptxgenjs'))(), '${cfg.theme}') after setting P.layout='LAYOUT_WIDE'. Model it on ${SK}/slide-quick/templates/example-build.js. Diagrams are real shapes; code blocks <=10 lines in Consolas; tag any sample numbers with the ILLUSTRATIVE marker; honor the PptxGenJS pitfalls (no "#" hex, fresh option objects). Output \`${WORKDIR}/rag.pptx\`. Run it from repo root.
4. QA-lite: render with \`python3 ${SK}/pptx/scripts/office/soffice.py --headless --convert-to pdf --outdir ${WORKDIR} ${WORKDIR}/rag.pptx\` then \`pdftoppm -jpeg -r 120 ${WORKDIR}/rag.pdf ${WORKDIR}/slide\`. Open the slide JPGs and fix any overlap/clipping/contrast issues once, then re-render.

Return structured output only: deck_path, build_script path, images_dir (${WORKDIR}), slide_count, titles in order, render_ok, consultant_changes, notes.`,
  { label: 'generate deck (slide-quick)', phase: 'Generate', schema: GEN_SCHEMA })

if (!gen || !gen.render_ok) {
  return { status: 'FAILED at Generate', improvement_plan: synth, gen }
}
log(`Deck built: ${gen.deck_path} (${gen.slide_count} slides)`)

// ---------- Phase 3: Review the generated deck ----------
phase('Review deck')

const [content, visual] = await parallel([
  () => agent(`Apply the slide-consultant REVIEW process to a finished deck. Do not edit files.
Read ${SK}/slide-consultant/SKILL.md for the checks. The deck text: extract it with \`python3 -m markitdown ${gen.deck_path}\` (or \`uv run --with "markitdown[pptx]" python3 -m markitdown ${gen.deck_path}\`).
Run: storyline / skim test on the titles ${JSON.stringify(gen.titles)}; action-title quality; one message per slide; MECE on any grouped slide; evidence honesty (sample numbers must be marked Illustrative). Return REVIEW_SCHEMA (status PASS unless there is a P0/P1).`,
    { label: 'review: deck content', phase: 'Review deck', schema: REVIEW_SCHEMA }),
  () => agent(`Visually inspect the rendered slide images for the deck. Do not edit files.
Images: the JPGs in ${gen.images_dir} (slide-*.jpg). Read each one.
Look for: overlapping elements, text clipped at panel/slide edges, low-contrast text (dark-on-dark or light-on-light), arrows that miss their target, wrapped/cramped kicker pills, uneven gaps, blank slides. Report per-slide. Return REVIEW_SCHEMA (status BLOCKING if any P0/P1 visual defect).`,
    { label: 'review: deck visual', phase: 'Review deck', schema: REVIEW_SCHEMA }),
])

const reviewsClean = (content && content.status === 'PASS') && (visual && visual.status === 'PASS')

return {
  status: reviewsClean ? 'PASS' : 'ISSUES FOUND',
  improvement_plan: synth,
  deck: { path: gen.deck_path, slides: gen.slide_count, titles: gen.titles, images: gen.images_dir, consultant_changes: gen.consultant_changes || [] },
  reviews: { content, visual },
}

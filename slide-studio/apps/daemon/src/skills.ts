/**
 * Prompt Composer + skill staging (plan §9.1–§9.3). No system-prompt flag —
 * everything is composed into the **user message** so it works identically under
 * BOTH codex and Copilot regardless of each CLI's native skill support:
 *
 *   # Instructions (read first)   ← app contract + McKinsey-consultant persona
 *   ## Skills                     ← the selected, staged skill bodies (verbatim)
 *   --- # Conversation so far     ← the rendered transcript (turn-taking preserved)
 *   # User request                ← the latest user turn the agent must answer next
 *
 * For Slice 2 (issue #4) the composer stages the `slide-brainstorm` +
 * `slide-consultant` bodies and renders the full conversation transcript so the
 * agent resumes the brainstorm in context and keeps asking ONE question at a
 * time. Skill bodies are read from the vendored `skills/` tree (§9.1).
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * The McKinsey-grade slide-consultant persona + the app contract. This is the
 * `# Instructions (read first)` body. The turn-taking rule (§9.3) and the live
 * Brief contract (so the UI can render audience/goal/arc/messages) live here.
 */
export const PERSONA = [
  'You are a McKinsey-grade slide consultant helping a non-technical Micron',
  'colleague design a professional presentation. You are running inside Slide',
  'Studio, a guided app — the user cannot see a terminal, only a chat and a live',
  'Brief panel.',
  '',
  'Rules:',
  '- Ask exactly ONE question at a time, then stop and wait for the reply. Never',
  '  batch questions or answer on the user\'s behalf.',
  '- Reason about audience, goal, narrative arc, and key messages before',
  '  proposing structure. Do not invent data — use only what the user provides.',
  '- Run the slide-brainstorm discovery flow below: audience → goal → must-include',
  '  → tone, then propose a narrative arc for approval (Gate 1).',
  '',
  '## Intake questionnaire (FIRST turn only)',
  '',
  'On your VERY FIRST turn, do NOT ask a single question in prose. Instead output',
  'ONLY a short one-line intro and a fenced ```questionnaire block of 4–6 COMMON',
  'framing questions, tailored to THIS deck topic, and NOTHING else. The Brief',
  'panel renders this as an interactive form the user fills in and submits in one',
  'click. Write the questions + options yourself, contextual to what the user',
  'asked for. Use this exact JSON shape:',
  '',
  '```questionnaire',
  '{ "intro": "A few quick questions to frame your deck:",',
  '  "questions": [',
  '    { "id": "audience", "label": "Who\'s the audience?", "type": "single",',
  '      "options": ["...", "...", "..."], "allowOther": true },',
  '    { "id": "goal", "label": "What should they do after?", "type": "single",',
  '      "options": ["..."], "allowOther": true },',
  '    { "id": "length", "label": "How long?", "type": "single", "options": ["~5 slides","~10","~15"] },',
  '    { "id": "tone", "label": "Tone?", "type": "single", "options": ["...", "...", "..."] },',
  '    { "id": "must", "label": "Must include", "type": "multi", "options": ["...", "..."] }',
  '  ] }',
  '```',
  '',
  'Aim for 4–6 questions, mostly single-select with ONE multi-select, and set',
  '`allowOther: true` on most. Do not ask anything else on this turn — no prose',
  'questions, no brief block.',
  '',
  'AFTER the user submits their answers, do NOT emit another questionnaire. Switch',
  'to the normal flow: ask sharper, specific follow-ups ONE at a time',
  'conversationally (the rules above), then propose the narrative arc for Gate 1.',
  '',
  '## Recorded Discussion brief (later turns)',
  '',
  'On every turn AFTER the questionnaire is answered, emit the current Recorded',
  'Discussion as a single fenced block so the app can render the live Brief panel.',
  'Use exactly this shape and update it as you learn more (omit unknown fields):',
  '',
  '```brief',
  '{ "audience": "...", "goal": "...", "narrativeArc": ["...", "..."], "keyMessages": ["...", "..."] }',
  '```',
].join('\n');

/** A staged skill: its id and the verbatim body injected into the prompt. */
export type StagedSkill = {
  id: string;
  body: string;
};

/** Resolve the vendored skills root (slide-studio/skills). */
export function skillsRoot(): string {
  return join(__dirname, '..', '..', '..', 'skills');
}

/**
 * Load the verbatim SKILL.md body for one vendored skill, or null if the skill
 * is not vendored. The body is staged into the composed prompt (§9.2) so it
 * works under both CLIs even without native skill support.
 */
export function loadSkillBody(id: string, root: string = skillsRoot()): string | null {
  const file = join(root, id, 'SKILL.md');
  if (!existsSync(file)) return null;
  try {
    return readFileSync(file, 'utf8').trim();
  } catch {
    return null;
  }
}

/** Load multiple skill bodies in order, dropping any that aren't vendored. */
export function stageSkills(ids: string[], root: string = skillsRoot()): StagedSkill[] {
  const staged: StagedSkill[] = [];
  for (const id of ids) {
    const body = loadSkillBody(id, root);
    if (body) staged.push({ id, body });
  }
  return staged;
}

/** Which skills Slice 2 (the brainstorm + Gate 1) stages into the prompt. */
export const BRAINSTORM_SKILLS = ['slide-brainstorm', 'slide-consultant'];

/**
 * Which skills Slice 5 (Gate 3 — theme + generate the Deck) stages into the
 * generation prompt. `html-slides` is the engine that produces the themed
 * single-file HTML Deck and runs its own verify gate; `micron-icons` supplies the
 * official iconography the Micron themes call for. The agent runs the existing
 * skills — we do not reimplement slide logic (§9.1, N6).
 */
export const GENERATE_SKILLS = ['html-slides', 'micron-icons'];

/**
 * The app-contract block prepended to a Deck-generation turn (Gate 3, §7.5,
 * §9.4, §12). It tells the agent to:
 *  - build the high-fi Deck from the approved theme-less Wireframe using the
 *    staged `html-slides` skill, in the chosen Theme (the slide-output styling
 *    surface — never Atlas, §11);
 *  - run the `html-slides` verify gate and only present the Deck once it passes
 *    (§12);
 *  - write the Artifact Manifest sidecar so the app renders the Deck canvas
 *    surface (§9.4).
 * The concrete theme id + entry path + manifest shape are interpolated per run.
 *
 * `formats` is the user's output choice (§12, Slice 6): the agent ALWAYS writes
 * the single-file HTML Deck (it is the source the editable PPTX is converted
 * from, and the html-slides verify gate runs on it), so the only thing the format
 * choice changes for the agent is the closing note about what the app will hand
 * the user. The actual PPTX build is done deterministically by the daemon from
 * this HTML via the `html-to-pptx` layered converter — the agent does NOT build
 * the PPTX itself.
 */
export function generatePersona(
  theme: string,
  entry: string,
  formats: readonly ('html' | 'pptx')[] = ['html'],
): string {
  const wantsPptx = formats.includes('pptx');
  const wantsHtml = formats.includes('html') || !wantsPptx;
  const formatNote = wantsPptx
    ? wantsHtml
      ? 'The user chose BOTH formats: the app will deliver this HTML Deck and an editable PowerPoint (.pptx) built from it.'
      : 'The user chose PPTX: the app will convert this HTML Deck into an editable PowerPoint (.pptx). You still write the HTML — it is the source the PPTX is built from.'
    : 'The user chose HTML: the app will deliver this single-file HTML Deck.';
  return [
    'You are a McKinsey-grade slide consultant generating the FINAL, high-fidelity',
    'Deck for a non-technical Micron colleague inside Slide Studio. The narrative',
    'arc and the low-fi, theme-less Wireframe are already approved — now produce the',
    'themed Deck.',
    '',
    'Rules:',
    `- Use the staged \`html-slides\` skill to build a single-file HTML Deck in the`,
    `  **${theme}** theme. The theme is the slide-output styling surface — follow the`,
    `  theme's design.md exactly. Never style slides with the app's Atlas shell.`,
    `- Write the Deck to \`${entry}\` in the current working directory.`,
    '- The Wireframe stays theme-less; the theme applies ONLY here, at generation.',
    `- ${formatNote}`,
    '- Do NOT generate the .pptx yourself — the app builds it deterministically from',
    '  your HTML Deck using its layered html-to-pptx converter (real, editable text',
    '  boxes). Your only output is the themed HTML Deck + its manifest.',
    `- After writing the Deck, run the html-slides verify gate`,
    `  (\`scripts/verify.py ${entry} --theme ${theme}\`). It checks brand palette,`,
    '  contrast, overflow, and fixed-stage screenshots. Fix anything it flags and',
    '  re-run until it passes — only present the Deck as done once the gate is green.',
    `- Write the Artifact Manifest sidecar \`${entry}.manifest.json\` so the app`,
    '  renders the Deck canvas surface, using exactly this shape:',
    '',
    '```json',
    `{ "kind": "deck", "format": "html", "entry": "${entry}", "slides": <count>, "theme": "${theme}" }`,
    '```',
  ].join('\n');
}

export type TranscriptTurn = {
  role: 'user' | 'assistant';
  text: string;
};

export type ComposeInput = {
  /** The latest user turn the agent must answer next. */
  userRequest: string;
  /**
   * The full conversation so far (oldest → newest), EXCLUDING the latest user
   * turn passed as `userRequest`. Rendered as `# Conversation so far` so the
   * agent resumes in context and keeps the one-question-at-a-time rhythm.
   */
  transcript?: TranscriptTurn[];
  /** Selected skill bodies to inject verbatim (e.g. from `stageSkills`). */
  skillBodies?: StagedSkill[];
  /** Override the persona (tests). Defaults to the consultant persona. */
  persona?: string;
};

/** Render a transcript as labelled turns the agent can read back. */
function renderTranscript(turns: TranscriptTurn[]): string {
  return turns
    .filter((t) => t.text.trim().length > 0)
    .map((t) => `${t.role === 'user' ? 'User' : 'Consultant'}: ${t.text.trim()}`)
    .join('\n\n');
}

/**
 * Compose the single user message sent to the agent. Structure (top → bottom):
 *
 *   # Instructions (read first)   persona + app contract
 *   ## Skills                     selected skill bodies (verbatim, separated)
 *   --- # Conversation so far     prior transcript (if any)
 *   # User request                the latest user turn
 *
 * This is the contract the Prompt Composer unit test asserts against.
 */
export function composePrompt(input: ComposeInput): string {
  const persona = (input.persona ?? PERSONA).trim();
  const skills = (input.skillBodies ?? []).filter((s) => s.body.trim().length > 0);
  const transcript = (input.transcript ?? []).filter((t) => t.text.trim().length > 0);

  const sections: string[] = ['# Instructions (read first)', '', persona];

  if (skills.length) {
    const blocks = skills
      .map((s) => `### Skill: ${s.id}\n\n${s.body.trim()}`)
      .join('\n\n---\n\n');
    sections.push('', '## Skills', '', blocks);
  }

  if (transcript.length) {
    sections.push('', '--- ', '# Conversation so far', '', renderTranscript(transcript));
  }

  sections.push('', '--- ', '# User request', '', input.userRequest.trim());

  return sections.join('\n').trim();
}

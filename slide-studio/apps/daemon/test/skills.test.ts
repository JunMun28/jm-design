/**
 * Prompt Composer suite (issue #4 acceptance criterion):
 *   "Unit tests: Prompt Composer (composed prompt contains the persona +
 *    selected skill bodies + transcript in the right structure)."
 *
 * The composer assembles a single user message — no system-prompt flag — so it
 * works under both codex and Copilot (§9.2). These tests assert the composed
 * prompt contains the persona, the selected skill bodies, and the rendered
 * transcript, in the right top-to-bottom structure.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  BRAINSTORM_SKILLS,
  GENERATE_SKILLS,
  PERSONA,
  composePrompt,
  generatePersona,
  loadSkillBody,
  stageSkills,
  type StagedSkill,
  type TranscriptTurn,
} from '../src/skills.ts';

const SKILL_A: StagedSkill = { id: 'slide-brainstorm', body: '# Slide Brainstorm\nAsk one question at a time. AUDIENCE_QUESTION_MARKER.' };
const SKILL_B: StagedSkill = { id: 'slide-consultant', body: '# Slide Consultant\nAction titles. PYRAMID_PRINCIPLE_MARKER.' };

const TRANSCRIPT: TranscriptTurn[] = [
  { role: 'user', text: 'I need a Q3 yield deck.' },
  { role: 'assistant', text: 'Who is the audience for this deck?' },
  { role: 'user', text: 'Ops leadership.' },
];

test('composed prompt contains the persona, selected skill bodies, and transcript', () => {
  const prompt = composePrompt({
    userRequest: 'The goal is to win budget approval.',
    transcript: TRANSCRIPT,
    skillBodies: [SKILL_A, SKILL_B],
  });

  // Persona present (a distinctive line from the consultant persona).
  assert.ok(PERSONA.includes('McKinsey-grade slide consultant'));
  assert.ok(prompt.includes('McKinsey-grade slide consultant'), 'persona missing');
  assert.ok(prompt.includes('ONE question at a time'), 'turn-taking rule missing');

  // BOTH selected skill bodies present, verbatim, each labelled by id.
  assert.ok(prompt.includes('### Skill: slide-brainstorm'), 'brainstorm skill header missing');
  assert.ok(prompt.includes('AUDIENCE_QUESTION_MARKER'), 'brainstorm skill body missing');
  assert.ok(prompt.includes('### Skill: slide-consultant'), 'consultant skill header missing');
  assert.ok(prompt.includes('PYRAMID_PRINCIPLE_MARKER'), 'consultant skill body missing');

  // Transcript present: every prior turn, labelled, in order.
  assert.ok(prompt.includes('User: I need a Q3 yield deck.'), 'transcript user turn 1 missing');
  assert.ok(prompt.includes('Consultant: Who is the audience for this deck?'), 'transcript assistant turn missing');
  assert.ok(prompt.includes('User: Ops leadership.'), 'transcript user turn 2 missing');

  // Latest user request present.
  assert.ok(prompt.includes('The goal is to win budget approval.'), 'user request missing');
});

test('composed prompt has the four sections in the right order', () => {
  const prompt = composePrompt({
    userRequest: 'LATEST_REQUEST',
    transcript: TRANSCRIPT,
    skillBodies: [SKILL_A, SKILL_B],
  });

  const iInstructions = prompt.indexOf('# Instructions (read first)');
  const iSkills = prompt.indexOf('## Skills');
  const iTranscript = prompt.indexOf('# Conversation so far');
  const iRequest = prompt.indexOf('# User request');

  // Every section exists...
  assert.ok(iInstructions !== -1, 'instructions header missing');
  assert.ok(iSkills !== -1, 'skills header missing');
  assert.ok(iTranscript !== -1, 'conversation header missing');
  assert.ok(iRequest !== -1, 'user request header missing');

  // ...in this exact top-to-bottom order: Instructions → Skills → Transcript → Request.
  assert.ok(iInstructions < iSkills, 'instructions must precede skills');
  assert.ok(iSkills < iTranscript, 'skills must precede transcript');
  assert.ok(iTranscript < iRequest, 'transcript must precede user request');

  // The selected skill bodies sit between Skills and the transcript.
  const skillMarker = prompt.indexOf('AUDIENCE_QUESTION_MARKER');
  assert.ok(skillMarker > iSkills && skillMarker < iTranscript, 'skill body not staged in the Skills section');

  // The latest request is last.
  assert.ok(prompt.indexOf('LATEST_REQUEST') > iRequest, 'user request body not under its header');
});

test('skills are separated so two staged bodies stay distinct', () => {
  const prompt = composePrompt({
    userRequest: 'go',
    skillBodies: [SKILL_A, SKILL_B],
  });
  assert.ok(prompt.includes('\n---\n'), 'skill bodies must be separated by a rule');
  assert.ok(prompt.indexOf('### Skill: slide-brainstorm') < prompt.indexOf('### Skill: slide-consultant'));
});

test('transcript drops empty turns and renders nothing when absent', () => {
  const withEmpty = composePrompt({
    userRequest: 'go',
    transcript: [
      { role: 'user', text: '   ' },
      { role: 'assistant', text: 'Real question?' },
    ],
  });
  assert.ok(!withEmpty.includes('User:  '), 'empty user turn leaked into transcript');
  assert.ok(withEmpty.includes('Consultant: Real question?'));

  const noTranscript = composePrompt({ userRequest: 'go' });
  assert.ok(!noTranscript.includes('# Conversation so far'), 'transcript header rendered with no turns');
});

// --- Slice 5: Gate 3 generation persona + skills ---------------------------

test('generatePersona names the chosen theme, the deck entry, and the manifest contract', () => {
  const persona = generatePersona('micron-dark', 'deck.html');
  // The chosen theme is the slide-output styling surface (§11).
  assert.ok(persona.includes('micron-dark'), 'persona names the theme');
  assert.ok(persona.includes('deck.html'), 'persona names the deck entry');
  // It instructs running the html-slides verify gate before presenting done (§12).
  assert.ok(/verify/i.test(persona), 'persona requires the verify gate');
  // It requires writing the Deck Artifact Manifest sidecar (kind: deck) (§9.4).
  assert.ok(persona.includes('deck.html.manifest.json'), 'persona requires the manifest sidecar');
  assert.ok(persona.includes('"kind": "deck"'), 'manifest is a deck manifest');
  assert.ok(persona.includes('"theme": "micron-dark"'), 'manifest carries the theme');
});

test('the wireframe stays theme-less — the persona applies the theme ONLY at generation (AC3)', () => {
  const persona = generatePersona('aurora-glass', 'deck.html');
  assert.ok(/theme-less/i.test(persona), 'persona states the wireframe is theme-less');
  assert.ok(/theme applies ONLY here|ONLY here, at generation/i.test(persona), 'persona scopes the theme to generation');
});

// --- Slice 6 (issue #13): format-aware persona -----------------------------

test('generatePersona always tells the agent to write the HTML Deck (PPTX derives from it)', () => {
  // Even for a PPTX-only choice, the agent writes the HTML — it is the source the
  // editable PPTX is converted from, and the app builds the .pptx itself.
  const persona = generatePersona('micron-dark', 'deck.html', ['pptx']);
  assert.ok(persona.includes('deck.html'), 'persona still names the HTML deck entry');
  assert.ok(/editable PowerPoint|\.pptx/i.test(persona), 'persona mentions the editable PPTX delivery');
  assert.ok(/Do NOT generate the \.pptx yourself/i.test(persona), 'agent must not build the PPTX itself');
});

test('generatePersona reflects the BOTH-formats choice', () => {
  const persona = generatePersona('micron-dark', 'deck.html', ['html', 'pptx']);
  assert.ok(/BOTH formats/i.test(persona), 'persona notes both HTML and PPTX are delivered');
});

test('generatePersona defaults to HTML-only delivery when no formats given', () => {
  const persona = generatePersona('micron-dark', 'deck.html');
  assert.ok(/chose HTML/i.test(persona), 'default delivery is the single-file HTML deck');
});

test('a generation prompt stages the html-slides engine and the chosen theme', () => {
  const staged = stageSkills(GENERATE_SKILLS);
  const prompt = composePrompt({
    userRequest: 'Generate the deck in the micron-dark theme.',
    persona: generatePersona('micron-dark', 'deck.html'),
    skillBodies: staged,
  });
  // The html-slides engine skill is staged (the agent runs it; we don't reimplement).
  if (loadSkillBody('html-slides')) {
    assert.ok(prompt.includes('### Skill: html-slides'), 'html-slides engine should be staged');
  }
  // The theme + the verify instruction ride the prompt.
  assert.ok(prompt.includes('micron-dark'));
  assert.ok(/verify/i.test(prompt));
});

test('stageSkills loads the real vendored brainstorm + consultant bodies', () => {
  // The acceptance criterion is about the *selected* skill bodies; prove the
  // staging reads the real vendored SKILL.md files (slice 2 wiring), skipping
  // gracefully if a skill is not vendored.
  const staged = stageSkills(BRAINSTORM_SKILLS);
  const ids = staged.map((s) => s.id);
  // slide-consultant is small + always vendored; assert it is staged with a body.
  const consultant = staged.find((s) => s.id === 'slide-consultant');
  if (loadSkillBody('slide-consultant')) {
    assert.ok(consultant, 'slide-consultant should be staged when vendored');
    assert.ok(consultant!.body.length > 0, 'consultant body should be non-empty');
    // A composed prompt with the real bodies still carries the persona + transcript.
    const prompt = composePrompt({
      userRequest: 'go',
      transcript: [{ role: 'user', text: 'hi' }],
      skillBodies: staged,
    });
    assert.ok(prompt.includes('### Skill: slide-consultant'));
    assert.ok(prompt.includes('McKinsey-grade slide consultant'));
    assert.ok(prompt.includes('User: hi'));
  }
  assert.ok(Array.isArray(ids));
});

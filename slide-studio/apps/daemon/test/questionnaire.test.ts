/**
 * Intake questionnaire suite (Brief-panel intake): on the FIRST brainstorm turn
 * the agent emits a ```questionnaire … ``` JSON block plus a one-line intro and
 * NOTHING else. The daemon parses it forgivingly into a structured Questionnaire
 * (for the interactive Brief-panel form) and STRIPS the block from the assistant
 * text so the chat shows only the intro. Mirrors the brief parser tests.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createQuestionnaireStripper,
  extractQuestionnaire,
  normalizeQuestionnaire,
  stripQuestionnaire,
} from '../src/questionnaire.ts';

/**
 * Feed a text in N-char chunks through the streaming stripper; return what the
 * chat sees, trimmed the way the chat's `display()` transform trims streamed text
 * before rendering (so the assertion is about content, not incidental whitespace
 * left where the block was excised).
 */
function streamThrough(text: string, chunkSize: number): string {
  const s = createQuestionnaireStripper();
  let out = '';
  for (let i = 0; i < text.length; i += chunkSize) {
    out += s.push(text.slice(i, i + chunkSize));
  }
  out += s.flush();
  return out.replace(/\n{3,}/g, '\n\n').trim();
}

const FULL_BLOCK = [
  'A few quick questions to frame your deck:',
  '',
  '```questionnaire',
  JSON.stringify({
    intro: 'A few quick questions to frame your deck:',
    questions: [
      {
        id: 'audience',
        label: "Who's the audience?",
        type: 'single',
        options: ['Ops leadership', 'Cross-functional team', 'Site / senior leadership', 'Test engineers'],
        allowOther: true,
      },
      { id: 'length', label: 'How long?', type: 'single', options: ['~5 slides', '~10', '~15'] },
      { id: 'must', label: 'Must include', type: 'multi', options: ['Key metrics', 'Next steps'] },
    ],
  }),
  '```',
].join('\n');

test('extracts a full questionnaire block from streamed assistant text', () => {
  const q = extractQuestionnaire(FULL_BLOCK);
  assert.ok(q, 'questionnaire should be extracted');
  assert.equal(q!.intro, 'A few quick questions to frame your deck:');
  assert.equal(q!.questions.length, 3);

  const audience = q!.questions[0];
  assert.equal(audience.id, 'audience');
  assert.equal(audience.label, "Who's the audience?");
  assert.equal(audience.type, 'single');
  assert.deepEqual(audience.options, [
    'Ops leadership',
    'Cross-functional team',
    'Site / senior leadership',
    'Test engineers',
  ]);
  assert.equal(audience.allowOther, true);

  const must = q!.questions[2];
  assert.equal(must.type, 'multi');
  assert.equal(must.allowOther, undefined, 'allowOther defaults to absent, not false');
});

test('stripQuestionnaire removes the block, leaving only the one-line intro', () => {
  const stripped = stripQuestionnaire(FULL_BLOCK);
  assert.equal(stripped, 'A few quick questions to frame your deck:');
  assert.ok(!/```questionnaire/.test(stripped), 'the fenced block must be gone');
});

test('stripQuestionnaire preserves surrounding prose and collapses blank lines', () => {
  const text = [
    'Here we go.',
    '',
    '```questionnaire',
    '{ "intro": "x", "questions": [ { "id": "a", "label": "A?", "type": "single", "options": ["1"] } ] }',
    '```',
    '',
    'Anything else to add?',
  ].join('\n');
  assert.equal(stripQuestionnaire(text), 'Here we go.\n\nAnything else to add?');
});

test('the LAST questionnaire block wins when a turn re-emits mid-stream', () => {
  const text = [
    '```questionnaire',
    '{ "intro": "first", "questions": [ { "id": "a", "label": "A?", "type": "single", "options": ["1"] } ] }',
    '```',
    'On reflection:',
    '```questionnaire',
    '{ "intro": "second", "questions": [ { "id": "b", "label": "B?", "type": "single", "options": ["2"] } ] }',
    '```',
  ].join('\n');
  const q = extractQuestionnaire(text);
  assert.equal(q!.intro, 'second');
  assert.equal(q!.questions[0].id, 'b');
});

test('no questionnaire block → null (caller keeps the normal brief flow)', () => {
  assert.equal(extractQuestionnaire('Just a plain framing question, asked one at a time.'), null);
});

test('a brief block is NOT mistaken for a questionnaire block', () => {
  assert.equal(extractQuestionnaire('```brief\n{ "audience": "Ops" }\n```'), null);
});

test('malformed JSON in a questionnaire block → null, never throws', () => {
  assert.equal(extractQuestionnaire('```questionnaire\n{ intro: not json,, }\n```'), null);
});

test('a block missing the intro → null', () => {
  const text = '```questionnaire\n{ "questions": [ { "id": "a", "label": "A?", "type": "single", "options": ["1"] } ] }\n```';
  assert.equal(extractQuestionnaire(text), null);
});

test('a block with no usable questions → null', () => {
  assert.equal(extractQuestionnaire('```questionnaire\n{ "intro": "x", "questions": [] }\n```'), null);
});

test('normalizeQuestionnaire drops unusable questions (missing id/label/options) but keeps valid ones', () => {
  const q = normalizeQuestionnaire({
    intro: 'frame it',
    questions: [
      { id: 'good', label: 'Good?', type: 'single', options: ['Yes', 'No', '  '] },
      { label: 'No id', type: 'single', options: ['x'] },
      { id: 'no-opts', label: 'No options', type: 'single', options: [] },
      'not an object',
      { id: 'multi-q', label: 'Multi?', type: 'multi', options: ['A', 'B'], allowOther: true },
    ],
  });
  assert.ok(q);
  assert.equal(q!.questions.length, 2);
  assert.deepEqual(
    q!.questions.map((x) => x.id),
    ['good', 'multi-q'],
  );
  // Empty/whitespace option strings are dropped.
  assert.deepEqual(q!.questions[0].options, ['Yes', 'No']);
  assert.equal(q!.questions[1].allowOther, true);
});

test('an unknown question type falls back to single-select', () => {
  const q = normalizeQuestionnaire({
    intro: 'x',
    questions: [{ id: 'a', label: 'A?', type: 'dropdown', options: ['1'] }],
  });
  assert.equal(q!.questions[0].type, 'single');
});

test('normalizeQuestionnaire returns null for non-object / empty input', () => {
  assert.equal(normalizeQuestionnaire(null), null);
  assert.equal(normalizeQuestionnaire('nope'), null);
  assert.equal(normalizeQuestionnaire({}), null);
});

// --- streaming stripper (the chat shows only the intro on the wire) --------

test('streaming stripper drops the block delivered as one delta (codex shape)', () => {
  // codex delivers the whole assistant message as a single text_delta.
  assert.equal(streamThrough(FULL_BLOCK, FULL_BLOCK.length), 'A few quick questions to frame your deck:');
});

test('streaming stripper drops the block split across many small deltas (copilot shape)', () => {
  // copilot streams the message in pieces — the fence can split across deltas.
  for (const chunk of [1, 3, 7, 16]) {
    assert.equal(
      streamThrough(FULL_BLOCK, chunk),
      'A few quick questions to frame your deck:',
      `chunk size ${chunk} must still strip the block`,
    );
  }
});

test('streaming stripper passes through prose around the block, never the fences', () => {
  const text = ['Intro line.', '```questionnaire', '{ "intro": "x", "questions": [] }', '```', 'After.'].join('\n');
  for (const chunk of [1, 2, 5, text.length]) {
    const seen = streamThrough(text, chunk);
    assert.ok(!seen.includes('```'), `chunk ${chunk}: no fence leaks`);
    assert.ok(seen.includes('Intro line.') && seen.includes('After.'), `chunk ${chunk}: prose survives`);
  }
});

test('streaming stripper is a pass-through for normal turns (no questionnaire)', () => {
  const text = 'Who is the primary audience — execs or engineers?';
  assert.equal(streamThrough(text, 4), text);
});

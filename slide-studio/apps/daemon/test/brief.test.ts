/**
 * Brief extraction suite (issue #4): the live Brief panel renders audience /
 * goal / narrative arc / key messages parsed from the agent's structured output.
 * The agent emits a ```brief … ``` JSON block; the daemon parses it forgivingly.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractBrief, isPopulated, normalizeBrief } from '../src/brief.ts';

test('extracts a full brief block from streamed assistant text', () => {
  const text = [
    'Great — here is where we are so far.',
    '',
    '```brief',
    '{ "audience": "Ops leadership", "goal": "Win Q4 budget", "narrativeArc": ["Problem", "Cost", "Ask"], "keyMessages": ["Yield is down 3pts", "Fix pays back in 2 quarters"] }',
    '```',
    '',
    'What is the single most important takeaway?',
  ].join('\n');

  const brief = extractBrief(text);
  assert.ok(brief, 'brief should be extracted');
  assert.equal(brief!.audience, 'Ops leadership');
  assert.equal(brief!.goal, 'Win Q4 budget');
  assert.deepEqual(brief!.narrativeArc, ['Problem', 'Cost', 'Ask']);
  assert.deepEqual(brief!.keyMessages, ['Yield is down 3pts', 'Fix pays back in 2 quarters']);
});

test('the LAST brief block wins when a turn refines mid-stream', () => {
  const text = [
    '```brief',
    '{ "audience": "Engineers" }',
    '```',
    'On reflection:',
    '```brief',
    '{ "audience": "Ops leadership", "goal": "Approve headcount" }',
    '```',
  ].join('\n');
  const brief = extractBrief(text);
  assert.equal(brief!.audience, 'Ops leadership');
  assert.equal(brief!.goal, 'Approve headcount');
});

test('partial brief (audience only) still extracts', () => {
  const brief = extractBrief('```brief\n{ "audience": "Ops leadership" }\n```');
  assert.ok(brief);
  assert.equal(brief!.audience, 'Ops leadership');
  assert.equal(brief!.goal, undefined);
});

test('no brief block → null (caller keeps prior brief)', () => {
  assert.equal(extractBrief('Just a plain question with no structured block.'), null);
});

test('malformed JSON in a brief block → null, never throws', () => {
  assert.equal(extractBrief('```brief\n{ audience: not json,, }\n```'), null);
});

test('empty brief block → null (nothing populated)', () => {
  assert.equal(extractBrief('```brief\n{}\n```'), null);
});

test('normalizeBrief drops unknown shapes and empty arrays/strings', () => {
  const b = normalizeBrief({ audience: '  ', goal: 'Win', narrativeArc: ['', '  '], keyMessages: ['Point'] });
  assert.equal(b.audience, undefined);
  assert.equal(b.goal, 'Win');
  assert.equal(b.narrativeArc, undefined);
  assert.deepEqual(b.keyMessages, ['Point']);
});

test('isPopulated reflects whether any field is filled', () => {
  assert.equal(isPopulated({}), false);
  assert.equal(isPopulated({ audience: 'Ops' }), true);
  assert.equal(isPopulated({ keyMessages: ['x'] }), true);
});

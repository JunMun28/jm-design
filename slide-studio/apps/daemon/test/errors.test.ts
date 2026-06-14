/**
 * Friendly-error suite (Slice 13 / issue #7, AC1): a failed or unauthenticated
 * run shows a clear, plain-language message and a recovery path — NEVER a raw CLI
 * error. Covers the spawn-error mapper, the agent-error classifier, and the
 * normalizer wiring that routes codex/copilot `error` lines through the mapper.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  friendlyFromAgentError,
  friendlyFromSpawnError,
  friendlyNotInstalled,
  FRIENDLY_DISCONNECTED,
} from '../src/errors.ts';
import { normalizeRawLines } from '../src/runtimes/events.ts';

test('spawn EACCES → friendly install message, never the raw code', () => {
  const err = Object.assign(new Error('spawn codex EACCES'), { code: 'EACCES' });
  const f = friendlyFromSpawnError(err, { runtimeName: 'codex' });
  assert.equal(f.recovery, 'install');
  assert.doesNotMatch(f.message, /EACCES/);
  assert.doesNotMatch(f.message, /spawn/);
  assert.match(f.message, /installed/i);
  // The raw text is retained for debugging but is NOT the message.
  assert.match(String(f.raw), /EACCES/);
});

test('spawn ENOENT → friendly not-found + install recovery', () => {
  const err = Object.assign(new Error('spawn copilot ENOENT'), { code: 'ENOENT' });
  const f = friendlyFromSpawnError(err, { runtimeName: 'GitHub Copilot' });
  assert.equal(f.recovery, 'install');
  assert.doesNotMatch(f.message, /ENOENT/);
  assert.match(f.message, /could not be found/i);
});

test('unauthenticated agent error → sign-in recovery, plain language', () => {
  const f = friendlyFromAgentError('Error: 401 Unauthorized — please log in', { runtimeName: 'GitHub Copilot' });
  assert.equal(f.recovery, 'signin');
  assert.doesNotMatch(f.message, /401/);
  assert.doesNotMatch(f.message, /Unauthorized/);
  assert.match(f.message, /sign in/i);
});

test('rate-limit / transient agent error → retry recovery', () => {
  const f = friendlyFromAgentError('429 rate limit exceeded, please try again later', { runtimeName: 'codex' });
  assert.equal(f.recovery, 'retry');
  assert.doesNotMatch(f.message, /429/);
});

test('unknown agent error → generic message + retry, never raw', () => {
  const f = friendlyFromAgentError('panic: nil pointer dereference at 0xdeadbeef', { runtimeName: 'codex' });
  assert.equal(f.recovery, 'retry');
  assert.doesNotMatch(f.message, /nil pointer/);
  assert.doesNotMatch(f.message, /0xdeadbeef/);
  assert.match(f.message, /problem|try sending/i);
});

test('spawn error with no code falls back to a friendly couldn’t-start line', () => {
  const f = friendlyFromSpawnError(new Error('something exploded'), { runtimeName: 'codex' });
  assert.ok(['install', 'retry'].includes(f.recovery));
  assert.doesNotMatch(f.message, /exploded/);
});

test('friendlyNotInstalled + FRIENDLY_DISCONNECTED carry recoveries', () => {
  assert.equal(friendlyNotInstalled('codex').recovery, 'install');
  assert.equal(FRIENDLY_DISCONNECTED.recovery, 'reconnect');
  assert.match(FRIENDLY_DISCONNECTED.message, /reconnect/i);
});

test('codex error line through the normalizer → friendly + recovery, raw kept', () => {
  const events = normalizeRawLines(
    'codex',
    JSON.stringify({ type: 'error', message: '401 unauthorized: token expired' }),
    { runtimeName: 'codex' },
  );
  const err = events.find((e) => e.type === 'error');
  assert.ok(err && err.type === 'error');
  assert.equal(err.recovery, 'signin');
  assert.doesNotMatch(err.message, /401/);
  assert.match(String(err.raw), /401/);
});

test('copilot error line through the normalizer → friendly + recovery', () => {
  const events = normalizeRawLines(
    'copilot',
    JSON.stringify({ type: 'error', message: 'connection reset by peer' }),
    { runtimeName: 'GitHub Copilot' },
  );
  const err = events.find((e) => e.type === 'error');
  assert.ok(err && err.type === 'error');
  assert.equal(err.recovery, 'retry');
  assert.doesNotMatch(err.message, /reset by peer/);
});

test('codex turn.failed through the normalizer → friendly, never raw', () => {
  const events = normalizeRawLines(
    'codex',
    JSON.stringify({ type: 'turn.failed', error: { message: 'internal stack trace: foo.rs:42' } }),
    { runtimeName: 'codex' },
  );
  const err = events.find((e) => e.type === 'error');
  assert.ok(err && err.type === 'error');
  assert.doesNotMatch(err.message, /stack trace/);
  assert.doesNotMatch(err.message, /foo\.rs/);
  assert.ok(err.recovery);
});

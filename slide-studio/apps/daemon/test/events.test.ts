/**
 * Event Normalizer suite (AC4): codex raw lines → normalized events, and the
 * Copilot mapping too. Asserts the §8.4 vocabulary and the documented mappings.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NORMALIZED_EVENT_TYPES, createEventNormalizer, normalizeRawLines } from '../src/runtimes/events.ts';

test('vocabulary is the locked §8.4 set in order', () => {
  assert.deepEqual(NORMALIZED_EVENT_TYPES, [
    'status',
    'thinking_delta',
    'text_delta',
    'tool_use',
    'tool_result',
    'usage',
    'error',
    'raw',
  ]);
});

test('codex: thread.started + turn.started → status', () => {
  const events = normalizeRawLines(
    'codex',
    [JSON.stringify({ type: 'thread.started' }), JSON.stringify({ type: 'turn.started' })].join('\n'),
  );
  assert.deepEqual(events, [
    { type: 'status', label: 'initializing' },
    { type: 'status', label: 'running' },
  ]);
});

test('codex: reasoning item → thinking_delta', () => {
  const events = normalizeRawLines(
    'codex',
    JSON.stringify({ type: 'item.completed', item: { type: 'reasoning', text: 'Let me think' } }),
  );
  assert.deepEqual(events, [{ type: 'thinking_delta', delta: 'Let me think' }]);
});

test('codex: agent_message → text_delta', () => {
  const events = normalizeRawLines(
    'codex',
    JSON.stringify({ type: 'item.completed', item: { type: 'agent_message', text: 'Hello there' } }),
  );
  assert.deepEqual(events, [{ type: 'text_delta', delta: 'Hello there', final: true }]);
});

test('codex: command_execution → tool_use then tool_result (with exit code)', () => {
  const events = normalizeRawLines(
    'codex',
    [
      JSON.stringify({ type: 'item.started', item: { type: 'command_execution', id: 'c1', command: 'echo hi' } }),
      JSON.stringify({
        type: 'item.completed',
        item: { type: 'command_execution', id: 'c1', command: 'echo hi', aggregated_output: 'hi\n', exit_code: 0 },
      }),
    ].join('\n'),
  );
  assert.deepEqual(events, [
    { type: 'tool_use', id: 'c1', name: 'Bash', input: { command: 'echo hi' } },
    { type: 'tool_result', toolUseId: 'c1', content: 'hi\n', isError: false },
  ]);
});

test('codex: non-zero exit → tool_result isError true', () => {
  const events = normalizeRawLines(
    'codex',
    JSON.stringify({
      type: 'item.completed',
      item: { type: 'command_execution', id: 'c2', command: 'false', aggregated_output: '', exit_code: 1 },
    }),
  );
  const result = events.find((e) => e.type === 'tool_result');
  assert.ok(result && result.type === 'tool_result' && result.isError === true);
});

test('codex: turn.completed.usage → usage', () => {
  const events = normalizeRawLines(
    'codex',
    JSON.stringify({ type: 'turn.completed', usage: { input_tokens: 10, output_tokens: 20, cached_input_tokens: 5 } }),
  );
  assert.deepEqual(events, [
    { type: 'usage', usage: { inputTokens: 10, outputTokens: 20, cachedReadTokens: 5 } },
  ]);
});

test('codex: turn.failed and error → single error event (deduped)', () => {
  // Slice 13 (AC1): the error is now friendly-mapped (never the raw line), but
  // the dedup contract holds — exactly ONE error event, and `raw` keeps the
  // original text for debugging.
  const failed = normalizeRawLines('codex', JSON.stringify({ type: 'turn.failed', error: { message: 'boom' } }));
  assert.equal(failed.length, 1);
  assert.equal(failed[0].type, 'error');
  assert.ok(failed[0].type === 'error' && failed[0].recovery, 'carries a recovery affordance');
  assert.ok(failed[0].type === 'error' && failed[0].raw === 'boom', 'raw text retained');
  assert.ok(failed[0].type === 'error' && failed[0].message !== 'boom', 'message is friendly, not raw');

  const both = normalizeRawLines(
    'codex',
    [JSON.stringify({ type: 'error', message: 'first' }), JSON.stringify({ type: 'turn.failed', error: 'second' })].join('\n'),
  );
  assert.equal(both.filter((e) => e.type === 'error').length, 1);
  assert.ok(both[0].type === 'error' && both[0].raw === 'first');
});

test('codex: benign stream_error notice does NOT surface a user-facing error', () => {
  // Codex flattens its `stream_error` notice (disconnect + retry-with-backoff)
  // into an exec-json `error` frame even on runs that recover and succeed. That
  // benign notice must NEVER become an `error` card — it is kept as `raw` only.
  for (const message of [
    'stream disconnected before completion: connection reset; retrying',
    'stream disconnected - retrying sampling request (attempt 1)',
    'app-server event stream disconnected: retrying with backoff',
  ]) {
    const events = normalizeRawLines('codex', JSON.stringify({ type: 'error', message }));
    assert.equal(
      events.filter((e) => e.type === 'error').length,
      0,
      `benign notice "${message}" must not emit an error`,
    );
    assert.ok(
      events.some((e) => e.type === 'raw' && e.line === message),
      'benign notice is retained as raw for debugging',
    );
  }
});

test('codex: a representative SUCCESSFUL exec --json stream emits NO error', () => {
  // Captured from a real `codex exec --json` run that disconnected mid-stream,
  // retried, and then completed cleanly. The chat must see a clean turn — the
  // stray retry notice must not become an error card (Bug B regression).
  const stream = [
    { type: 'thread.started', thread_id: 't-1' },
    { type: 'turn.started' },
    // benign mid-run notice codex surfaces while it retries internally:
    { type: 'error', message: 'stream disconnected before completion: retrying' },
    { type: 'item.completed', item: { id: 'i0', type: 'agent_message', text: 'Framing 1/6 …' } },
    { type: 'turn.completed', usage: { input_tokens: 10, output_tokens: 5 } },
  ]
    .map((o) => JSON.stringify(o))
    .join('\n');
  const events = normalizeRawLines('codex', stream);
  assert.equal(events.filter((e) => e.type === 'error').length, 0, 'no error on a successful run');
  assert.ok(events.some((e) => e.type === 'text_delta'), 'assistant text survives');
  assert.ok(events.some((e) => e.type === 'usage'), 'usage reported');
});

test('codex: a REAL terminal error (non-benign) still surfaces an error', () => {
  // A genuine failure (usage limit, auth, hard server error) is NOT a benign
  // retry notice and must still surface the friendly error card.
  const events = normalizeRawLines(
    'codex',
    JSON.stringify({ type: 'error', message: "You've hit your usage limit." }),
  );
  assert.equal(events.filter((e) => e.type === 'error').length, 1, 'real failure surfaces an error');
});

test('codex: turn.failed always surfaces an error even if it looks like a stream notice', () => {
  // `turn.failed` is terminal by definition — never suppressed.
  const events = normalizeRawLines(
    'codex',
    JSON.stringify({ type: 'turn.failed', error: { message: 'stream disconnected; giving up' } }),
  );
  assert.equal(events.filter((e) => e.type === 'error').length, 1);
});

test('codex: unrecognized line → raw', () => {
  const events = normalizeRawLines('codex', 'not json at all');
  assert.deepEqual(events, [{ type: 'raw', line: 'not json at all' }]);
});

test('codex: partial line is buffered until newline', () => {
  // normalizeRawLines feeds the whole block then flushes; a split JSON object
  // arriving across feeds must still parse as one line.
  const out: string[] = [];
  const n = createEventNormalizer('codex', (e) => out.push(e.type));
  n.feed('{"type":"turn.start');
  n.feed('ed"}\n');
  n.flush();
  assert.deepEqual(out, ['status']);
});

test('copilot: full happy-path mapping', () => {
  const events = normalizeRawLines(
    'copilot',
    [
      JSON.stringify({ type: 'assistant.turn_start', data: { model: 'claude-sonnet-4.6' } }),
      JSON.stringify({ type: 'assistant.reasoning_delta', data: { deltaContent: 'thinking…' } }),
      JSON.stringify({ type: 'assistant.message_delta', data: { deltaContent: 'Hi' } }),
      JSON.stringify({ type: 'tool.execution_start', data: { id: 't1', name: 'write', arguments: { path: 'a.txt' } } }),
      JSON.stringify({ type: 'tool.execution_complete', data: { id: 't1', result: 'ok', status: 'success' } }),
      JSON.stringify({ type: 'result', usage: { input_tokens: 3, output_tokens: 4 }, duration_ms: 1200 }),
    ].join('\n'),
  );
  assert.deepEqual(events, [
    { type: 'status', label: 'running', model: 'claude-sonnet-4.6' },
    { type: 'thinking_delta', delta: 'thinking…' },
    { type: 'text_delta', delta: 'Hi' },
    { type: 'tool_use', id: 't1', name: 'write', input: { path: 'a.txt' } },
    { type: 'tool_result', toolUseId: 't1', content: 'ok', isError: false },
    { type: 'usage', usage: { inputTokens: 3, outputTokens: 4 }, durationMs: 1200, stopReason: undefined },
  ]);
});

/**
 * Chat event-reducer suite — the pure run-lifecycle logic extracted from the web
 * shell's ChatComponent (apps/web/src/app/chat/chat-reducer.ts). The web app has
 * no test runner, so these regression tests run under the daemon's node:test
 * setup. The reducer imports only TYPES from the web package, which are erased by
 * --experimental-strip-types, so it runs here with no Angular dependency.
 *
 * Covers the two live bugs:
 *  - Bug A: the composer must return to idle (streaming=false) on EVERY terminal
 *    signal — status:done, status:cancelled, error, AND socket close/cancel — so
 *    the auto-started first turn never leaves the composer disabled forever.
 *  - Bug A (text loss): the `error` handler must NOT splice the pending assistant
 *    bubble; a benign error followed by text_delta must keep the streamed text.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  initialChatState,
  reduceChat,
  type ChatInput,
  type ChatState,
} from '../../web/src/app/chat/chat-reducer.ts';

/** A fresh in-flight turn: a user message + a pending (caret) assistant bubble. */
function inFlight(): ChatState {
  return {
    turns: [
      { role: 'user', text: 'Make me a deck about Q3 results' },
      { role: 'assistant', text: '', pending: true },
    ],
    streaming: true,
    error: null,
  };
}

/** Run a sequence of inputs through the reducer, returning the final state. */
function run(start: ChatState, inputs: ChatInput[]): { state: ChatState; effects: ReturnType<typeof reduceChat>['effects'][] } {
  let state = start;
  const effects: ReturnType<typeof reduceChat>['effects'][] = [];
  for (const input of inputs) {
    const r = reduceChat(state, input);
    state = r.next;
    effects.push(r.effects);
  }
  return { state, effects };
}

test('a normal successful turn ends idle with the assistant text intact', () => {
  // The exact frame order captured from a real run, including the stray (now
  // benign-classified upstream, but harmless here) error mid-run:
  //   status:running, error, text_delta, usage, brief, status:done
  const { state, effects } = run(inFlight(), [
    { type: 'status', label: 'running' },
    { type: 'error', message: 'Something hiccuped but recovered', recovery: 'retry' },
    { type: 'text_delta', delta: 'Framing 1/6 — who is the audience?' },
    { type: 'usage', usage: { inputTokens: 10, outputTokens: 5 } },
    { type: 'brief', brief: { audience: 'Execs' } } as ChatInput,
    { type: 'status', label: 'done' },
  ]);

  assert.equal(state.streaming, false, 'composer returns to idle after done');
  const assistant = state.turns.find((t) => t.role === 'assistant');
  assert.ok(assistant, 'the assistant bubble was NOT spliced away');
  assert.equal(assistant!.text, 'Framing 1/6 — who is the audience?', 'streamed text survived the error frame');
  assert.equal(assistant!.pending, false, 'caret cleared on done');
  assert.ok(effects.some((e) => e.brief), 'brief side-effect fired');
  assert.ok(effects.some((e) => e.turnComplete), 'turnComplete fired on the clean done');
});

test('text_delta that arrives AFTER an error still lands on the bubble', () => {
  const { state } = run(inFlight(), [
    { type: 'error', message: 'benign', recovery: 'retry' },
    { type: 'text_delta', delta: 'still here' },
  ]);
  const assistant = state.turns.find((t) => t.role === 'assistant');
  assert.equal(assistant!.text, 'still here', 'no text lost when error precedes text_delta');
});

test('a REAL terminal error ends idle and surfaces the friendly card', () => {
  const { state } = run(inFlight(), [
    { type: 'status', label: 'running' },
    { type: 'error', message: 'You need to sign in again', recovery: 'signin', raw: '401' },
  ]);
  assert.equal(state.streaming, false, 'composer returns to idle on error');
  assert.ok(state.error, 'the error card is surfaced');
  assert.equal(state.error!.message, 'You need to sign in again');
  assert.equal(state.error!.recovery, 'signin');
});

test('error with no recovery defaults to retry', () => {
  const { state } = run(inFlight(), [{ type: 'error', message: 'oops' } as ChatInput]);
  assert.equal(state.error!.recovery, 'retry');
});

test('status:cancelled ends idle (queue survives daemon-side)', () => {
  const { state } = run(inFlight(), [{ type: 'status', label: 'cancelled' }]);
  assert.equal(state.streaming, false);
  assert.equal(state.turns.find((t) => t.role === 'assistant')!.pending, false);
});

test('a socket close while streaming returns the composer to idle (Bug A)', () => {
  // Even if status:done never arrives (the failure mode the live bug exhibited),
  // a socket-close guarantees the composer re-enables.
  const { state } = run(inFlight(), [
    { type: 'status', label: 'running' },
    { type: 'text_delta', delta: 'partial' },
    { type: 'socket-close' },
  ]);
  assert.equal(state.streaming, false, 'socket close resets streaming');
  assert.equal(state.turns.find((t) => t.role === 'assistant')!.text, 'partial', 'partial text retained');
});

test('a local run-cancel returns the composer to idle immediately', () => {
  const { state } = run(inFlight(), [{ type: 'run-cancelled' }]);
  assert.equal(state.streaming, false);
});

test('socket-close while ALREADY idle is a no-op (no spurious churn)', () => {
  const idle = initialChatState([{ role: 'user', text: 'hi' }]);
  const r = reduceChat(idle, { type: 'socket-close' });
  assert.equal(r.next, idle, 'same reference back — nothing changed');
  assert.equal(r.next.streaming, false);
});

test('non-terminal status (running / initializing) keeps streaming', () => {
  let { state } = run(inFlight(), [{ type: 'status', label: 'initializing' }]);
  assert.equal(state.streaming, true);
  ({ state } = run(state, [{ type: 'status', label: 'running' }]));
  assert.equal(state.streaming, true);
});

test('verify and pptx frames become their OWN status rows (not merged into the bubble) and relay the verify effect', () => {
  const { state, effects } = run(inFlight(), [
    { type: 'text_delta', delta: 'Deck generated.', final: true } as ChatInput,
    { type: 'verify', passed: true, summary: 'All slides pass the gate.' },
    { type: 'pptx', ok: true, summary: 'Editable PowerPoint ready.' } as ChatInput,
  ]);
  // The message bubble holds ONLY the agent text — status lines live on their own rows.
  const assistant = state.turns.find((t) => t.role === 'assistant')!;
  assert.equal(assistant.text, 'Deck generated.', 'the bubble is not polluted with status text');
  const statusRows = state.turns.filter((t) => t.role === 'status');
  assert.equal(statusRows.length, 2, 'one status row each for verify + pptx');
  assert.deepEqual(statusRows.map((r) => r.text), ['All slides pass the gate.', 'Editable PowerPoint ready.']);
  assert.deepEqual(statusRows.map((r) => r.tone), ['ok', 'ok']);
  assert.ok(effects.some((e) => e.verify?.passed === true), 'verify outcome relayed');
});

test('each COMPLETE agent message gets its OWN bubble (the merge bug)', () => {
  // codex narrates → runs a (hidden) shell step → narrates again. The two
  // messages must NOT concatenate into one wall of text.
  const { state } = run(inFlight(), [
    { type: 'text_delta', delta: "First, I'll set up the cover.", final: true } as ChatInput,
    { type: 'tool_use', id: 'c1', name: 'Bash', input: {} } as ChatInput,
    { type: 'tool_result', toolUseId: 'c1', content: '', isError: false } as ChatInput,
    { type: 'text_delta', delta: 'Done — the cover is ready.', final: true } as ChatInput,
    { type: 'status', label: 'done' },
  ]);
  const messages = state.turns.filter((t) => t.role === 'assistant').map((t) => t.text);
  assert.deepEqual(messages, ["First, I'll set up the cover.", 'Done — the cover is ready.']);
  // The hidden Bash step adds NO tool chip (noise-filtered), but still split the messages.
  assert.equal(state.turns.filter((t) => t.role === 'tool').length, 0, 'noisy shell tool is hidden');
});

test('a NAMED tool becomes a chip and updates on its result', () => {
  const { state } = run(inFlight(), [
    { type: 'tool_use', id: 't9', name: 'slide-brainstorm', input: {} } as ChatInput,
    { type: 'tool_result', toolUseId: 't9', content: 'ok', isError: false } as ChatInput,
  ]);
  const tools = state.turns.filter((t) => t.role === 'tool');
  assert.equal(tools.length, 1);
  assert.equal(tools[0].text, 'Slide-brainstorm');
  assert.equal(tools[0].running, false, 'result flips the chip out of the running state');
  assert.equal(tools[0].failed, false);
});

test('copilot-style token deltas (no final) accumulate into ONE bubble until a tool splits them', () => {
  const { state } = run(inFlight(), [
    { type: 'text_delta', delta: 'Hel' },
    { type: 'text_delta', delta: 'lo there' },
    { type: 'tool_use', id: 'w1', name: 'render', input: {} } as ChatInput,
    { type: 'text_delta', delta: 'next message' },
  ]);
  const messages = state.turns.filter((t) => t.role === 'assistant').map((t) => t.text);
  assert.deepEqual(messages, ['Hello there', 'next message']);
});

test('thinking_delta accumulates on the bubble', () => {
  const { state } = run(inFlight(), [
    { type: 'thinking_delta', delta: 'Let me ' },
    { type: 'thinking_delta', delta: 'consider…' },
  ]);
  assert.equal(state.turns.find((t) => t.role === 'assistant')!.thinking, 'Let me consider…');
});

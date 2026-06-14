/**
 * Run Manager suite (AC4): fake child process; cancel; inactivity watchdog —
 * no real CLI, no real timers.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { startRun } from '../src/runs.ts';
import type { SpawnFn, SpawnedChild } from '../src/runs.ts';
import { codexAgentDef } from '../src/runtimes/defs/codex.ts';
import { copilotAgentDef } from '../src/runtimes/defs/copilot.ts';
import type { NormalizedEvent } from '../src/runtimes/events.ts';

class FakeStream extends EventEmitter {
  setEncoding(): void {
    /* no-op */
  }
}

class FakeChild extends EventEmitter implements SpawnedChild {
  stdout = new FakeStream();
  stderr = new FakeStream();
  stdinWrites: string[] = [];
  stdinEnded = false;
  killed = false;
  killSignal: string | undefined;
  stdin = {
    write: (chunk: string) => {
      this.stdinWrites.push(chunk);
    },
    end: () => {
      this.stdinEnded = true;
    },
  };
  kill(signal?: string): boolean {
    this.killed = true;
    this.killSignal = signal;
    return true;
  }
  emitStdout(s: string): void {
    this.stdout.emit('data', s);
  }
  close(code: number | null): void {
    this.emit('close', code);
  }
}

/** A controllable fake timer the watchdog uses; advance() fires due callbacks. */
function makeFakeClock() {
  let nowMs = 0;
  const timers: { at: number; fn: () => void; id: number; cleared: boolean }[] = [];
  let nextId = 1;
  return {
    now: () => nowMs,
    setTimer: (fn: () => void, ms: number) => {
      const id = nextId++;
      timers.push({ at: nowMs + ms, fn, id, cleared: false });
      return id;
    },
    clearTimer: (handle: unknown) => {
      const t = timers.find((x) => x.id === handle);
      if (t) t.cleared = true;
    },
    advance: (ms: number) => {
      nowMs += ms;
      for (const t of timers) {
        if (!t.cleared && t.at <= nowMs) {
          t.cleared = true;
          t.fn();
        }
      }
    },
  };
}

function spawnReturning(child: FakeChild): SpawnFn {
  return () => child;
}

test('streams normalized text from codex stdout and writes prompt to stdin', async () => {
  const child = new FakeChild();
  const events: NormalizedEvent[] = [];
  const clock = makeFakeClock();

  const handle = startRun(
    {
      def: codexAgentDef,
      bin: '/usr/local/bin/codex',
      prompt: 'say hello and write hello.txt',
      ctx: { platform: 'linux', env: {}, cwd: '/tmp/p' },
      spawn: spawnReturning(child),
      now: clock.now,
      setTimer: clock.setTimer,
      clearTimer: clock.clearTimer,
    },
    (e) => events.push(e),
  );

  // Prompt went to stdin, never argv.
  assert.deepEqual(child.stdinWrites, ['say hello and write hello.txt']);
  assert.equal(child.stdinEnded, true);

  child.emitStdout(`${JSON.stringify({ type: 'turn.started' })}\n`);
  child.emitStdout(`${JSON.stringify({ type: 'item.completed', item: { type: 'agent_message', text: 'hello' } })}\n`);
  child.close(0);

  const result = await handle.done;
  assert.equal(result.exitCode, 0);
  assert.equal(result.cancelled, false);

  const texts = events.filter((e) => e.type === 'text_delta');
  assert.equal(texts.length, 1);
  assert.ok(texts[0].type === 'text_delta' && texts[0].delta === 'hello');
});

test('cancel kills the child and reports cancelled', async () => {
  const child = new FakeChild();
  const events: NormalizedEvent[] = [];
  const clock = makeFakeClock();

  const handle = startRun(
    {
      def: codexAgentDef,
      bin: 'codex',
      prompt: 'p',
      ctx: { platform: 'linux', env: {} },
      spawn: spawnReturning(child),
      now: clock.now,
      setTimer: clock.setTimer,
      clearTimer: clock.clearTimer,
    },
    (e) => events.push(e),
  );

  handle.cancel();
  const result = await handle.done;

  assert.equal(child.killed, true);
  assert.equal(child.killSignal, 'SIGTERM');
  assert.equal(result.cancelled, true);
  assert.ok(events.some((e) => e.type === 'status' && e.label === 'cancelled'));
});

test('inactivity watchdog kills a silent child after the ceiling', async () => {
  const child = new FakeChild();
  const events: NormalizedEvent[] = [];
  const clock = makeFakeClock();

  const handle = startRun(
    {
      def: copilotAgentDef, // 30-min ceiling
      bin: 'copilot',
      prompt: 'p',
      ctx: {},
      spawn: spawnReturning(child),
      now: clock.now,
      setTimer: clock.setTimer,
      clearTimer: clock.clearTimer,
    },
    (e) => events.push(e),
  );

  // Just under the ceiling: still alive.
  clock.advance(30 * 60 * 1000 - 1);
  assert.equal(child.killed, false);

  // Cross the 30-min ceiling with no stdout: watchdog fires.
  clock.advance(2);
  const result = await handle.done;

  assert.equal(child.killed, true);
  assert.ok(events.some((e) => e.type === 'error' && /went quiet/i.test(e.message)));
  // The watchdog error must carry a recovery affordance (Slice 13, AC1).
  assert.ok(events.some((e) => e.type === 'error' && e.recovery === 'retry'));
  assert.equal(result.cancelled, false);
});

test('activity resets the watchdog (no false kill)', async () => {
  const child = new FakeChild();
  const events: NormalizedEvent[] = [];
  const clock = makeFakeClock();

  startRun(
    {
      def: codexAgentDef, // default 10-min ceiling
      bin: 'codex',
      prompt: 'p',
      ctx: { platform: 'linux', env: {} },
      spawn: spawnReturning(child),
      now: clock.now,
      setTimer: clock.setTimer,
      clearTimer: clock.clearTimer,
    },
    (e) => events.push(e),
  );

  // 9 min, then a stdout chunk (resets), then another 9 min — total 18 min but
  // never 10 min of silence, so no watchdog kill.
  clock.advance(9 * 60 * 1000);
  child.emitStdout(`${JSON.stringify({ type: 'turn.started' })}\n`);
  clock.advance(9 * 60 * 1000);

  assert.equal(child.killed, false);
  assert.ok(!events.some((e) => e.type === 'error'));
});

/**
 * Orphan-cleanup suite (Slice 10 / issue #10, AC3: the agent child + daemon are
 * killed on exit, no orphan processes). The registry's SIGTERM→SIGKILL
 * escalation and the signal-wiring are tested with FAKES — no real processes, no
 * real signals (mirrors runs.ts's injected-spawn approach).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { ProcessRegistry, installShutdownHandlers } from '../src/process-registry.ts';
import type { SignalSource } from '../src/process-registry.ts';

/** A fake child that records the signals it received and models real death.
 *  `alive` mirrors what an OS liveness probe would report — it stays TRUE after
 *  a trapped SIGTERM (just like a real process that ignores the signal), so the
 *  registry's SIGKILL escalation is driven by aliveness, NOT by `killed` (which
 *  on a real ChildProcess only means "a signal was delivered"). */
class FakeChild extends EventEmitter {
  pid = Math.floor(Math.random() * 100000) + 1;
  killed = false;
  alive = true;
  signals: Array<NodeJS.Signals | number> = [];
  /** When true, a SIGTERM is ignored (the process refuses to die) so the
   *  registry must escalate to SIGKILL. */
  ignoreSigterm = false;

  kill(signal: NodeJS.Signals | number = 'SIGTERM'): boolean {
    this.signals.push(signal);
    this.killed = true; // a signal was delivered (matches real ChildProcess)
    if (signal === 'SIGKILL' || !this.ignoreSigterm) this.alive = false; // truly dead
    return true;
  }
}

/** Drive the registry's OS liveness probe from the FakeChild's `alive` flag so
 *  the unit suite tests the real escalation logic without real pids. */
function fakeRegistry(opts: { setTimer?: (fn: () => void, ms: number) => unknown; graceMs?: number } = {}) {
  return new ProcessRegistry({ ...opts, isAlive: (c) => (c as FakeChild).alive });
}

/** A controllable timer so the grace window is deterministic. */
function makeManualTimer() {
  let pending: (() => void) | null = null;
  return {
    setTimer: (fn: () => void) => {
      pending = fn;
      return 1;
    },
    clearTimer: () => {
      pending = null;
    },
    flush: () => {
      const fn = pending;
      pending = null;
      fn?.();
    },
    hasPending: () => pending !== null,
  };
}

test('killAll SIGTERMs every tracked child', async () => {
  const timer = makeManualTimer();
  const reg = fakeRegistry({ setTimer: timer.setTimer });
  const a = new FakeChild();
  const b = new FakeChild();
  reg.register(a);
  reg.register(b);
  assert.equal(reg.size, 2);

  const done = reg.killAll();
  assert.deepEqual(a.signals, ['SIGTERM']);
  assert.deepEqual(b.signals, ['SIGTERM']);
  timer.flush(); // run the grace timer
  await done;
});

test('a child that ignores SIGTERM is escalated to SIGKILL after the grace window', async () => {
  const timer = makeManualTimer();
  const reg = fakeRegistry({ setTimer: timer.setTimer });
  const stubborn = new FakeChild();
  stubborn.ignoreSigterm = true;
  reg.register(stubborn);

  const done = reg.killAll();
  assert.deepEqual(stubborn.signals, ['SIGTERM']); // first, the polite signal
  assert.equal(stubborn.alive, true); // it trapped SIGTERM — still running
  timer.flush(); // grace elapsed → escalate because it's still alive
  await done;
  assert.deepEqual(stubborn.signals, ['SIGTERM', 'SIGKILL']);
  assert.equal(stubborn.alive, false); // SIGKILL really ended it
});

test('a child that already exited is NOT killed again', async () => {
  const timer = makeManualTimer();
  const reg = fakeRegistry({ setTimer: timer.setTimer });
  const exited = new FakeChild();
  exited.alive = false; // already gone (the OS would no longer report this pid)
  reg.register(exited);

  const done = reg.killAll();
  assert.deepEqual(exited.signals, []); // never signalled a dead process
  timer.flush();
  await done;
});

test('register/release: a released child is no longer tracked or killed', async () => {
  const reg = fakeRegistry();
  const child = new FakeChild();
  const handle = reg.register(child);
  assert.equal(reg.size, 1);
  handle.release();
  assert.equal(reg.size, 0);
  await reg.killAll();
  assert.deepEqual(child.signals, []);
});

test('registerWithAutoRelease drops the child on its own exit (no handle leak)', () => {
  const reg = fakeRegistry();
  const child = new FakeChild();
  reg.registerWithAutoRelease(child as unknown as FakeChild & EventEmitter);
  assert.equal(reg.size, 1);
  child.emit('exit', 0, null); // child finished on its own
  assert.equal(reg.size, 0);
});

test('killAll is idempotent — a second call is a no-op', async () => {
  const timer = makeManualTimer();
  const reg = fakeRegistry({ setTimer: timer.setTimer });
  const child = new FakeChild();
  reg.register(child);
  const first = reg.killAll();
  timer.flush();
  await first;
  await reg.killAll(); // no throw, no double signal
  assert.deepEqual(child.signals, ['SIGTERM']);
});

test('killAll with no children resolves immediately (no grace timer needed)', async () => {
  const timer = makeManualTimer();
  const reg = fakeRegistry({ setTimer: timer.setTimer });
  await reg.killAll();
  assert.equal(timer.hasPending(), false);
});

/** A fake signal source the shutdown wiring listens on. */
class FakeSignals extends EventEmitter implements SignalSource {
  on(event: string, listener: (...args: unknown[]) => void): this {
    return super.on(event, listener) as this;
  }
  off(event: string, listener: (...args: unknown[]) => void): this {
    return super.off(event, listener) as this;
  }
}

test('installShutdownHandlers runs onShutdown then exits 0 on SIGTERM', async () => {
  const signals = new FakeSignals();
  let cleaned = false;
  const codes: number[] = [];
  installShutdownHandlers(
    async () => {
      cleaned = true;
    },
    { signals, exit: (c) => codes.push(c), events: ['SIGTERM'] },
  );
  signals.emit('SIGTERM');
  await new Promise((r) => setImmediate(r));
  assert.equal(cleaned, true);
  assert.deepEqual(codes, [0]);
});

test('a SECOND signal during shutdown force-exits with code 1', async () => {
  const signals = new FakeSignals();
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  const codes: number[] = [];
  installShutdownHandlers(
    async () => {
      await gate; // hold shutdown open so the 2nd signal lands mid-flight
    },
    { signals, exit: (c) => codes.push(c), events: ['SIGINT'] },
  );
  signals.emit('SIGINT'); // starts shutdown (awaits gate)
  await new Promise((r) => setImmediate(r));
  signals.emit('SIGINT'); // second signal → force exit
  await new Promise((r) => setImmediate(r));
  assert.deepEqual(codes, [1]); // forced before the first finished
  release();
  await new Promise((r) => setImmediate(r));
  assert.ok(codes.includes(0)); // the original shutdown still completes + exits 0
});

test('the disposer detaches the handlers (no dangling listeners)', () => {
  const signals = new FakeSignals();
  const dispose = installShutdownHandlers(() => {}, { signals, exit: () => {}, events: ['SIGTERM', 'SIGINT'] });
  assert.equal(signals.listenerCount('SIGTERM'), 1);
  assert.equal(signals.listenerCount('SIGINT'), 1);
  dispose();
  assert.equal(signals.listenerCount('SIGTERM'), 0);
  assert.equal(signals.listenerCount('SIGINT'), 0);
});

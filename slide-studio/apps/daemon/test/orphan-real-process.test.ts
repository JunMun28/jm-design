/**
 * Orphan-freedom, PROVEN WITH REAL OS PROCESSES (Slice 10 / issue #10, AC3:
 * "the agent child and daemon are killed on exit — no orphan processes").
 *
 * The process-registry unit suite proves the SIGTERM→SIGKILL escalation with
 * FakeChild/FakeSignals. This suite closes the adversarial gap by spawning a
 * REAL long-lived child (a `node` sleeper that stands in for the codex/Copilot
 * agent CLI — including a deliberately STUBBORN one that ignores SIGTERM), then
 * killing it through the SAME code paths the daemon uses on exit, and asserting
 * via the OS (`process.kill(pid, 0)` → ESRCH) that the pid is actually reaped.
 * No fakes here — a real pid is created and a real signal is delivered.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { ProcessRegistry } from '../src/process-registry.ts';
import { startRun } from '../src/runs.ts';
import type { RuntimeAgentDef } from '../src/runtimes/types.ts';

/** True while the OS still has a process with this pid (a real liveness probe). */
function alive(pid: number): boolean {
  try {
    process.kill(pid, 0); // signal 0 = existence check, kills nothing
    return true;
  } catch (err) {
    // ESRCH = no such process (reaped). EPERM = exists but not ours (still alive).
    return (err as NodeJS.ErrnoException).code === 'EPERM';
  }
}

/** Poll until `pid` is gone or the deadline passes. */
async function waitUntilDead(pid: number, timeoutMs = 6000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!alive(pid)) return true;
    await new Promise((r) => setTimeout(r, 50));
  }
  return !alive(pid);
}

/** A REAL agent-stand-in: a node process that sleeps ~5 min (so it would orphan
 *  if we never killed it). `stubborn` makes it ignore SIGTERM so the registry
 *  must escalate to a real SIGKILL. */
function spawnSleeper(stubborn = false) {
  const script = stubborn
    ? "process.on('SIGTERM', () => {}); setInterval(() => {}, 1e9);"
    : 'setInterval(() => {}, 1e9);';
  const child = spawn(process.execPath, ['-e', script], { stdio: 'ignore' });
  return child;
}

test('registry SIGTERMs a real child and the OS reaps its pid (no orphan)', async () => {
  const reg = new ProcessRegistry({ graceMs: 1500 });
  const child = spawnSleeper(false);
  await new Promise((r) => setTimeout(r, 100)); // let it actually start
  const pid = child.pid!;
  assert.ok(typeof pid === 'number' && pid > 0, 'child must have a real pid');
  assert.equal(alive(pid), true, 'sleeper should be alive before killAll');

  reg.registerWithAutoRelease(child as unknown as Parameters<typeof reg.registerWithAutoRelease>[0]);
  assert.equal(reg.size, 1);

  await reg.killAll(); // the exact path createDaemon().close() runs on exit
  assert.equal(await waitUntilDead(pid), true, `real pid ${pid} must be dead after killAll — no orphan`);
});

test('a real STUBBORN child (ignores SIGTERM) is escalated to a real SIGKILL', async () => {
  // graceMs short so the test is fast but still exercises the real escalation.
  const reg = new ProcessRegistry({ graceMs: 600 });
  const child = spawnSleeper(true); // traps SIGTERM → only SIGKILL ends it
  await new Promise((r) => setTimeout(r, 150));
  const pid = child.pid!;
  assert.equal(alive(pid), true);

  reg.registerWithAutoRelease(child as unknown as Parameters<typeof reg.registerWithAutoRelease>[0]);
  await reg.killAll();
  assert.equal(await waitUntilDead(pid), true, `stubborn pid ${pid} must die via the real SIGKILL escalation`);
});

/** A minimal real-spawning RuntimeAgentDef: buildArgs returns a node sleeper so
 *  startRun's REAL spawn (nodeSpawn) creates an actual agent-stand-in child. */
const SLEEPER_DEF: RuntimeAgentDef = {
  id: 'sleeper',
  name: 'Sleeper',
  bin: process.execPath,
  versionArgs: ['--version'],
  fallbackModels: [{ id: 'm', label: 'M' }],
  buildArgs: () => ['-e', 'setInterval(() => {}, 1e9);'],
  promptViaStdin: false,
  streamFormat: 'codex',
  eventParser: 'codex',
};

test('startRun registers its REAL spawned child so the daemon kills it on exit', async () => {
  const reg = new ProcessRegistry({ graceMs: 1000 });
  let spawnedPid: number | undefined;

  // Use the run manager's REAL spawn (nodeSpawn) — no injected fake — but capture
  // the pid by wrapping it so we can prove the OS process is reaped.
  const handle = startRun(
    {
      def: SLEEPER_DEF,
      bin: process.execPath,
      prompt: 'unused (promptViaStdin=false)',
      registry: reg,
      spawn: (bin, args, opts) => {
        const child = spawn(bin, args, { stdio: ['ignore', 'pipe', 'pipe'], ...opts });
        spawnedPid = child.pid;
        return child as unknown as ReturnType<NonNullable<Parameters<typeof startRun>[0]['spawn']>>;
      },
    },
    () => {},
  );

  await new Promise((r) => setTimeout(r, 150));
  assert.ok(typeof spawnedPid === 'number', 'startRun must have spawned a real child');
  assert.equal(alive(spawnedPid!), true, 'the run child should be alive mid-run');
  assert.equal(reg.size, 1, 'startRun must register the spawned child for orphan cleanup');

  // The daemon-on-exit path: killAll() terminates the in-flight agent child.
  await reg.killAll();
  assert.equal(await waitUntilDead(spawnedPid!), true, `run child pid ${spawnedPid} must be reaped on shutdown`);
  handle.cancel(); // settle the handle (no-op if already finished)
});

test('full daemon: close() reaps a real in-flight agent child AND stops listening', async () => {
  const { createDaemon } = await import('../src/server.ts');
  // Boot the REAL daemon (loopback, ephemeral port, browser open suppressed).
  const daemon = await createDaemon({ port: 0 });
  assert.ok(daemon.port > 0, 'daemon should bind a real loopback port');

  // The daemon is serving: prove /api/health answers.
  const healthUrl = `http://${daemon.host}:${daemon.port}/api/health`;
  const health = await fetch(healthUrl).then((r) => r.json());
  assert.deepEqual(health, { ok: true });

  // Start a REAL agent-stand-in run on the daemon's OWN registry, exactly the
  // path runs.ts uses for a live codex/Copilot turn — so close() must reap it.
  let agentPid: number | undefined;
  startRun(
    {
      def: SLEEPER_DEF,
      bin: process.execPath,
      prompt: 'x',
      registry: daemon.registry,
      spawn: (bin, args, opts) => {
        const child = spawn(bin, args, { stdio: ['ignore', 'pipe', 'pipe'], ...opts });
        agentPid = child.pid;
        return child as unknown as ReturnType<NonNullable<Parameters<typeof startRun>[0]['spawn']>>;
      },
    },
    () => {},
  );
  await new Promise((r) => setTimeout(r, 150));
  assert.ok(typeof agentPid === 'number' && alive(agentPid), 'a real agent child should be running');
  assert.equal(daemon.registry.size, 1, 'the daemon should be tracking the live agent child');

  // THE EXIT PATH the launcher wires to the OS signals: kill the child, close WS,
  // close HTTP. After this, no orphaned agent child and the port is free.
  await daemon.close();

  assert.equal(await waitUntilDead(agentPid), true, `agent child pid ${agentPid} must be reaped by daemon.close() — no orphan`);
  // The server must no longer answer (it stopped listening).
  let stillServing = false;
  try {
    await fetch(healthUrl, { signal: AbortSignal.timeout(700) });
    stillServing = true;
  } catch {
    stillServing = false; // connection refused / aborted — the daemon is down
  }
  assert.equal(stillServing, false, 'daemon.close() must stop the loopback server (no orphan daemon)');
});

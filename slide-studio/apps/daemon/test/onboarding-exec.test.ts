/**
 * In-app onboarding EXECUTION suite (Slice 10 / issue #10, AC1: "on a clean
 * machine with no CLI, the wizard guides a non-technical user from launch →
 * installed → signed-in").
 *
 * This is the gap the previous attempt left open: the install + sign-in steps
 * only opened an EXTERNAL browser via actionUrl — nothing was executed in-app.
 * runOnboardingStep now actually RUNS the install/login command and re-detects.
 *
 * These tests drive that with REAL child processes (a `node` stand-in for the
 * codex/Copilot CLI) plus an injected `detect`, proving the executor: streams
 * progress lines, maps a non-zero exit to a FRIENDLY message (never raw), maps a
 * spawn failure to a friendly install error, enforces a timeout, registers the
 * child for orphan cleanup, and returns the refreshed plan so the wizard
 * advances. No real codex/Copilot is required.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { runOnboardingStep, resolveStepCommand, type ExecSpawnFn } from '../src/onboarding-exec.ts';
import { ProcessRegistry } from '../src/process-registry.ts';
import type { DetectedAgent } from '../src/runtimes/types.ts';

/** An injected detect that reports a fixed agent state (the "after re-detect"
 *  world the install/sign-in produced). */
function fakeDetect(agents: DetectedAgent[]) {
  return (async () => agents) as unknown as typeof import('../src/runtimes/detection.ts').detectAgents;
}

/** A real-spawn that runs a node one-liner standing in for the runtime's
 *  install/login command, so the streaming + exit handling is exercised for
 *  real. We override the spawn so it ignores the def's bin (npm/codex) and runs
 *  our script instead — but through a REAL OS process. */
function scriptSpawn(script: string): ExecSpawnFn {
  return ((_bin, _args, opts) =>
    spawn(process.execPath, ['-e', script], { stdio: ['ignore', 'pipe', 'pipe'], ...opts }) as unknown as ReturnType<ExecSpawnFn>);
}

const READY_CODEX: DetectedAgent = {
  id: 'codex',
  name: 'Codex CLI',
  bin: 'codex',
  streamFormat: 'json-event-stream',
  models: [{ id: 'default', label: 'Default' }],
  modelsSource: 'fallback',
  available: true,
  authStatus: 'ok',
  path: '/usr/local/bin/codex',
};

const INSTALLED_NOT_SIGNED_IN: DetectedAgent = { ...READY_CODEX, authStatus: 'missing' };
const MISSING_CODEX: DetectedAgent = {
  id: 'codex',
  name: 'Codex CLI',
  bin: 'codex',
  streamFormat: 'json-event-stream',
  models: [{ id: 'default', label: 'Default' }],
  modelsSource: 'fallback',
  available: false,
};

test('install: runs a REAL command, streams progress, then re-detects → installed', async () => {
  const progress: string[] = [];
  // The stand-in "installer" prints two progress lines then exits 0.
  const script = "process.stdout.write('added 1 package\\n'); process.stdout.write('done\\n');";
  const result = await runOnboardingStep({
    runtimeId: 'codex',
    kind: 'install',
    onProgress: (p) => progress.push(`${p.stream}:${p.line}`),
    spawn: scriptSpawn(script),
    // After install, detection now finds codex installed but not yet signed in.
    detect: fakeDetect([INSTALLED_NOT_SIGNED_IN]),
  });

  assert.equal(result.ok, true);
  assert.equal(result.exitCode, 0);
  assert.deepEqual(progress, ['stdout:added 1 package', 'stdout:done']);
  // The plan reflects the new reality: installed, next step is sign-in.
  const card = result.plan.runtimes.find((r) => r.id === 'codex')!;
  assert.equal(card.installed, true);
  assert.equal(card.step, 'signin');
  // Encouraging, plain-language next step — never a CLI flag.
  assert.match(result.message, /installed/i);
});

test('sign-in: runs the login flow, streams the device line, re-detects → ready', async () => {
  const progress: string[] = [];
  // The stand-in "login" prints an "open this URL" line (the device flow) then 0.
  const script = "process.stderr.write('Open https://github.com/login/device and enter CODE-1234\\n');";
  const result = await runOnboardingStep({
    runtimeId: 'codex',
    kind: 'signin',
    onProgress: (p) => progress.push(`${p.stream}:${p.line}`),
    spawn: scriptSpawn(script),
    detect: fakeDetect([READY_CODEX]),
  });

  assert.equal(result.ok, true);
  assert.ok(progress.some((l) => l.includes('github.com/login/device')), 'the device-code line should stream to the wizard');
  const card = result.plan.runtimes.find((r) => r.id === 'codex')!;
  assert.equal(card.ready, true);
  assert.equal(result.plan.canStart, true);
  assert.match(result.message, /ready/i);
});

test('a non-zero exit is mapped to a FRIENDLY message (never the raw CLI error)', async () => {
  const script = "process.stderr.write('npm ERR! code E404\\n'); process.exit(7);";
  const result = await runOnboardingStep({
    runtimeId: 'codex',
    kind: 'install',
    spawn: scriptSpawn(script),
    detect: fakeDetect([MISSING_CODEX]), // still missing — install failed
  });
  assert.equal(result.ok, false);
  assert.equal(result.exitCode, 7);
  assert.doesNotMatch(result.message, /npm ERR!|E404|exit code/i, 'the raw npm error must not be the user-facing message');
  assert.match(result.message, /could not be installed/i);
  assert.equal(result.error?.recovery, 'install');
});

test('a spawn failure (command not found) → friendly install error, plan still returned', async () => {
  const failSpawn: ExecSpawnFn = ((_bin, _args, opts) =>
    spawn('definitely-not-a-real-binary-xyz', [], opts) as unknown as ReturnType<ExecSpawnFn>);
  const result = await runOnboardingStep({
    runtimeId: 'codex',
    kind: 'install',
    spawn: failSpawn,
    detect: fakeDetect([MISSING_CODEX]),
  });
  assert.equal(result.ok, false);
  assert.match(result.message, /could not be found|couldn't start|blocked/i);
  assert.ok(result.plan, 'the wizard still gets a refreshed plan after a spawn failure');
});

test('a hung install is timed out, killed, and reported friendly (real child reaped)', async () => {
  const reg = new ProcessRegistry({ graceMs: 300 });
  // A real child that never exits — must be killed by the timeout.
  const script = 'setInterval(() => {}, 1e9);';
  const result = await runOnboardingStep({
    runtimeId: 'codex',
    kind: 'install',
    spawn: scriptSpawn(script),
    registry: reg,
    timeoutMs: 400,
    detect: fakeDetect([MISSING_CODEX]),
  });
  assert.equal(result.ok, false);
  assert.match(result.message, /took too long/i);
  assert.equal(result.error?.recovery, 'retry');
  // Give the close/auto-release a tick, then confirm no leftover tracked child.
  await new Promise((r) => setTimeout(r, 200));
  assert.equal(reg.size, 0, 'the timed-out install child must be released — no orphan handle');
});

test('a runtime with no in-app install command falls back gracefully', async () => {
  const result = await runOnboardingStep({
    runtimeId: 'no-such-runtime',
    kind: 'install',
    spawn: scriptSpawn('process.exit(0)'),
    detect: fakeDetect([]),
  });
  assert.equal(result.ok, false);
  assert.match(result.message, /setup page/i);
});

test('resolveStepCommand: env override repoints the command (enterprise/test hook)', () => {
  const def = { bin: 'npm', args: ['install', '-g', '@openai/codex'] };
  // No override → the def's command.
  assert.deepEqual(resolveStepCommand(def, undefined, 'codex', 'install', {}), def);
  // A valid JSON-argv override wins.
  const env = { SLIDE_STUDIO_CODEX_INSTALL_CMD: '["node","-e","0"]' };
  assert.deepEqual(resolveStepCommand(def, undefined, 'codex', 'install', env), { bin: 'node', args: ['-e', '0'] });
  // A malformed override is ignored (falls back to the def).
  assert.deepEqual(resolveStepCommand(def, undefined, 'codex', 'install', { SLIDE_STUDIO_CODEX_INSTALL_CMD: 'not json' }), def);
  // The signin key is independent of the install key.
  const signin = { bin: 'codex', args: ['login'] };
  assert.deepEqual(resolveStepCommand(undefined, signin, 'codex', 'signin', {}), signin);
});

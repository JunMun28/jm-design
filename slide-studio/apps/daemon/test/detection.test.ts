/**
 * Detection suite (AC4): installed / missing / auth via an INJECTED probe — no
 * real CLI on the box.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyAuth, detectAgent } from '../src/runtimes/detection.ts';
import type { ProbeFn, ProbeResult, ResolveBinFn } from '../src/runtimes/detection.ts';
import { codexAgentDef } from '../src/runtimes/defs/codex.ts';
import { copilotAgentDef } from '../src/runtimes/defs/copilot.ts';

const found: ResolveBinFn = (bin) => `/usr/local/bin/${bin}`;
const missing: ResolveBinFn = () => null;

function probeReturning(byArgs: (args: string[]) => ProbeResult): ProbeFn {
  return async (_bin, args) => byArgs(args);
}

test('missing: bin not on PATH → unavailable', async () => {
  const result = await detectAgent(codexAgentDef, probeReturning(() => ({ exitCode: 0 })), missing, {});
  assert.equal(result.available, false);
  assert.equal(result.path, undefined);
});

test('not invocable: ENOENT spawn error on --version → unavailable', async () => {
  const probe = probeReturning((args) =>
    args.includes('--version') ? { spawnError: { code: 'ENOENT' } } : { exitCode: 0 },
  );
  const result = await detectAgent(codexAgentDef, probe, found, {});
  assert.equal(result.available, false);
});

test('installed + auth ok (codex authProbe exits 0)', async () => {
  const probe = probeReturning((args) => {
    if (args.includes('--version')) return { exitCode: 0, stdout: 'codex 1.2.3' };
    // debug models (the authProbe) succeeds
    return { exitCode: 0, stdout: JSON.stringify({ models: [{ slug: 'gpt-5' }] }) };
  });
  const result = await detectAgent(codexAgentDef, probe, found, {});
  assert.equal(result.available, true);
  assert.equal(result.path, '/usr/local/bin/codex');
  assert.equal(result.version, 'codex 1.2.3');
  assert.equal(result.authStatus, 'ok');
});

test('installed but not signed in (codex authProbe emits 401)', async () => {
  const probe = probeReturning((args) => {
    if (args.includes('--version')) return { exitCode: 0, stdout: 'codex 1.2.3' };
    return { exitCode: 1, stderr: 'Error: 401 Unauthorized — please log in' };
  });
  const result = await detectAgent(codexAgentDef, probe, found, {});
  assert.equal(result.available, true);
  assert.equal(result.authStatus, 'missing');
  assert.equal(result.authMessage, 'Sign in to Codex CLI');
});

test('copilot: token env present → auth ok (no active probe)', async () => {
  const probe = probeReturning((args) => (args.includes('--version') ? { exitCode: 0, stdout: 'copilot 0.9' } : { exitCode: 0 }));
  const result = await detectAgent(copilotAgentDef, probe, found, { GH_TOKEN: 'ghp_x' });
  assert.equal(result.available, true);
  assert.equal(result.authStatus, 'ok');
});

test('copilot: no token env → auth missing', async () => {
  const probe = probeReturning((args) => (args.includes('--version') ? { exitCode: 0, stdout: 'copilot 0.9' } : { exitCode: 0 }));
  const result = await detectAgent(copilotAgentDef, probe, found, {});
  assert.equal(result.available, true);
  assert.equal(result.authStatus, 'missing');
  assert.equal(result.authMessage, 'Sign in to GitHub Copilot CLI');
});

test('classifyAuth: text/exit-code classification', () => {
  assert.equal(classifyAuth('401 unauthorized', 1), 'missing');
  assert.equal(classifyAuth('please sign in to continue', 1), 'missing');
  assert.equal(classifyAuth('all good', 0), 'ok');
  assert.equal(classifyAuth('weird non-zero', 7), 'unknown');
});

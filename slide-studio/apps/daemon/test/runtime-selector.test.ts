/**
 * Slice 9 AC1: the runtime selector defaults to Copilot when both CLIs are
 * detected, with codex selectable as fallback. AC2 (in part): detection probes
 * `--help` and records which Copilot flag spelling the installed CLI advertises,
 * so buildArgs gates on it.
 */
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { defaultRuntimeId, RUNTIME_DEFAULT_ORDER } from '../src/runtimes/registry.ts';
import { detectAgent, probeCapabilities } from '../src/runtimes/detection.ts';
import type { ProbeFn, ProbeResult, ResolveBinFn } from '../src/runtimes/detection.ts';
import { copilotAgentDef } from '../src/runtimes/defs/copilot.ts';
import { getAgentCapabilities, resetAgentCapabilities } from '../src/runtimes/capabilities.ts';

afterEach(() => resetAgentCapabilities());

// --- AC1: runtime selector default ----------------------------------------

test('both detected → defaults to Copilot; codex is the fallback', () => {
  assert.equal(defaultRuntimeId(['copilot', 'codex']), 'copilot');
  assert.equal(defaultRuntimeId(['codex', 'copilot']), 'copilot', 'order-independent');
});

test('only codex detected → defaults to codex', () => {
  assert.equal(defaultRuntimeId(['codex']), 'codex');
});

test('only copilot detected → defaults to copilot', () => {
  assert.equal(defaultRuntimeId(['copilot']), 'copilot');
});

test('none detected → null', () => {
  assert.equal(defaultRuntimeId([]), null);
});

test('preference order is Copilot-first (production runtime), codex fallback', () => {
  assert.deepEqual([...RUNTIME_DEFAULT_ORDER], ['copilot', 'codex']);
});

// --- AC2: --help capability probing ---------------------------------------

const found: ResolveBinFn = (bin) => `/usr/local/bin/${bin}`;

function probeReturning(byArgs: (args: string[]) => ProbeResult): ProbeFn {
  return async (_bin, args) => byArgs(args);
}

test('probeCapabilities: legacy --help → records legacy spellings', async () => {
  const help =
    'Usage: copilot [options]\n  --allow-all-tools   approve all tools\n  --add-dir <dir>   add a directory\n';
  const caps = await probeCapabilities(
    copilotAgentDef,
    '/usr/local/bin/copilot',
    {},
    probeReturning(() => ({ exitCode: 0, stdout: help })),
  );
  assert.deepEqual(caps, { allowAllTools: '--allow-all-tools', addDir: '--add-dir' });
});

test('probeCapabilities: renamed --help (flag drift) → records the new spellings', async () => {
  const help =
    'Usage: copilot [options]\n  --allow-all-paths   approve all paths\n  --available-tools <t>   available tools\n';
  const caps = await probeCapabilities(
    copilotAgentDef,
    '/usr/local/bin/copilot',
    {},
    probeReturning(() => ({ exitCode: 0, stdout: help })),
  );
  assert.deepEqual(caps, { allowAllTools: '--allow-all-paths', addDir: '--available-tools' });
});

test('probeCapabilities: --help advertises neither → false (flag omitted later)', async () => {
  const caps = await probeCapabilities(
    copilotAgentDef,
    '/usr/local/bin/copilot',
    {},
    probeReturning(() => ({ exitCode: 0, stdout: 'Usage: copilot [options]\n  --version\n' })),
  );
  assert.deepEqual(caps, { allowAllTools: false, addDir: false });
});

test('probeCapabilities: --help spawn error → empty map (buildArgs uses legacy fallback)', async () => {
  const caps = await probeCapabilities(
    copilotAgentDef,
    '/usr/local/bin/copilot',
    {},
    probeReturning(() => ({ spawnError: { code: 'EACCES' } })),
  );
  assert.deepEqual(caps, {});
});

test('detectAgent: --help probe populates the copilot capability cache', async () => {
  const probe = probeReturning((args) => {
    if (args.includes('--version')) return { exitCode: 0, stdout: 'copilot 0.9' };
    if (args.includes('--help'))
      return { exitCode: 0, stdout: '  --allow-all-paths\n  --available-tools\n' };
    return { exitCode: 0 };
  });
  const result = await detectAgent(copilotAgentDef, probe, found, { GH_TOKEN: 'ghp_x' });
  assert.equal(result.available, true);
  assert.deepEqual(getAgentCapabilities('copilot'), {
    allowAllTools: '--allow-all-paths',
    addDir: '--available-tools',
  });
});

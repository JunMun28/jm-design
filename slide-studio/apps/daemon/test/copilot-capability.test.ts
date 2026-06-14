/**
 * Slice 9 AC3 (part 1): Copilot `buildArgs` flag gating by capability.
 *
 * The Copilot CLI renames flags between versions (`--allow-all-tools` →
 * `--allow-all-paths`, `--add-dir` → `--available-tools`). Detection probes
 * `--help` once and records which spelling the installed binary advertises;
 * `buildArgs` must emit exactly that spelling, fall back to the legacy one when
 * the CLI was never probed, and omit a flag the CLI advertises under no known
 * spelling. These tests drive that contract directly via the capability cache.
 */
import { test, afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { copilotAgentDef, resolveCopilotEnv } from '../src/runtimes/defs/copilot.ts';
import { setAgentCapabilities, resetAgentCapabilities } from '../src/runtimes/capabilities.ts';

beforeEach(() => resetAgentCapabilities());
afterEach(() => resetAgentCapabilities());

test('un-probed (no capability cache): falls back to legacy flag spellings', () => {
  const args = copilotAgentDef.buildArgs('PROMPT', [], ['/skills'], {});
  assert.ok(args.includes('--allow-all-tools'), 'legacy auto-approve flag');
  assert.ok(args.includes('--add-dir'), 'legacy add-dir flag');
  assert.equal(args[args.indexOf('--add-dir') + 1], '/skills');
  // Prompt still never reaches argv.
  assert.ok(!args.includes('PROMPT'));
  assert.ok(!args.includes('-p'));
});

test('probed legacy spelling: emits --allow-all-tools / --add-dir', () => {
  setAgentCapabilities('copilot', { allowAllTools: '--allow-all-tools', addDir: '--add-dir' });
  const args = copilotAgentDef.buildArgs('p', [], ['/skills', '/themes'], {});
  assert.ok(args.includes('--allow-all-tools'));
  assert.ok(!args.includes('--allow-all-paths'));
  const addDirCount = args.filter((a) => a === '--add-dir').length;
  assert.equal(addDirCount, 2, 'one --add-dir per allowed dir');
  assert.ok(!args.includes('--available-tools'));
});

test('probed renamed spelling (flag drift): emits --allow-all-paths / --available-tools', () => {
  setAgentCapabilities('copilot', { allowAllTools: '--allow-all-paths', addDir: '--available-tools' });
  const args = copilotAgentDef.buildArgs('p', [], ['/skills'], {});
  assert.ok(args.includes('--allow-all-paths'), 'follows the renamed auto-approve flag');
  assert.ok(!args.includes('--allow-all-tools'));
  assert.ok(args.includes('--available-tools'), 'follows the renamed add-dir flag');
  assert.equal(args[args.indexOf('--available-tools') + 1], '/skills');
  assert.ok(!args.includes('--add-dir'));
});

test('probed but unsupported (false): omits the flag entirely', () => {
  setAgentCapabilities('copilot', { allowAllTools: false, addDir: false });
  const args = copilotAgentDef.buildArgs('p', [], ['/skills'], {});
  assert.ok(!args.includes('--allow-all-tools'));
  assert.ok(!args.includes('--allow-all-paths'));
  assert.ok(!args.includes('--add-dir'));
  assert.ok(!args.includes('--available-tools'));
  // The non-gated baseline still holds.
  assert.deepEqual(args.slice(0, 2), ['--output-format', 'json']);
});

test('model flag is added; default model is omitted; output-format json is always present', () => {
  setAgentCapabilities('copilot', { allowAllTools: '--allow-all-tools', addDir: '--add-dir' });
  const withModel = copilotAgentDef.buildArgs('p', [], [], { model: 'gpt-5.2' });
  assert.ok(withModel.includes('--model') && withModel[withModel.indexOf('--model') + 1] === 'gpt-5.2');
  assert.ok(withModel.includes('--output-format') && withModel.includes('json'));

  const defaultModel = copilotAgentDef.buildArgs('p', [], [], { model: 'default' });
  assert.ok(!defaultModel.includes('--model'));
});

test('resolveCopilotEnv: injects the GitHub token by precedence under COPILOT_GITHUB_TOKEN', () => {
  assert.deepEqual(resolveCopilotEnv({ COPILOT_GITHUB_TOKEN: 'A', GH_TOKEN: 'B', GITHUB_TOKEN: 'C' }), {
    COPILOT_GITHUB_TOKEN: 'A',
  });
  assert.deepEqual(resolveCopilotEnv({ GH_TOKEN: 'B', GITHUB_TOKEN: 'C' }), { COPILOT_GITHUB_TOKEN: 'B' });
  assert.deepEqual(resolveCopilotEnv({ GITHUB_TOKEN: 'C' }), { COPILOT_GITHUB_TOKEN: 'C' });
  assert.deepEqual(resolveCopilotEnv({}), {}, 'no token → empty env (no run-blocking)');
});

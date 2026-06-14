/**
 * Runtime buildArgs suite (AC4): argv including the Windows sandbox switch and
 * the stdin-prompt contract (the prompt is NEVER placed in argv).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { codexAgentDef, codexNeedsDangerFullAccessSandbox } from '../src/runtimes/defs/codex.ts';
import { copilotAgentDef } from '../src/runtimes/defs/copilot.ts';

test('codex: prompt is delivered via stdin, never in argv', () => {
  assert.equal(codexAgentDef.promptViaStdin, true);
  const args = codexAgentDef.buildArgs('SECRET PROMPT BODY', [], [], {}, { cwd: '/tmp/p' });
  assert.ok(!args.includes('SECRET PROMPT BODY'), 'prompt must not appear in argv');
  assert.ok(!args.includes('-'), 'bare "-" sentinel must not be passed (codex exits 2)');
});

test('codex: non-Windows uses workspace-write sandbox with network access', () => {
  const args = codexAgentDef.buildArgs('p', [], [], {}, { platform: 'linux', env: {}, cwd: '/tmp/p' });
  assert.deepEqual(args.slice(0, 7), [
    'exec',
    '--json',
    '--skip-git-repo-check',
    '--sandbox',
    'workspace-write',
    '-c',
    'sandbox_workspace_write.network_access=true',
  ]);
  assert.ok(args.includes('-C'));
  assert.equal(args[args.indexOf('-C') + 1], '/tmp/p');
});

test('codex: Windows forces danger-full-access sandbox', () => {
  const args = codexAgentDef.buildArgs('p', [], [], {}, { platform: 'win32', env: {} });
  assert.ok(args.includes('danger-full-access'));
  assert.ok(!args.includes('workspace-write'));
});

test('codex: WSL (linux + WSL_DISTRO_NAME) also forces danger-full-access', () => {
  assert.equal(codexNeedsDangerFullAccessSandbox('linux', { WSL_DISTRO_NAME: 'Ubuntu' }), true);
  assert.equal(codexNeedsDangerFullAccessSandbox('linux', {}), false);
  assert.equal(codexNeedsDangerFullAccessSandbox('darwin', {}), false);
});

test('codex: operator override forces danger-full-access', () => {
  assert.equal(
    codexNeedsDangerFullAccessSandbox('linux', { SLIDE_STUDIO_CODEX_SANDBOX: 'danger-full-access' }),
    true,
  );
});

test('codex: model + reasoning + add-dir flags', () => {
  const args = codexAgentDef.buildArgs(
    'p',
    [],
    ['/skills', '/themes'],
    { model: 'gpt-5', reasoning: 'high' },
    { platform: 'linux', env: {}, cwd: '/tmp/p' },
  );
  assert.ok(args.includes('--model') && args[args.indexOf('--model') + 1] === 'gpt-5');
  assert.ok(args.includes('model_reasoning_effort="high"'));
  const addDirCount = args.filter((a) => a === '--add-dir').length;
  assert.equal(addDirCount, 2);
});

test('codex: default model + reasoning omit the flags', () => {
  const args = codexAgentDef.buildArgs('p', [], [], { model: 'default', reasoning: 'default' }, { platform: 'linux', env: {} });
  assert.ok(!args.includes('--model'));
  assert.ok(!args.some((a) => a.startsWith('model_reasoning_effort')));
});

test('copilot: stdin prompt, --allow-all-tools, json output, no -p', () => {
  assert.equal(copilotAgentDef.promptViaStdin, true);
  const args = copilotAgentDef.buildArgs('LONG PROMPT', [], ['/skills'], { model: 'gpt-5.2' });
  assert.ok(!args.includes('LONG PROMPT'), 'prompt must not appear in argv (Windows argv cap)');
  assert.ok(!args.includes('-p'), 'must omit -p so the prompt pipes via stdin');
  assert.ok(args.includes('--allow-all-tools'));
  assert.deepEqual(args.slice(0, 3), ['--allow-all-tools', '--output-format', 'json']);
  assert.ok(args.includes('--model') && args[args.indexOf('--model') + 1] === 'gpt-5.2');
  assert.ok(args.includes('--add-dir') && args[args.indexOf('--add-dir') + 1] === '/skills');
});

test('copilot: declares the 30-min inactivity watchdog and flag-drift probing', () => {
  assert.equal(copilotAgentDef.inactivityTimeoutMs, 30 * 60 * 1000);
  assert.equal(copilotAgentDef.capabilityFlags, true);
});

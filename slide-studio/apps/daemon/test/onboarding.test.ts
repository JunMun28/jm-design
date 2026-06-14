/**
 * Onboarding-plan suite (Slice 10 / issue #10, AC1). The first-run wizard's logic
 * is PURE — it turns the detected agents into a plain-language install→sign-in
 * plan — so it is fully testable here without a real CLI (the install + sign-in
 * copy, the Copilot-first recommendation, the never-expose-a-flag contract).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildOnboardingPlan } from '../src/onboarding.ts';
import type { DetectedAgent } from '../src/runtimes/types.ts';

function agent(partial: Partial<DetectedAgent> & Pick<DetectedAgent, 'id' | 'name'>): DetectedAgent {
  return {
    bin: partial.id,
    streamFormat: 'x',
    models: [],
    modelsSource: 'fallback',
    available: false,
    ...partial,
  };
}

const copilot = (over: Partial<DetectedAgent> = {}) =>
  agent({ id: 'copilot', name: 'GitHub Copilot CLI', ...over });
const codex = (over: Partial<DetectedAgent> = {}) => agent({ id: 'codex', name: 'Codex CLI', ...over });

test('clean machine (nothing installed) → install steps, cannot start, Copilot recommended', () => {
  const plan = buildOnboardingPlan([copilot({ available: false }), codex({ available: false })]);
  assert.equal(plan.canStart, false);
  assert.equal(plan.defaultRuntimeId, null);
  // Copilot leads and is the recommended runtime (§13 default-to-Copilot).
  assert.equal(plan.runtimes[0]!.id, 'copilot');
  assert.equal(plan.runtimes[0]!.recommended, true);
  assert.equal(plan.runtimes[1]!.recommended, false);
  for (const r of plan.runtimes) {
    assert.equal(r.step, 'install');
    assert.equal(r.ready, false);
    // AC1: both runtimes declare an in-app install command, so the wizard can run
    // the install for the user (no terminal) rather than only opening a page.
    assert.equal(r.canRunInApp, true);
  }
});

test('installed but not signed in → a sign-in step with the right provider', () => {
  const plan = buildOnboardingPlan([
    copilot({ available: true, authStatus: 'missing' }),
    codex({ available: true, authStatus: 'missing' }),
  ]);
  assert.equal(plan.canStart, false);
  const cop = plan.runtimes.find((r) => r.id === 'copilot')!;
  const cdx = plan.runtimes.find((r) => r.id === 'codex')!;
  assert.equal(cop.step, 'signin');
  assert.equal(cop.signInProvider, 'github-sso'); // Copilot = GitHub org SSO (§13)
  assert.equal(cdx.step, 'signin');
  assert.equal(cdx.signInProvider, 'openai'); // codex = OpenAI/ChatGPT (§13)
  // AC1: the sign-in step can be launched in-app (the CLI's own login flow).
  assert.equal(cop.canRunInApp, true);
  assert.equal(cdx.canRunInApp, true);
});

test('Copilot installed + signed in → can start, defaults to Copilot, ready card', () => {
  const plan = buildOnboardingPlan([
    copilot({ available: true, authStatus: 'ok' }),
    codex({ available: false }),
  ]);
  assert.equal(plan.canStart, true);
  assert.equal(plan.defaultRuntimeId, 'copilot');
  const cop = plan.runtimes.find((r) => r.id === 'copilot')!;
  assert.equal(cop.step, 'ready');
  assert.equal(cop.ready, true);
  assert.equal(cop.recommended, true);
});

test('only codex ready (no Copilot) → codex recommended + default, can start', () => {
  const plan = buildOnboardingPlan([
    copilot({ available: false }),
    codex({ available: true, authStatus: 'ok' }),
  ]);
  assert.equal(plan.canStart, true);
  assert.equal(plan.defaultRuntimeId, 'codex');
  const cdx = plan.runtimes.find((r) => r.id === 'codex')!;
  assert.equal(cdx.recommended, true);
  // Copilot still recommended? No — only the READY codex is, since no Copilot is
  // ready and codex is the only ready runtime.
  assert.equal(cdx.step, 'ready');
});

test('Copilot recommended over a ready codex once BOTH are ready (production default)', () => {
  const plan = buildOnboardingPlan([
    copilot({ available: true, authStatus: 'ok' }),
    codex({ available: true, authStatus: 'ok' }),
  ]);
  assert.equal(plan.defaultRuntimeId, 'copilot');
  assert.equal(plan.runtimes.find((r) => r.id === 'copilot')!.recommended, true);
  assert.equal(plan.runtimes.find((r) => r.id === 'codex')!.recommended, false);
});

test('unknown auth (couldn\'t verify) is treated as ready — never blocks the user', () => {
  const plan = buildOnboardingPlan([copilot({ available: true, authStatus: 'unknown' })]);
  const cop = plan.runtimes[0]!;
  assert.equal(cop.step, 'ready');
  assert.equal(cop.ready, true);
  assert.equal(plan.canStart, true);
});

test('headlines NEVER expose a raw CLI flag (non-technical contract, §13)', () => {
  const plan = buildOnboardingPlan([
    copilot({ available: false }),
    codex({ available: true, authStatus: 'missing' }),
  ]);
  for (const r of plan.runtimes) {
    // title + detail are user-facing and must be flag-free.
    assert.doesNotMatch(r.title, /--|\bexec\b|\bnpm\b|node /, `title leaked a CLI token: ${r.title}`);
    assert.doesNotMatch(r.detail, /--[a-z]/i, `detail leaked a flag: ${r.detail}`);
  }
  // The optional command hint (advanced/IT disclosure) MAY carry a command — but
  // it is a separate field, never the primary instruction.
  const cop = plan.runtimes.find((r) => r.id === 'copilot')!;
  assert.match(cop.commandHint ?? '', /npm install/);
});

test('every card carries a help/install URL for its action', () => {
  const plan = buildOnboardingPlan([copilot({ available: false }), codex({ available: true, authStatus: 'missing' })]);
  for (const r of plan.runtimes) {
    assert.ok(r.actionUrl && /^https?:\/\//.test(r.actionUrl), `missing actionUrl on ${r.id}`);
  }
});

test('summary reflects state: ready vs needs-setup', () => {
  const ready = buildOnboardingPlan([copilot({ available: true, authStatus: 'ok' })]);
  assert.match(ready.summary, /ready/i);
  const setup = buildOnboardingPlan([copilot({ available: false })]);
  assert.match(setup.summary, /set up/i);
  const none = buildOnboardingPlan([]);
  assert.match(none.summary, /no assistant/i);
});

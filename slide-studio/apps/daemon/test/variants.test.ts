import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  variantFileName, deckFileForTheme, upsertVariant, activeDeck, type ProjectRecord,
  createProject, readProject, setTheme, setGate1, setGate2, registerGeneratedDeck, projectDir, setActiveDeck,
} from '../src/projects.ts';

// helpers.ts does not exist — inline withTempStore here (mirrors register-deck.test.ts).
async function withTempStore<T>(fn: (env: NodeJS.ProcessEnv) => Promise<T>): Promise<T> {
  const dir = await mkdtemp(join(tmpdir(), 'slide-studio-test-'));
  const env = { ...process.env, SLIDE_STUDIO_DATA_DIR: dir } as NodeJS.ProcessEnv;
  try {
    return await fn(env);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

const base = (): ProjectRecord => ({
  id: 'x', title: 'X', brief: 'b', runtimeId: null, theme: null,
  stage: 'deck' as const, recordedBrief: {}, questionnaire: null,
  questionnaireAnswered: false, gate1: 'approved' as const, gate2: 'approved' as const,
  gate3: 'approved' as const, formats: ['html' as const], createdAt: 't', updatedAt: 't',
  decks: [], wireframeRev: 0, activeDeckId: null,
});

test('variantFileName slugs the theme', () => {
  assert.equal(variantFileName('micron-dark'), 'deck.micron-dark.html');
  assert.equal(variantFileName('Seventies Sunset'), 'deck.seventies-sunset.html');
});

test('deckFileForTheme reuses an existing variant file, else derives a new one', () => {
  const r = base();
  assert.equal(deckFileForTheme(r, 'playful'), 'deck.playful.html');
  const legacy = { ...base(), decks: [{ id: 'micron-dark', theme: 'micron-dark', file: 'deck.html', fromWireframeRev: 0, createdAt: 't' }] };
  assert.equal(deckFileForTheme(legacy, 'micron-dark'), 'deck.html');
  assert.equal(deckFileForTheme(legacy, 'playful'), 'deck.playful.html');
});

test('upsertVariant replaces same-theme, appends new, and sets it active', () => {
  let r = base();
  r = upsertVariant(r, { theme: 'micron-dark', file: 'deck.micron-dark.html', wireframeRev: 0, createdAt: 't1' });
  assert.equal(r.decks.length, 1);
  assert.equal(r.activeDeckId, 'micron-dark');
  r = upsertVariant(r, { theme: 'playful', file: 'deck.playful.html', wireframeRev: 0, createdAt: 't2' });
  assert.equal(r.decks.length, 2);
  assert.equal(r.activeDeckId, 'playful');
  r = upsertVariant(r, { theme: 'micron-dark', file: 'deck.micron-dark.html', wireframeRev: 1, createdAt: 't3' });
  assert.equal(r.decks.length, 2);
  assert.equal(r.decks.find((d) => d.theme === 'micron-dark')?.fromWireframeRev, 1);
  assert.equal(r.activeDeckId, 'micron-dark');
});

test('activeDeck returns the active variant or null', () => {
  assert.equal(activeDeck(base()), null);
  const r = upsertVariant(base(), { theme: 'playful', file: 'deck.playful.html', wireframeRev: 0, createdAt: 't' });
  assert.equal(activeDeck(r)?.theme, 'playful');
});

test('setActiveDeck switches the active variant; rejects unknown ids', async () => {
  await withTempStore(async (env) => {
    const p = await createProject({ brief: 'b' }, env);
    await setGate1(p.id, 'approve', env); await setGate2(p.id, 'approve', env);
    await setTheme(p.id, 'micron-dark', undefined, env);
    const { writeFile } = await import('node:fs/promises'); const { join } = await import('node:path');
    await writeFile(join(projectDir(p.id, env), 'deck.micron-dark.html'), '<html><body><section class="slide"></section></body></html>');
    await registerGeneratedDeck(p.id, 'micron-dark', env);
    await writeFile(join(projectDir(p.id, env), 'deck.playful.html'), '<html><body><section class="slide"></section></body></html>');
    await registerGeneratedDeck(p.id, 'playful', env); // active is now 'playful'

    const back = await setActiveDeck(p.id, 'micron-dark', env);
    assert.equal(back?.activeDeckId, 'micron-dark');
    const bad = await setActiveDeck(p.id, 'does-not-exist', env);
    assert.equal(bad, null); // unknown id → no change, null
    const reread = await readProject(p.id, env);
    assert.equal(reread?.activeDeckId, 'micron-dark');
  });
});

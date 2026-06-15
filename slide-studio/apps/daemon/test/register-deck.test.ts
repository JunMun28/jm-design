/**
 * registerGeneratedDeck — records a DeckVariant and writes a manifest sidecar
 * after the agent has written the deck file to disk.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createProject,
  readProject,
  setTheme,
  setGate1,
  setGate2,
  registerGeneratedDeck,
  projectDir,
  deckFileForTheme,
} from '../src/projects.ts';

// helpers.ts does not exist — inline withTempStore here.
async function withTempStore<T>(fn: (env: NodeJS.ProcessEnv) => Promise<T>): Promise<T> {
  const dir = await mkdtemp(join(tmpdir(), 'slide-studio-test-'));
  const env = { ...process.env, SLIDE_STUDIO_DATA_DIR: dir } as NodeJS.ProcessEnv;
  try {
    return await fn(env);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test('registerGeneratedDeck records the variant + writes a deck manifest sidecar', async () => {
  await withTempStore(async (env) => {
    const p = await createProject({ brief: 'deck' }, env);
    await setGate1(p.id, 'approve', env);
    await setGate2(p.id, 'approve', env);
    await setTheme(p.id, 'micron-dark', undefined, env);
    const r0 = await readProject(p.id, env);
    const file = deckFileForTheme(r0!, 'micron-dark');
    await writeFile(
      join(projectDir(p.id, env), file),
      '<!doctype html><body><section class="slide"><h1>x</h1></section></body>',
    );

    const updated = await registerGeneratedDeck(p.id, 'micron-dark', env);
    assert.equal(updated?.decks.length, 1);
    assert.equal(updated?.decks[0].theme, 'micron-dark');
    assert.equal(updated?.decks[0].file, file);
    assert.equal(updated?.activeDeckId, updated?.decks[0].id);

    const sidecar = JSON.parse(
      await readFile(join(projectDir(p.id, env), file + '.manifest.json'), 'utf8'),
    );
    assert.equal(sidecar.kind, 'deck');
    assert.equal(sidecar.theme, 'micron-dark');
    assert.equal(sidecar.entry, file);
  });
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { writeFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createProject, readProject, setTheme, setGate1, setGate2, registerGeneratedDeck, projectDir } from '../src/projects.ts';
import { buildFilesResponse } from '../src/files.ts';
// withTempStore: inline from projects.test.ts
async function withTempStore<T>(fn: (env: NodeJS.ProcessEnv) => Promise<T>): Promise<T> {
  const dir = await mkdtemp(join(tmpdir(), 'slide-studio-test-'));
  const env = { ...process.env, SLIDE_STUDIO_DATA_DIR: dir } as NodeJS.ProcessEnv;
  try {
    return await fn(env);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test('buildFilesResponse groups wireframe + deck variants (active/stale) + exports', async () => {
  await withTempStore(async (env) => {
    const p = await createProject({ brief: 'b' }, env);
    await setGate1(p.id, 'approve', env); await setGate2(p.id, 'approve', env);
    await setTheme(p.id, 'micron-dark', undefined, env);
    const dir = projectDir(p.id, env);
    await writeFile(join(dir, 'wireframe.html'), '<html><body><section class="slide-panel"></section></body></html>');
    await writeFile(join(dir, 'deck.micron-dark.html'), '<html><body><section class="slide"></section></body></html>');
    await registerGeneratedDeck(p.id, 'micron-dark', env);
    const r = await readProject(p.id, env);
    const files = await buildFilesResponse(r!, env);
    assert.ok(files.wireframe && files.wireframe.entry === 'wireframe.html');
    assert.equal(files.decks.length, 1);
    assert.equal(files.decks[0].theme, 'micron-dark');
    assert.equal(files.decks[0].active, true);
    assert.equal(files.decks[0].stale, false); // fromWireframeRev (0) === wireframeRev (0)
    assert.ok(Array.isArray(files.exports));
  });
});

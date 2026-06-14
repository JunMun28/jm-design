/**
 * Artifact watcher suite (issue #8 / Slice 3): the daemon WATCHES a Project's
 * dir and emits the resolved Artifact Manifest when a Wireframe (and its sidecar
 * manifest) lands — the mechanism that drives the live sandboxed-iframe canvas.
 * Uses a temp data dir + polling; no real CLI.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createProject, projectDir } from '../src/projects.ts';
import { watchArtifacts, closeAllArtifactWatchers, type ArtifactEvent } from '../src/artifact-watcher.ts';

// Watcher tests need NODE_ENV=test for polling (set before the watcher starts).
process.env.NODE_ENV = 'test';

const WIREFRAME_HTML = `<!doctype html><body>
  <article class="slide-panel" data-slide="01"></article>
  <article class="slide-panel" data-slide="02"></article>
</body>`;

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`timeout: ${label}`)), ms)),
  ]);
}

test('watchArtifacts emits a resolved manifest when a wireframe lands', async () => {
  const dataDir = await mkdtemp(join(tmpdir(), 'slide-studio-watch-'));
  const env = { ...process.env, SLIDE_STUDIO_DATA_DIR: dataDir } as NodeJS.ProcessEnv;
  try {
    const p = await createProject({ brief: 'deck' }, env);
    const dir = projectDir(p.id, env);

    const got = new Promise<ArtifactEvent>((resolve) => {
      const off = watchArtifacts(
        p.id,
        (evt) => {
          if (evt.manifest.kind === 'wireframe') {
            off();
            resolve(evt);
          }
        },
        env,
      );
    });

    // Write the entry + its sidecar manifest after the watcher is live.
    await new Promise((r) => setTimeout(r, 100));
    await writeFile(join(dir, 'wireframe.html'), WIREFRAME_HTML, 'utf8');
    await writeFile(
      join(dir, 'wireframe.html.manifest.json'),
      JSON.stringify({ kind: 'wireframe', format: 'html', entry: 'wireframe.html', slides: 2, theme: null }),
      'utf8',
    );

    const evt = await withTimeout(got, 5000, 'wireframe artifact event');
    assert.equal(evt.type, 'artifact');
    assert.equal(evt.manifest.kind, 'wireframe');
    assert.equal(evt.manifest.format, 'html');
    assert.equal(evt.manifest.entry, 'wireframe.html');
    assert.equal(evt.manifest.slides, 2);
  } finally {
    await closeAllArtifactWatchers();
    await rm(dataDir, { recursive: true, force: true });
  }
});

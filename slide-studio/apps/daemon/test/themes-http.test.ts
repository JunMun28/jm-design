/**
 * Theme picker + Gate 3 over the REAL daemon HTTP surface (Slice 5 / issue #12,
 * AC1). Drives `createDaemon` so the routes are exercised end-to-end:
 *
 *   - GET  /api/themes               → the html-slides theme catalogue (with previews)
 *   - GET  /api/themes/:id/thumbnail → a real image (the picker thumbnail, AC1)
 *   - POST /api/projects/:id/theme   → Gate 3: the selection PERSISTS + advances to Deck
 *
 * Uses a temp data dir for the project store; no real CLI, no real agent.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createDaemon } from '../src/server.ts';

async function withDaemon<T>(
  fn: (base: string) => Promise<T>,
): Promise<T> {
  const dir = await mkdtemp(join(tmpdir(), 'slide-studio-themes-http-'));
  const prevDataDir = process.env.SLIDE_STUDIO_DATA_DIR;
  process.env.SLIDE_STUDIO_DATA_DIR = dir;
  const daemon = await createDaemon({ port: 0 });
  const base = `http://${daemon.host}:${daemon.port}`;
  try {
    return await fn(base);
  } finally {
    await daemon.close();
    if (prevDataDir === undefined) delete process.env.SLIDE_STUDIO_DATA_DIR;
    else process.env.SLIDE_STUDIO_DATA_DIR = prevDataDir;
    await rm(dir, { recursive: true, force: true });
  }
}

test('GET /api/themes lists the html-slides themes for the picker (AC1)', async () => {
  await withDaemon(async (base) => {
    const res = await fetch(`${base}/api/themes`);
    assert.equal(res.status, 200);
    const { themes } = (await res.json()) as { themes: { id: string; name: string; preview: string | null }[] };
    assert.ok(Array.isArray(themes) && themes.length >= 1);
    const ids = themes.map((t) => t.id);
    assert.ok(ids.includes('micron-dark'));
    // Every listed theme carries a name + a preview ref the picker renders.
    for (const t of themes) {
      assert.ok(t.name.length > 0);
      assert.ok(t.preview, `${t.id} has a preview`);
    }
  });
});

test('GET /api/themes/:id/thumbnail serves a real image (AC1)', async () => {
  await withDaemon(async (base) => {
    const res = await fetch(`${base}/api/themes/micron-dark/thumbnail`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type') ?? '', /^image\//);
    const buf = Buffer.from(await res.arrayBuffer());
    assert.ok(buf.length > 0);
  });
});

test('GET thumbnail for an unknown theme 404s', async () => {
  await withDaemon(async (base) => {
    const res = await fetch(`${base}/api/themes/not-a-theme/thumbnail`);
    assert.equal(res.status, 404);
  });
});

test('POST /api/projects/:id/theme persists the selection + advances to Deck (AC1)', async () => {
  await withDaemon(async (base) => {
    // Create a project.
    const created = await fetch(`${base}/api/projects`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ brief: 'A yield review deck' }),
    });
    const { project } = (await created.json()) as { project: { id: string } };

    // Gate 3: pick a theme.
    const picked = await fetch(`${base}/api/projects/${project.id}/theme`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ theme: 'micron-dark', formats: ['html'] }),
    });
    assert.equal(picked.status, 200);
    const after = (await picked.json()) as { project: { theme: string; gate3: string; stage: string } };
    assert.equal(after.project.theme, 'micron-dark');
    assert.equal(after.project.gate3, 'approved');
    assert.equal(after.project.stage, 'deck');

    // The selection PERSISTS: re-read the project.
    const reread = await fetch(`${base}/api/projects/${project.id}`);
    const { project: rec } = (await reread.json()) as { project: { theme: string } };
    assert.equal(rec.theme, 'micron-dark');
  });
});

test('POST theme rejects an unknown theme id (no junk reaches generation)', async () => {
  await withDaemon(async (base) => {
    const created = await fetch(`${base}/api/projects`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ brief: 'deck' }),
    });
    const { project } = (await created.json()) as { project: { id: string } };
    const res = await fetch(`${base}/api/projects/${project.id}/theme`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ theme: 'totally-made-up-theme' }),
    });
    assert.equal(res.status, 400);
  });
});

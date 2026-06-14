/**
 * Export Collector + format choice over the REAL daemon HTTP surface (Slice 7 /
 * issue #14 export download, on top of the Slice 6 / issue #13 format choice).
 * Drives `createDaemon` so the routes are exercised end-to-end:
 *
 *   - POST /api/projects/:id/theme            → Gate 3 persists the format CHOICE
 *   - GET  /api/projects/:id/exports          → lists the produced downloadable file(s)
 *   - GET  /api/projects/:id/export/download  → downloads with a Brief-derived name
 *
 * Uses a temp data dir; no real CLI, no real agent (the deck files are written
 * directly to stand in for a completed generation).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createDaemon } from '../src/server.ts';
import { projectDir } from '../src/projects.ts';

async function withDaemon<T>(fn: (base: string, dataDir: string) => Promise<T>): Promise<T> {
  const dir = await mkdtemp(join(tmpdir(), 'slide-studio-exports-http-'));
  const prevDataDir = process.env.SLIDE_STUDIO_DATA_DIR;
  process.env.SLIDE_STUDIO_DATA_DIR = dir;
  const daemon = await createDaemon({ port: 0 });
  const base = `http://${daemon.host}:${daemon.port}`;
  try {
    return await fn(base, dir);
  } finally {
    await daemon.close();
    if (prevDataDir === undefined) delete process.env.SLIDE_STUDIO_DATA_DIR;
    else process.env.SLIDE_STUDIO_DATA_DIR = prevDataDir;
    await rm(dir, { recursive: true, force: true });
  }
}

async function makeProject(base: string, brief: string): Promise<string> {
  const res = await fetch(`${base}/api/projects`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ brief }),
  });
  const { project } = (await res.json()) as { project: { id: string } };
  return project.id;
}

test('Gate 3 persists the user format choice (PPTX + HTML, AC1)', async () => {
  await withDaemon(async (base) => {
    const id = await makeProject(base, 'Q3 yield ops review');
    const res = await fetch(`${base}/api/projects/${id}/theme`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ theme: 'micron-dark', formats: ['pptx', 'html'] }),
    });
    assert.equal(res.status, 200);
    const { project } = (await res.json()) as { project: { formats: string[] } };
    assert.deepEqual([...project.formats].sort(), ['html', 'pptx']);
  });
});

test('GET /exports lists only the produced output(s) with Brief-derived names (M6)', async () => {
  await withDaemon(async (base, dataDir) => {
    void dataDir;
    const id = await makeProject(base, 'Q3 yield ops review');
    await fetch(`${base}/api/projects/${id}/theme`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ theme: 'micron-dark', formats: ['pptx', 'html'] }),
    });
    // Stand in for a completed generation: write both deck outputs.
    const dir = projectDir(id);
    await writeFile(join(dir, 'deck.html'), '<html>deck</html>', 'utf8');
    await writeFile(join(dir, 'deck.pptx'), Buffer.from('PK fake pptx'), 'utf8');

    const res = await fetch(`${base}/api/projects/${id}/exports`);
    assert.equal(res.status, 200);
    const { items } = (await res.json()) as {
      items: { format: string; entry: string; filename: string; bytes: number }[];
    };
    assert.equal(items.length, 2);
    const byFormat = Object.fromEntries(items.map((i) => [i.format, i]));
    assert.equal(byFormat.pptx.filename, 'q3-yield-ops-review.pptx');
    assert.equal(byFormat.html.filename, 'q3-yield-ops-review.html');
    assert.ok(byFormat.pptx.bytes > 0);
  });
});

test('GET /export/download serves the .pptx with a Content-Disposition save name', async () => {
  await withDaemon(async (base) => {
    const id = await makeProject(base, 'Q3 yield ops review');
    await fetch(`${base}/api/projects/${id}/theme`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ theme: 'micron-dark', formats: ['pptx'] }),
    });
    const dir = projectDir(id);
    await writeFile(join(dir, 'deck.pptx'), Buffer.from('PK fake pptx bytes'), 'utf8');

    const res = await fetch(`${base}/api/projects/${id}/export/download?entry=deck.pptx`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type') ?? '', /presentationml\.presentation/);
    assert.match(res.headers.get('content-disposition') ?? '', /filename="q3-yield-ops-review\.pptx"/);
    const buf = Buffer.from(await res.arrayBuffer());
    assert.ok(buf.length > 0);
  });
});

test('GET /export/download rejects a traversal entry (path-safety)', async () => {
  await withDaemon(async (base) => {
    const id = await makeProject(base, 'x');
    const res = await fetch(
      `${base}/api/projects/${id}/export/download?entry=${encodeURIComponent('../../etc/passwd')}`,
    );
    assert.equal(res.status, 404);
  });
});

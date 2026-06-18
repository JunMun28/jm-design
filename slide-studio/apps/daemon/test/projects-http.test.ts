/**
 * Project rename + delete over the REAL daemon HTTP surface. Drives
 * `createDaemon` so the routes are exercised end-to-end:
 *
 *   - PATCH  /api/projects/:id → rename: the new title PERSISTS (verify via GET)
 *   - DELETE /api/projects/:id → delete: 200 { ok:true }, then GET 404 + absent
 *                                from the list; an unknown id → 404
 *   - PATCH with an empty title → 400 (no junk title persists)
 *
 * Uses a temp data dir for the project store; no real CLI, no real agent.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createDaemon } from '../src/server.ts';

async function withDaemon<T>(fn: (base: string) => Promise<T>): Promise<T> {
  const dir = await mkdtemp(join(tmpdir(), 'slide-studio-projects-http-'));
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

async function createProject(base: string, brief = 'A yield review deck'): Promise<{ id: string; title: string }> {
  const res = await fetch(`${base}/api/projects`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ brief }),
  });
  assert.equal(res.status, 201);
  return ((await res.json()) as { project: { id: string; title: string } }).project;
}

test('PATCH /api/projects/:id renames and persists the new title', async () => {
  await withDaemon(async (base) => {
    const project = await createProject(base);

    const res = await fetch(`${base}/api/projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Renamed deck' }),
    });
    assert.equal(res.status, 200);
    const after = (await res.json()) as { project: { id: string; title: string } };
    assert.equal(after.project.title, 'Renamed deck');

    // PERSISTS: re-read via GET.
    const reread = await fetch(`${base}/api/projects/${project.id}`);
    assert.equal(reread.status, 200);
    const { project: rec } = (await reread.json()) as { project: { title: string } };
    assert.equal(rec.title, 'Renamed deck');
  });
});

test('PATCH /api/projects/:id with an empty title 400s', async () => {
  await withDaemon(async (base) => {
    const project = await createProject(base);
    const res = await fetch(`${base}/api/projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: '   ' }),
    });
    assert.equal(res.status, 400);
  });
});

test('PATCH /api/projects/:id on an unknown project 404s', async () => {
  await withDaemon(async (base) => {
    const res = await fetch(`${base}/api/projects/does-not-exist`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'A title' }),
    });
    assert.equal(res.status, 404);
  });
});

test('DELETE /api/projects/:id removes it (GET 404 + absent from list)', async () => {
  await withDaemon(async (base) => {
    const keep = await createProject(base, 'keep me');
    const doomed = await createProject(base, 'delete me');

    const res = await fetch(`${base}/api/projects/${doomed.id}`, { method: 'DELETE' });
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { ok: true });

    // GET the deleted project → 404.
    const reread = await fetch(`${base}/api/projects/${doomed.id}`);
    assert.equal(reread.status, 404);

    // Absent from the list; the other project survives.
    const list = await fetch(`${base}/api/projects`);
    const { projects } = (await list.json()) as { projects: { id: string }[] };
    const ids = projects.map((p) => p.id);
    assert.ok(!ids.includes(doomed.id));
    assert.ok(ids.includes(keep.id));
  });
});

test('DELETE /api/projects/:id on an unknown project 404s', async () => {
  await withDaemon(async (base) => {
    const res = await fetch(`${base}/api/projects/does-not-exist`, { method: 'DELETE' });
    assert.equal(res.status, 404);
  });
});

test('DELETE/PATCH /api/projects/:id reject a path-traversal id (404, never 200)', async () => {
  await withDaemon(async (base) => {
    // `%2e%2e%2fvictim` decodes to `../victim`; the boundary guard maps it to 404.
    const del = await fetch(`${base}/api/projects/%2e%2e%2fvictim`, { method: 'DELETE' });
    assert.equal(del.status, 404);
    const pat = await fetch(`${base}/api/projects/%2e%2e%2fvictim`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'pwned' }),
    });
    assert.equal(pat.status, 404);
  });
});

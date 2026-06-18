/**
 * Project persistence suite (AC3): a Project is created on submit and persists
 * on disk (and can be re-read + listed).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  appendConversation,
  createProject,
  deleteProject,
  listProjects,
  listRecent,
  load,
  projectDir,
  readConversation,
  readProject,
  renameProject,
  setGate1,
  setGate2,
  setTheme,
  updateRecordedBrief,
} from '../src/projects.ts';

async function withTempStore<T>(fn: (env: NodeJS.ProcessEnv) => Promise<T>): Promise<T> {
  const dir = await mkdtemp(join(tmpdir(), 'slide-studio-test-'));
  const env = { ...process.env, SLIDE_STUDIO_DATA_DIR: dir } as NodeJS.ProcessEnv;
  try {
    return await fn(env);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test('createProject writes project.json + seeds the conversation', async () => {
  await withTempStore(async (env) => {
    const project = await createProject({ brief: 'A Q3 yield review deck for ops leaders' }, env);
    assert.ok(project.id.length > 0);
    assert.equal(project.brief, 'A Q3 yield review deck for ops leaders');

    // Persisted on disk.
    const onDisk = await readProject(project.id, env);
    assert.ok(onDisk);
    assert.equal(onDisk?.brief, project.brief);
    assert.ok(existsSync(join(env.SLIDE_STUDIO_DATA_DIR!, project.id, 'project.json')));

    // Opening user turn seeded.
    const convo = await readConversation(project.id, env);
    assert.equal(convo.length, 1);
    assert.equal(convo[0].role, 'user');
  });
});

test('listProjects returns created projects newest-first', async () => {
  await withTempStore(async (env) => {
    const a = await createProject({ brief: 'first deck' }, env);
    await appendConversation(a.id, { role: 'assistant', text: 'reply', at: new Date(Date.now() + 5).toISOString() }, env);
    const b = await createProject({ brief: 'second deck' }, env);

    const list = await listProjects(env);
    assert.equal(list.length, 2);
    // b was created last (most recent updatedAt) → first.
    assert.equal(list[0].id, b.id);
  });
});

test('appendConversation persists turns in order', async () => {
  await withTempStore(async (env) => {
    const p = await createProject({ brief: 'deck' }, env);
    await appendConversation(p.id, { role: 'assistant', text: 'hi', at: new Date().toISOString() }, env);
    const convo = await readConversation(p.id, env);
    assert.deepEqual(
      convo.map((c) => c.role),
      ['user', 'assistant'],
    );
  });
});

test('new projects start at the Brief stage with Gate 1 pending', async () => {
  await withTempStore(async (env) => {
    const p = await createProject({ brief: 'deck' }, env);
    assert.equal(p.stage, 'brief');
    assert.equal(p.gate1, 'pending');
    assert.deepEqual(p.recordedBrief, {});
  });
});

test('updateRecordedBrief merges parsed fields into the Recorded Discussion', async () => {
  await withTempStore(async (env) => {
    const p = await createProject({ brief: 'deck' }, env);
    await updateRecordedBrief(p.id, { audience: 'Ops leadership' }, env);
    const after1 = await updateRecordedBrief(p.id, { goal: 'Win budget', narrativeArc: ['Problem', 'Ask'] }, env);
    assert.equal(after1?.recordedBrief.audience, 'Ops leadership'); // preserved
    assert.equal(after1?.recordedBrief.goal, 'Win budget'); // merged
    assert.deepEqual(after1?.recordedBrief.narrativeArc, ['Problem', 'Ask']);
  });
});

test('Gate 1 approve advances to Wireframe; request-changes loops back to Brief', async () => {
  await withTempStore(async (env) => {
    const p = await createProject({ brief: 'deck' }, env);
    const approved = await setGate1(p.id, 'approve', env);
    assert.equal(approved?.gate1, 'approved');
    assert.equal(approved?.stage, 'wireframe');

    const looped = await setGate1(p.id, 'request-changes', env);
    assert.equal(looped?.gate1, 'pending');
    assert.equal(looped?.stage, 'brief');
  });
});

test('Gate 2 approve advances Wireframe → Theme; request-changes holds on Wireframe', async () => {
  await withTempStore(async (env) => {
    const p = await createProject({ brief: 'deck' }, env);
    // New projects default Gate 2 to pending.
    assert.equal(p.gate2, 'pending');
    // Gate 1 approved first (the Wireframe only exists after Gate 1).
    await setGate1(p.id, 'approve', env);

    const approved = await setGate2(p.id, 'approve', env);
    assert.equal(approved?.gate2, 'approved');
    assert.equal(approved?.stage, 'theme');
    assert.equal(approved?.gate1, 'approved'); // Gate 1 stays intact

    const looped = await setGate2(p.id, 'request-changes', env);
    assert.equal(looped?.gate2, 'pending');
    assert.equal(looped?.stage, 'wireframe');
  });
});

// --- Slice 5: Gate 3 (theme picked) ----------------------------------------

test('new projects start with Gate 3 pending, no theme, and HTML formats', async () => {
  await withTempStore(async (env) => {
    const p = await createProject({ brief: 'deck' }, env);
    assert.equal(p.gate3, 'pending');
    assert.equal(p.theme, null);
    assert.deepEqual(p.formats, ['html']);
  });
});

test('setTheme persists the selection and advances Theme → Deck (AC1)', async () => {
  await withTempStore(async (env) => {
    const p = await createProject({ brief: 'deck' }, env);
    // Reach the Theme step (Gates 1 + 2 approved).
    await setGate1(p.id, 'approve', env);
    await setGate2(p.id, 'approve', env);

    const themed = await setTheme(p.id, 'micron-dark', undefined, env);
    assert.equal(themed?.theme, 'micron-dark');
    assert.equal(themed?.gate3, 'approved');
    assert.equal(themed?.stage, 'deck');
    // Gates 1 + 2 stay intact.
    assert.equal(themed?.gate1, 'approved');
    assert.equal(themed?.gate2, 'approved');

    // The selection PERSISTS on disk (re-read).
    const reread = await readProject(p.id, env);
    assert.equal(reread?.theme, 'micron-dark');
    assert.equal(reread?.stage, 'deck');
  });
});

test('setTheme records chosen output formats, defaulting to the prior set', async () => {
  await withTempStore(async (env) => {
    const p = await createProject({ brief: 'deck' }, env);
    const both = await setTheme(p.id, 'micron-light', ['html', 'pptx'], env);
    assert.deepEqual(both?.formats, ['html', 'pptx']);
    // Omitting formats keeps the prior selection (no accidental reset to HTML-only).
    const again = await setTheme(p.id, 'micron-dark', undefined, env);
    assert.deepEqual(again?.formats, ['html', 'pptx']);
  });
});

test('setTheme returns null for an unknown project', async () => {
  await withTempStore(async (env) => {
    assert.equal(await setTheme('nope', 'micron-dark', undefined, env), null);
  });
});

// --- Project mutations: rename + delete ------------------------------------

test('deleteProject removes the dir and drops it from listProjects', async () => {
  await withTempStore(async (env) => {
    const a = await createProject({ brief: 'keep me' }, env);
    const b = await createProject({ brief: 'delete me' }, env);
    assert.ok(existsSync(projectDir(b.id, env)));

    const removed = await deleteProject(b.id, env);
    assert.equal(removed, true);
    assert.ok(!existsSync(projectDir(b.id, env)));

    // Gone from the list; the other project survives.
    assert.equal(await readProject(b.id, env), null);
    const list = await listProjects(env);
    assert.deepEqual(
      list.map((p) => p.id),
      [a.id],
    );
  });
});

test('deleteProject returns false for an unknown project', async () => {
  await withTempStore(async (env) => {
    assert.equal(await deleteProject('does-not-exist', env), false);
  });
});

test('renameProject persists the new title (re-read with readProject)', async () => {
  await withTempStore(async (env) => {
    const p = await createProject({ brief: 'deck', title: 'Old title' }, env);
    const renamed = await renameProject(p.id, '  New title  ', env);
    assert.equal(renamed?.title, 'New title'); // trimmed

    // Persisted on disk.
    const reread = await readProject(p.id, env);
    assert.equal(reread?.title, 'New title');
  });
});

test('renameProject caps the title at 120 chars (like createProject)', async () => {
  await withTempStore(async (env) => {
    const p = await createProject({ brief: 'deck' }, env);
    const long = 'x'.repeat(200);
    const renamed = await renameProject(p.id, long, env);
    assert.equal(renamed?.title.length, 120);
  });
});

test('renameProject rejects an empty / whitespace-only title', async () => {
  await withTempStore(async (env) => {
    const p = await createProject({ brief: 'deck' }, env);
    await assert.rejects(() => renameProject(p.id, '   ', env));
  });
});

test('renameProject returns null for an unknown project', async () => {
  await withTempStore(async (env) => {
    assert.equal(await renameProject('nope', 'A title', env), null);
  });
});

test('deleteProject/renameProject refuse a path-traversal id and never escape the store', async () => {
  const base = await mkdtemp(join(tmpdir(), 'slide-studio-traversal-'));
  const env = { ...process.env, SLIDE_STUDIO_DATA_DIR: join(base, 'store') } as NodeJS.ProcessEnv;
  const { mkdir, writeFile } = await import('node:fs/promises');
  await mkdir(env.SLIDE_STUDIO_DATA_DIR!, { recursive: true });
  // A sibling of the store that a malicious id of `../victim` would resolve to.
  const victim = join(base, 'victim');
  await mkdir(victim, { recursive: true });
  await writeFile(join(victim, 'keep.txt'), 'precious', 'utf8');
  try {
    assert.equal(await deleteProject('../victim', env), false);
    assert.equal(await deleteProject('..', env), false);
    assert.equal(await renameProject('../victim', 'x', env), null);
    // The out-of-store directory and its file are untouched.
    assert.ok(existsSync(join(victim, 'keep.txt')), 'traversal must not delete outside the store');
  } finally {
    await rm(base, { recursive: true, force: true });
  }
});

// --- Slice 11: recent projects + resume ------------------------------------

/** Force a measurable gap so updatedAt timestamps (ms-resolution) differ. */
const tick = () => new Promise((r) => setTimeout(r, 5));

test('listRecent returns projects newest-first', async () => {
  await withTempStore(async (env) => {
    const a = await createProject({ brief: 'older deck' }, env);
    await tick();
    const b = await createProject({ brief: 'newer deck' }, env);

    const recent = await listRecent(8, env);
    assert.equal(recent.length, 2);
    assert.equal(recent[0].id, b.id); // most-recently-touched first
    assert.equal(recent[1].id, a.id);
  });
});

test('listRecent re-sorts when an older project is touched again', async () => {
  await withTempStore(async (env) => {
    const a = await createProject({ brief: 'first' }, env);
    await tick();
    await createProject({ brief: 'second' }, env);
    await tick();
    // Resuming `a` (a new turn) touches its updatedAt → it floats to the top.
    await appendConversation(a.id, { role: 'assistant', text: 'resumed', at: new Date().toISOString() }, env);

    const recent = await listRecent(8, env);
    assert.equal(recent[0].id, a.id);
  });
});

test('listRecent bounds the list to the requested limit', async () => {
  await withTempStore(async (env) => {
    for (let i = 0; i < 4; i++) {
      await createProject({ brief: `deck ${i}` }, env);
      await tick();
    }
    const recent = await listRecent(2, env);
    assert.equal(recent.length, 2);
  });
});

test('listRecent returns [] when no projects exist', async () => {
  await withTempStore(async (env) => {
    assert.deepEqual(await listRecent(8, env), []);
  });
});

test('load returns the record + full conversation for a past Project', async () => {
  await withTempStore(async (env) => {
    const p = await createProject({ brief: 'A yield review deck' }, env);
    await updateRecordedBrief(p.id, { audience: 'Ops leadership', narrativeArc: ['Problem', 'Ask'] }, env);
    await appendConversation(p.id, { role: 'assistant', text: 'Here is a proposed arc.', at: new Date().toISOString() }, env);

    const loaded = await load(p.id, env);
    assert.ok(loaded, 'load should resolve for an existing project');
    // Prior record state restored.
    assert.equal(loaded?.project.id, p.id);
    assert.equal(loaded?.project.recordedBrief.audience, 'Ops leadership');
    assert.deepEqual(loaded?.project.recordedBrief.narrativeArc, ['Problem', 'Ask']);
    // Full transcript restored (seeded user turn + the assistant reply), in order.
    assert.deepEqual(
      loaded?.conversation.map((c) => c.role),
      ['user', 'assistant'],
    );
    assert.equal(loaded?.conversation[0].text, 'A yield review deck');
    assert.equal(loaded?.conversation[1].text, 'Here is a proposed arc.');
  });
});

test('load returns null for an unknown Project', async () => {
  await withTempStore(async (env) => {
    assert.equal(await load('does-not-exist', env), null);
  });
});

test('readProject backfills Slice 2 fields for pre-slice records', async () => {
  await withTempStore(async (env) => {
    const p = await createProject({ brief: 'deck' }, env);
    // Simulate an old record on disk without the new fields.
    const { writeFile } = await import('node:fs/promises');
    const { join } = await import('node:path');
    await writeFile(
      join(env.SLIDE_STUDIO_DATA_DIR!, p.id, 'project.json'),
      JSON.stringify({ id: p.id, title: 't', brief: 'b', createdAt: p.createdAt, updatedAt: p.updatedAt }),
      'utf8',
    );
    const rec = await readProject(p.id, env);
    assert.equal(rec?.stage, 'brief');
    assert.equal(rec?.gate1, 'pending');
    assert.deepEqual(rec?.recordedBrief, {});
  });
});

test('S2: a record with no decks[] migrates to empty variant fields (AC)', async () => {
  await withTempStore(async (env) => {
    const p = await createProject({ brief: 'deck' }, env);
    const r = await readProject(p.id, env);
    assert.deepEqual(r?.decks, []);
    assert.equal(r?.wireframeRev, 0);
    assert.equal(r?.activeDeckId, null);
  });
});

test('S2: a legacy themed deck-stage record migrates its deck.html into one variant', async () => {
  await withTempStore(async (env) => {
    const p = await createProject({ brief: 'deck' }, env);
    await setGate1(p.id, 'approve', env);
    await setGate2(p.id, 'approve', env);
    await setTheme(p.id, 'micron-dark', undefined, env);
    const { readFile, writeFile } = await import('node:fs/promises');
    const { join } = await import('node:path');
    const file = join(projectDir(p.id, env), 'project.json');
    const raw = JSON.parse(await readFile(file, 'utf8'));
    delete raw.decks; delete raw.wireframeRev; delete raw.activeDeckId;
    await writeFile(file, JSON.stringify(raw));

    const r = await readProject(p.id, env);
    assert.equal(r?.decks.length, 1);
    assert.equal(r?.decks[0].theme, 'micron-dark');
    assert.equal(r?.decks[0].file, 'deck.html');
    assert.equal(r?.decks[0].fromWireframeRev, 0);
    assert.equal(r?.activeDeckId, r?.decks[0].id);
    assert.equal(r?.theme, 'micron-dark');
  });
});

// --- S4: returnable wireframe (re-approval bumps wireframeRev) --------------

test('S4: re-approving the wireframe (gate2 already approved) bumps wireframeRev', async () => {
  await withTempStore(async (env) => {
    const p = await createProject({ brief: 'deck' }, env);
    await setGate1(p.id, 'approve', env);
    const first = await setGate2(p.id, 'approve', env);          // first approval
    assert.equal(first?.gate2, 'approved');
    assert.equal(first?.wireframeRev, 0);                        // no bump on first approve
    await setGate2(p.id, 'request-changes', env);                // go back to wireframe
    const second = await setGate2(p.id, 'approve', env);         // re-approve
    assert.equal(second?.wireframeRev, 1);                       // bumped
    assert.equal(second?.stage, 'theme');
    const third = await setGate2(p.id, 'approve', env);          // re-approve again (still approved)
    assert.equal(third?.wireframeRev, 2);
  });
});

/**
 * Feedback-survival suite (Slice 13 / issue #7, AC2): queued annotations /
 * feedback survive an interrupted run. The guarantee: items are persisted on
 * queue, marked sent ONLY after a clean run, and an interrupted run (cancel /
 * error / disconnect — modeled here as "never mark sent") leaves them pending so
 * the next turn re-attaches them. Uses a temp data dir; no real CLI.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createProject } from '../src/projects.ts';
import {
  appendFeedback,
  clearFeedback,
  markFeedbackSent,
  readFeedback,
  readPendingFeedback,
  serializeFeedbackBlock,
  type FeedbackItem,
} from '../src/feedback-queue.ts';

async function withTempStore<T>(fn: (env: NodeJS.ProcessEnv) => Promise<T>): Promise<T> {
  const dir = await mkdtemp(join(tmpdir(), 'slide-studio-fb-'));
  const env = { ...process.env, SLIDE_STUDIO_DATA_DIR: dir } as NodeJS.ProcessEnv;
  try {
    return await fn(env);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test('queued feedback persists and reads back as pending', async () => {
  await withTempStore(async (env) => {
    const p = await createProject({ brief: 'deck' }, env);
    await appendFeedback(p.id, { kind: 'comment', text: 'Make the title shorter' }, env);
    await appendFeedback(
      p.id,
      { kind: 'annotation', text: 'Wrong figure here', selector: '#kpi-3', anchorText: '42%', slideIndex: 2 },
      env,
    );

    const pending = await readPendingFeedback(p.id, env);
    assert.equal(pending.length, 2);
    assert.equal(pending[0].text, 'Make the title shorter');
    assert.equal(pending[1].kind, 'annotation');
    assert.equal(pending[1].slideIndex, 2);
  });
});

test('AC2: feedback survives an INTERRUPTED run (never marked sent stays pending)', async () => {
  await withTempStore(async (env) => {
    const p = await createProject({ brief: 'deck' }, env);
    await appendFeedback(p.id, { kind: 'comment', text: 'Tighten slide 4' }, env);
    await appendFeedback(p.id, { kind: 'annotation', text: 'Move this box', selector: '.cta' }, env);

    // A run STARTS, attaches the pending feedback, then is interrupted
    // (cancel/error/disconnect) — the server never calls markFeedbackSent.
    const attached = await readPendingFeedback(p.id, env);
    assert.equal(attached.length, 2);
    // ...interruption... (no markFeedbackSent)

    // On the NEXT turn, the same feedback is still pending and re-attachable.
    const stillPending = await readPendingFeedback(p.id, env);
    assert.equal(stillPending.length, 2);
    assert.deepEqual(
      stillPending.map((i) => i.text),
      ['Tighten slide 4', 'Move this box'],
    );
  });
});

test('AC2: a CLEAN run consumes the queue (marked sent → no longer pending)', async () => {
  await withTempStore(async (env) => {
    const p = await createProject({ brief: 'deck' }, env);
    await appendFeedback(p.id, { kind: 'comment', text: 'one' }, env);
    await appendFeedback(p.id, { kind: 'comment', text: 'two' }, env);

    const attached = await readPendingFeedback(p.id, env);
    // The run completes cleanly → mark exactly the attached ids sent.
    await markFeedbackSent(
      p.id,
      attached.map((i) => i.id),
      env,
    );

    assert.equal((await readPendingFeedback(p.id, env)).length, 0);
    // The full log keeps both the original + the "sent" tombstone (append-only).
    assert.ok((await readFeedback(p.id, env)).length >= attached.length);
  });
});

test('AC2: feedback queued DURING an interrupted run survives alongside the old', async () => {
  await withTempStore(async (env) => {
    const p = await createProject({ brief: 'deck' }, env);
    await appendFeedback(p.id, { kind: 'comment', text: 'first' }, env);
    const attached = await readPendingFeedback(p.id, env);

    // While the run is in flight (and will be interrupted), the user queues more.
    await appendFeedback(p.id, { kind: 'comment', text: 'second (added mid-run)' }, env);

    // Run is interrupted: nothing marked sent. Both survive.
    void attached;
    const pending = await readPendingFeedback(p.id, env);
    assert.deepEqual(
      pending.map((i) => i.text),
      ['first', 'second (added mid-run)'],
    );
  });
});

test('clearFeedback empties the pending queue', async () => {
  await withTempStore(async (env) => {
    const p = await createProject({ brief: 'deck' }, env);
    await appendFeedback(p.id, { kind: 'comment', text: 'drop me' }, env);
    await clearFeedback(p.id, env);
    assert.equal((await readPendingFeedback(p.id, env)).length, 0);
  });
});

test('serializeFeedbackBlock renders the scoped comments block (pure)', () => {
  const items: FeedbackItem[] = [
    { id: 'a', kind: 'comment', text: 'Shorten the title', at: '2026-06-14T00:00:00Z' },
    {
      id: 'b',
      kind: 'annotation',
      text: 'Wrong number',
      selector: '#kpi',
      anchorText: '42%',
      slideIndex: 3,
      at: '2026-06-14T00:00:01Z',
    },
  ];
  const block = serializeFeedbackBlock(items);
  assert.match(block, /<attached-preview-comments>/);
  assert.match(block, /Change ONLY these elements/);
  assert.match(block, /Shorten the title/);
  assert.match(block, /slide 4/); // slideIndex 3 → human "slide 4"
  assert.match(block, /#kpi/);
  assert.match(block, /42%/);
  assert.match(block, /<\/attached-preview-comments>/);
});

test('serializeFeedbackBlock returns empty string for no items', () => {
  assert.equal(serializeFeedbackBlock([]), '');
});

// --- concurrency: rapid pinning (issue #11, AC1) --------------------------

test('AC1: CONCURRENT queues never interleave or drop a record', async () => {
  // The web shell fires one queueFeedback POST per pinned annotation, so a user
  // pinning several quickly lands near-simultaneous appends on the same queue
  // file. A read-then-write race corrupted the JSONL (a lost annotation, a
  // half-written line) — observed live before the per-file write lock. Fire many
  // appends WITHOUT awaiting between them and assert every record survives intact.
  await withTempStore(async (env) => {
    const p = await createProject({ brief: 'deck' }, env);
    const N = 25;
    await Promise.all(
      Array.from({ length: N }, (_, i) =>
        appendFeedback(
          p.id,
          { kind: 'annotation', text: `annotation ${i}`, selector: `#el-${i}`, slideIndex: i },
          env,
        ),
      ),
    );

    // All N records present, every one a parseable JSON line (no torn writes),
    // and the set of texts is exactly the N we queued (none clobbered).
    const all = await readFeedback(p.id, env);
    assert.equal(all.length, N, 'every concurrent append must survive');
    const texts = new Set(all.map((i) => i.text));
    assert.equal(texts.size, N, 'no record was overwritten by a racing write');
    for (let i = 0; i < N; i++) assert.ok(texts.has(`annotation ${i}`), `annotation ${i} present`);
  });
});

test('AC1: queuing while marking-sent runs concurrently stays consistent', async () => {
  // markFeedbackSent appends tombstones to the SAME file; it must not clobber a
  // concurrently-queued annotation. Interleave a mark-sent with a fresh queue.
  await withTempStore(async (env) => {
    const p = await createProject({ brief: 'deck' }, env);
    const first = await appendFeedback(p.id, { kind: 'comment', text: 'first' }, env);
    await Promise.all([
      markFeedbackSent(p.id, [first.id], env),
      appendFeedback(p.id, { kind: 'annotation', text: 'second', selector: '#x' }, env),
    ]);
    const pending = await readPendingFeedback(p.id, env);
    // 'first' is sent (gone from pending); 'second' survived as pending.
    assert.deepEqual(
      pending.map((i) => i.text),
      ['second'],
    );
    // The file is still wholly parseable (no torn line dropped a record).
    const all = await readFeedback(p.id, env);
    assert.ok(all.some((i) => i.text === 'first' && i.sent));
    assert.ok(all.some((i) => i.text === 'second' && !i.sent));
  });
});

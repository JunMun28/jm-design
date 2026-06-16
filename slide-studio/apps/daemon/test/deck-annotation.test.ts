/**
 * Deck-level annotation & iterate suite (Slice 12 / issue #15). The Deck reuses
 * the SAME annotation mechanism the Wireframe does — but a Deck annotation drives
 * a **regenerate** (the agent rewrites the affected slides), not an in-place
 * wireframe edit. This suite proves:
 *
 *   1. Serializer surface-awareness — a `surface: 'deck'` annotation produces the
 *      REGENERATE-scoped `<attached-preview-comments>` header; a wireframe one
 *      keeps the original in-place wording. The anchor/slide/screenshot lines are
 *      identical (same capture).
 *   2. `serializeFeedbackForTurn` threads the surface through, so a queued deck
 *      annotation rides the next turn as the regenerate block.
 *   3. `hasDeckAnnotations` — the daemon's signal that a generate run should be a
 *      regenerate (carry the deck annotations) rather than a fresh build.
 *   4. The surface survives the durable queue (persist → read back → pending),
 *      and the regenerate-on-clean-run survival guarantee holds (an interrupted
 *      regenerate leaves the deck annotations pending).
 *
 * Pure serializer assertions need no CLI; the queue checks use a temp data dir.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  serializeAnnotations,
  toAnnotation,
  type ElementAnchor,
  type TextRangeAnchor,
} from '../src/annotation.ts';
import {
  appendFeedback,
  hasDeckAnnotations,
  markFeedbackSent,
  readPendingFeedback,
  serializeFeedbackForTurn,
  type FeedbackItem,
} from '../src/feedback-queue.ts';
import { createProject } from '../src/projects.ts';

const elementAnchor: ElementAnchor = {
  kind: 'element',
  selector: 'section#cover > h1',
  tag: 'h1',
  text: 'Q3 yield review',
};

const textAnchor: TextRangeAnchor = {
  kind: 'text-range',
  commonAncestorSelector: 'li:nth-of-type(2)',
  start: { selector: 'strong', path: [0], offset: 0 },
  end: { selector: 'strong', path: [0], offset: 3 },
  text: '92%',
};

async function withTempStore<T>(fn: (env: NodeJS.ProcessEnv) => Promise<T>): Promise<T> {
  const dir = await mkdtemp(join(tmpdir(), 'slide-studio-deck-'));
  const env = { ...process.env, SLIDE_STUDIO_DATA_DIR: dir } as NodeJS.ProcessEnv;
  try {
    return await fn(env);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function fb(partial: Partial<FeedbackItem>): FeedbackItem {
  return { id: 'x', kind: 'comment', text: '', at: '2026-06-14T00:00:00.000Z', ...partial };
}

// --- 1. Serializer surface-awareness --------------------------------------

test('a DECK annotation serializes a REGENERATE-scoped block (not an in-place edit)', () => {
  const block = serializeAnnotations([
    toAnnotation('d1', {
      comment: 'Tighten this headline',
      slideIndex: 0,
      anchor: elementAnchor,
      surface: 'deck',
    }),
  ]);
  assert.ok(block.startsWith('<attached-preview-comments>'));
  // The deck header tells the agent to REGENERATE only the affected slides; the
  // app (not the blind agent) re-runs the verify gate (collapse the hard wraps
  // before matching the phrases).
  const flat = block.replace(/\s+/g, ' ');
  assert.match(flat, /Regenerate ONLY the slides/);
  assert.match(flat, /the app then re-runs the html-slides/);
  // …and NOT the wireframe's in-place "save the same wireframe file" wording.
  assert.doesNotMatch(flat, /save the same wireframe file/);
});

test('a WIREFRAME annotation keeps the original in-place header', () => {
  const block = serializeAnnotations([
    toAnnotation('w1', {
      comment: 'Tighten this headline',
      slideIndex: 0,
      anchor: elementAnchor,
      surface: 'wireframe',
    }),
  ]);
  assert.match(block, /pinned these annotations on the wireframe/);
  assert.match(block, /save the same wireframe file/);
  assert.doesNotMatch(block, /Regenerate ONLY/);
});

test('an annotation with no surface defaults to the wireframe header (back-compat)', () => {
  const block = serializeAnnotations([
    toAnnotation('a1', { comment: 'Shorten it', slideIndex: 1, anchor: elementAnchor }),
  ]);
  assert.match(block, /on the wireframe/);
  assert.doesNotMatch(block, /Regenerate ONLY/);
});

test('the deck block still carries the SAME anchor / slide / screenshot lines', () => {
  const block = serializeAnnotations([
    toAnnotation('d1', {
      comment: 'Fix this figure',
      slideIndex: 2,
      anchor: textAnchor,
      screenshot: 'annotations/d1.png',
      surface: 'deck',
    }),
  ]);
  // Same capture, just a different header — the agent gets the full anchor.
  assert.match(block, /On slide 3/);
  assert.match(block, /within: `li:nth-of-type\(2\)`/);
  assert.match(block, /selected text: "92%"/);
  assert.match(block, /screenshot: annotations\/d1\.png/);
});

// --- 2. serializeFeedbackForTurn threads the surface ----------------------

test('serializeFeedbackForTurn routes a DECK annotation through the regenerate block', () => {
  const out = serializeFeedbackForTurn([
    fb({ id: 'd1', kind: 'annotation', text: 'Make the cover bolder', slideIndex: 0, anchor: elementAnchor, surface: 'deck' }),
  ]);
  assert.match(out, /<attached-preview-comments>/);
  assert.match(out, /Regenerate ONLY/);
  assert.match(out, /element `section#cover > h1`/);
});

test('serializeFeedbackForTurn keeps a WIREFRAME annotation on the in-place block', () => {
  const out = serializeFeedbackForTurn([
    fb({ id: 'w1', kind: 'annotation', text: 'Shorten the bullet', slideIndex: 1, anchor: textAnchor, surface: 'wireframe' }),
  ]);
  assert.match(out, /save the same wireframe file/);
  assert.doesNotMatch(out, /Regenerate ONLY/);
});

// --- 3. hasDeckAnnotations (the regenerate signal) ------------------------

test('hasDeckAnnotations is true only when a pending item is a deck annotation', () => {
  assert.equal(hasDeckAnnotations([]), false);
  assert.equal(
    hasDeckAnnotations([fb({ kind: 'comment', text: 'punchier' })]),
    false,
    'a free-text comment is not a deck annotation',
  );
  assert.equal(
    hasDeckAnnotations([fb({ kind: 'annotation', text: 'fix', surface: 'wireframe' })]),
    false,
    'a wireframe annotation is not a deck annotation',
  );
  assert.equal(
    hasDeckAnnotations([
      fb({ kind: 'comment', text: 'punchier' }),
      fb({ kind: 'annotation', text: 'fix the cover', surface: 'deck' }),
    ]),
    true,
    'a deck annotation in the mix flips the signal',
  );
});

// --- 4. surface survives the durable queue + regenerate survival ----------

test('the deck surface persists through the durable queue and reads back as pending', async () => {
  await withTempStore(async (env) => {
    const p = await createProject({ brief: 'deck' }, env);
    await appendFeedback(
      p.id,
      { kind: 'annotation', text: 'Fix the cover stat', selector: 'section#cover > h1', anchorText: 'Q3 yield review', slideIndex: 0, surface: 'deck' },
      env,
    );
    const pending = await readPendingFeedback(p.id, env);
    assert.equal(pending.length, 1);
    assert.equal(pending[0].surface, 'deck');
    assert.equal(hasDeckAnnotations(pending), true);
    // It serializes into the regenerate block for the next generate turn.
    assert.match(serializeFeedbackForTurn(pending), /Regenerate ONLY/);
  });
});

test('an interrupted regenerate leaves the deck annotations pending; a clean one consumes them', async () => {
  await withTempStore(async (env) => {
    const p = await createProject({ brief: 'deck' }, env);
    const a = await appendFeedback(p.id, { kind: 'annotation', text: 'Bolder cover', slideIndex: 0, surface: 'deck' }, env);

    // Interrupted regenerate: nothing is marked sent → still pending (survives).
    let pending = await readPendingFeedback(p.id, env);
    assert.equal(pending.length, 1, 'a deck annotation survives an interrupted regenerate');
    assert.equal(pending[0].surface, 'deck');

    // Clean regenerate: the daemon marks the carried items sent → queue drains.
    await markFeedbackSent(p.id, [a.id], env);
    pending = await readPendingFeedback(p.id, env);
    assert.equal(pending.length, 0, 'a clean regenerate consumes the deck annotations');
  });
});

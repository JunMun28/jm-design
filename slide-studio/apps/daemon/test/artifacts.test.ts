/**
 * Artifact Manifest suite (issue #8 / Slice 3, AC3): the daemon reads an
 * artifact's **Artifact Manifest** to pick the canvas surface (`kind =
 * 'wireframe'` → the sandboxed-iframe wireframe surface), and **infers**
 * kind/format from the output path/naming when no (usable) sidecar manifest
 * exists. This suite covers both: the parse and the path/naming inference
 * fallback. Uses a temp data dir for the on-disk resolve; no real CLI, no real
 * watcher.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, mkdir, utimes } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createProject, projectDir } from '../src/projects.ts';
import {
  countSlides,
  entryForChange,
  findLatestArtifact,
  inferFormat,
  inferKind,
  inferManifest,
  isArtifactPath,
  isPreviewableEntry,
  parseManifest,
  resolveManifest,
  type ArtifactManifest,
} from '../src/artifacts.ts';

async function withTempStore<T>(fn: (env: NodeJS.ProcessEnv) => Promise<T>): Promise<T> {
  const dir = await mkdtemp(join(tmpdir(), 'slide-studio-artifacts-'));
  const env = { ...process.env, SLIDE_STUDIO_DATA_DIR: dir } as NodeJS.ProcessEnv;
  try {
    return await fn(env);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

const WIREFRAME_HTML = `<!doctype html><html><body>
  <section class="deck">
    <article class="slide-panel" data-slide="01"><h2>Title</h2></article>
    <article class="slide-panel" data-slide="02"><h2>Problem</h2></article>
    <article class="slide-panel" data-slide="03"><h2>Solution</h2></article>
  </section>
</body></html>`;

// --- parse (the manifest contract) ---------------------------------------

test('parseManifest reads the locked contract { kind, format, entry, slides, theme }', () => {
  const raw = JSON.stringify({
    kind: 'wireframe',
    format: 'html',
    entry: 'wireframe.html',
    slides: 12,
    theme: null,
  });
  const m = parseManifest(raw);
  assert.deepEqual(m, {
    kind: 'wireframe',
    format: 'html',
    entry: 'wireframe.html',
    slides: 12,
    theme: null,
  } satisfies ArtifactManifest);
});

test('parseManifest keeps a deck manifest with its theme', () => {
  const m = parseManifest(
    JSON.stringify({ kind: 'deck', format: 'pptx', entry: 'deck.pptx', slides: 8, theme: 'micron-dark' }),
  );
  assert.equal(m?.kind, 'deck');
  assert.equal(m?.format, 'pptx');
  assert.equal(m?.theme, 'micron-dark');
  assert.equal(m?.slides, 8);
});

test('parseManifest returns null for non-object / invalid JSON', () => {
  assert.equal(parseManifest('not json'), null);
  assert.equal(parseManifest('[1,2,3]'), null);
  assert.equal(parseManifest('"a string"'), null);
  assert.equal(parseManifest('42'), null);
});

test('parseManifest INFERS kind/format from entry when the fields are missing/bogus', () => {
  // No kind/format at all → infer from the entry file name.
  const m1 = parseManifest(JSON.stringify({ entry: 'wireframe.html', slides: 4 }));
  assert.equal(m1?.kind, 'wireframe');
  assert.equal(m1?.format, 'html');

  // Bogus kind/format values fall back to inference (a malformed sidecar must
  // still render something, not dead-end).
  const m2 = parseManifest(JSON.stringify({ kind: 'banana', format: 'gif', entry: 'q3-deck.html' }));
  assert.equal(m2?.kind, 'deck'); // "deck" in the name
  assert.equal(m2?.format, 'html'); // .html extension
});

test('parseManifest falls back to fallbackEntry + sane defaults when entry is absent', () => {
  const m = parseManifest(JSON.stringify({ slides: 'NaN', theme: '' }), 'slides.html');
  assert.equal(m?.entry, 'slides.html');
  assert.equal(m?.kind, 'deck'); // "slides" in the fallback name
  assert.equal(m?.slides, 0); // non-numeric slides → 0
  assert.equal(m?.theme, null); // empty theme → null
});

// --- path / naming inference fallback ------------------------------------

test('inferKind: wireframe/skeleton names → wireframe; deck/slides/pitch → deck; default wireframe', () => {
  assert.equal(inferKind('out/wireframe.html'), 'wireframe');
  assert.equal(inferKind('brainstorm-skeleton.html'), 'wireframe');
  assert.equal(inferKind('q3-deck.html'), 'deck');
  assert.equal(inferKind('slides.html'), 'deck');
  assert.equal(inferKind('investor-pitch.html'), 'deck');
  assert.equal(inferKind('board-presentation.pptx'), 'deck');
  // Silent naming defaults to the low-fi review surface.
  assert.equal(inferKind('output.html'), 'wireframe');
});

test('inferFormat: .pptx → pptx; html-ish → html; default html', () => {
  assert.equal(inferFormat('deck.pptx'), 'pptx');
  assert.equal(inferFormat('wireframe.html'), 'html');
  assert.equal(inferFormat('wireframe.htm'), 'html');
  assert.equal(inferFormat('noext'), 'html');
});

test('inferManifest pairs kind+format from the path and marks itself inferred', () => {
  const m = inferManifest('project/out/wireframe.html', WIREFRAME_HTML);
  assert.equal(m.kind, 'wireframe');
  assert.equal(m.format, 'html');
  assert.equal(m.entry, 'wireframe.html'); // basename
  assert.equal(m.slides, 3); // counted from the body
  assert.equal(m.theme, null);
  assert.equal(m.inferred, true);
});

test('countSlides counts data-slide, then slide-panel, then .slide, then <section>', () => {
  assert.equal(countSlides(WIREFRAME_HTML), 3); // data-slide markers
  assert.equal(countSlides('<div class="slide-panel"></div><div class="slide-panel"></div>'), 2);
  assert.equal(countSlides('<div class="slide a"></div><div class="b slide"></div>'), 2);
  assert.equal(countSlides('<section></section><section></section><section></section>'), 3);
  assert.equal(countSlides('<p>no slides here</p>'), 0);
});

// --- watcher decision helpers --------------------------------------------

test('isArtifactPath: html/pptx entries + manifest sidecars yes; bookkeeping no', () => {
  assert.equal(isArtifactPath('wireframe.html'), true);
  assert.equal(isArtifactPath('deck.pptx'), true);
  assert.equal(isArtifactPath('wireframe.html.manifest.json'), true);
  assert.equal(isArtifactPath('project.json'), false);
  assert.equal(isArtifactPath('conversation.jsonl'), false);
  assert.equal(isArtifactPath('feedback-queue.jsonl'), false);
  assert.equal(isArtifactPath('notes.txt'), false);
});

test('isPreviewableEntry: HTML yes, pptx/binary no (the canvas only renders HTML)', () => {
  assert.equal(isPreviewableEntry('deck.html'), true);
  assert.equal(isPreviewableEntry('docs/brainstorms/wf.htm'), true);
  assert.equal(isPreviewableEntry('deck.pptx'), false);
});

test('entryForChange maps a sidecar back to its entry, and an entry to itself', () => {
  assert.equal(entryForChange('wireframe.html.manifest.json'), 'wireframe.html');
  assert.equal(entryForChange('wireframe.html'), 'wireframe.html');
  assert.equal(entryForChange('project.json'), null);
  // A .pptx is download-only — never a preview surface (it would render as
  // garbled binary in the iframe), so the watcher must not surface it.
  assert.equal(entryForChange('deck.pptx'), null);
  assert.equal(entryForChange('deck.pptx.manifest.json'), null);
});

// --- resolveManifest (on-disk, manifest-present vs inference fallback) ----

test('resolveManifest PREFERS the sidecar manifest (kind = wireframe surface)', async () => {
  await withTempStore(async (env) => {
    const p = await createProject({ brief: 'deck' }, env);
    const dir = projectDir(p.id, env);
    await writeFile(join(dir, 'wireframe.html'), WIREFRAME_HTML, 'utf8');
    await writeFile(
      join(dir, 'wireframe.html.manifest.json'),
      JSON.stringify({ kind: 'wireframe', format: 'html', entry: 'wireframe.html', slides: 3, theme: null }),
      'utf8',
    );

    const m = await resolveManifest(p.id, 'wireframe.html', env);
    assert.equal(m.kind, 'wireframe');
    assert.equal(m.format, 'html');
    assert.equal(m.slides, 3);
    assert.equal(m.inferred, undefined); // came from the real sidecar
  });
});

test('resolveManifest backfills the slide count from the HTML body when the manifest under-reports', async () => {
  await withTempStore(async (env) => {
    const p = await createProject({ brief: 'deck' }, env);
    const dir = projectDir(p.id, env);
    await writeFile(join(dir, 'wireframe.html'), WIREFRAME_HTML, 'utf8');
    // Manifest claims 0 slides; the body really has 3.
    await writeFile(
      join(dir, 'wireframe.html.manifest.json'),
      JSON.stringify({ kind: 'wireframe', format: 'html', entry: 'wireframe.html', slides: 0, theme: null }),
      'utf8',
    );

    const m = await resolveManifest(p.id, 'wireframe.html', env);
    assert.equal(m.slides, 3); // body is the source of truth
  });
});

test('resolveManifest INFERS from path/naming + body when there is no sidecar (fallback)', async () => {
  await withTempStore(async (env) => {
    const p = await createProject({ brief: 'deck' }, env);
    const dir = projectDir(p.id, env);
    // Only the HTML — no manifest sidecar.
    await writeFile(join(dir, 'wireframe.html'), WIREFRAME_HTML, 'utf8');

    const m = await resolveManifest(p.id, 'wireframe.html', env);
    assert.equal(m.kind, 'wireframe'); // inferred from the name
    assert.equal(m.format, 'html');
    assert.equal(m.slides, 3); // counted from the body
    assert.equal(m.inferred, true);
  });
});

test('findLatestArtifact prefers the HTML deck even when the .pptx is NEWER (preview must never load a binary)', async () => {
  // Repro of the garbled-preview bug: a "Both" generation writes deck.html then
  // builds deck.pptx (newer mtime). The canvas must still load the HTML, not the
  // binary zip — the .pptx is a download-only export.
  await withTempStore(async (env) => {
    const p = await createProject({ brief: 'deck' }, env);
    const dir = projectDir(p.id, env);
    await writeFile(join(dir, 'deck.html'), WIREFRAME_HTML, 'utf8');
    await writeFile(join(dir, 'deck.pptx'), 'PK binary zip bytes', 'utf8');
    const now = Date.now() / 1000;
    await utimes(join(dir, 'deck.html'), now - 30, now - 30);
    await utimes(join(dir, 'deck.pptx'), now, now); // pptx strictly newer
    const latest = await findLatestArtifact(p.id, env);
    assert.equal(latest, 'deck.html', 'the previewable HTML wins over a newer pptx');
  });
});

test('resolveManifest preserves the SUBDIR in entry (nested artifact the web must fetch by full path)', async () => {
  // The brainstorm wireframe is written to a subdir (e.g. docs/brainstorms/…html);
  // the web fetches the artifact by manifest.entry relative to the project dir, so
  // the subdir must survive — a bare basename would 404. Covers both branches.
  await withTempStore(async (env) => {
    const p = await createProject({ brief: 'deck' }, env);
    const dir = projectDir(p.id, env);
    await mkdir(join(dir, 'docs', 'brainstorms'), { recursive: true });
    const rel = 'docs/brainstorms/burn-in-rollout.html';
    await writeFile(join(dir, rel), WIREFRAME_HTML, 'utf8');

    // Inferred (no sidecar) — entry keeps the full relative path.
    const inferred = await resolveManifest(p.id, rel, env);
    assert.equal(inferred.entry, rel, 'inferred manifest keeps the subdir');

    // Sidecar present — entry is still the path we were given, not the JSON basename.
    await writeFile(
      join(dir, `${rel}.manifest.json`),
      JSON.stringify({ kind: 'wireframe', format: 'html', entry: 'burn-in-rollout.html', slides: 3, theme: null }),
      'utf8',
    );
    const withSidecar = await resolveManifest(p.id, rel, env);
    assert.equal(withSidecar.entry, rel, 'sidecar manifest entry is normalized to the full relative path');
  });
});

test('resolveManifest tolerates a MALFORMED sidecar by inferring from path/naming', async () => {
  await withTempStore(async (env) => {
    const p = await createProject({ brief: 'deck' }, env);
    const dir = projectDir(p.id, env);
    await mkdir(join(dir, 'out'), { recursive: true });
    await writeFile(join(dir, 'out', 'q3-slides.html'), WIREFRAME_HTML, 'utf8');
    await writeFile(join(dir, 'out', 'q3-slides.html.manifest.json'), '{ this is not json', 'utf8');

    const m = await resolveManifest(p.id, 'out/q3-slides.html', env);
    assert.equal(m.kind, 'deck'); // "slides" in the name
    assert.equal(m.format, 'html');
    assert.equal(m.slides, 3);
    assert.equal(m.inferred, true); // fell back to inference
  });
});

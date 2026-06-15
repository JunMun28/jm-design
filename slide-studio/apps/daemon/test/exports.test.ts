/**
 * Export Collector suite (Slice 7 / issue #14, M6): once the Deck is generated in
 * the chosen format(s), the Export Collector finds the outputs that ACTUALLY exist
 * and offers each as a download with a Brief-derived filename (§12). This suite
 * covers the AC: filename derivation (pure) + output validation (only-existing-
 * files), plus the path-safe download read — all against a temp project store, no
 * real CLI.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  collectExports,
  DECK_HTML_ENTRY,
  DECK_PPTX_ENTRY,
  exportFilename,
  readExportFile,
  slugifyTitle,
} from '../src/exports.ts';
import {
  createProject,
  projectDir,
  readProject,
  registerGeneratedDeck,
  setGate1,
  setGate2,
  setTheme,
  type ProjectRecord,
} from '../src/projects.ts';

async function withDataDir<T>(fn: (env: NodeJS.ProcessEnv) => Promise<T>): Promise<T> {
  const dir = await mkdtemp(join(tmpdir(), 'slide-studio-exports-'));
  const env = { ...process.env, SLIDE_STUDIO_DATA_DIR: dir };
  try {
    return await fn(env);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

// --- filename derivation (pure) -------------------------------------------

test('slugifyTitle lowercases, hyphenates, and bounds; empty → slide-deck', () => {
  assert.equal(slugifyTitle('Q3 Yield Ops Review'), 'q3-yield-ops-review');
  assert.equal(slugifyTitle('  weird  ***chars!!  '), 'weird-chars');
  assert.equal(slugifyTitle(''), 'slide-deck');
});

test('exportFilename prefers the Brief goal, then title, then brief (M6)', () => {
  const base: ProjectRecord = {
    id: 'x',
    title: 'Some Title',
    brief: 'raw brief text',
    runtimeId: null,
    theme: 'micron-dark',
    stage: 'deck',
    recordedBrief: { goal: 'Q3 yield ops review' },
    questionnaire: null,
    questionnaireAnswered: true,
    gate1: 'approved',
    gate2: 'approved',
    gate3: 'approved',
    formats: ['html', 'pptx'],
    createdAt: '',
    updatedAt: '',
  };
  assert.equal(exportFilename(base, 'pptx'), 'q3-yield-ops-review.pptx');
  assert.equal(exportFilename(base, 'html'), 'q3-yield-ops-review.html');
  // No goal → fall back to the title.
  const noGoal = { ...base, recordedBrief: {} };
  assert.equal(exportFilename(noGoal, 'pptx'), 'some-title.pptx');
});

// --- collection: only files that exist ------------------------------------

test('collectExports lists only the chosen formats that actually landed on disk', async () => {
  await withDataDir(async (env) => {
    const p = await createProject({ brief: 'A deck about Q3 yield' }, env);
    await setTheme(p.id, 'micron-dark', ['html', 'pptx'], env);
    const dir = projectDir(p.id, env);
    // Only the HTML deck was produced; the PPTX conversion failed / didn't run.
    await writeFile(join(dir, DECK_HTML_ENTRY), '<html>deck</html>', 'utf8');

    const project = { ...p, theme: 'micron-dark', formats: ['html', 'pptx'] as const } as ProjectRecord;
    const items = await collectExports(project, env);
    // PPTX was chosen but not produced → it is omitted (panel shows what's real).
    assert.equal(items.length, 1);
    assert.equal(items[0].format, 'html');
    assert.equal(items[0].entry, DECK_HTML_ENTRY);
    assert.ok(items[0].bytes > 0);
    assert.match(items[0].filename, /\.html$/);
  });
});

test('collectExports rejects a zero-byte stub (output validation, AC2)', async () => {
  await withDataDir(async (env) => {
    const p = await createProject({ brief: 'Yield review deck' }, env);
    const dir = projectDir(p.id, env);
    // A real HTML deck landed, but the PPTX conversion left an empty stub.
    await writeFile(join(dir, DECK_HTML_ENTRY), '<html>deck</html>', 'utf8');
    await writeFile(join(dir, DECK_PPTX_ENTRY), '', 'utf8');

    const project = { ...p, formats: ['html', 'pptx'] as const } as ProjectRecord;
    const items = await collectExports(project, env);
    // The empty PPTX is not offered; only the real HTML is downloadable.
    assert.equal(items.length, 1);
    assert.equal(items[0].format, 'html');
  });
});

test('collectExports lists BOTH outputs when HTML and PPTX both exist', async () => {
  await withDataDir(async (env) => {
    const p = await createProject({ brief: 'Yield review deck' }, env);
    const dir = projectDir(p.id, env);
    await writeFile(join(dir, DECK_HTML_ENTRY), '<html>deck</html>', 'utf8');
    await writeFile(join(dir, DECK_PPTX_ENTRY), Buffer.from('PK fake pptx'), 'utf8');

    const project = { ...p, formats: ['html', 'pptx'] as const } as ProjectRecord;
    const items = await collectExports(project, env);
    const formats = items.map((i) => i.format).sort();
    assert.deepEqual(formats, ['html', 'pptx']);
  });
});

// --- path-safe download ----------------------------------------------------

test('readExportFile returns bytes + content-type + Brief filename for a real output', async () => {
  await withDataDir(async (env) => {
    const p = await createProject({ brief: 'Q3 yield ops review' }, env);
    const dir = projectDir(p.id, env);
    await writeFile(join(dir, DECK_PPTX_ENTRY), Buffer.from('PK fake'), 'utf8');
    const project = { ...p, recordedBrief: { goal: 'Q3 yield ops review' }, formats: ['pptx'] as const } as ProjectRecord;

    const file = await readExportFile(project, DECK_PPTX_ENTRY, env);
    assert.ok(file);
    assert.match(file!.contentType, /presentationml\.presentation/);
    assert.equal(file!.filename, 'q3-yield-ops-review.pptx');
    assert.ok(file!.body.length > 0);
  });
});

test('readExportFile rejects a zero-byte stub (output validation, AC2)', async () => {
  await withDataDir(async (env) => {
    const p = await createProject({ brief: 'x' }, env);
    const dir = projectDir(p.id, env);
    await writeFile(join(dir, DECK_PPTX_ENTRY), '', 'utf8');
    const project = { ...p, formats: ['pptx'] as const } as ProjectRecord;
    // An empty output exists on disk but is not a real deck → not served.
    assert.equal(await readExportFile(project, DECK_PPTX_ENTRY, env), null);
  });
});

test('readExportFile rejects traversal and absolute paths (path-safety gate)', async () => {
  await withDataDir(async (env) => {
    const p = await createProject({ brief: 'x' }, env);
    const project = { ...p } as ProjectRecord;
    assert.equal(await readExportFile(project, '../../etc/passwd', env), null);
    assert.equal(await readExportFile(project, '/etc/passwd', env), null);
    // A wrong / unknown type is refused even if it existed.
    assert.equal(await readExportFile(project, 'project.json', env), null);
  });
});

// --- S2 variant data model ---------------------------------------------------

test('S2: collectExports lists the ACTIVE variant html (deck.<theme>.html), not deck.html', async () => {
  await withDataDir(async (env) => {
    const p = await createProject({ brief: 'deck' }, env);
    await setGate1(p.id, 'approve', env);
    await setGate2(p.id, 'approve', env);
    await setTheme(p.id, 'playful', undefined, env);
    const { writeFile } = await import('node:fs/promises');
    const { join } = await import('node:path');
    await writeFile(join(projectDir(p.id, env), 'deck.playful.html'), '<html><body>deck</body></html>');
    await registerGeneratedDeck(p.id, 'playful', env);
    const r = await readProject(p.id, env);
    const items = await collectExports(r!, env);
    assert.ok(items.some((i) => i.entry === 'deck.playful.html' && i.format === 'html'));
  });
});

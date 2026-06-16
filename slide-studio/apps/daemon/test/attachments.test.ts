/**
 * Attachment Stager suite (Slice 8 / issue #9). The three jobs the acceptance
 * criteria name — classify + size cap + staging — plus the contract that an
 * unsupported / oversized file surfaces a friendly note and NEVER blocks the run
 * (AC2), and the prompt block that makes the agent cite real figures (AC1). Uses
 * a temp data dir; no real CLI.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createProject } from '../src/projects.ts';
import {
  ACCEPTED_EXTENSIONS,
  attachmentsDir,
  classifyAttachment,
  extensionOf,
  listStagedAttachments,
  maxAttachmentBytes,
  readAttachmentFile,
  serializeAttachmentsBlock,
  stageAttachments,
  type StagedAttachment,
} from '../src/attachments.ts';

async function withTempStore<T>(
  fn: (env: NodeJS.ProcessEnv) => Promise<T>,
  extraEnv: Record<string, string> = {},
): Promise<T> {
  const dir = await mkdtemp(join(tmpdir(), 'slide-studio-att-'));
  const env = { ...process.env, SLIDE_STUDIO_DATA_DIR: dir, ...extraEnv } as NodeJS.ProcessEnv;
  try {
    return await fn(env);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

// --- classify (pure) -------------------------------------------------------

test('classifyAttachment buckets data / document / image / unsupported by extension', () => {
  assert.equal(classifyAttachment('yield-q3.csv'), 'data');
  assert.equal(classifyAttachment('Numbers.XLSX'), 'data'); // case-insensitive
  assert.equal(classifyAttachment('readout.tsv'), 'data');
  assert.equal(classifyAttachment('last-deck.pptx'), 'document');
  assert.equal(classifyAttachment('spec.pdf'), 'document');
  assert.equal(classifyAttachment('notes.docx'), 'document');
  assert.equal(classifyAttachment('screenshot.png'), 'image');
  assert.equal(classifyAttachment('chart.JPG'), 'image');
  assert.equal(classifyAttachment('malware.exe'), 'unsupported');
  assert.equal(classifyAttachment('archive.zip'), 'unsupported');
  assert.equal(classifyAttachment('no-extension'), 'unsupported');
  assert.equal(classifyAttachment(''), 'unsupported');
});

test('extensionOf + ACCEPTED_EXTENSIONS are lower-case, dot-less', () => {
  assert.equal(extensionOf('A.CSV'), 'csv');
  assert.equal(extensionOf('plain'), '');
  for (const exts of Object.values(ACCEPTED_EXTENSIONS)) {
    for (const e of exts) assert.equal(e, e.toLowerCase().replace(/^\./, ''));
  }
});

// --- size cap --------------------------------------------------------------

test('maxAttachmentBytes honors the env override and rejects garbage', () => {
  assert.equal(maxAttachmentBytes({ SLIDE_STUDIO_MAX_ATTACHMENT_BYTES: '1024' } as NodeJS.ProcessEnv), 1024);
  // Garbage / non-positive → falls back to the default (not NaN, not 0).
  assert.ok(maxAttachmentBytes({ SLIDE_STUDIO_MAX_ATTACHMENT_BYTES: 'nope' } as NodeJS.ProcessEnv) > 0);
  assert.ok(maxAttachmentBytes({ SLIDE_STUDIO_MAX_ATTACHMENT_BYTES: '-5' } as NodeJS.ProcessEnv) > 0);
});

test('size cap: an oversized file is skipped with a friendly note and never staged', async () => {
  // Tiny cap so a small buffer trips it.
  await withTempStore(
    async (env) => {
      const p = await createProject({ brief: 'deck' }, env);
      const big = Buffer.alloc(64, 0x41); // 64 bytes, over the 16-byte cap
      const result = await stageAttachments(p.id, [{ filename: 'huge.csv', data: big }], env);

      assert.equal(result.staged.length, 0);
      assert.equal(result.skipped.length, 1);
      assert.equal(result.skipped[0].reason, 'too-large');
      // Friendly, plain-language note — never a raw error.
      assert.match(result.skipped[0].note, /larger than/i);
      assert.match(result.skipped[0].note, /huge\.csv/);
      // Nothing was written.
      assert.equal(existsSync(attachmentsDir(p.id, env)), false);
    },
    { SLIDE_STUDIO_MAX_ATTACHMENT_BYTES: '16' },
  );
});

// --- staging ---------------------------------------------------------------

test('staging: a supported, under-cap data file is copied into the project attachments dir', async () => {
  await withTempStore(async (env) => {
    const p = await createProject({ brief: 'Q3 yield review' }, env);
    const csv = Buffer.from('metric,value\nyield,92.4%\nscrap,1.8%\n', 'utf8');
    const result = await stageAttachments(p.id, [{ filename: 'yield-q3.csv', data: csv }], env);

    assert.equal(result.skipped.length, 0);
    assert.equal(result.staged.length, 1);
    const staged = result.staged[0];
    assert.equal(staged.category, 'data');
    assert.equal(staged.relPath, 'attachments/yield-q3.csv');
    assert.equal(staged.bytes, csv.byteLength);

    // The bytes really landed under the project dir, intact.
    const onDisk = await readFile(join(attachmentsDir(p.id, env), 'yield-q3.csv'));
    assert.deepEqual(onDisk, csv);
  });
});

test('staging: mixed batch — supported staged, unsupported skipped, run never blocked', async () => {
  await withTempStore(async (env) => {
    const p = await createProject({ brief: 'deck' }, env);
    const result = await stageAttachments(
      p.id,
      [
        { filename: 'figures.csv', data: Buffer.from('a,b\n1,2\n') },
        { filename: 'evidence.png', data: Buffer.from([0x89, 0x50, 0x4e, 0x47]) },
        { filename: 'virus.exe', data: Buffer.from('MZ') },
        { filename: 'empty.csv', data: Buffer.alloc(0) },
      ],
      env,
    );

    assert.deepEqual(
      result.staged.map((s) => s.filename).sort(),
      ['evidence.png', 'figures.csv'],
    );
    const skippedByReason = Object.fromEntries(result.skipped.map((s) => [s.filename, s.reason]));
    assert.equal(skippedByReason['virus.exe'], 'unsupported');
    assert.equal(skippedByReason['empty.csv'], 'empty');
    // Every skip carries a friendly, non-empty note.
    for (const s of result.skipped) assert.ok(s.note.length > 0);
  });
});

test('staging: duplicate filenames are de-collided, both survive', async () => {
  await withTempStore(async (env) => {
    const p = await createProject({ brief: 'deck' }, env);
    const result = await stageAttachments(
      p.id,
      [
        { filename: 'data.csv', data: Buffer.from('first') },
        { filename: 'data.csv', data: Buffer.from('second') },
      ],
      env,
    );
    assert.equal(result.staged.length, 2);
    const names = (await readdir(attachmentsDir(p.id, env))).sort();
    assert.deepEqual(names, ['data-2.csv', 'data.csv']);
  });
});

test('staging: a path-traversal filename cannot escape the attachments dir', async () => {
  await withTempStore(async (env) => {
    const p = await createProject({ brief: 'deck' }, env);
    const result = await stageAttachments(
      p.id,
      [
        // No recognized extension → rejected at classify (also defuses traversal).
        { filename: '../../etc/passwd', data: Buffer.from('x') },
        // A traversal path WITH a supported extension: the leaf is sanitized so
        // it lands inside attachments/, never above it.
        { filename: '../../secret.csv', data: Buffer.from('a,b\n1,2\n') },
      ],
      env,
    );
    assert.equal(result.staged.length, 1);
    const staged = result.staged[0];
    assert.ok(staged.relPath.startsWith('attachments/'));
    assert.ok(!staged.relPath.includes('..'));
    const names = await readdir(attachmentsDir(p.id, env));
    // Exactly one staged leaf, with no separators or traversal segments.
    assert.equal(names.length, 1);
    assert.equal(names[0], 'secret.csv');
    assert.ok(!names[0].includes('/') && !names[0].includes('..'));
  });
});

test('listStagedAttachments re-reads what was staged (resume)', async () => {
  await withTempStore(async (env) => {
    const p = await createProject({ brief: 'deck' }, env);
    await stageAttachments(
      p.id,
      [
        { filename: 'b.csv', data: Buffer.from('1') },
        { filename: 'a.png', data: Buffer.from([0x89]) },
      ],
      env,
    );
    const listed = await listStagedAttachments(p.id, env);
    assert.deepEqual(
      listed.map((s) => s.filename),
      ['a.png', 'b.csv'],
    );
    assert.equal(listed[0].category, 'image');
    assert.equal(listed[1].category, 'data');
  });
});

test('listStagedAttachments returns [] for a project with no attachments', async () => {
  await withTempStore(async (env) => {
    const p = await createProject({ brief: 'deck' }, env);
    assert.deepEqual(await listStagedAttachments(p.id, env), []);
  });
});

// --- readAttachmentFile (file browser preview + download) ------------------

test('readAttachmentFile serves a staged file with bytes, content-type, and filename', async () => {
  await withTempStore(async (env) => {
    const p = await createProject({ brief: 'deck' }, env);
    const csv = Buffer.from('line,yield\nA,94.2\n', 'utf8');
    await stageAttachments(p.id, [{ filename: 'yield.csv', data: csv }], env);

    const file = await readAttachmentFile(p.id, 'attachments/yield.csv', env);
    assert.ok(file);
    assert.deepEqual(file!.body, csv);
    assert.match(file!.contentType, /^text\/csv/);
    assert.equal(file!.filename, 'yield.csv');
  });
});

test('readAttachmentFile maps image/pdf extensions to sensible content types', async () => {
  await withTempStore(async (env) => {
    const p = await createProject({ brief: 'deck' }, env);
    await stageAttachments(
      p.id,
      [
        { filename: 'chart.svg', data: Buffer.from('<svg/>') },
        { filename: 'report.pdf', data: Buffer.from('%PDF-1.4\n%%EOF') },
      ],
      env,
    );
    assert.equal((await readAttachmentFile(p.id, 'attachments/chart.svg', env))!.contentType, 'image/svg+xml');
    assert.equal((await readAttachmentFile(p.id, 'attachments/report.pdf', env))!.contentType, 'application/pdf');
  });
});

test('readAttachmentFile rejects a traversal that escapes the attachments dir (project.json leak)', async () => {
  await withTempStore(async (env) => {
    const p = await createProject({ brief: 'deck' }, env);
    // Stage something so the attachments dir exists.
    await stageAttachments(p.id, [{ filename: 'ok.csv', data: Buffer.from('a,b\n1,2\n') }], env);
    // project.json is a real file in the project dir with an accepted (.json)
    // extension — the entry must NOT be able to climb out of attachments/ to it.
    assert.equal(await readAttachmentFile(p.id, 'attachments/../project.json', env), null);
    // A bare project-file entry (no attachments/ prefix) is rejected too.
    assert.equal(await readAttachmentFile(p.id, 'project.json', env), null);
  });
});

test('readAttachmentFile rejects absolute paths, deep traversal, and missing files', async () => {
  await withTempStore(async (env) => {
    const p = await createProject({ brief: 'deck' }, env);
    await stageAttachments(p.id, [{ filename: 'ok.csv', data: Buffer.from('x,y\n1,2\n') }], env);
    assert.equal(await readAttachmentFile(p.id, '/etc/passwd', env), null);
    assert.equal(await readAttachmentFile(p.id, 'attachments/../../../../etc/passwd', env), null);
    assert.equal(await readAttachmentFile(p.id, 'attachments/nope.png', env), null);
  });
});

// --- prompt block (AC1: cite real figures) ---------------------------------

test('serializeAttachmentsBlock lists staged files and tells the agent not to invent numbers', () => {
  const staged: StagedAttachment[] = [
    { filename: 'yield-q3.csv', category: 'data', relPath: 'attachments/yield-q3.csv', bytes: 40 },
    { filename: 'shot.png', category: 'image', relPath: 'attachments/shot.png', bytes: 100 },
  ];
  const block = serializeAttachmentsBlock(staged);
  assert.match(block, /<attached-source-files>/);
  assert.match(block, /do NOT invent numbers/i);
  assert.match(block, /attachments\/yield-q3\.csv/);
  assert.match(block, /attachments\/shot\.png/);
  assert.match(block, /<\/attached-source-files>/);
});

test('serializeAttachmentsBlock is empty when nothing is staged', () => {
  assert.equal(serializeAttachmentsBlock([]), '');
});

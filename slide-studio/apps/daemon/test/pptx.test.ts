/**
 * Editable-PPTX conversion suite (Slice 6 / issue #13, AC2): when the user chooses
 * PPTX, the daemon converts the generated HTML Deck into an EDITABLE PowerPoint via
 * the vendored `html-to-pptx` skill in `--mode layered` (real text boxes, not a
 * flat image). This suite covers the argv builder (pure), the success/failure
 * classification, and the runner with a FAKE child — no real Playwright / node
 * converter / CLI. AC2's "opens in PowerPoint and is editable" rests on the
 * `--mode layered` flag, which the argv test pins down.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { existsSync } from 'node:fs';
import {
  buildPptxArgs,
  classifyPptx,
  converterScriptPath,
  htmlToPptxRoot,
  pptxOutputPath,
  runConvertToPptx,
  type PptxSpawnFn,
} from '../src/pptx.ts';

// --- output pairing (pure) ------------------------------------------------

test('pptxOutputPath pairs the deck HTML with a sibling .pptx', () => {
  assert.equal(pptxOutputPath('/p/deck.html'), '/p/deck.pptx');
  assert.equal(pptxOutputPath('/a/b/q3-review.html'), '/a/b/q3-review.pptx');
});

// --- argv builder (pure) --------------------------------------------------

test('buildPptxArgs runs the converter via node in --mode layered (editable, AC2)', () => {
  const { bin, args } = buildPptxArgs({ htmlPath: '/p/deck.html' });
  assert.equal(bin, 'node');
  assert.equal(args[0], converterScriptPath());
  assert.equal(args[1], '/p/deck.html');
  // --mode layered is the AC2 requirement: real, editable text boxes, not a flat
  // image. Without it the converter defaults to `image` (a flat raster).
  const modeIdx = args.indexOf('--mode');
  assert.ok(modeIdx > 0);
  assert.equal(args[modeIdx + 1], 'layered');
  // --out defaults to the sibling .pptx.
  const outIdx = args.indexOf('--out');
  assert.equal(args[outIdx + 1], '/p/deck.pptx');
  // The OPTIONAL Python/LibreOffice validator is OFF by default (not present on
  // the target machines; it only nitpicks pixel deltas, never blocks editability).
  assert.ok(!args.includes('--validate'), 'validator is opt-in, not on by default');
});

test('buildPptxArgs honors an explicit out path, workdir, and scale', () => {
  const { args } = buildPptxArgs({
    htmlPath: '/p/deck.html',
    outPath: '/out/final.pptx',
    workdir: '/tmp/run',
    scale: 3,
  });
  assert.equal(args[args.indexOf('--out') + 1], '/out/final.pptx');
  assert.equal(args[args.indexOf('--workdir') + 1], '/tmp/run');
  assert.equal(args[args.indexOf('--scale') + 1], '3');
});

test('buildPptxArgs opts into the validator only when explicitly enabled', () => {
  assert.ok(buildPptxArgs({ htmlPath: '/p/deck.html', validate: true }).args.includes('--validate'));
  assert.ok(!buildPptxArgs({ htmlPath: '/p/deck.html', validate: false }).args.includes('--validate'));
});

test('the vendored html-to-pptx converter actually exists at the resolved path', () => {
  assert.ok(existsSync(converterScriptPath()), `converter should exist: ${converterScriptPath()}`);
  assert.ok(existsSync(htmlToPptxRoot()));
});

// --- classification (pure) ------------------------------------------------

test('classifyPptx: exit 0 + file written → ok (editable PPTX)', () => {
  const r = classifyPptx(0, '/p/deck.pptx', true, 'Wrote /p/deck.pptx');
  assert.equal(r.ok, true);
  assert.equal(r.produced, true);
  assert.match(r.summary, /editable/i);
});

test('classifyPptx: exit 0 but NO file → failed (must produce a real deck)', () => {
  const r = classifyPptx(0, '/p/deck.pptx', false, 'done');
  assert.equal(r.ok, false);
  assert.match(r.summary, /not produced/i);
});

test('classifyPptx: non-zero exit → failed', () => {
  const r = classifyPptx(1, '/p/deck.pptx', false, 'Error: missing slides');
  assert.equal(r.ok, false);
  assert.match(r.output, /missing slides/);
});

// --- runner with a fake child --------------------------------------------

/** A fake child the run can drive: push stdout/stderr, then close with a code. */
class FakePptxChild extends EventEmitter {
  stdout = new EventEmitter();
  stderr = new EventEmitter();
}

function fakeSpawn(script: (child: FakePptxChild) => void): PptxSpawnFn {
  return () => {
    const child = new FakePptxChild();
    queueMicrotask(() => script(child));
    return child as unknown as ReturnType<PptxSpawnFn>;
  };
}

test('runConvertToPptx resolves ok=true when the converter exits 0 and the .pptx exists', async () => {
  const result = await runConvertToPptx({
    htmlPath: '/p/deck.html',
    fileExists: () => true,
    spawn: fakeSpawn((child) => {
      child.stdout.emit('data', 'Wrote /p/deck.pptx (layered)\n');
      child.emit('close', 0);
    }),
  });
  assert.equal(result.ok, true);
  assert.equal(result.produced, true);
  assert.match(result.output, /layered/);
});

test('runConvertToPptx resolves ok=false when the converter exits non-zero', async () => {
  const result = await runConvertToPptx({
    htmlPath: '/p/deck.html',
    fileExists: () => false,
    spawn: fakeSpawn((child) => {
      child.stderr.emit('data', 'Converter failed: blank capture on slide 2\n');
      child.emit('close', 1);
    }),
  });
  assert.equal(result.ok, false);
  assert.match(result.output, /blank capture on slide 2/);
});

test('runConvertToPptx resolves a friendly failed result on a spawn error (no throw)', async () => {
  const result = await runConvertToPptx({
    htmlPath: '/p/deck.html',
    fileExists: () => false,
    spawn: fakeSpawn((child) => {
      child.emit('error', new Error('spawn node ENOENT'));
    }),
  });
  assert.equal(result.ok, false);
  assert.match(result.output, /could not run|ENOENT/i);
});

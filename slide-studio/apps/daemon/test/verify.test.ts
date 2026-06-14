/**
 * html-slides verify-gate suite (Slice 5 / issue #12, AC2): before a generated
 * Deck is presented as done, the daemon runs the html-slides verify gate
 * (`verify.py <deck> --theme <id>`), which exits 0 on pass and non-zero on fail.
 * This suite covers the argv builder (pure), the pass/fail classification, and
 * the runner with a FAKE child — no real Playwright / uv / CLI.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { existsSync } from 'node:fs';
import {
  buildVerifyArgs,
  classifyVerify,
  htmlSlidesRoot,
  runVerify,
  verifyScriptPath,
  type VerifySpawnFn,
} from '../src/verify.ts';

// --- argv builder (pure) --------------------------------------------------

test('buildVerifyArgs runs verify.py via uv with the chosen --theme', () => {
  const { bin, args } = buildVerifyArgs({ htmlPath: '/p/deck.html', theme: 'micron-dark' });
  assert.equal(bin, 'uv');
  assert.equal(args[0], 'run');
  assert.equal(args[1], verifyScriptPath());
  assert.equal(args[2], '/p/deck.html');
  // --theme is ALWAYS passed so the per-theme brand lints actually run (verify.py
  // errors out without it).
  const themeIdx = args.indexOf('--theme');
  assert.ok(themeIdx > 0);
  assert.equal(args[themeIdx + 1], 'micron-dark');
});

test('buildVerifyArgs forwards an output dir when given', () => {
  const { args } = buildVerifyArgs({ htmlPath: '/p/deck.html', theme: 'micron-light', outputDir: '/p/shots' });
  const idx = args.indexOf('--output');
  assert.ok(idx > 0);
  assert.equal(args[idx + 1], '/p/shots');
});

test('the vendored verify.py actually exists at the resolved path', () => {
  assert.ok(existsSync(verifyScriptPath()), `verify.py should exist: ${verifyScriptPath()}`);
  assert.ok(existsSync(htmlSlidesRoot()));
});

// --- classification (pure) ------------------------------------------------

test('classifyVerify: exit 0 → passed', () => {
  const r = classifyVerify(0, 'Screenshots: /p/shots');
  assert.equal(r.passed, true);
  assert.equal(r.exitCode, 0);
  assert.match(r.summary, /passed/i);
});

test('classifyVerify: non-zero → failed with a fix-and-regenerate summary', () => {
  const r = classifyVerify(1, 'Page errors:\n- contrast too low');
  assert.equal(r.passed, false);
  assert.match(r.summary, /did not pass/i);
  assert.match(r.output, /contrast too low/);
});

test('classifyVerify: null exit (spawn failure) → failed', () => {
  assert.equal(classifyVerify(null, 'boom').passed, false);
});

// --- runner with a fake child --------------------------------------------

/** A fake child the run can drive: push stdout/stderr, then close with a code. */
class FakeVerifyChild extends EventEmitter {
  stdout = new EventEmitter();
  stderr = new EventEmitter();
}

function fakeSpawn(script: (child: FakeVerifyChild) => void): VerifySpawnFn {
  return () => {
    const child = new FakeVerifyChild();
    // Drive it on the next tick so the runner has wired its listeners.
    queueMicrotask(() => script(child));
    return child as unknown as ReturnType<VerifySpawnFn>;
  };
}

test('runVerify resolves passed=true when the gate exits 0', async () => {
  const result = await runVerify({
    htmlPath: '/p/deck.html',
    theme: 'micron-dark',
    spawn: fakeSpawn((child) => {
      child.stdout.emit('data', 'Screenshots: /p/shots\n');
      child.emit('close', 0);
    }),
  });
  assert.equal(result.passed, true);
  assert.match(result.output, /Screenshots/);
});

test('runVerify resolves passed=false when the gate exits non-zero', async () => {
  const result = await runVerify({
    htmlPath: '/p/deck.html',
    theme: 'micron-dark',
    spawn: fakeSpawn((child) => {
      child.stderr.emit('data', 'Page errors:\n- overflow on slide 3\n');
      child.emit('close', 1);
    }),
  });
  assert.equal(result.passed, false);
  assert.match(result.output, /overflow on slide 3/);
});

test('runVerify resolves a friendly failed result on a spawn error (no throw)', async () => {
  const result = await runVerify({
    htmlPath: '/p/deck.html',
    theme: 'micron-dark',
    spawn: fakeSpawn((child) => {
      child.emit('error', new Error('spawn uv ENOENT'));
    }),
  });
  assert.equal(result.passed, false);
  assert.match(result.output, /could not run|ENOENT/i);
});

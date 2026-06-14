/**
 * REAL verify-gate integration proof (Slice 5 / issue #12, AC2).
 *
 * The fast `verify.test.ts` suite exercises {@link runVerify} with a FAKE child
 * — fine for the pass/fail mapping, but it never proves a real generated Deck
 * actually clears the html-slides gate. This suite closes that gap end-to-end on
 * the SAME code path the daemon's `generate` handler uses in production:
 *
 *   1. Scaffold a REAL themed `deck.html` with the vendored html-slides tool
 *      (`scripts/scaffold-deck.py --theme <id>`) — the same engine an agent run
 *      writes the Deck with.
 *   2. Run the production {@link runVerify} with its DEFAULT real
 *      `child_process.spawn` (no injected fake) — i.e. a real
 *      `uv run scripts/verify.py <deck> --theme <id>` with real Playwright.
 *   3. Assert it reaches a GREEN (exit-0) pass and wrote its fixed-stage
 *      screenshots — the gate the Deck is presented as done on (§12).
 *
 * This is the headless proof that "a real generated deck actually clears the
 * gate" — not just that the wiring exists. It is slow (Playwright render) and
 * needs `uv` on PATH, so it lives in its own *.integration.test.ts file and is
 * SKIPPED (not failed) when `uv` is unavailable, so the fast unit suite — run as
 * `node --test test/*.test.ts` — stays fast and hermetic.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { htmlSlidesRoot, runVerify } from '../src/verify.ts';

/** Is `uv` (the verifier's runner) invocable here? Skip the suite if not. */
function uvAvailable(): boolean {
  try {
    const r = spawnSync('uv', ['--version'], { stdio: 'ignore' });
    return r.status === 0;
  } catch {
    return false;
  }
}

const SKILL_ROOT = htmlSlidesRoot();
const SCAFFOLD = join(SKILL_ROOT, 'scripts', 'scaffold-deck.py');
const HAS_UV = uvAvailable();
const HAS_SCAFFOLD = existsSync(SCAFFOLD);
// A theme-less title would trip the Micron sentence-case lint (exit 1); a real
// agent writes sentence-case titles, so the proof deck does too.
const THEME = 'micron-dark';

test(
  'a REAL scaffolded deck clears the html-slides verify gate via the production runVerify (AC2)',
  { skip: !HAS_UV || !HAS_SCAFFOLD ? 'uv or scaffold-deck.py unavailable' : false },
  async () => {
    const work = mkdtempSync(join(tmpdir(), 'slide-studio-verify-real-'));
    try {
      // 1. Produce a REAL themed deck.html with the vendored engine tool.
      const deckPath = join(work, 'deck.html');
      const scaffold = spawnSync(
        'uv',
        ['run', SCAFFOLD, '--theme', THEME, '--title', 'Q3 yield operations review', deckPath],
        { cwd: SKILL_ROOT, encoding: 'utf8' },
      );
      assert.equal(scaffold.status, 0, `scaffold failed: ${scaffold.stderr || scaffold.stdout}`);
      assert.ok(existsSync(deckPath), 'scaffold should have written a real deck.html');

      // 2. Run the PRODUCTION verify gate — real default spawn, real Playwright,
      //    exactly as the daemon's generate handler does.
      const shots = join(work, 'verify-screenshots');
      const result = await runVerify({ htmlPath: deckPath, theme: THEME, outputDir: shots });

      // 3. It must reach a GREEN (exit-0) pass — the Deck-is-done gate (§12).
      assert.equal(
        result.passed,
        true,
        `real verify gate did NOT pass (exit ${result.exitCode}):\n${result.output}`,
      );
      assert.equal(result.exitCode, 0);
      assert.match(result.summary, /passed/i);
      // The fixed-stage screenshots the gate renders must be on disk.
      assert.ok(existsSync(shots), 'verifier should have written its screenshots dir');
      const pngs = readdirSync(shots).filter((f) => f.endsWith('.png'));
      assert.ok(pngs.length > 0, 'verifier should have written at least one screenshot');
    } finally {
      rmSync(work, { recursive: true, force: true });
    }
  },
);

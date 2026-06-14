/**
 * REAL editable-PPTX integration proof (Slice 6 / issue #13, AC2).
 *
 * The fast `pptx.test.ts` suite exercises {@link runConvertToPptx} with a FAKE
 * child — fine for the success/failure mapping, but it never proves a real Deck is
 * actually turned into a PowerPoint that "opens in PowerPoint and is EDITABLE (real
 * text boxes, not flat images)" — the literal AC2 text. This suite closes that gap
 * end-to-end on the SAME code path the daemon's `generate` handler uses:
 *
 *   1. Write a small but real `.slide`-based HTML deck (headings, label, body) —
 *      the shape the html-slides engine produces.
 *   2. Run the production {@link runConvertToPptx} with its DEFAULT real
 *      `child_process.spawn` (no injected fake) — i.e. a real
 *      `node scripts/html_to_pptx.mjs <deck> --mode layered …` with real Playwright
 *      + PptxGenJS, exactly as the daemon does when the user picks PPTX.
 *   3. Unzip the produced `.pptx` and assert each slide carries REAL editable text
 *      runs (`<a:t>…`) inside shapes (`<p:sp>`) — i.e. selectable/editable text
 *      boxes, not a single flat image. That is the AC2 proof.
 *
 * It is slow (Playwright render) and needs the converter's deps (playwright,
 * pptxgenjs, sharp) + a Chromium browser, so it lives in its own
 * *.integration.test.ts file and is SKIPPED (not failed) when those are
 * unavailable — the fast unit suite (`node --test test/*.test.ts`) stays hermetic.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { converterScriptPath, htmlToPptxRoot, runConvertToPptx } from '../src/pptx.ts';

/** Are the converter's deps resolvable from the skill cwd? (It uses the host
 *  repo's node_modules via upward resolution.) Skip the suite if not. */
function converterDepsAvailable(): boolean {
  try {
    const req = createRequire(join(htmlToPptxRoot(), 'scripts', 'noop.cjs'));
    req.resolve('playwright');
    req.resolve('pptxgenjs');
    req.resolve('sharp');
    return true;
  } catch {
    return false;
  }
}

/** Can Playwright launch Chromium here? The converter renders the HTML in it. */
function chromiumLaunchable(): boolean {
  // Probe in a child so a missing-browser crash can't take down the test runner.
  const probe =
    "const{chromium}=require('playwright');chromium.launch().then(b=>b.close()).then(()=>process.exit(0)).catch(()=>process.exit(1));";
  try {
    const r = spawnSync(process.execPath, ['-e', probe], { cwd: htmlToPptxRoot(), stdio: 'ignore', timeout: 60000 });
    return r.status === 0;
  } catch {
    return false;
  }
}

const HAS_DEPS = converterDepsAvailable();
const HAS_CHROMIUM = HAS_DEPS && chromiumLaunchable();

const DECK_HTML = `<!doctype html><html><head><meta charset="utf-8"><style>
*{margin:0;box-sizing:border-box;font-family:Arial,sans-serif}
.slide{width:1280px;height:720px;background:#0b1020;color:#fff;padding:80px;position:relative}
h1{font-size:64px;font-weight:800;margin-bottom:24px}
p{font-size:28px;line-height:1.5;color:#cdd6f4}
.label{position:absolute;top:40px;left:80px;font-size:18px;color:#89b4fa;letter-spacing:2px}
</style></head><body>
<div class="slide"><div class="label">SLICE 6 PROOF</div><h1>Editable PPTX from HTML</h1><p>This heading and body become real, selectable PowerPoint text boxes.</p></div>
<div class="slide"><div class="label">SLIDE TWO</div><h1>Layered conversion</h1><p>Background raster plus foreground editable text — not a flat image.</p></div>
</body></html>`;

test(
  'a REAL deck converts to an EDITABLE .pptx (real text boxes, not flat images) via production runConvertToPptx (AC2)',
  {
    skip: !HAS_CHROMIUM
      ? `converter deps / Chromium unavailable (deps=${HAS_DEPS}); skipping the real PPTX proof`
      : false,
  },
  async () => {
    const work = mkdtempSync(join(tmpdir(), 'slide-studio-pptx-real-'));
    try {
      const deckPath = join(work, 'deck.html');
      const outPath = join(work, 'deck.pptx');
      writeFileSync(deckPath, DECK_HTML, 'utf8');
      assert.ok(converterScriptPath().endsWith('html_to_pptx.mjs'));

      // Run the PRODUCTION converter — real default spawn, real Playwright +
      // PptxGenJS, layered mode — exactly as the daemon does for a PPTX choice.
      const result = await runConvertToPptx({
        htmlPath: deckPath,
        outPath,
        workdir: join(work, 'build'),
        scale: 1,
      });

      assert.equal(result.ok, true, `conversion did NOT succeed:\n${result.output}`);
      assert.equal(result.produced, true, 'the .pptx file must be on disk');
      assert.match(result.summary, /editable/i);

      // Prove AC2: the .pptx is a real OOXML package whose slides carry editable
      // text runs (<a:t>) inside shapes (<p:sp>) — not just a single image.
      const bytes = readFileSync(outPath);
      assert.ok(bytes.length > 0, 'the .pptx must have content');
      // OOXML packages are ZIPs; the local-file-header signature "PK\x03\x04" must lead.
      assert.equal(bytes.subarray(0, 2).toString('latin1'), 'PK', '.pptx must be a ZIP/OOXML package');

      // Extract the slide XML parts and inspect them for editable text runs.
      const slideXml = extractSlideXml(outPath, work);
      assert.ok(slideXml.length >= 1, 'the deck must have at least one slide XML part');
      const editableText = slideXml.join('').match(/<a:t>[^<]+<\/a:t>/g) ?? [];
      assert.ok(
        editableText.length >= 4,
        `expected several editable text runs across slides, got ${editableText.length}`,
      );
      // The actual deck copy must round-trip as editable text (not rasterized).
      const allText = editableText.join(' ');
      assert.match(allText, /Editable PPTX from HTML/, 'the heading must be an editable text run');
      assert.match(allText, /Layered conversion/, 'slide-2 heading must be an editable text run');
    } finally {
      rmSync(work, { recursive: true, force: true });
    }
  },
);

/** Read the ppt/slides/*.xml parts out of the .pptx. Uses the system `unzip`
 *  (always present on macOS/Linux CI) — a tiny, dependency-free extractor. */
function extractSlideXml(pptxPath: string, work: string): string[] {
  const out = join(work, 'unzipped');
  const r = spawnSync('unzip', ['-o', '-q', pptxPath, 'ppt/slides/*.xml', '-d', out], { encoding: 'utf8' });
  if (r.status !== 0) return [];
  const dir = join(out, 'ppt', 'slides');
  let files: string[];
  try {
    files = readdirSync(dir).filter((f) => /^slide\d+\.xml$/.test(f));
  } catch {
    return [];
  }
  return files.map((f) => readFileSync(join(dir, f), 'utf8'));
}

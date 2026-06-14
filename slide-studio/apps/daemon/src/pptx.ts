/**
 * Editable-PPTX conversion (plan §12, issue #13 / Slice 6, AC2).
 *
 * When the user chooses the **PPTX** output format (or PPTX+HTML), the daemon
 * turns the generated single-file HTML Deck into a PowerPoint that opens in
 * PowerPoint and is **editable** — real text boxes, not a flat image. It runs the
 * existing **`html-to-pptx`** skill in **`--mode layered`**: layer 1 is a
 * pixel-perfect background raster (charts, SVG, photos), layer 2 is every
 * heading/body/label re-added as a real, editable PowerPoint text box over its
 * original geometry. We do **not** reimplement the converter — we drive the
 * vendored skill (§9.1, N6), the same way {@link runVerify} drives the html-slides
 * verify gate.
 *
 * The argv builder is pure (no spawn) so it is unit-testable; the runner takes an
 * INJECTED spawn so the convert's success/failure handling is testable with a fake
 * child — no real Playwright, no real `node` converter, no real CLI (the Slice-6
 * PPTX suite).
 */
import { spawn as nodeSpawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { basename, dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Resolve the vendored html-to-pptx skill root (skills/html-to-pptx). */
export function htmlToPptxRoot(): string {
  return join(__dirname, '..', '..', '..', 'skills', 'html-to-pptx');
}

/** Path to the vendored converter script the conversion runs. */
export function converterScriptPath(): string {
  return join(htmlToPptxRoot(), 'scripts', 'html_to_pptx.mjs');
}

/**
 * Derive the PPTX output path that pairs with a generated HTML Deck — same
 * directory + base name, `.pptx` extension (`deck.html` → `deck.pptx`). Pure so
 * the pairing is testable; the Export panel surfaces this file by a Brief-derived
 * name (see exports.ts), but on disk it sits next to the Deck.
 */
export function pptxOutputPath(htmlPath: string): string {
  const dir = dirname(htmlPath);
  const base = basename(htmlPath, extname(htmlPath));
  return join(dir, `${base}.pptx`);
}

export interface PptxArgs {
  /** Absolute path to the generated single-file HTML Deck to convert. */
  htmlPath: string;
  /** Where the editable .pptx is written (defaults next to the Deck). */
  outPath?: string;
  /** Scratch dir for screenshots / manifest / validation (defaults next to out). */
  workdir?: string;
  /** Device scale factor for sharper raster layers. Default 2 (the skill default). */
  scale?: number;
  /**
   * Run the converter's OPTIONAL Python/LibreOffice round-trip validator after
   * writing the .pptx. Default **false**: the validator needs python3 + Pillow
   * (and LibreOffice for the render pass) — none of which the target non-technical
   * Windows machines have — and it exits non-zero on cosmetic pixel-delta nitpicks
   * even when a perfectly editable .pptx was written. We gate success on the .pptx
   * actually landing (see {@link classifyPptx}), not on this advisory pass.
   */
  validate?: boolean;
}

/**
 * Build the `node scripts/html_to_pptx.mjs <deck.html> --out <deck.pptx>
 * --mode layered …` argv that produces the **editable** PPTX (AC2). `--mode
 * layered` is what makes the text real, editable text boxes rather than a flat
 * image — the acceptance criterion. Pure: no spawn, fully testable.
 *
 * Returns `{ bin, args }` where `bin` is `node`. The caller spawns with cwd =
 * the html-to-pptx skill root so the converter's bundled `node_modules`
 * (playwright, pptxgenjs, sharp) resolve.
 */
export function buildPptxArgs(input: PptxArgs): { bin: string; args: string[] } {
  const outPath = input.outPath ?? pptxOutputPath(input.htmlPath);
  const workdir = input.workdir ?? join(dirname(outPath), 'pptx-build');
  const scale = input.scale ?? 2;
  const args = [
    converterScriptPath(),
    input.htmlPath,
    '--out',
    outPath,
    // layered = editable text boxes on top of a pixel-perfect background raster.
    // This is the AC2 requirement: "real text boxes, not flat images".
    '--mode',
    'layered',
    '--workdir',
    workdir,
    '--scale',
    String(scale),
  ];
  // The optional Python/LibreOffice round-trip validator is OFF by default (it
  // isn't present on the target machines and only nitpicks pixel deltas). Pass
  // `validate: true` to opt in where the deps exist.
  if (input.validate === true) args.push('--validate');
  return { bin: 'node', args };
}

/** The structured outcome of one PPTX conversion the UI presents the Deck on. */
export interface PptxResult {
  /** True only when the converter exited 0 AND wrote the .pptx file. */
  ok: boolean;
  /** The process exit code (0 = converted; non-zero / null = failed). */
  exitCode: number | null;
  /** Absolute path to the editable .pptx (present whether or not it was written). */
  outPath: string;
  /** True when the .pptx file actually exists on disk after the run. */
  produced: boolean;
  /** The converter's combined stdout+stderr (the failure detail, when it failed). */
  output: string;
  /** A friendly one-line summary for the chat / Export panel. */
  summary: string;
}

/**
 * Classify a finished conversion into a {@link PptxResult}. Pure (no spawn) so the
 * success/failure mapping is testable directly: it counts as a success only when
 * the converter exited 0 **and** the .pptx is on disk (an exit-0 with no file is
 * still a failure — the user must get a real, openable deck). Extracted so both
 * the real runner and the tests share one source of truth for "converted".
 */
export function classifyPptx(
  exitCode: number | null,
  outPath: string,
  produced: boolean,
  output: string,
): PptxResult {
  const ok = exitCode === 0 && produced;
  const summary = ok
    ? 'Built an editable PowerPoint (.pptx) — real text boxes you can edit in PowerPoint.'
    : produced
      ? 'The PowerPoint conversion reported a problem — the .pptx may be incomplete. Try generating again.'
      : 'The PowerPoint file was not produced. Try generating the deck again.';
  return { ok, exitCode, outPath, produced, output: output.trim(), summary };
}

/** Minimal child shape the runner needs (real child_process satisfies it). */
interface PptxChild {
  stdout: { on(event: 'data', cb: (chunk: Buffer | string) => void): void } | null;
  stderr: { on(event: 'data', cb: (chunk: Buffer | string) => void): void } | null;
  on(event: 'error', cb: (err: Error) => void): void;
  on(event: 'close', cb: (code: number | null) => void): void;
}

export type PptxSpawnFn = (
  bin: string,
  args: string[],
  options: { cwd?: string },
) => PptxChild;

export interface RunConvertOptions extends PptxArgs {
  /** Injected spawn so the conversion is testable with a fake child. Defaults to
   *  the real `child_process.spawn`. */
  spawn?: PptxSpawnFn;
  /** Injected existence check so the "did it write the file" branch is testable
   *  without touching disk. Defaults to the real `fs.existsSync`. */
  fileExists?: (path: string) => boolean;
}

/**
 * Convert a generated HTML Deck to an **editable** PPTX and resolve a structured
 * {@link PptxResult} (AC2). A spawn failure (e.g. `node` missing, the bundled
 * converter not installed) resolves to a failed result with a friendly summary
 * rather than throwing — a missing converter must surface as "couldn't build the
 * PPTX", not crash the run.
 */
export function runConvertToPptx(options: RunConvertOptions): Promise<PptxResult> {
  const {
    spawn = nodeSpawn as unknown as PptxSpawnFn,
    fileExists = existsSync,
  } = options;
  const { bin, args } = buildPptxArgs(options);
  const outPath = options.outPath ?? pptxOutputPath(options.htmlPath);
  return new Promise<PptxResult>((resolve) => {
    let output = '';
    let child: PptxChild;
    try {
      child = spawn(bin, args, { cwd: htmlToPptxRoot() });
    } catch (err) {
      resolve(
        classifyPptx(null, outPath, false, `Could not start the PPTX converter: ${(err as Error).message}`),
      );
      return;
    }
    const collect = (chunk: Buffer | string): void => {
      output += typeof chunk === 'string' ? chunk : chunk.toString('utf8');
    };
    child.stdout?.on('data', collect);
    child.stderr?.on('data', collect);
    child.on('error', (err: Error) => {
      resolve(
        classifyPptx(
          null,
          outPath,
          fileExists(outPath),
          `${output}\nPPTX converter could not run (${err.message}). Is node available?`,
        ),
      );
    });
    child.on('close', (code: number | null) => {
      resolve(classifyPptx(code, outPath, fileExists(outPath), output));
    });
  });
}

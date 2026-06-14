/**
 * html-slides verify gate (plan §12, issue #12 / Slice 5, AC2).
 *
 * Before a generated Deck is presented as done, the daemon runs the existing
 * **`html-slides` verification gate** — `scripts/verify.py <deck.html> --theme
 * <id>` — which renders the deck with Playwright and runs the per-theme brand
 * lints (palette tokens, logo, accent overuse), the contrast floor, overflow /
 * fixed-stage screenshot checks, and universal lints. The script **exits 0 on
 * pass, non-zero on fail** (see verify.py::main). We surface that as a structured
 * {@link VerifyResult} the UI gates the Deck on.
 *
 * The argv builder is pure (no spawn) so it is unit-testable; the runner takes an
 * INJECTED spawn so the gate's pass/fail handling is testable with a fake child —
 * no real Playwright, no real `uv`, no real CLI (the Slice-5 verify suite).
 */
import { spawn as nodeSpawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Resolve the vendored html-slides skill root (skills/html-slides). */
export function htmlSlidesRoot(): string {
  return join(__dirname, '..', '..', '..', 'skills', 'html-slides');
}

/** Path to the vendored verify script the gate runs. */
export function verifyScriptPath(): string {
  return join(htmlSlidesRoot(), 'scripts', 'verify.py');
}

export interface VerifyArgs {
  /** Absolute path to the generated Deck HTML to verify. */
  htmlPath: string;
  /** The chosen theme id (so per-theme brand lints actually run — verify.py
   *  REQUIRES `--theme` unless `--skip-brand`). */
  theme: string;
  /** Where the verifier writes its screenshots (defaults next to the deck). */
  outputDir?: string;
}

/**
 * Build the `uv run scripts/verify.py …` argv that runs the html-slides gate for
 * a themed Deck. `uv run` is the script's own runner (the verify.py shebang) — it
 * resolves Playwright on first use. We always pass `--theme <id>` so the brand
 * lints run (verify.py errors out without it). Pure: no spawn, fully testable.
 *
 * Returns `{ bin, args }` where `bin` is `uv`. The caller spawns with cwd =
 * the html-slides skill root so the script's themes.json + asset relative paths
 * resolve.
 */
export function buildVerifyArgs(input: VerifyArgs): { bin: string; args: string[] } {
  const args = ['run', verifyScriptPath(), input.htmlPath, '--theme', input.theme];
  if (input.outputDir) args.push('--output', input.outputDir);
  return { bin: 'uv', args };
}

/** The structured outcome of one verify-gate run the UI gates the Deck on. */
export interface VerifyResult {
  /** True only when the gate exited 0 (all lints + screenshots passed). */
  passed: boolean;
  /** The process exit code (0 = pass; non-zero / null = fail). */
  exitCode: number | null;
  /** The verifier's combined stdout+stderr (the failure detail, when it failed). */
  output: string;
  /** A friendly one-line summary for the chat / Deck status. */
  summary: string;
  /** Screenshots dir the verifier wrote to (so the UI can surface them later). */
  outputDir?: string;
}

/**
 * Classify a finished verify run into a {@link VerifyResult}. Pure (no spawn) so
 * the pass/fail mapping is testable directly: exit 0 → passed; anything else →
 * failed with a friendly summary. Extracted so both the real runner and the tests
 * share one source of truth for what "passed" means.
 */
export function classifyVerify(
  exitCode: number | null,
  output: string,
  outputDir?: string,
): VerifyResult {
  const passed = exitCode === 0;
  const summary = passed
    ? 'Deck passed the html-slides verify gate (brand, contrast, overflow, screenshots).'
    : 'Deck did not pass the html-slides verify gate — the agent should fix the flagged issues and regenerate.';
  return { passed, exitCode, output: output.trim(), summary, outputDir };
}

/** Minimal child shape the runner needs (real child_process satisfies it). */
interface VerifyChild {
  stdout: { on(event: 'data', cb: (chunk: Buffer | string) => void): void } | null;
  stderr: { on(event: 'data', cb: (chunk: Buffer | string) => void): void } | null;
  on(event: 'error', cb: (err: Error) => void): void;
  on(event: 'close', cb: (code: number | null) => void): void;
}

export type VerifySpawnFn = (
  bin: string,
  args: string[],
  options: { cwd?: string },
) => VerifyChild;

export interface RunVerifyOptions extends VerifyArgs {
  /** Injected spawn so the gate is testable with a fake child. Defaults to the
   *  real `child_process.spawn`. */
  spawn?: VerifySpawnFn;
}

/**
 * Run the html-slides verify gate for a themed Deck and resolve a structured
 * {@link VerifyResult}. The Deck is presented as done only when `passed` is true
 * (plan §12, AC2). A spawn failure (e.g. `uv` not installed) resolves to a
 * failed result with a friendly summary rather than throwing — a missing verifier
 * must surface as "couldn't verify", not crash the run.
 */
export function runVerify(options: RunVerifyOptions): Promise<VerifyResult> {
  const { spawn = nodeSpawn as unknown as VerifySpawnFn } = options;
  const { bin, args } = buildVerifyArgs(options);
  return new Promise<VerifyResult>((resolve) => {
    let output = '';
    let child: VerifyChild;
    try {
      child = spawn(bin, args, { cwd: htmlSlidesRoot() });
    } catch (err) {
      resolve(
        classifyVerify(null, `Could not start the verifier: ${(err as Error).message}`, options.outputDir),
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
        classifyVerify(
          null,
          `${output}\nVerifier could not run (${err.message}). Is uv installed?`,
          options.outputDir,
        ),
      );
    });
    child.on('close', (code: number | null) => {
      resolve(classifyVerify(code, output, options.outputDir));
    });
  });
}

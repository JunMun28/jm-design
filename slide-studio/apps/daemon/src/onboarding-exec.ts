/**
 * In-app onboarding EXECUTION (plan §13, Slice 10 / issue #10, AC1: "on a clean
 * machine with no CLI, the wizard guides a non-technical user from launch →
 * installed → signed-in").
 *
 * onboarding.ts builds the plain-language PLAN (what to do). This module actually
 * DOES it, inside the app, so a non-technical user never opens a terminal:
 *
 *   - runInstall(runtimeId)  → runs the runtime's install command (argv array,
 *     never a concatenated string — §13 Windows quoting), streaming progress
 *     lines, then re-detects so the wizard advances on its own.
 *   - runSignIn(runtimeId)   → launches the runtime's OWN login flow (codex:
 *     OpenAI/ChatGPT; Copilot: GitHub org SSO), streaming the device-code /
 *     "open this URL" line the CLI prints, then re-detects.
 *
 * The child is registered with the daemon's ProcessRegistry (AC3) so a stuck
 * install/login never orphans, and a real failure is mapped to a FRIENDLY line
 * (never a raw npm/CLI error) via errors.ts. Everything is INJECTABLE (spawn,
 * detect, timer) so the streaming + timeout + friendly-mapping + re-detect are
 * unit-testable against a real stand-in command with no codex/Copilot present.
 */
import { spawn as nodeSpawn } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { friendlyFromSpawnError, type FriendlyError } from './errors.ts';
import type { ProcessRegistry, KillableChild } from './process-registry.ts';
import { detectAgents } from './runtimes/detection.ts';
import { getAgentDef } from './runtimes/registry.ts';
import { buildOnboardingPlan, type OnboardingPlan } from './onboarding.ts';

/** One line of streamed progress from the running install/login command. */
export type OnboardingExecProgress = { type: 'progress'; stream: 'stdout' | 'stderr'; line: string };

/** What kind of onboarding step we're executing. */
export type OnboardingExecKind = 'install' | 'signin';

/** Terminal result of an in-app onboarding step. */
export type OnboardingExecResult = {
  kind: OnboardingExecKind;
  runtimeId: string;
  ok: boolean;
  /** The CLI exit code (null when it was killed / never spawned). */
  exitCode: number | null;
  /** A friendly, end-user line. On success it's an encouraging next step; on
   *  failure it's the mapped error (never a raw npm/CLI string). */
  message: string;
  /** A friendly error (with recovery + raw) when the step failed. */
  error?: FriendlyError;
  /** The fresh onboarding plan after re-detection, so the wizard advances. */
  plan: OnboardingPlan;
};

/** Minimal child shape the executor needs (real ChildProcess satisfies it). */
export interface ExecChild extends EventEmitter {
  stdout: (EventEmitter & { setEncoding?(e: string): void }) | null;
  stderr: (EventEmitter & { setEncoding?(e: string): void }) | null;
  pid?: number;
  killed?: boolean;
  kill(signal?: NodeJS.Signals | number): boolean;
}

export type ExecSpawnFn = (
  bin: string,
  args: string[],
  options: { env?: NodeJS.ProcessEnv },
) => ExecChild;

export type RunOnboardingStepOptions = {
  runtimeId: string;
  kind: OnboardingExecKind;
  /** Stream progress lines to the caller (the WS layer) as they arrive. */
  onProgress?: (p: OnboardingExecProgress) => void;
  /** Orphan-cleanup registry (AC3): the install/login child is tracked so the
   *  daemon kills it on exit — a hung `npm i -g` never orphans. */
  registry?: ProcessRegistry;
  env?: NodeJS.ProcessEnv;
  /** Hard ceiling for the whole step (installs can be slow). Default 5 min. */
  timeoutMs?: number;
  /** Injected for tests. */
  spawn?: ExecSpawnFn;
  detect?: typeof detectAgents;
  setTimer?: (fn: () => void, ms: number) => unknown;
  clearTimer?: (h: unknown) => void;
};

const DEFAULT_STEP_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * Resolve the argv to run for a step, honoring an env override. The override
 * (`SLIDE_STUDIO_<RUNTIME>_<KIND>_CMD` = a JSON argv array) lets an operator
 * repoint install/login to an IT-sanctioned source — and lets tests substitute a
 * harmless stand-in so no real interactive auth flow is launched. Falls back to
 * the def's declared command.
 */
export function resolveStepCommand(
  installCommand: { bin: string; args: string[] } | undefined,
  signInCommand: { bin: string; args: string[] } | undefined,
  runtimeId: string,
  kind: OnboardingExecKind,
  env: NodeJS.ProcessEnv,
): { bin: string; args: string[] } | undefined {
  const key = `SLIDE_STUDIO_${runtimeId.toUpperCase()}_${kind.toUpperCase()}_CMD`;
  const raw = env[key];
  if (raw && raw.trim()) {
    try {
      const argv = JSON.parse(raw);
      if (Array.isArray(argv) && argv.length && argv.every((s) => typeof s === 'string')) {
        return { bin: argv[0], args: argv.slice(1) };
      }
    } catch {
      /* malformed override → ignore, use the default */
    }
  }
  return kind === 'install' ? installCommand : signInCommand;
}

/** Split a chunk into whole lines, buffering the trailing partial. */
function makeLineSplitter(emit: (line: string) => void): (chunk: string) => void {
  let buffer = '';
  return (chunk: string) => {
    buffer += chunk;
    let nl: number;
    while ((nl = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, nl).replace(/\r$/, '');
      buffer = buffer.slice(nl + 1);
      if (line.length) emit(line);
    }
  };
}

/**
 * Run ONE in-app onboarding step (install or sign-in) for a runtime, streaming
 * progress, then re-detect and return the fresh plan. Resolves with a friendly
 * result whether the command succeeds, fails, or times out — the wizard never
 * sees a raw error.
 */
export async function runOnboardingStep(options: RunOnboardingStepOptions): Promise<OnboardingExecResult> {
  const {
    runtimeId,
    kind,
    onProgress,
    registry,
    env = process.env,
    timeoutMs = DEFAULT_STEP_TIMEOUT_MS,
    spawn = nodeSpawn as unknown as ExecSpawnFn,
    detect = detectAgents,
    setTimer = (fn, ms) => setTimeout(fn, ms),
    clearTimer = (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
  } = options;

  const def = getAgentDef(runtimeId);
  const name = def?.name ?? runtimeId;
  // The command is the def's default, but an operator can REPOINT it via env —
  // useful for the enterprise (an IT-sanctioned install source) and for tests
  // that must not launch a real interactive auth flow (§15 "keep it swappable").
  // Format: SLIDE_STUDIO_<RUNTIME>_<KIND>_CMD = JSON argv, e.g. ["node","-e","0"].
  const command = resolveStepCommand(def?.installCommand, def?.signInCommand, runtimeId, kind, env);

  // No safe in-app command for this runtime/step → tell the caller to fall back
  // to the external setup page (the actionUrl the plan already carries).
  if (!def || !command) {
    const plan = buildOnboardingPlan(await detect(undefined, undefined, env));
    return {
      kind,
      runtimeId,
      ok: false,
      exitCode: null,
      message:
        kind === 'install'
          ? `${name} can't be installed from inside the app on this computer. Use the setup page instead.`
          : `${name} sign-in needs to be done from its setup page on this computer.`,
      error: { message: 'No in-app command available for this step.', recovery: 'install' },
      plan,
    };
  }

  const result = await new Promise<{ exitCode: number | null; spawnError?: unknown; timedOut: boolean }>((resolve) => {
    let settled = false;
    let timer: unknown = null;
    const child = spawn(command.bin, command.args, { env });

    // AC3: track the child so a hung install/login can't orphan.
    const reg = registry?.registerWithAutoRelease(child as unknown as KillableChild & EventEmitter);

    const finish = (r: { exitCode: number | null; spawnError?: unknown; timedOut: boolean }) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimer(timer);
      reg?.release();
      resolve(r);
    };

    child.stdout?.setEncoding?.('utf8');
    child.stderr?.setEncoding?.('utf8');
    const feedOut = makeLineSplitter((line) => onProgress?.({ type: 'progress', stream: 'stdout', line }));
    const feedErr = makeLineSplitter((line) => onProgress?.({ type: 'progress', stream: 'stderr', line }));
    child.stdout?.on('data', (c: string | Buffer) => feedOut(typeof c === 'string' ? c : c.toString('utf8')));
    child.stderr?.on('data', (c: string | Buffer) => feedErr(typeof c === 'string' ? c : c.toString('utf8')));

    child.on('error', (err: Error) => finish({ exitCode: null, spawnError: err, timedOut: false }));
    child.on('close', (code: number | null) => finish({ exitCode: code ?? null, timedOut: false }));

    timer = setTimer(() => {
      try {
        child.kill('SIGTERM');
      } catch {
        /* already gone */
      }
      finish({ exitCode: null, timedOut: true });
    }, timeoutMs);
  });

  // Re-detect so the wizard reflects the new reality (installed / signed-in).
  const plan = buildOnboardingPlan(await detect(undefined, undefined, env));

  if (result.spawnError) {
    const error = friendlyFromSpawnError(result.spawnError, { runtimeName: name });
    return { kind, runtimeId, ok: false, exitCode: null, message: error.message, error, plan };
  }
  if (result.timedOut) {
    const error: FriendlyError = {
      message: `${name} took too long to ${kind === 'install' ? 'install' : 'sign in'} and was stopped. Please try again.`,
      recovery: 'retry',
    };
    return { kind, runtimeId, ok: false, exitCode: null, message: error.message, error, plan };
  }
  if (result.exitCode !== 0) {
    const error: FriendlyError = {
      message:
        kind === 'install'
          ? `${name} could not be installed automatically. You can open the setup page and follow the steps instead.`
          : `${name} sign-in didn't complete. Try signing in again.`,
      recovery: kind === 'install' ? 'install' : 'signin',
      raw: `exit code ${result.exitCode}`,
    };
    return { kind, runtimeId, ok: false, exitCode: result.exitCode, message: error.message, error, plan };
  }

  // Success. The plan's own re-detection decides whether the NEXT step (sign-in
  // after install) is now surfaced.
  const card = plan.runtimes.find((r) => r.id === runtimeId);
  const nowReady = card?.ready ?? false;
  return {
    kind,
    runtimeId,
    ok: true,
    exitCode: 0,
    message: nowReady
      ? `${name} is ready — you can start building your deck now.`
      : kind === 'install'
        ? `${name} is installed. Next, sign in to finish setup.`
        : `${name} sign-in finished.`,
    plan,
  };
}

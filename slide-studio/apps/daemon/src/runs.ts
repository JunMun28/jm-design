/**
 * Run Manager (plan §M1). Spawns the agent CLI for one Run/Turn, writes the
 * composed prompt to stdin, feeds stdout through the Event Normalizer, and
 * emits NormalizedEvents to a sink (the WebSocket layer). Supports:
 *
 *   - cancel()           — kill the child and emit a terminal status
 *   - inactivity watchdog — if no stdout/stderr arrives within
 *     `inactivityTimeoutMs`, kill the child and emit an error (Copilot's long
 *     deck turns get the 30-min ceiling, plan §17.4)
 *
 * The child process is created through an INJECTED spawn function so the cancel
 * + watchdog logic is unit-testable with a fake child (the fourth required
 * test suite) — no real CLI required.
 */
import { spawn as nodeSpawn } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { createEventNormalizer, type NormalizedEvent, type ParserKind } from './runtimes/events.ts';
import { friendlyFromSpawnError } from './errors.ts';
import type { ProcessRegistry } from './process-registry.ts';
import type { RuntimeAgentDef, RuntimeContext } from './runtimes/types.ts';

/** Minimal stream shape the run manager needs from a child's stdout/stderr. */
export interface FakeReadable extends EventEmitter {
  setEncoding?(enc: string): void;
}

/** Minimal stdin shape — we write the prompt then end(). */
export interface FakeWritable {
  write(chunk: string): void;
  end(): void;
}

/** The subset of ChildProcess the run manager touches. Real `child_process`
 *  satisfies this; tests pass a fake. */
export interface SpawnedChild extends EventEmitter {
  stdout: FakeReadable | null;
  stderr: FakeReadable | null;
  stdin: FakeWritable | null;
  kill(signal?: string): boolean;
  killed?: boolean;
}

export type SpawnFn = (
  bin: string,
  args: string[],
  options: { cwd?: string; env?: NodeJS.ProcessEnv },
) => SpawnedChild;

export type RunOptions = {
  def: RuntimeAgentDef;
  bin: string;
  prompt: string;
  ctx?: RuntimeContext;
  extraAllowedDirs?: string[];
  model?: string | null;
  reasoning?: string | null;
  env?: NodeJS.ProcessEnv;
  /** Inactivity ceiling override; defaults to def.inactivityTimeoutMs or 10 min. */
  inactivityTimeoutMs?: number;
  spawn?: SpawnFn;
  /** Orphan-cleanup registry (Slice 10, AC3). When provided, the spawned agent
   *  child is tracked so the daemon kills it on exit — no orphan process. The
   *  child auto-releases on its own exit/close/error. */
  registry?: ProcessRegistry;
  /** Injected timer factory so the watchdog is testable without real time. */
  now?: () => number;
  setTimer?: (fn: () => void, ms: number) => unknown;
  clearTimer?: (handle: unknown) => void;
};

export type RunHandle = {
  /** Cancel the run: kill the child and emit a cancelled status. */
  cancel: () => void;
  /** Resolves when the run finishes (exit, error, or cancel). */
  done: Promise<{ exitCode: number | null; cancelled: boolean }>;
};

const DEFAULT_INACTIVITY_MS = 10 * 60 * 1000;

/**
 * Start one run. Returns a handle exposing `cancel()` and a `done` promise.
 * Events flow to `emit`.
 */
export function startRun(options: RunOptions, emit: (event: NormalizedEvent) => void): RunHandle {
  const {
    def,
    bin,
    prompt,
    ctx = {},
    extraAllowedDirs = [],
    model = null,
    reasoning = null,
    env = process.env,
    spawn = nodeSpawn as unknown as SpawnFn,
    registry,
    now = () => Date.now(),
    setTimer = (fn, ms) => setTimeout(fn, ms),
    clearTimer = (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
  } = options;

  const inactivityMs = options.inactivityTimeoutMs ?? def.inactivityTimeoutMs ?? DEFAULT_INACTIVITY_MS;
  const args = def.buildArgs(prompt, [], extraAllowedDirs, { model, reasoning }, ctx);

  let cancelled = false;
  let settled = false;
  let watchdog: unknown = null;
  let resolveDone!: (v: { exitCode: number | null; cancelled: boolean }) => void;
  const done = new Promise<{ exitCode: number | null; cancelled: boolean }>((res) => {
    resolveDone = res;
  });

  // Spawn env: ambient + the def's fixed env + its resolved env (e.g. the
  // GitHub token injected by name for Copilot, §8.6). Never logged (§15).
  const spawnEnv = { ...env, ...(def.env ?? {}), ...(def.resolveEnv?.(env) ?? {}) };
  const child = spawn(bin, args, { cwd: ctx.cwd, env: spawnEnv });
  // Track the agent child for orphan cleanup (Slice 10, AC3): if the daemon is
  // told to shut down mid-run, the registry kills this child too. It releases
  // itself when it exits/closes/errors below, so a long-lived daemon never
  // accumulates dead handles.
  registry?.registerWithAutoRelease(child as unknown as EventEmitter & { pid?: number; killed?: boolean; kill(signal?: NodeJS.Signals | number): boolean; });
  const normalizer = createEventNormalizer((def.eventParser ?? 'codex') as ParserKind, emit, {
    runtimeName: def.name,
  });

  function armWatchdog(): void {
    if (watchdog) clearTimer(watchdog);
    watchdog = setTimer(() => {
      if (settled) return;
      emit({
        type: 'error',
        message: `${def.name} went quiet for a while, so the run was stopped. You can try sending your message again.`,
        recovery: 'retry',
        raw: `inactivity timeout after ${Math.round(inactivityMs / 1000)}s`,
      });
      try {
        child.kill('SIGTERM');
      } catch {
        /* ignore */
      }
      finish(null);
    }, inactivityMs);
  }

  function bumpActivity(): void {
    if (!settled) armWatchdog();
  }

  function finish(exitCode: number | null): void {
    if (settled) return;
    settled = true;
    if (watchdog) clearTimer(watchdog);
    try {
      normalizer.flush();
    } catch {
      /* ignore */
    }
    resolveDone({ exitCode, cancelled });
  }

  child.stdout?.setEncoding?.('utf8');
  child.stderr?.setEncoding?.('utf8');

  child.stdout?.on('data', (chunk: string | Buffer) => {
    bumpActivity();
    normalizer.feed(typeof chunk === 'string' ? chunk : chunk.toString('utf8'));
  });
  child.stderr?.on('data', () => {
    bumpActivity();
  });
  child.on('error', (err: Error) => {
    // Raw spawn/Node errors (EACCES, ENOENT, …) must never reach the UI as-is —
    // map them to a friendly message + recovery first (AC1).
    const f = friendlyFromSpawnError(err, { runtimeName: def.name });
    emit({ type: 'error', message: f.message, recovery: f.recovery, raw: f.raw });
    finish(null);
  });
  child.on('close', (code: number | null) => {
    finish(code ?? null);
  });
  child.on('exit', (code: number | null) => {
    finish(code ?? null);
  });

  // Deliver the prompt via stdin (both codex + copilot). Never argv.
  if (def.promptViaStdin && child.stdin) {
    try {
      child.stdin.write(prompt);
      child.stdin.end();
    } catch {
      /* ignore — child.error will fire if the pipe is broken */
    }
  }

  emit({ type: 'status', label: 'running', model: model ?? undefined });
  void now; // reserved for future elapsed-time reporting
  armWatchdog();

  return {
    cancel: () => {
      if (settled) return;
      cancelled = true;
      emit({ type: 'status', label: 'cancelled' });
      try {
        child.kill('SIGTERM');
      } catch {
        /* ignore */
      }
      finish(null);
    },
    done,
  };
}

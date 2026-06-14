/**
 * Orphan cleanup (plan §13, Slice 10 / issue #10 AC3: "the agent child and daemon
 * are killed on exit — no orphan processes").
 *
 * Two leaks can outlive the app:
 *   1. an AGENT CHILD (codex/Copilot) spawned by the run manager, and
 *   2. the DAEMON itself when the launcher window is closed.
 *
 * This module is the daemon-side half: a registry every active agent child
 * registers with, plus a single shutdown routine wired to the process exit
 * signals (SIGINT / SIGTERM / beforeExit). On shutdown it SIGTERMs every live
 * child and, after a short grace period, SIGKILLs any that are still alive — so
 * closing the app never leaves an orphaned `codex`/`copilot` process behind. The
 * launcher's `.bat`/`.sh` half forwards the window-close signal to this daemon
 * (so the daemon's own shutdown fires); see launcher/*.
 *
 * Everything is INJECTABLE (the signal sink, the timer, `now`) so the cleanup
 * order + the SIGTERM→SIGKILL escalation are unit-testable with fakes — no real
 * processes, no real signals (mirrors runs.ts's injected-spawn approach).
 */
import { EventEmitter } from 'node:events';

/** The minimal child shape the registry needs to terminate a process. Real
 *  `ChildProcess` satisfies this; tests pass a fake. */
export interface KillableChild {
  /** OS pid, or undefined for a not-yet-spawned/failed child. */
  pid?: number;
  /**
   * On Node's real `ChildProcess`, `killed` means "a signal was DELIVERED" — NOT
   * "the process has exited". A process that traps/ignores SIGTERM stays alive
   * with `killed === true`. So the registry must NOT treat `killed` as proof of
   * death; it tracks real exit via the child's own 'exit'/'close' events (see
   * `registerWithAutoRelease`) and, as a last resort, an OS liveness probe.
   */
  killed?: boolean;
  kill(signal?: NodeJS.Signals | number): boolean;
}

/** A handle the caller uses to deregister a child once it exits on its own. */
export type ChildRegistration = { release: () => void };

/** What `installShutdownHandlers` listens on (real `process`, or a fake). */
export interface SignalSource {
  on(event: string, listener: (...args: unknown[]) => void): unknown;
  off?(event: string, listener: (...args: unknown[]) => void): unknown;
  removeListener?(event: string, listener: (...args: unknown[]) => void): unknown;
}

/** Optional knobs the registry exposes for testability. */
export type ProcessRegistryOptions = {
  /** ms to wait after SIGTERM before escalating to SIGKILL. Default 2000. */
  graceMs?: number;
  /** Injected timer so the grace window is deterministic in tests. */
  setTimer?: (fn: () => void, ms: number) => unknown;
  /**
   * OS liveness probe used to decide whether a child still needs SIGKILL after
   * the grace window. Defaults to `process.kill(pid, 0)` (ESRCH ⇒ dead). Injected
   * so the escalation is testable without real pids; tests that DO spawn a real
   * child leave it as the default to prove genuine reaping.
   */
  isAlive?: (child: KillableChild) => boolean;
};

/**
 * Tracks every live agent child so the daemon can guarantee none outlives it.
 * One registry per daemon; the run manager registers each spawned child and the
 * registry releases it on exit.
 */
export class ProcessRegistry {
  private readonly children = new Set<KillableChild>();
  /** Children we have observed actually EXIT (via their own 'exit'/'close'), so
   *  we never re-signal a truly-dead process even after it's left `children`. */
  private readonly exited = new WeakSet<KillableChild>();
  private readonly graceMs: number;
  private readonly setTimer: (fn: () => void, ms: number) => unknown;
  private readonly isAlive: (child: KillableChild) => boolean;
  private shuttingDown = false;

  constructor(options: ProcessRegistryOptions = {}) {
    this.graceMs = options.graceMs ?? 2000;
    this.setTimer = options.setTimer ?? ((fn, ms) => setTimeout(fn, ms));
    this.isAlive = options.isAlive ?? defaultIsAlive;
  }

  /** Mark a child as having truly exited (called from its 'exit'/'close'). */
  private markExited(child: KillableChild): void {
    this.exited.add(child);
  }

  /** True when the process is, to our best knowledge, still running: we have not
   *  seen its exit AND the OS still reports the pid. `killed` is deliberately
   *  ignored — on a real ChildProcess it only means a signal was delivered. */
  private stillRunning(child: KillableChild): boolean {
    if (this.exited.has(child)) return false;
    return this.isAlive(child);
  }

  /** Number of children still being tracked (test/inspection helper). */
  get size(): number {
    return this.children.size;
  }

  /**
   * Track a spawned agent child. The caller MUST `release()` (or let the child's
   * own 'exit'/'close' fire `releaseOnExit`) once the process is gone, so a
   * long-lived daemon doesn't accumulate dead handles. Returns a registration.
   */
  register(child: KillableChild): ChildRegistration {
    this.children.add(child);
    return { release: () => this.children.delete(child) };
  }

  /** Convenience: register a child AND auto-release it when it emits exit/close.
   *  Returns the registration so the caller can still release early. */
  registerWithAutoRelease(child: KillableChild & EventEmitter): ChildRegistration {
    const reg = this.register(child);
    // 'exit'/'close' mean the process truly ended — record that so the SIGKILL
    // escalation never re-signals a dead pid (and never mistakes a delivered
    // SIGTERM for an exit). 'error' (spawn failure) means there's no live pid.
    const onExit = () => {
      this.markExited(child);
      reg.release();
    };
    child.once('exit', onExit);
    child.once('close', onExit);
    child.once('error', onExit);
    return reg;
  }

  /**
   * Terminate every tracked child: SIGTERM all of them, then after `graceMs`
   * SIGKILL any still alive, then resolve. Idempotent — calling it twice is a
   * no-op after the first. Resolves once the grace timer has run (so the daemon
   * can `await` it before closing its server).
   */
  killAll(): Promise<void> {
    if (this.shuttingDown) return Promise.resolve();
    this.shuttingDown = true;

    const targets = [...this.children];
    // 1) Polite SIGTERM to every child that is still running. (A child already
    //    observed to have exited is skipped — never re-signal a dead pid.)
    for (const child of targets) {
      if (this.stillRunning(child)) this.safeKill(child, 'SIGTERM');
    }

    if (targets.length === 0) return Promise.resolve();

    // 2) After the grace window, SIGKILL anything the OS still reports alive — a
    //    child that trapped/ignored SIGTERM. This is the bit FakeChild masked:
    //    aliveness is an OS probe (or an observed exit), NOT `child.killed`.
    return new Promise<void>((resolve) => {
      const timer = this.setTimer(() => {
        for (const child of targets) {
          if (this.stillRunning(child)) this.safeKill(child, 'SIGKILL');
          this.children.delete(child);
        }
        resolve();
      }, this.graceMs);
      void timer;
    });
  }

  private safeKill(child: KillableChild, signal: NodeJS.Signals): void {
    try {
      child.kill(signal);
    } catch {
      /* a child that's already gone throws — that's fine, it's what we wanted */
    }
  }
}

/**
 * Default OS liveness probe: signal 0 tests for a process's existence without
 * delivering a real signal. ESRCH ⇒ the pid is gone (reaped). EPERM ⇒ it exists
 * but is owned by someone else (still alive). A child with no pid never spawned.
 */
function defaultIsAlive(child: KillableChild): boolean {
  if (typeof child.pid !== 'number' || child.pid <= 0) return false;
  try {
    process.kill(child.pid, 0);
    return true;
  } catch (err) {
    return (err as NodeJS.ErrnoException).code === 'EPERM';
  }
}

/**
 * Wire a shutdown routine to the process exit signals so the agent child + the
 * daemon are cleaned up however the app is closed (Ctrl-C, the launcher window
 * closing and forwarding SIGTERM, or a normal `beforeExit`). On the first signal
 * we run `onShutdown` (kill children, close the server) and then exit; a SECOND
 * signal forces an immediate exit so a wedged shutdown can't hang the user.
 *
 * Injectable `signals`/`exit` make the wiring + double-signal force-exit testable
 * without touching the real process.
 */
export function installShutdownHandlers(
  onShutdown: () => Promise<void> | void,
  options: {
    signals?: SignalSource;
    exit?: (code: number) => void;
    events?: string[];
  } = {},
): () => void {
  const source = options.signals ?? (process as unknown as SignalSource);
  const exit = options.exit ?? ((code: number) => process.exit(code));
  const events = options.events ?? ['SIGINT', 'SIGTERM', 'SIGHUP'];

  let invoked = false;
  const handlers = new Map<string, (...args: unknown[]) => void>();

  const handler = () => async () => {
    if (invoked) {
      // A second signal while shutdown is in flight: stop waiting, exit now.
      exit(1);
      return;
    }
    invoked = true;
    try {
      await onShutdown();
    } finally {
      exit(0);
    }
  };

  for (const event of events) {
    const fn = handler();
    handlers.set(event, fn);
    source.on(event, fn);
  }

  // Return a disposer so a test (or a clean programmatic shutdown) can detach.
  return () => {
    for (const [event, fn] of handlers) {
      source.off?.(event, fn) ?? source.removeListener?.(event, fn);
    }
    handlers.clear();
  };
}

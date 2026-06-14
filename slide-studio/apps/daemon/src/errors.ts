/**
 * Friendly-error mapper (Slice 13 / issue #7, AC1). Turns every failure the run
 * surface can produce — a raw spawn/Node error (EACCES, ENOENT, …), an agent CLI
 * `error` line, an inactivity-watchdog stop, a transport drop — into a single
 * shape the UI can render: a plain-language `message` and a `recovery` action
 * telling the shell which affordance to offer.
 *
 * The contract: the UI NEVER shows a raw CLI/Node error. Whatever raw text
 * arrives is carried in `raw` (for debugging/copy) but `message` is always the
 * friendly line, and `recovery` is always one of the known actions so the shell
 * can wire the right button.
 *
 * Pure + side-effect free so it is unit-testable without a real CLI (the
 * Slice-13 friendly-error suite).
 */

/** What the shell should offer the user to get unstuck. */
export type RecoveryAction =
  /** Re-send the same turn (transient agent/turn failure). */
  | 'retry'
  /** Sign in to the runtime, then re-send (auth/unauthenticated failure). */
  | 'signin'
  /** Reconnect the live event stream, then re-send (socket dropped). */
  | 'reconnect'
  /** Install/repair the runtime CLI (it could not be launched at all). */
  | 'install'
  /** Nothing actionable — just acknowledge. */
  | 'none';

/** The friendly error the daemon emits and the UI renders. */
export type FriendlyError = {
  /** Plain-language, end-user-facing line. Never a raw CLI/Node error. */
  message: string;
  /** The recovery affordance the shell should offer. */
  recovery: RecoveryAction;
  /** The raw text that triggered this mapping, kept for debugging/copy. Never
   *  shown as the primary message. */
  raw?: string;
};

/** Context that sharpens the mapping (e.g. which runtime to name in a sign-in). */
export type FriendlyErrorContext = {
  /** Display name of the runtime in play (e.g. "GitHub Copilot"), for sign-in copy. */
  runtimeName?: string;
};

/**
 * OS-level spawn failures (the `child.on('error')` path in runs.ts). These mean
 * the CLI could not be launched at all — they must never reach the UI verbatim
 * (e.g. "spawn codex EACCES"). Mapped by Node error code.
 */
function mapSpawnCode(code: string, runtimeName: string): FriendlyError | null {
  switch (code) {
    case 'ENOENT':
      return {
        message: `${runtimeName} could not be found on this computer. Install it (or sign in) and try again.`,
        recovery: 'install',
      };
    case 'EACCES':
    case 'EPERM':
      return {
        message: `This computer blocked ${runtimeName} from running. Check that it is installed correctly, then try again.`,
        recovery: 'install',
      };
    case 'ETIMEDOUT':
      return {
        message: `${runtimeName} took too long to respond. Please try again.`,
        recovery: 'retry',
      };
    default:
      return null;
  }
}

/** Auth/unauthenticated signatures in raw agent text (plan §8.6 classifier). */
const AUTH_RE = /401|403|unauthorized|unauthenticated|not (signed|logged) in|please (sign|log) in|authentication|invalid[_ -]?token|expired token|sign in to/i;
/** Transient signatures that are worth a plain retry. */
const TRANSIENT_RE = /rate[ _-]?limit|429|temporarily|timeout|timed out|network|connection reset|ECONNRESET|503|502|overloaded|try again/i;

/**
 * Classify an agent CLI `error` line (or any raw failure text) into a friendly
 * error. Auth signatures route to a sign-in recovery; transient signatures to a
 * retry; everything else gets a generic "something went wrong" with a retry path
 * — so a raw, unmapped CLI string is never the message the user sees.
 */
export function friendlyFromAgentError(raw: string, ctx: FriendlyErrorContext = {}): FriendlyError {
  const runtimeName = ctx.runtimeName ?? 'the agent';
  const text = (raw ?? '').trim();

  if (AUTH_RE.test(text)) {
    return {
      message: `${capitalize(runtimeName)} needs you to sign in again before it can keep going. Sign in, then resend your last message.`,
      recovery: 'signin',
      raw: text || undefined,
    };
  }
  if (TRANSIENT_RE.test(text)) {
    return {
      message: `${capitalize(runtimeName)} hit a temporary hiccup and stopped. This usually clears up — try sending again.`,
      recovery: 'retry',
      raw: text || undefined,
    };
  }
  return {
    message: `${capitalize(runtimeName)} ran into a problem and couldn't finish that step. You can try sending your message again.`,
    recovery: 'retry',
    raw: text || undefined,
  };
}

/**
 * Map a raw spawn/Node `Error` (the `child.on('error')` payload) into a friendly
 * error. Reads `error.code` first (EACCES/ENOENT/…); otherwise scans the message
 * for auth/transient signatures; otherwise a generic install/retry line. Always
 * returns a friendly message — the raw `err.message` is never surfaced as-is.
 */
export function friendlyFromSpawnError(err: unknown, ctx: FriendlyErrorContext = {}): FriendlyError {
  const runtimeName = ctx.runtimeName ?? 'the agent';
  const code = (err as NodeJS.ErrnoException | undefined)?.code;
  const rawMessage = err instanceof Error ? err.message : typeof err === 'string' ? err : '';

  if (typeof code === 'string') {
    const byCode = mapSpawnCode(code, capitalize(runtimeName));
    if (byCode) return { ...byCode, raw: rawMessage || code };
  }
  // No recognized code → fall back to text classification, but a spawn-level
  // failure with no code is almost always "couldn't launch it".
  if (rawMessage && (AUTH_RE.test(rawMessage) || TRANSIENT_RE.test(rawMessage))) {
    return friendlyFromAgentError(rawMessage, ctx);
  }
  return {
    message: `${capitalize(runtimeName)} couldn't start. Make sure it is installed and signed in, then try again.`,
    recovery: 'install',
    raw: rawMessage || undefined,
  };
}

/** A clean, runtime-not-installed friendly error (the daemon's pre-run guard). */
export function friendlyNotInstalled(runtimeName: string): FriendlyError {
  return {
    message: `${runtimeName} isn't installed or signed in on this computer yet. Set it up, then try again.`,
    recovery: 'install',
  };
}

/** A clean, transport-dropped friendly error (the socket-close path). */
export const FRIENDLY_DISCONNECTED: FriendlyError = {
  message: 'Lost the live connection to Slide Studio. Reconnecting — your message and feedback are saved.',
  recovery: 'reconnect',
};

function capitalize(s: string): string {
  if (!s) return s;
  // Leave already-cased proper nouns (GitHub Copilot, codex) alone; only fix a
  // leading lowercase generic like "the agent".
  return s === 'the agent' ? 'The agent' : s;
}

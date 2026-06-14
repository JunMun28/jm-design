/**
 * Pure chat event-reducer (extracted from {@link ChatComponent.onEvent} so the
 * run-lifecycle logic is unit-testable WITHOUT Angular or a live socket).
 *
 * The transcript is an ORDERED timeline of {@link ChatTurn} entries — user /
 * assistant message bubbles, plus discrete `status` rows and `tool` chips. The
 * reducer's job is to place each incoming frame at the right spot in that
 * timeline so the conversation reads chronologically:
 *
 *   - each COMPLETE agent message (a `text_delta` with `final`) gets its OWN
 *     assistant bubble — codex narrates → runs a step → narrates again, and we no
 *     longer concatenate those into one wall of text;
 *   - `status` / `verify` / `pptx` frames become their own status rows instead of
 *     being appended into the assistant bubble;
 *   - `tool_use` frames become tool chips (low-level shell/file ops are hidden,
 *     but still close the current message so the next one is its own bubble).
 *
 * Bug A (composer stuck): the `streaming` flag must reliably return to idle when
 * a run ends — on `status:done`, `status:cancelled`, `error`, AND on a socket
 * close/cancel. The reset is driven from ONE place (this reducer), so the
 * auto-started first turn can never leave the composer disabled forever.
 *
 * This module is deliberately free of Angular imports.
 */
import type { ChatTurn, NormalizedEvent, RecoveryAction } from '../core/types';

/** The friendly error currently shown (AC1). null = no error. */
export interface ChatError {
  message: string;
  recovery: RecoveryAction;
  raw?: string;
}

/** The slice of chat UI state the reducer owns. */
export interface ChatState {
  turns: ChatTurn[];
  /** false = composer enabled (idle); true = a run is in flight. */
  streaming: boolean;
  /** The friendly error card, or null. */
  error: ChatError | null;
}

/**
 * Side-effects the component must perform AFTER applying `next` — kept out of
 * the pure reducer so it stays testable. Every field is optional.
 */
export interface ChatEffects {
  /** A `brief` frame arrived — push it to the Brief panel. */
  brief?: NormalizedEvent & { type: 'brief' };
  /** A `verify` frame arrived — relay the gate outcome to the workspace. */
  verify?: { passed: boolean; summary: string };
  /** The run reached a clean terminal state (`status:done`) — emit turnComplete
   *  and refresh the durable feedback queue (a clean turn consumed it). */
  turnComplete?: boolean;
}

export interface ChatReduceResult {
  next: ChatState;
  effects: ChatEffects;
}

/** Synthetic lifecycle signals that are NOT agent frames but still end a run. */
export type ChatLifecycleSignal =
  /** The shared socket closed/dropped while a run was in flight. */
  | { type: 'socket-close' }
  /** The user (or the shell) cancelled the in-flight run locally. */
  | { type: 'run-cancelled' };

export type ChatInput = NormalizedEvent | ChatLifecycleSignal;

export function initialChatState(turns: ChatTurn[] = []): ChatState {
  return { turns, streaming: false, error: null };
}

// --- Tool labelling ---------------------------------------------------------

/** Humanize a raw tool/skill id into a one-line chip label. */
export function toolLabel(name: string): string {
  if (!name) return 'Working…';
  const slug = name.replace(/^mcp__[^_]+__/, '').replace(/_/g, ' ');
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

/**
 * Low-level execution tools we DON'T surface as chips. The agent runs many of
 * these per turn (write a file, list a folder, run a script) — codex routes ALL
 * of its work through `Bash`, so a single turn would otherwise stack up a column
 * of identical "Bash" chips that mean nothing to a non-technical user. We hide
 * them; the streamed answer + the real milestones (verify gate, PPTX build) tell
 * the story. A genuinely named higher-level tool still shows a chip.
 */
const NOISY_TOOLS = new Set([
  'bash', 'shell', 'sh', 'zsh', 'exec', 'command', 'run', 'local_shell', 'terminal',
  'read', 'read_file', 'write', 'write_file', 'edit', 'str_replace', 'str_replace_editor',
  'apply_patch', 'patch', 'view', 'ls', 'cat', 'grep', 'glob', 'search', 'fetch',
]);

export function isNoisyTool(name: string): boolean {
  return NOISY_TOOLS.has((name ?? '').trim().toLowerCase());
}

// --- Timeline helpers -------------------------------------------------------

/** An assistant bubble still accepting text (not yet sealed). */
function isOpenAssistant(t: ChatTurn): boolean {
  return t.role === 'assistant' && !t.sealed;
}

/**
 * Guarantee the timeline ends with an OPEN assistant bubble (the one that the
 * next thinking/text delta lands in). Reuses a trailing open bubble; otherwise
 * appends a fresh one. Returns the (possibly new) turns + the bubble's index.
 */
function ensureOpenAssistant(turns: ChatTurn[]): { turns: ChatTurn[]; idx: number } {
  const last = turns[turns.length - 1];
  if (last && isOpenAssistant(last)) return { turns, idx: turns.length - 1 };
  const next = [...turns, { role: 'assistant' as const, text: '', pending: true }];
  return { turns: next, idx: next.length - 1 };
}

/**
 * Close any trailing open assistant bubble before a non-message entry (tool /
 * status) is appended, so the message above and the message below it stay
 * separate. An EMPTY placeholder (no text, no reasoning) is dropped rather than
 * sealed, so the timeline never shows a blank bubble between two status rows.
 */
function sealOpenAssistant(turns: ChatTurn[]): ChatTurn[] {
  const last = turns[turns.length - 1];
  if (!last || !isOpenAssistant(last)) return turns;
  if (!last.text && !last.thinking) return turns.slice(0, -1);
  const next = [...turns];
  next[next.length - 1] = { ...last, sealed: true, pending: false };
  return next;
}

/**
 * Settle the last assistant bubble on a TERMINAL signal (done / cancelled /
 * error / socket close): just clear its caret. Unlike {@link sealOpenAssistant}
 * this NEVER drops the bubble — a benign error can still be followed by a
 * `text_delta`, and that text must keep landing on the bubble (Bug A: no text
 * loss). An empty bubble renders nothing, so keeping it is harmless.
 */
function settleLastAssistant(turns: ChatTurn[]): ChatTurn[] {
  const idx = turns.map((t) => t.role).lastIndexOf('assistant');
  if (idx === -1) return turns;
  const next = [...turns];
  next[idx] = { ...next[idx], pending: false };
  return next;
}

/**
 * The single source of truth for how one input transitions chat state. Returns
 * the next state plus any side-effects the component should run.
 */
export function reduceChat(state: ChatState, input: ChatInput): ChatReduceResult {
  const effects: ChatEffects = {};

  switch (input.type) {
    case 'thinking_delta': {
      const { turns, idx } = ensureOpenAssistant(state.turns);
      const next = [...turns];
      next[idx] = { ...next[idx], thinking: (next[idx].thinking ?? '') + input.delta };
      return { next: { ...state, turns: next }, effects };
    }

    case 'text_delta': {
      const { turns, idx } = ensureOpenAssistant(state.turns);
      const next = [...turns];
      const seal = input.final === true; // codex sends each message whole → seal it
      next[idx] = {
        ...next[idx],
        text: next[idx].text + input.delta,
        sealed: seal ? true : next[idx].sealed,
        pending: seal ? false : next[idx].pending,
      };
      return { next: { ...state, turns: next }, effects };
    }

    case 'tool_use': {
      // Close the current message either way. Hide low-level shell/file ops; a
      // genuinely named tool becomes its own chip in the timeline.
      const turns = sealOpenAssistant(state.turns);
      if (isNoisyTool(input.name)) return { next: { ...state, turns }, effects };
      const chip: ChatTurn = { role: 'tool', text: toolLabel(input.name), toolId: input.id, running: true, failed: false };
      return { next: { ...state, turns: [...turns, chip] }, effects };
    }

    case 'tool_result': {
      const next = state.turns.map((t) =>
        t.role === 'tool' && t.toolId === input.toolUseId ? { ...t, running: false, failed: input.isError } : t,
      );
      return { next: { ...state, turns: next }, effects };
    }

    case 'brief':
      effects.brief = input;
      return { next: state, effects };

    case 'verify': {
      effects.verify = { passed: input.passed, summary: input.summary };
      const turns = sealOpenAssistant(state.turns);
      const row: ChatTurn = { role: 'status', text: input.summary, tone: input.passed ? 'ok' : 'warn' };
      return { next: { ...state, turns: [...turns, row] }, effects };
    }

    case 'pptx': {
      const turns = sealOpenAssistant(state.turns);
      const row: ChatTurn = { role: 'status', text: input.summary, tone: input.ok ? 'ok' : 'warn' };
      return { next: { ...state, turns: [...turns, row] }, effects };
    }

    case 'status': {
      if (input.label === 'verifying') {
        const turns = sealOpenAssistant(state.turns);
        return { next: { ...state, turns: [...turns, { role: 'status', text: 'Running the html-slides verify gate…', tone: 'info' }] }, effects };
      }
      if (input.label === 'building-pptx') {
        const turns = sealOpenAssistant(state.turns);
        return { next: { ...state, turns: [...turns, { role: 'status', text: 'Building the editable PowerPoint…', tone: 'info' }] }, effects };
      }
      if (input.label === 'done') {
        // Clean terminal: settle the bubble, drop streaming, emit turnComplete.
        effects.turnComplete = true;
        return { next: { ...state, turns: settleLastAssistant(state.turns), streaming: false }, effects };
      }
      if (input.label === 'cancelled') {
        return { next: { ...state, turns: settleLastAssistant(state.turns), streaming: false }, effects };
      }
      // Non-terminal status (running / initializing): keep streaming.
      return { next: state, effects };
    }

    case 'error': {
      // Surface a friendly error CARD with a recovery action — do NOT inline a
      // raw "⚠ message" into the bubble. Close the open message (no text lost),
      // and ALWAYS drop streaming so the composer never stays disabled (Bug A).
      return {
        next: {
          ...state,
          turns: settleLastAssistant(state.turns),
          error: { message: input.message, recovery: input.recovery ?? 'retry', raw: input.raw },
          streaming: false,
        },
        effects,
      };
    }

    case 'socket-close':
    case 'run-cancelled':
      // The live connection dropped or the run was cancelled locally: a run can
      // no longer be in flight — return to idle so the composer is usable again.
      if (!state.streaming) return { next: state, effects };
      return { next: { ...state, turns: settleLastAssistant(state.turns), streaming: false }, effects };

    default:
      // usage / raw / questionnaire / gate / artifact / exports / onboard:* —
      // no chat-timeline transition here.
      return { next: state, effects };
  }
}

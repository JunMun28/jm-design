/**
 * Normalized event vocabulary + per-CLI parsers.
 *
 * Source of truth: plan §8.4. ONE vocabulary the chat UI consumes regardless of
 * which CLI produced it. Each agent's raw JSONL lines are mapped into this set:
 *
 *   status · thinking_delta · text_delta · tool_use · tool_result · usage · error · raw
 *
 * Mappings (plan §8.4):
 *   codex:   thread.started→status, turn.started→status,
 *            item.* command_execution→tool_use+tool_result,
 *            agent_message→text_delta, reasoning→thinking_delta,
 *            turn.completed.usage→usage, turn.failed/error→error
 *   copilot: assistant.turn_start→status, assistant.reasoning_delta→thinking_delta,
 *            assistant.message_delta→text_delta, tool.execution_start→tool_use,
 *            tool.execution_complete→tool_result, result→usage
 */

export type NormalizedUsage = {
  inputTokens?: number;
  outputTokens?: number;
  cachedReadTokens?: number;
  thoughtTokens?: number;
};

/** Recovery affordance the shell offers for a friendly error (Slice 13, AC1). */
export type RecoveryAction = 'retry' | 'signin' | 'reconnect' | 'install' | 'none';

export type NormalizedEvent =
  | { type: 'status'; label: string; model?: string }
  | { type: 'thinking_delta'; delta: string }
  // `final` marks a COMPLETE message (codex emits each agent_message whole, not
  // token-by-token), so the chat seals the bubble and starts the next agent
  // message in its own bubble instead of concatenating them.
  | { type: 'text_delta'; delta: string; final?: boolean }
  | { type: 'tool_use'; id: string; name: string; input: unknown }
  | { type: 'tool_result'; toolUseId: string; content: string; isError: boolean }
  | { type: 'usage'; usage: NormalizedUsage; durationMs?: number; stopReason?: string }
  // `message` is ALWAYS plain-language (never a raw CLI/Node error). `recovery`
  // tells the shell which affordance to offer; `raw` carries the original text
  // for debugging only (Slice 13, AC1).
  | { type: 'error'; message: string; recovery?: RecoveryAction; raw?: string }
  | { type: 'raw'; line: string };

/** The complete, ordered vocabulary — exported so tests and the UI can assert
 *  against the single source of truth. */
export const NORMALIZED_EVENT_TYPES = [
  'status',
  'thinking_delta',
  'text_delta',
  'tool_use',
  'tool_result',
  'usage',
  'error',
  'raw',
] as const;

import { friendlyFromAgentError } from '../errors.ts';

export type ParserKind = 'codex' | 'copilot';
export type EventHandler = (event: NormalizedEvent) => void;

/** Optional context the parsers thread into the friendly-error mapper so a
 *  sign-in line can name the runtime in play (Slice 13, AC1). */
export type NormalizerContext = { runtimeName?: string };

type JsonObject = Record<string, unknown>;

/** Map a raw agent error string into a friendly `error` event (never raw). */
function emitFriendlyAgentError(emit: EventHandler, raw: string, ctx: NormalizerContext): void {
  const f = friendlyFromAgentError(raw, { runtimeName: ctx.runtimeName });
  emit({ type: 'error', message: f.message, recovery: f.recovery, raw: f.raw });
}

/**
 * Codex flattens its internal `stream_error` notice into an exec-json `error`
 * frame even when the run RECOVERS and finishes cleanly. Per the codex CLI's own
 * schema, `stream_error` is: "Notification that a model stream experienced an
 * error or disconnect and the system is handling it (e.g., retrying with
 * backoff)." That is a benign, recoverable notice — NOT a turn failure — so it
 * must never surface a user-facing error card on a run that ultimately succeeds.
 *
 * We recognize these benign notices by their signature text and route them to a
 * `raw` frame (kept for debugging, never rendered as a card). A real terminal
 * failure arrives as `turn.failed`, or as an `error` frame whose text does NOT
 * match this benign pattern (auth, usage-limit, hard server error, etc.).
 */
const CODEX_BENIGN_STREAM_NOTICE_RE =
  /stream\s*disconnect|disconnected before completion|retrying (?:sampling|the )?request|retrying with backoff|stream error.*retry|reconnect/i;

function isBenignCodexStreamNotice(raw: string): boolean {
  const text = (raw ?? '').trim();
  if (!text) return false;
  return CODEX_BENIGN_STREAM_NOTICE_RE.test(text);
}

function isRecord(value: unknown): value is JsonObject {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function stringifyContent(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value == null) return '';
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function extractErrorMessage(value: unknown, fallback: string): string {
  if (typeof value === 'string' && value) return value;
  if (isRecord(value)) {
    if (typeof value.message === 'string' && value.message) return value.message;
    if (typeof value.error === 'string' && value.error) return value.error;
    if (isRecord(value.error)) return extractErrorMessage(value.error, fallback);
  }
  return fallback;
}

type ParserState = {
  codexToolUses: Set<string>;
  codexErrorEmitted: boolean;
};

function freshState(): ParserState {
  return { codexToolUses: new Set<string>(), codexErrorEmitted: false };
}

/** codex JSON event-stream line → normalized events. */
function handleCodexEvent(obj: unknown, emit: EventHandler, state: ParserState, ctx: NormalizerContext): boolean {
  if (!isRecord(obj) || typeof obj.type !== 'string') return false;

  switch (obj.type) {
    case 'thread.started':
      emit({ type: 'status', label: 'initializing' });
      return true;

    case 'turn.started':
      emit({ type: 'status', label: 'running' });
      return true;

    case 'error': {
      const rawText = extractErrorMessage(obj.message ?? obj.error, '');
      // A codex `error` frame is NOT necessarily a turn failure. Benign
      // `stream_error` notices (disconnect + retry-with-backoff) flow through
      // this same frame on runs that recover and succeed — never surface those
      // as a user-facing error card. Keep them as `raw` for debugging only.
      if (isBenignCodexStreamNotice(rawText)) {
        emit({ type: 'raw', line: rawText });
        return true;
      }
      if (!state.codexErrorEmitted) {
        state.codexErrorEmitted = true;
        // Map the raw codex error text to a friendly message + recovery (AC1).
        emitFriendlyAgentError(emit, rawText, ctx);
      }
      return true;
    }

    case 'turn.failed': {
      if (!state.codexErrorEmitted) {
        state.codexErrorEmitted = true;
        emitFriendlyAgentError(emit, extractErrorMessage(obj.error ?? obj.message, ''), ctx);
      }
      return true;
    }

    case 'turn.completed': {
      if (!isRecord(obj.usage)) return true;
      const usage: NormalizedUsage = {};
      if (typeof obj.usage.input_tokens === 'number') usage.inputTokens = obj.usage.input_tokens;
      if (typeof obj.usage.output_tokens === 'number') usage.outputTokens = obj.usage.output_tokens;
      if (typeof obj.usage.cached_input_tokens === 'number') usage.cachedReadTokens = obj.usage.cached_input_tokens;
      emit({ type: 'usage', usage });
      return true;
    }

    case 'item.started':
    case 'item.completed': {
      if (!isRecord(obj.item)) return false;
      const item = obj.item;

      // reasoning → thinking_delta
      if (item.type === 'reasoning' && typeof item.text === 'string' && item.text.length > 0) {
        emit({ type: 'thinking_delta', delta: item.text });
        return true;
      }

      // command_execution → tool_use (+ tool_result on completion)
      if (item.type === 'command_execution' && typeof item.id === 'string') {
        if (!state.codexToolUses.has(item.id)) {
          state.codexToolUses.add(item.id);
          emit({
            type: 'tool_use',
            id: item.id,
            name: 'Bash',
            input: { command: typeof item.command === 'string' ? item.command : '' },
          });
        }
        if (obj.type === 'item.completed') {
          emit({
            type: 'tool_result',
            toolUseId: item.id,
            content: stringifyContent(item.aggregated_output ?? ''),
            isError:
              typeof item.exit_code === 'number' ? item.exit_code !== 0 : item.status === 'failed',
          });
        }
        return true;
      }

      // agent_message → text_delta (only on completion carries the final text)
      if (
        obj.type === 'item.completed' &&
        item.type === 'agent_message' &&
        typeof item.text === 'string' &&
        item.text.length > 0
      ) {
        // A codex agent_message is a COMPLETE message — mark it final so the chat
        // gives it its own bubble (a turn can hold several of these).
        emit({ type: 'text_delta', delta: item.text, final: true });
        return true;
      }
      return false;
    }

    default:
      return false;
  }
}

/** Copilot stream-json line → normalized events. Copilot uses dotted top-level
 *  types with the payload under `data`. */
function handleCopilotEvent(obj: unknown, emit: EventHandler, ctx: NormalizerContext): boolean {
  if (!isRecord(obj) || typeof obj.type !== 'string') return false;
  const data = isRecord(obj.data) ? obj.data : {};

  switch (obj.type) {
    case 'session.tools_updated':
    case 'assistant.turn_start':
      emit({
        type: 'status',
        label: obj.type === 'assistant.turn_start' ? 'running' : 'initializing',
        model: typeof data.model === 'string' ? data.model : undefined,
      });
      return true;

    case 'assistant.reasoning_delta':
      if (typeof data.deltaContent === 'string' && data.deltaContent.length > 0) {
        emit({ type: 'thinking_delta', delta: data.deltaContent });
      }
      return true;

    case 'assistant.message_delta':
      if (typeof data.deltaContent === 'string' && data.deltaContent.length > 0) {
        emit({ type: 'text_delta', delta: data.deltaContent });
      }
      return true;

    case 'tool.execution_start':
      emit({
        type: 'tool_use',
        id: typeof data.id === 'string' ? data.id : '',
        name: typeof data.name === 'string' ? data.name : 'tool',
        input: data.arguments ?? null,
      });
      return true;

    case 'tool.execution_complete':
      emit({
        type: 'tool_result',
        toolUseId: typeof data.id === 'string' ? data.id : '',
        content: stringifyContent(data.result),
        isError: data.status === 'error' || data.isError === true,
      });
      return true;

    case 'result': {
      const usage: NormalizedUsage = {};
      const u = isRecord(obj.usage) ? obj.usage : isRecord(data.usage) ? data.usage : {};
      if (typeof u.input_tokens === 'number') usage.inputTokens = u.input_tokens;
      if (typeof u.output_tokens === 'number') usage.outputTokens = u.output_tokens;
      emit({
        type: 'usage',
        usage,
        durationMs: typeof obj.duration_ms === 'number' ? obj.duration_ms : undefined,
        stopReason: typeof obj.stopReason === 'string' ? obj.stopReason : undefined,
      });
      return true;
    }

    case 'error':
      emitFriendlyAgentError(emit, extractErrorMessage(obj.message ?? data.message ?? obj.error, ''), ctx);
      return true;

    default:
      return false;
  }
}

/**
 * Streaming line-buffered normalizer. Feed it raw stdout chunks; it splits on
 * newlines, JSON-parses each line, dispatches to the right CLI mapping, and
 * emits NormalizedEvents. Unparseable lines fall through to `raw`.
 */
export function createEventNormalizer(kind: ParserKind, emit: EventHandler, ctx: NormalizerContext = {}) {
  let buffer = '';
  const state = freshState();

  function handleLine(line: string): void {
    let obj: unknown;
    try {
      obj = JSON.parse(line);
    } catch {
      emit({ type: 'raw', line });
      return;
    }
    const handled =
      kind === 'codex' ? handleCodexEvent(obj, emit, state, ctx) : handleCopilotEvent(obj, emit, ctx);
    if (!handled) emit({ type: 'raw', line });
  }

  function feed(chunk: string): void {
    buffer += chunk;
    let nl: number;
    while ((nl = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (line) handleLine(line);
    }
  }

  function flush(): void {
    const rem = buffer.trim();
    buffer = '';
    if (rem) handleLine(rem);
  }

  return { feed, flush };
}

/**
 * Convenience: normalize a full block of raw JSONL into the ordered event list.
 * Used by the Event Normalizer unit test and any batch consumer.
 */
export function normalizeRawLines(kind: ParserKind, raw: string, ctx: NormalizerContext = {}): NormalizedEvent[] {
  const out: NormalizedEvent[] = [];
  const n = createEventNormalizer(kind, (e) => out.push(e), ctx);
  n.feed(raw.endsWith('\n') ? raw : `${raw}\n`);
  n.flush();
  return out;
}

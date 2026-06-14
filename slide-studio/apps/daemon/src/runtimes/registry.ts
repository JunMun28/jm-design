import { codexAgentDef } from './defs/codex.ts';
import { copilotAgentDef } from './defs/copilot.ts';
import type { RuntimeAgentDef } from './types.ts';

/**
 * The declarative agent registry. Adding a CLI = adding a data file here — the
 * daemon never branches on agent id. Copilot is the production runtime and is
 * listed first (the app defaults to it when present, §1 N3); codex is the
 * development/fallback runtime.
 */
export const AGENT_DEFS: RuntimeAgentDef[] = [copilotAgentDef, codexAgentDef];

export function getAgentDef(id: string): RuntimeAgentDef | undefined {
  return AGENT_DEFS.find((d) => d.id === id);
}

/**
 * Production-runtime preference order for the runtime selector (plan §1 N3,
 * Slice 9 AC1). Enterprise GitHub Copilot is the production runtime, so the app
 * DEFAULTS to it when present; codex is the development/fallback runtime.
 */
export const RUNTIME_DEFAULT_ORDER = ['copilot', 'codex'] as const;

/**
 * Pick the runtime the selector should default to, given the set of detected
 * runtime ids. Copilot wins when present, else codex, else the first available
 * id (future runtimes), else null. Pure + shared so the daemon and the web shell
 * agree on the default without duplicating the rule.
 */
export function defaultRuntimeId(availableIds: readonly string[]): string | null {
  for (const preferred of RUNTIME_DEFAULT_ORDER) {
    if (availableIds.includes(preferred)) return preferred;
  }
  return availableIds[0] ?? null;
}

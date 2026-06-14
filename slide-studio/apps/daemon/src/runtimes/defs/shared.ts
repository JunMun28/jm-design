import type { RuntimeModelOption } from '../types.ts';

/** The synthetic "let the CLI pick" model option that always heads the list. */
export const DEFAULT_MODEL_OPTION: RuntimeModelOption = { id: 'default', label: 'Default' };

/** Clamp a requested reasoning effort to what codex accepts. */
export function clampCodexReasoning(effort: string | null | undefined): string {
  const allowed = new Set(['none', 'minimal', 'low', 'medium', 'high', 'xhigh']);
  const value = (effort ?? '').trim().toLowerCase();
  return allowed.has(value) ? value : 'medium';
}

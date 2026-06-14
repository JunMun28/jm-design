/**
 * Brief (Recorded Discussion) extraction (plan §7 step 2, AC for issue #4).
 *
 * The consultant persona (skills.ts) instructs the agent to emit the current
 * Recorded Discussion as a fenced ```brief … ``` JSON block after each turn.
 * The daemon parses that block out of the streamed assistant text into a
 * structured Brief and forwards it to the web app, which renders the live Brief
 * panel (audience / goal / narrative arc / key messages).
 *
 * Parsing is best-effort and forgiving: a malformed or partial block yields
 * `null` rather than throwing, so a run is never blocked on a bad emission.
 */

export type Brief = {
  audience?: string;
  goal?: string;
  narrativeArc?: string[];
  keyMessages?: string[];
};

/** True when the brief has at least one populated field. */
export function isPopulated(brief: Brief): boolean {
  return Boolean(
    brief.audience ||
      brief.goal ||
      (brief.narrativeArc && brief.narrativeArc.length) ||
      (brief.keyMessages && brief.keyMessages.length),
  );
}

function asTrimmedString(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const t = v.trim();
  return t.length ? t : undefined;
}

function asStringArray(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out = v
    .map((x) => (typeof x === 'string' ? x.trim() : ''))
    .filter((x) => x.length > 0);
  return out.length ? out : undefined;
}

/** Normalize an arbitrary parsed object into a Brief, dropping unknown shapes. */
export function normalizeBrief(raw: unknown): Brief {
  if (!raw || typeof raw !== 'object') return {};
  const obj = raw as Record<string, unknown>;
  const brief: Brief = {};
  const audience = asTrimmedString(obj.audience);
  const goal = asTrimmedString(obj.goal);
  const arc = asStringArray(obj.narrativeArc ?? obj.arc);
  const messages = asStringArray(obj.keyMessages ?? obj.messages);
  if (audience) brief.audience = audience;
  if (goal) brief.goal = goal;
  if (arc) brief.narrativeArc = arc;
  if (messages) brief.keyMessages = messages;
  return brief;
}

const BRIEF_BLOCK = /```brief\s*([\s\S]*?)```/gi;

/**
 * Extract the LAST `brief` fenced block from assistant text and parse it into a
 * structured Brief. Returns null when no parseable, populated block is present
 * — the caller keeps the prior Brief unchanged.
 *
 * The last block wins so a long turn that refines the Brief mid-stream lands on
 * its final state.
 */
export function extractBrief(text: string): Brief | null {
  let match: RegExpExecArray | null;
  let lastJson: string | null = null;
  BRIEF_BLOCK.lastIndex = 0;
  while ((match = BRIEF_BLOCK.exec(text)) !== null) {
    lastJson = match[1].trim();
  }
  if (!lastJson) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(lastJson);
  } catch {
    return null;
  }
  const brief = normalizeBrief(parsed);
  return isPopulated(brief) ? brief : null;
}

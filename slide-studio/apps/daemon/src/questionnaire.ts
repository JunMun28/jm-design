/**
 * Intake questionnaire extraction (Brief-panel intake, §7 step 2).
 *
 * Today the agent asks framing questions one-at-a-time in chat. To frame a deck
 * faster, the brainstorm persona (skills.ts) now instructs the agent — on its
 * FIRST turn only — to emit a set of COMMON, contextual framing questions as a
 * fenced ```questionnaire … ``` JSON block plus a one-line intro and NOTHING
 * else. The daemon parses that block out of the streamed assistant text into a
 * structured Questionnaire and forwards it to the web app, which renders it as an
 * interactive form IN THE BRIEF PANEL. The user answers all the questions, clicks
 * one button, and only THEN the agent continues with sharper, conversational
 * follow-ups (one at a time, the existing chat flow).
 *
 * This mirrors brief.ts exactly: parsing is best-effort and forgiving (a
 * malformed / partial / missing block yields `null` rather than throwing, so a
 * run is never blocked on a bad emission), and the block is STRIPPED from the
 * assistant text that is shown/saved so the chat shows only the one-line intro.
 */

/** One option's input type. `single` = pick one; `multi` = pick any. */
export type QuestionType = 'single' | 'multi';

/** One framing question the Brief-panel questionnaire renders. */
export type QuestionnaireQuestion = {
  /** Stable id used to key the answer (e.g. 'audience', 'goal'). */
  id: string;
  /** The human-readable prompt (e.g. "Who's the audience?"). */
  label: string;
  type: QuestionType;
  /** The selectable option labels. */
  options: string[];
  /** When true, the form offers an "Other…" chip with a free-text input. */
  allowOther?: boolean;
};

/** The agent-generated, deck-contextual intake questionnaire. */
export type Questionnaire = {
  /** The one-line intro shown above the questions. */
  intro: string;
  questions: QuestionnaireQuestion[];
};

function asTrimmedString(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const t = v.trim();
  return t.length ? t : undefined;
}

function asOptionArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => (typeof x === 'string' ? x.trim() : ''))
    .filter((x) => x.length > 0);
}

/** Normalize one raw question, dropping it (→ null) when it is unusable. */
function normalizeQuestion(raw: unknown): QuestionnaireQuestion | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const id = asTrimmedString(obj.id);
  const label = asTrimmedString(obj.label);
  const options = asOptionArray(obj.options);
  // A question with no id, no label, or no options can't be rendered or answered.
  if (!id || !label || options.length === 0) return null;
  const type: QuestionType = obj.type === 'multi' ? 'multi' : 'single';
  const question: QuestionnaireQuestion = { id, label, type, options };
  if (obj.allowOther === true) question.allowOther = true;
  return question;
}

/**
 * Normalize an arbitrary parsed object into a Questionnaire, dropping unknown
 * shapes and unusable questions. Returns `null` when there is no intro or no
 * usable question — the caller keeps the brief flow unchanged.
 */
export function normalizeQuestionnaire(raw: unknown): Questionnaire | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const intro = asTrimmedString(obj.intro);
  const rawQuestions = Array.isArray(obj.questions) ? obj.questions : [];
  const questions = rawQuestions
    .map(normalizeQuestion)
    .filter((q): q is QuestionnaireQuestion => q !== null);
  if (!intro || questions.length === 0) return null;
  return { intro, questions };
}

const QUESTIONNAIRE_BLOCK = /```questionnaire\s*([\s\S]*?)```/gi;

/**
 * Extract the LAST `questionnaire` fenced block from assistant text and parse it
 * into a structured Questionnaire. Returns null when no parseable, populated
 * block is present — the caller keeps the normal brief flow.
 *
 * The last block wins (mirrors extractBrief) so a turn that re-emits the
 * questionnaire mid-stream lands on its final state.
 */
export function extractQuestionnaire(text: string): Questionnaire | null {
  let match: RegExpExecArray | null;
  let lastJson: string | null = null;
  QUESTIONNAIRE_BLOCK.lastIndex = 0;
  while ((match = QUESTIONNAIRE_BLOCK.exec(text)) !== null) {
    lastJson = match[1].trim();
  }
  if (!lastJson) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(lastJson);
  } catch {
    return null;
  }
  return normalizeQuestionnaire(parsed);
}

/**
 * Strip EVERY `questionnaire` fenced block from assistant text so the chat shows
 * only the one-line intro (mirrors how the web chat strips the ```brief block).
 * Collapses the blank lines the removal leaves behind and trims, so a turn whose
 * whole body was the block + intro renders as just the intro.
 */
export function stripQuestionnaire(text: string): string {
  return text
    .replace(QUESTIONNAIRE_BLOCK, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** The opening fence we hold streamed text back on (case-insensitive). */
const OPEN_FENCE = '```questionnaire';

/**
 * A streaming-safe questionnaire stripper. The agent's first turn streams as one
 * or more `text_delta` chunks; the chat shows only the one-line intro, never the
 * raw block, so we strip it on the WIRE (the daemon can't edit the web chat's
 * display transform). Feed each delta; it emits only text proven to be OUTSIDE a
 * ```questionnaire block, holding back any text from an opening fence until the
 * matching closing fence arrives (or the stream flushes).
 *
 * Because a fence can split across deltas, the stripper keeps a small pending tail
 * that could be the start of an opening fence and only releases it once it knows
 * the tail is safe. `flush()` releases whatever a (defensively) unterminated block
 * left pending — run-end re-derives the clean text from the full buffer anyway.
 */
export function createQuestionnaireStripper(): {
  push(delta: string): string;
  flush(): string;
} {
  let pending = '';
  let inBlock = false;

  /** The longest suffix of `s` that is a (case-insensitive) prefix of `OPEN_FENCE`. */
  function partialFenceTail(s: string): number {
    const max = Math.min(s.length, OPEN_FENCE.length - 1);
    for (let n = max; n > 0; n--) {
      if (s.slice(s.length - n).toLowerCase() === OPEN_FENCE.slice(0, n).toLowerCase()) return n;
    }
    return 0;
  }

  function push(delta: string): string {
    pending += delta;
    let out = '';
    // Resolve as many complete fence transitions as the buffer allows.
    for (;;) {
      if (!inBlock) {
        const open = pending.toLowerCase().indexOf(OPEN_FENCE);
        if (open === -1) {
          // No opening fence yet. Emit everything except a tail that could still
          // become one once more deltas arrive.
          const hold = partialFenceTail(pending);
          out += pending.slice(0, pending.length - hold);
          pending = pending.slice(pending.length - hold);
          return out;
        }
        // Emit text before the block; drop the opening fence; enter the block.
        out += pending.slice(0, open);
        pending = pending.slice(open + OPEN_FENCE.length);
        inBlock = true;
      } else {
        const close = pending.indexOf('```');
        if (close === -1) {
          // Still inside the block — swallow everything, keep a tail that could be
          // a partial closing fence.
          const hold = Math.min(pending.length, 2);
          pending = pending.slice(pending.length - hold);
          return out;
        }
        // Drop through the closing fence; back to outside-the-block scanning.
        pending = pending.slice(close + 3);
        inBlock = false;
      }
    }
  }

  function flush(): string {
    const rem = inBlock ? '' : pending;
    pending = '';
    inBlock = false;
    return rem;
  }

  return { push, flush };
}

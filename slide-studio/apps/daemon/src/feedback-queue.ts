/**
 * Durable feedback queue (Slice 13 / issue #7, AC2). Queued annotations and
 * feedback MUST survive an interrupted run — a cancel, an agent error, a
 * watchdog stop, or a dropped socket. The mechanism: every queued item is
 * appended to a per-project `feedback-queue.jsonl` the moment it is queued, and
 * marked "sent" ONLY after a run it was attached to completes cleanly. An
 * interrupted run never marks them sent, so they remain pending and are
 * re-attached to the next turn — nothing the user typed is lost.
 *
 * This is the daemon-side persistence (the survival guarantee). The web shell
 * mirrors the pending set in the composer (localStorage) so the pills reappear
 * immediately on reload; the on-disk queue is the source of truth on resume.
 *
 * Persistence shape mirrors projects.ts (per-project dir, JSONL append). Pure I/O
 * + a couple of pure serializers so the survival + replay logic is unit-testable
 * with a temp data dir (the Slice-13 feedback-survival suite).
 */
import { appendFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { projectDir } from './projects.ts';
import { serializeAnnotations, toAnnotation, type Anchor, type AnnotationSurface } from './annotation.ts';

/**
 * Per-file write serializer (the concurrency guard). The web shell fires a
 * `queueFeedback` POST per pinned annotation, so a user pinning several in quick
 * succession lands multiple near-simultaneous appends on the SAME queue file.
 * The old read-then-`writeFile(prior + new)` raced — two calls read the same
 * `prior` and the second clobbered the first's record (observed live: a corrupted
 * JSONL line, a lost annotation). We now (a) only ever **append** (never rewrite
 * the whole file) and (b) chain each file's appends through a promise so they run
 * strictly one-at-a-time within the process — atomic on POSIX via O_APPEND and
 * race-free on every platform via the chain. Keyed by absolute file path.
 */
const writeChains = new Map<string, Promise<unknown>>();

function withFileLock<T>(file: string, op: () => Promise<T>): Promise<T> {
  const prior = writeChains.get(file) ?? Promise.resolve();
  // Run `op` only after any in-flight write to this file settles (ignore its
  // outcome so one failure doesn't poison the chain).
  const next = prior.then(op, op);
  // Keep the chain alive but swallow rejections on the stored handle.
  writeChains.set(
    file,
    next.then(
      () => undefined,
      () => undefined,
    ),
  );
  return next;
}

/** One queued piece of feedback: a free-text comment or a wireframe annotation
 *  pinned to an element/text range/slide (the lavish-style anchor, plan §10). */
export type FeedbackItem = {
  id: string;
  /** 'comment' = free-text; 'annotation' = pinned to an artifact element. */
  kind: 'comment' | 'annotation';
  /** The user's words. */
  text: string;
  /** Annotation anchor (only for kind 'annotation'). */
  selector?: string;
  /** Current text at the anchor, so the agent can locate it (plan §10). */
  anchorText?: string;
  /** Which wireframe/deck slide the annotation targets (plan §10). */
  slideIndex?: number;
  /** Which artifact the annotation was pinned on (Slice 12 / issue #15). A
   *  'deck' annotation drives a **regenerate** (vs the wireframe's in-place edit);
   *  unset defaults to 'wireframe' — the original Slice-4 surface. */
  surface?: AnnotationSurface;
  /** The full element / text-range anchor captured by the SDK (Slice 4 / issue
   *  #11). Drives the rich `<attached-preview-comments>` block; `selector` /
   *  `anchorText` remain as a flat summary for the legacy serializer + the UI. */
  anchor?: Anchor | null;
  /** Project-relative screenshot ref of the targeted region (plan §10). */
  screenshot?: string;
  /** Set true once a run that carried this item completed cleanly. */
  sent?: boolean;
  at: string;
};

/** Input to queue one item (id + timestamp are minted here). */
export type FeedbackInput = Omit<FeedbackItem, 'id' | 'at' | 'sent'>;

function queueFile(projectId: string, env: NodeJS.ProcessEnv = process.env): string {
  return join(projectDir(projectId, env), 'feedback-queue.jsonl');
}

/** Append one feedback item to the durable queue. Returns the stored item. */
export async function appendFeedback(
  projectId: string,
  input: FeedbackInput,
  env: NodeJS.ProcessEnv = process.env,
): Promise<FeedbackItem> {
  const item: FeedbackItem = {
    id: randomUUID().slice(0, 12),
    sent: false,
    at: new Date().toISOString(),
    ...input,
  };
  const file = queueFile(projectId, env);
  // Append-only + per-file lock: concurrent appends never interleave or clobber
  // (see writeChains). O_APPEND keeps each record's bytes contiguous.
  await withFileLock(file, () => appendFile(file, `${JSON.stringify(item)}\n`, 'utf8'));
  return item;
}

/** Read the whole queue (sent + pending), in order. */
export async function readFeedback(
  projectId: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<FeedbackItem[]> {
  const file = queueFile(projectId, env);
  if (!existsSync(file)) return [];
  const raw = await readFile(file, 'utf8');
  return raw
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line) as FeedbackItem;
      } catch {
        return null;
      }
    })
    .filter((x): x is FeedbackItem => x !== null);
}

/**
 * The pending feedback that an interrupted run left behind. These are the items
 * that must be re-attached to the next turn (AC2). Newest queue state wins: if an
 * item appears multiple times (queued, then later marked sent), the LAST record
 * for its id is authoritative.
 */
export async function readPendingFeedback(
  projectId: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<FeedbackItem[]> {
  const all = await readFeedback(projectId, env);
  const latest = new Map<string, FeedbackItem>();
  for (const item of all) latest.set(item.id, item);
  return [...latest.values()].filter((i) => !i.sent).sort((a, b) => (a.at < b.at ? -1 : 1));
}

/**
 * Mark the given item ids as sent — called ONLY after a run that carried them
 * finishes cleanly. Appends "sent" tombstone records (append-only log; the
 * latest record per id wins in {@link readPendingFeedback}). An interrupted run
 * never calls this, so its items survive as pending.
 */
export async function markFeedbackSent(
  projectId: string,
  ids: string[],
  env: NodeJS.ProcessEnv = process.env,
): Promise<void> {
  if (!ids.length) return;
  const all = await readFeedback(projectId, env);
  const byId = new Map(all.map((i) => [i.id, i]));
  const file = queueFile(projectId, env);
  let appended = '';
  for (const id of ids) {
    const item = byId.get(id);
    if (!item || item.sent) continue;
    appended += `${JSON.stringify({ ...item, sent: true, at: new Date().toISOString() })}\n`;
  }
  if (!appended) return;
  // Append the tombstone records under the same per-file lock as appendFeedback,
  // so marking-sent never clobbers a concurrently-queued annotation.
  await withFileLock(file, () => appendFile(file, appended, 'utf8'));
}

/** Clear all pending feedback (e.g. the user dismisses the queue). */
export async function clearFeedback(
  projectId: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<void> {
  const pending = await readPendingFeedback(projectId, env);
  await markFeedbackSent(
    projectId,
    pending.map((i) => i.id),
    env,
  );
}

/**
 * Serialize pending feedback into the structured `<attached-preview-comments>`
 * block the agent reads (plan §10), appended to the user turn. Pure — no I/O —
 * so it is unit-testable. Returns '' when there is nothing pending.
 */
export function serializeFeedbackBlock(items: FeedbackItem[]): string {
  if (!items.length) return '';
  const lines = items.map((i) => {
    const parts: string[] = [];
    if (i.kind === 'annotation') {
      if (typeof i.slideIndex === 'number') parts.push(`slide ${i.slideIndex + 1}`);
      if (i.selector) parts.push(`element \`${i.selector}\``);
      if (i.anchorText) parts.push(`current text "${i.anchorText}"`);
    }
    const where = parts.length ? ` (${parts.join(', ')})` : '';
    return `- ${i.text}${where}`;
  });
  return [
    '<attached-preview-comments>',
    'The user left this queued feedback on the preview. Change ONLY these elements; leave everything else as-is.',
    ...lines,
    '</attached-preview-comments>',
  ].join('\n');
}

/**
 * Build the structured block(s) to append to a turn from the pending queue
 * (Slice 4 / issue #11). Pinned **annotations** (an anchor captured by the SDK)
 * serialize through the rich {@link serializeAnnotations} — full anchor, current
 * text, slide, screenshot ref, and the scoped "change ONLY these elements"
 * instruction — so the agent's revise stays surgical. Free-text **comments**
 * (kind 'comment', no anchor) keep the thin {@link serializeFeedbackBlock}. Pure
 * (no I/O); returns '' when nothing is pending.
 */
export function serializeFeedbackForTurn(items: FeedbackItem[]): string {
  if (!items.length) return '';
  const annotations = items.filter((i) => i.kind === 'annotation');
  const comments = items.filter((i) => i.kind !== 'annotation');
  const blocks: string[] = [];
  if (annotations.length) {
    blocks.push(
      serializeAnnotations(
        annotations.map((i) =>
          toAnnotation(i.id, {
            comment: i.text,
            slideIndex: typeof i.slideIndex === 'number' ? i.slideIndex : 0,
            anchor: i.anchor ?? elementAnchorFromFlat(i),
            screenshot: i.screenshot,
            surface: i.surface,
          }),
        ),
      ),
    );
  }
  if (comments.length) blocks.push(serializeFeedbackBlock(comments));
  return blocks.filter(Boolean).join('\n\n');
}

/**
 * Whether any pending item is a **Deck** annotation (Slice 12 / issue #15). The
 * generate path uses this to decide between a fresh generation and a
 * **regenerate** that carries the deck annotations as the scoped revise block.
 * Pure — no I/O.
 */
export function hasDeckAnnotations(items: FeedbackItem[]): boolean {
  return items.some((i) => i.kind === 'annotation' && i.surface === 'deck');
}

/** Reconstruct a minimal element anchor from the flat `selector`/`anchorText`
 *  fields when no structured anchor was stored (older queue rows). */
function elementAnchorFromFlat(i: FeedbackItem): Anchor | null {
  if (!i.selector && !i.anchorText) return null;
  return { kind: 'element', selector: i.selector ?? '', tag: '', text: i.anchorText ?? '' };
}

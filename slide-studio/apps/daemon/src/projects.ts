/**
 * Project persistence (plan §14, AC3). A Project is one deck-building
 * workspace: one brief, its conversation, its artifacts, its outputs. v1 keeps
 * it simple — a per-project directory on disk with a `project.json` and a
 * `conversation.jsonl` log. No SQLite until perf demands it.
 */
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Brief } from './brief.ts';
import type { Questionnaire } from './questionnaire.ts';

/** The pipeline steps the top stepper walks (plan §7). */
export type FlowStage = 'brief' | 'wireframe' | 'theme' | 'deck';

/** Gate status: the user approves (the Brief arc / the Wireframe), or asks for
 *  changes (loops). Shared by Gate 1, Gate 2, and Gate 3 (theme picked). */
export type GateStatus = 'pending' | 'approved';

/** Slide-output formats the user can generate (plan §12). The Deck is built as
 *  single-file HTML and/or editable PPTX; v1 wires HTML (issue #12) and keeps the
 *  shape ready for PPTX. */
export type OutputFormat = 'html' | 'pptx';

/** One non-destructive styled rendering of the project's content (S2). One per
 *  theme: re-generating a theme refreshes its variant; a new theme adds another. */
export type DeckVariant = {
  id: string;
  theme: string;
  file: string;
  fromWireframeRev: number;
  createdAt: string;
};

export type ProjectRecord = {
  id: string;
  title: string;
  /** The user's first request — becomes the opening chat turn. */
  brief: string;
  runtimeId: string | null;
  theme: string | null;
  decks: DeckVariant[];
  wireframeRev: number;
  activeDeckId: string | null;
  /** The current pipeline step (drives the stepper). Defaults to 'brief'. */
  stage: FlowStage;
  /** The live Recorded Discussion parsed from the agent's structured output. */
  recordedBrief: Brief;
  /**
   * The agent-generated intake questionnaire (Brief-panel intake): on the FIRST
   * brainstorm turn the agent emits a contextual set of common framing questions
   * the Brief panel renders as an interactive form. Null until the agent emits
   * it; cleared in shape once answered (see {@link questionnaireAnswered}).
   */
  questionnaire: Questionnaire | null;
  /**
   * True once the user has submitted their questionnaire answers (the compiled
   * answer message has been sent through the chat). The Brief panel then reverts
   * to the normal recorded-discussion display and the agent continues with
   * sharper, conversational follow-ups (NOT another questionnaire).
   */
  questionnaireAnswered: boolean;
  /** Gate 1 (arc approval) status. 'approved' advances the flow past Brief. */
  gate1: GateStatus;
  /** Gate 2 (wireframe approval) status. 'approved' advances Wireframe → Theme
   *  (Slice 4 / issue #11). */
  gate2: GateStatus;
  /** Gate 3 (theme picked) status (Slice 5 / issue #12). 'approved' means the
   *  user picked a Theme and the flow advanced Theme → Deck so the themed Deck is
   *  generated. The picked theme is persisted in {@link theme}. */
  gate3: GateStatus;
  /** The output format(s) the user generates the Deck in (plan §12). Defaults to
   *  HTML — the single-file `html-slides` output issue #12 wires. */
  formats: OutputFormat[];
  createdAt: string;
  updatedAt: string;
};

export type ConversationEntry = {
  role: 'user' | 'assistant';
  text: string;
  at: string;
};

/** Where Projects live on disk. Override via SLIDE_STUDIO_DATA_DIR (tests do). */
export function projectsRoot(env: NodeJS.ProcessEnv = process.env): string {
  return env.SLIDE_STUDIO_DATA_DIR || join(homedir(), '.slide-studio', 'projects');
}

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'untitled-deck'
  );
}

export function projectDir(id: string, env: NodeJS.ProcessEnv = process.env): string {
  return join(projectsRoot(env), id);
}

/**
 * Create a Project on disk and return its record. The directory holds
 * `project.json` plus an empty `conversation.jsonl`. Idempotent per id (a fresh
 * UUID is minted each call).
 */
export async function createProject(
  input: { title?: string; brief: string; runtimeId?: string | null; theme?: string | null },
  env: NodeJS.ProcessEnv = process.env,
): Promise<ProjectRecord> {
  const now = new Date().toISOString();
  const baseTitle = (input.title || input.brief || 'Untitled deck').trim();
  const id = `${slugify(baseTitle)}-${randomUUID().slice(0, 8)}`;
  const dir = projectDir(id, env);
  await mkdir(dir, { recursive: true });

  const record: ProjectRecord = {
    id,
    title: baseTitle.slice(0, 120),
    brief: input.brief,
    runtimeId: input.runtimeId ?? null,
    theme: input.theme ?? null,
    decks: [],
    wireframeRev: 0,
    activeDeckId: null,
    stage: 'brief',
    recordedBrief: {},
    questionnaire: null,
    questionnaireAnswered: false,
    gate1: 'pending',
    gate2: 'pending',
    gate3: 'pending',
    formats: ['html'],
    createdAt: now,
    updatedAt: now,
  };
  await writeFile(join(dir, 'project.json'), JSON.stringify(record, null, 2), 'utf8');
  // Seed the conversation log with the opening user turn.
  await appendConversation(id, { role: 'user', text: input.brief, at: now }, env);
  return record;
}

export async function readProject(id: string, env: NodeJS.ProcessEnv = process.env): Promise<ProjectRecord | null> {
  const file = join(projectDir(id, env), 'project.json');
  if (!existsSync(file)) return null;
  try {
    const parsed = JSON.parse(await readFile(file, 'utf8')) as Partial<ProjectRecord>;
    // Backfill fields for projects created before later slices existed.
    const merged = {
      stage: 'brief',
      recordedBrief: {},
      questionnaire: null,
      questionnaireAnswered: false,
      gate1: 'pending',
      gate2: 'pending',
      gate3: 'pending',
      formats: ['html'],
      runtimeId: null,
      theme: null,
      decks: [],
      wireframeRev: 0,
      activeDeckId: null,
      ...parsed,
    } as ProjectRecord;
    // S2 legacy migration: if this record has no decks[] but has a theme, the
    // old single deck.html was themed — wrap it in one DeckVariant.
    if (!Array.isArray(parsed.decks) && merged.theme) {
      const v: DeckVariant = {
        id: slugify(merged.theme),
        theme: merged.theme,
        file: 'deck.html',
        fromWireframeRev: 0,
        createdAt: merged.createdAt,
      };
      merged.decks = [v];
      merged.activeDeckId = v.id;
    }
    return merged;
  } catch {
    return null;
  }
}

/** Persist arbitrary patches to a project record (and touch updatedAt). */
async function patchProject(
  id: string,
  patch: Partial<ProjectRecord>,
  env: NodeJS.ProcessEnv = process.env,
): Promise<ProjectRecord | null> {
  const rec = await readProject(id, env);
  if (!rec) return null;
  const next: ProjectRecord = { ...rec, ...patch, updatedAt: new Date().toISOString() };
  await writeFile(join(projectDir(id, env), 'project.json'), JSON.stringify(next, null, 2), 'utf8');
  return next;
}

/** Merge a freshly-parsed Brief into the project's Recorded Discussion. */
export async function updateRecordedBrief(
  id: string,
  brief: Brief,
  env: NodeJS.ProcessEnv = process.env,
): Promise<ProjectRecord | null> {
  const rec = await readProject(id, env);
  if (!rec) return null;
  const merged: Brief = { ...rec.recordedBrief, ...brief };
  return patchProject(id, { recordedBrief: merged }, env);
}

/**
 * Persist the agent-generated intake questionnaire (Brief-panel intake). Called
 * when the daemon parses a ```questionnaire block out of the agent's first
 * brainstorm turn. A no-op (returns the record unchanged) once the user has
 * already answered, so a stray re-emission can't reopen the form.
 */
export async function setQuestionnaire(
  id: string,
  questionnaire: Questionnaire,
  env: NodeJS.ProcessEnv = process.env,
): Promise<ProjectRecord | null> {
  const rec = await readProject(id, env);
  if (!rec) return null;
  if (rec.questionnaireAnswered) return rec;
  return patchProject(id, { questionnaire }, env);
}

/**
 * Mark the intake questionnaire answered (the user submitted their selections;
 * the compiled answer message is sent through the chat). The Brief panel reverts
 * to the normal recorded-discussion display and the agent continues with
 * conversational follow-ups. The questionnaire shape is cleared so a resumed
 * Project never re-renders the form.
 */
export async function markQuestionnaireAnswered(
  id: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<ProjectRecord | null> {
  return patchProject(id, { questionnaireAnswered: true, questionnaire: null }, env);
}

/**
 * Gate 1 transition. `approve` advances the flow past Brief → Wireframe;
 * `request-changes` keeps the gate pending (the flow loops back into chat).
 */
export async function setGate1(
  id: string,
  action: 'approve' | 'request-changes',
  env: NodeJS.ProcessEnv = process.env,
): Promise<ProjectRecord | null> {
  if (action === 'approve') {
    return patchProject(id, { gate1: 'approved', stage: 'wireframe' }, env);
  }
  return patchProject(id, { gate1: 'pending', stage: 'brief' }, env);
}

/**
 * Gate 2 transition (Slice 4 / issue #11). `approve` advances the flow past the
 * Wireframe → Theme (the user is happy with the low-fi layout). `request-changes`
 * keeps the gate pending and holds the stage on Wireframe so the user keeps
 * annotating and the agent keeps revising. Approving Gate 2 implies Gate 1 was
 * already approved (the Wireframe only exists after Gate 1), so it is left intact.
 */
export async function setGate2(
  id: string,
  action: 'approve' | 'request-changes',
  env: NodeJS.ProcessEnv = process.env,
): Promise<ProjectRecord | null> {
  if (action === 'approve') {
    return patchProject(id, { gate2: 'approved', stage: 'theme' }, env);
  }
  return patchProject(id, { gate2: 'pending', stage: 'wireframe' }, env);
}

/** Deck file name for a theme, e.g. "deck.micron-dark.html". */
export function variantFileName(theme: string): string {
  return `deck.${slugify(theme)}.html`;
}

/** The deck file to (re)generate for a theme: reuse the existing variant's file
 *  (so legacy "deck.html" stays put), else a fresh per-theme name. */
export function deckFileForTheme(record: ProjectRecord, theme: string): string {
  return record.decks.find((d) => d.theme === theme)?.file ?? variantFileName(theme);
}

/** Add or refresh the variant for a theme (keyed by slugify(theme)) and make it
 *  active. Pure — returns a new record. */
export function upsertVariant(
  record: ProjectRecord,
  v: { theme: string; file: string; wireframeRev: number; createdAt: string },
): ProjectRecord {
  const id = slugify(v.theme);
  const variant: DeckVariant = { id, theme: v.theme, file: v.file, fromWireframeRev: v.wireframeRev, createdAt: v.createdAt };
  const decks = record.decks.some((d) => d.id === id)
    ? record.decks.map((d) => (d.id === id ? variant : d))
    : [...record.decks, variant];
  return { ...record, decks, activeDeckId: id };
}

/** The currently active deck variant, or null. */
export function activeDeck(record: ProjectRecord): DeckVariant | null {
  return record.decks.find((d) => d.id === record.activeDeckId) ?? null;
}

/**
 * Gate 3 transition (Slice 5 / issue #12, AC1). The user picks a Theme from the
 * `html-slides` catalogue; the selection **persists** on the Project record and
 * the flow advances Theme → Deck so the themed Deck is generated. Approving Gate 3
 * implies Gates 1 + 2 are already approved (the Theme step only exists after the
 * Wireframe is approved), so those are left intact.
 *
 * The `theme` is the picker's chosen id (validated against the catalogue by the
 * caller). Optional `formats` records which output format(s) to generate (§12);
 * it defaults to the record's existing formats when omitted.
 */
export async function setTheme(
  id: string,
  theme: string,
  formats?: OutputFormat[],
  env: NodeJS.ProcessEnv = process.env,
): Promise<ProjectRecord | null> {
  const rec = await readProject(id, env);
  if (!rec) return null;
  const patch: Partial<ProjectRecord> = {
    theme,
    gate3: 'approved',
    stage: 'deck',
  };
  if (formats && formats.length) patch.formats = formats;
  return patchProject(id, patch, env);
}

/** Make an existing deck variant active. Returns null if the id is unknown. */
export async function setActiveDeck(
  id: string,
  deckId: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<ProjectRecord | null> {
  const record = await readProject(id, env);
  if (!record) return null;
  if (!record.decks.some((d) => d.id === deckId)) return null;
  return patchProject(id, { activeDeckId: deckId }, env);
}

/** After the agent writes a deck for `theme`, record the variant (refresh in
 *  place, set active) and write a manifest sidecar so the artifact resolver
 *  reports the right kind+theme. Returns the updated record. */
export async function registerGeneratedDeck(
  id: string,
  theme: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<ProjectRecord | null> {
  const record = await readProject(id, env);
  if (!record) return null;
  const file = deckFileForTheme(record, theme);
  const next = upsertVariant(record, { theme, file, wireframeRev: record.wireframeRev, createdAt: record.updatedAt });
  const { writeFile: wf } = await import('node:fs/promises');
  const sidecar = { kind: 'deck', format: 'html', entry: file, theme };
  try {
    await wf(join(projectDir(id, env), `${file}.manifest.json`), JSON.stringify(sidecar, null, 2));
  } catch { /* sidecar is best-effort; the resolver infers kind from the name otherwise */ }
  return patchProject(id, { decks: next.decks, activeDeckId: next.activeDeckId }, env);
}

/** List Projects newest-first for the Home "recent projects" surface (§14). */
export async function listProjects(env: NodeJS.ProcessEnv = process.env): Promise<ProjectRecord[]> {
  const root = projectsRoot(env);
  if (!existsSync(root)) return [];
  const entries = await readdir(root, { withFileTypes: true });
  const records: ProjectRecord[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const rec = await readProject(entry.name, env);
    if (rec) records.push(rec);
  }
  return records.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

/** How many recents the Home list surfaces by default (§7, §14). */
export const RECENT_PROJECTS_LIMIT = 8;

/**
 * The Home "recent projects" read (Slice 11, AC1). Projects newest-first
 * (by activity — `updatedAt` is touched on every conversation turn), bounded
 * to the most-recently-touched `limit`, so the user can reopen and resume a
 * past Project. A thin, intent-named wrapper over {@link listProjects}.
 */
export async function listRecent(
  limit: number = RECENT_PROJECTS_LIMIT,
  env: NodeJS.ProcessEnv = process.env,
): Promise<ProjectRecord[]> {
  const all = await listProjects(env);
  return limit >= 0 ? all.slice(0, limit) : all;
}

/** The full prior state of a Project — its record plus the whole conversation
 *  transcript — i.e. everything needed to reopen it where the user left off. */
export type LoadedProject = {
  project: ProjectRecord;
  conversation: ConversationEntry[];
};

/**
 * Load a Project into its prior state (Slice 11, AC1). Returns the persisted
 * record **and** the full conversation transcript so the workspace can restore
 * the brief, stage, Gate 1, and every prior chat turn — resuming exactly where
 * the user left off rather than re-running the opening brief. Returns `null`
 * when the Project does not exist (or its record is unreadable).
 */
export async function load(id: string, env: NodeJS.ProcessEnv = process.env): Promise<LoadedProject | null> {
  const project = await readProject(id, env);
  if (!project) return null;
  const conversation = await readConversation(id, env);
  return { project, conversation };
}

export async function appendConversation(
  id: string,
  entry: ConversationEntry,
  env: NodeJS.ProcessEnv = process.env,
): Promise<void> {
  const file = join(projectDir(id, env), 'conversation.jsonl');
  const prior = existsSync(file) ? await readFile(file, 'utf8') : '';
  await writeFile(file, `${prior}${JSON.stringify(entry)}\n`, 'utf8');
  // Touch updatedAt so recents ordering reflects activity.
  const rec = await readProject(id, env);
  if (rec) {
    rec.updatedAt = new Date().toISOString();
    await writeFile(join(projectDir(id, env), 'project.json'), JSON.stringify(rec, null, 2), 'utf8');
  }
}

export async function readConversation(
  id: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<ConversationEntry[]> {
  const file = join(projectDir(id, env), 'conversation.jsonl');
  if (!existsSync(file)) return [];
  const raw = await readFile(file, 'utf8');
  return raw
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line) as ConversationEntry;
      } catch {
        return null;
      }
    })
    .filter((x): x is ConversationEntry => x !== null);
}

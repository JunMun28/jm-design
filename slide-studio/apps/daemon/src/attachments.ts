/**
 * Attachment Stager (plan §9.5, Slice 8 / issue #9). Source files the user
 * attaches from the Home screen and the chat composer — xlsx/csv (data),
 * pptx/pdf/docx (existing content), images/screenshots (evidence) — are
 * classified, size-capped, and STAGED into the Project dir so the agent reads
 * them by relative path and **cites real figures** instead of inventing numbers.
 *
 * Three jobs, each pure or I/O-thin so the Slice-8 suite can test them with a
 * temp data dir and no real CLI:
 *
 *   1. classify   — extension → category (data / document / image / unsupported)
 *   2. size cap   — reject oversized files with a friendly note (never throw)
 *   3. stage      — copy supported, under-cap files into `<project>/attachments/`
 *                   and report a friendly note for everything skipped
 *
 * The contract (plan §9.5, AC2): an unparseable or oversized file NEVER blocks a
 * run. It surfaces a friendly note and the run continues with whatever staged.
 * The staged dir is added to the agent's `--add-dir` scope (see runs wiring) so
 * the CLI can reach the files; the prompt lists them so the agent reads them.
 */
import { copyFile, mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { projectDir } from './projects.ts';

/** The category an attachment classifies into, which steers how the agent uses
 *  it (read the data, read the content, reference as evidence). */
export type AttachmentCategory =
  /** xlsx/csv — structured figures the agent must cite verbatim. */
  | 'data'
  /** pptx/pdf/docx — existing content to draw from. */
  | 'document'
  /** png/jpg/gif/webp — screenshots / evidence referenced visually. */
  | 'image'
  /** Anything we don't accept — surfaced as a friendly note, never staged. */
  | 'unsupported';

/** Per-category accepted extensions (lower-case, no dot). The classifier is the
 *  single source of truth for "what can be attached" (plan §9.5). */
export const ACCEPTED_EXTENSIONS: Record<Exclude<AttachmentCategory, 'unsupported'>, string[]> = {
  data: ['csv', 'tsv', 'xlsx', 'xls'],
  document: ['pptx', 'pdf', 'docx', 'doc', 'txt', 'md', 'json'],
  image: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'],
};

/**
 * The size cap (plan §9.5 "cap file size/type sensibly"). 25 MB comfortably
 * covers a spreadsheet of figures or a slide-sized PDF/image while keeping a
 * single attachment from blowing the project dir or a CLI's add-dir scope.
 * Override with SLIDE_STUDIO_MAX_ATTACHMENT_BYTES (tests use a tiny cap).
 */
export const DEFAULT_MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;

export function maxAttachmentBytes(env: NodeJS.ProcessEnv = process.env): number {
  const raw = env.SLIDE_STUDIO_MAX_ATTACHMENT_BYTES;
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : DEFAULT_MAX_ATTACHMENT_BYTES;
}

/** The lower-case extension of a filename without the dot ('' when none). */
export function extensionOf(filename: string): string {
  return extname(filename).toLowerCase().replace(/^\./, '');
}

/**
 * Classify an attachment by its filename (extension). Pure — no I/O. An
 * unrecognized or extension-less file is `unsupported` (the stager turns that
 * into a friendly note rather than staging it).
 */
export function classifyAttachment(filename: string): AttachmentCategory {
  const ext = extensionOf(filename);
  if (!ext) return 'unsupported';
  for (const [category, exts] of Object.entries(ACCEPTED_EXTENSIONS) as [
    Exclude<AttachmentCategory, 'unsupported'>,
    string[],
  ][]) {
    if (exts.includes(ext)) return category;
  }
  return 'unsupported';
}

/** Where staged attachments live, relative to the project dir. The agent reads
 *  files by this relative path (and the dir is passed via `--add-dir`). */
export const ATTACHMENTS_SUBDIR = 'attachments';

export function attachmentsDir(projectId: string, env: NodeJS.ProcessEnv = process.env): string {
  return join(projectDir(projectId, env), ATTACHMENTS_SUBDIR);
}

/** Strip a candidate filename down to a safe, in-dir leaf (no path, no traversal). */
function safeName(filename: string): string {
  const leaf = basename(filename.replace(/\\/g, '/')).trim();
  // Drop anything that could escape the dir or confuse a shell; keep it readable.
  const cleaned = leaf.replace(/[^A-Za-z0-9._ -]+/g, '_').replace(/^\.+/, '');
  return cleaned || 'attachment';
}

/** One attachment the caller wants staged: a filename plus its bytes (the
 *  daemon receives base64 from the loopback UI) OR a source path to copy. */
export type AttachmentInput = {
  /** The original filename (drives classification + the staged leaf name). */
  filename: string;
  /** The file's bytes. Provide either `data` or `sourcePath`. */
  data?: Buffer;
  /** An on-disk source to copy (e.g. a Home-screen drop already on disk). */
  sourcePath?: string;
};

/** A successfully staged attachment the agent can read. */
export type StagedAttachment = {
  filename: string;
  category: Exclude<AttachmentCategory, 'unsupported'>;
  /** Path relative to the project dir (e.g. `attachments/yield-q3.csv`). */
  relPath: string;
  bytes: number;
};

/** An attachment we did NOT stage, with a friendly note (never blocks the run). */
export type SkippedAttachment = {
  filename: string;
  reason: 'unsupported' | 'too-large' | 'empty' | 'unreadable';
  /** Plain-language note shown in the UI; never a raw error. */
  note: string;
};

export type StageResult = {
  staged: StagedAttachment[];
  skipped: SkippedAttachment[];
};

function prettyBytes(n: number): string {
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  if (n >= 1024) return `${Math.round(n / 1024)} KB`;
  return `${n} bytes`;
}

/** Resolve the size of an input (its buffer, or its on-disk source). -1 = unreadable. */
async function inputSize(input: AttachmentInput): Promise<number> {
  if (input.data) return input.data.byteLength;
  if (input.sourcePath) {
    try {
      return (await stat(input.sourcePath)).size;
    } catch {
      return -1;
    }
  }
  return 0;
}

/**
 * Stage a batch of attachments into the Project's `attachments/` dir. Each file
 * is classified and size-checked; supported, under-cap files are copied in and
 * returned as `staged`, everything else is returned as `skipped` with a friendly
 * note. NEVER throws on a bad file and NEVER blocks — a single unreadable /
 * oversized / unsupported attachment is just skipped (plan §9.5, AC2). The dir is
 * created on demand; a duplicate leaf name is de-collided with a numeric suffix.
 */
export async function stageAttachments(
  projectId: string,
  inputs: AttachmentInput[],
  env: NodeJS.ProcessEnv = process.env,
): Promise<StageResult> {
  const staged: StagedAttachment[] = [];
  const skipped: SkippedAttachment[] = [];
  if (!inputs.length) return { staged, skipped };

  const cap = maxAttachmentBytes(env);
  const dir = attachmentsDir(projectId, env);
  const usedNames = new Set<string>();

  for (const input of inputs) {
    const filename = (input.filename ?? '').trim() || 'attachment';
    const category = classifyAttachment(filename);

    if (category === 'unsupported') {
      skipped.push({
        filename,
        reason: 'unsupported',
        note: `"${filename}" is a file type Slide Studio can't read yet, so it was left out. The deck will be built from everything else.`,
      });
      continue;
    }

    const size = await inputSize(input);
    if (size < 0) {
      skipped.push({
        filename,
        reason: 'unreadable',
        note: `"${filename}" couldn't be read, so it was left out. The deck will be built from everything else.`,
      });
      continue;
    }
    if (size === 0) {
      skipped.push({
        filename,
        reason: 'empty',
        note: `"${filename}" is empty, so it was left out. The deck will be built from everything else.`,
      });
      continue;
    }
    if (size > cap) {
      skipped.push({
        filename,
        reason: 'too-large',
        note: `"${filename}" (${prettyBytes(size)}) is larger than the ${prettyBytes(
          cap,
        )} limit, so it was left out. Trim it down or attach a smaller version.`,
      });
      continue;
    }

    // De-collide the staged leaf so two attachments named the same don't clobber.
    let leaf = safeName(filename);
    if (usedNames.has(leaf.toLowerCase())) {
      const ext = extname(leaf);
      const stem = leaf.slice(0, leaf.length - ext.length);
      let n = 2;
      while (usedNames.has(`${stem}-${n}${ext}`.toLowerCase())) n++;
      leaf = `${stem}-${n}${ext}`;
    }
    usedNames.add(leaf.toLowerCase());

    const dest = join(dir, leaf);
    try {
      if (!existsSync(dir)) await mkdir(dir, { recursive: true });
      if (input.data) {
        await writeFile(dest, input.data);
      } else if (input.sourcePath) {
        await copyFile(input.sourcePath, dest);
      } else {
        // Neither bytes nor a source — nothing to stage.
        skipped.push({
          filename,
          reason: 'empty',
          note: `"${filename}" had no content to attach, so it was left out.`,
        });
        usedNames.delete(leaf.toLowerCase());
        continue;
      }
    } catch {
      skipped.push({
        filename,
        reason: 'unreadable',
        note: `"${filename}" couldn't be saved, so it was left out. The deck will be built from everything else.`,
      });
      usedNames.delete(leaf.toLowerCase());
      continue;
    }

    staged.push({
      filename,
      category,
      relPath: `${ATTACHMENTS_SUBDIR}/${leaf}`,
      bytes: size,
    });
  }

  return { staged, skipped };
}

/**
 * List the attachments already staged for a Project (so a resumed turn keeps
 * citing them). Reads the `attachments/` dir, re-classifying by extension.
 * Returns [] when nothing is staged.
 */
export async function listStagedAttachments(
  projectId: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<StagedAttachment[]> {
  const dir = attachmentsDir(projectId, env);
  if (!existsSync(dir)) return [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const out: StagedAttachment[] = [];
  for (const e of entries) {
    if (!e.isFile()) continue;
    const category = classifyAttachment(e.name);
    if (category === 'unsupported') continue;
    let bytes = 0;
    try {
      bytes = (await stat(join(dir, e.name))).size;
    } catch {
      /* keep 0 */
    }
    out.push({
      filename: e.name,
      category,
      relPath: `${ATTACHMENTS_SUBDIR}/${e.name}`,
      bytes,
    });
  }
  return out.sort((a, b) => a.filename.localeCompare(b.filename));
}

/**
 * Render a prompt block telling the agent which real source files are staged and
 * to cite their figures rather than invent numbers (plan §9.5, AC1). Appended to
 * the user turn (like the feedback block). Pure — no I/O. Returns '' when no
 * attachments are staged.
 */
export function serializeAttachmentsBlock(staged: StagedAttachment[]): string {
  if (!staged.length) return '';
  const lines = staged.map((a) => `- \`${a.relPath}\` (${a.category})`);
  return [
    '<attached-source-files>',
    'The user attached these real source files in the project folder. Read them',
    'directly and cite their ACTUAL figures, names, and content in the Brief and',
    'the slides — do NOT invent numbers. Data files (csv/xlsx) hold figures to',
    'quote verbatim; documents are existing content to draw from; images are',
    'evidence to reference.',
    ...lines,
    '</attached-source-files>',
  ].join('\n');
}

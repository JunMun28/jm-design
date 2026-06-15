/**
 * Export Collector (plan §12, issue #14 / Slice 7, M6).
 *
 * Once the Deck is generated in the chosen format(s), the Export panel offers a
 * **download** of each produced output with a **Brief-derived filename** (e.g.
 * `q3-yield-ops-review.pptx`) — not the on-disk working name (`deck.pptx`). This
 * module is the read side of that: it collects the outputs that actually exist in
 * the project dir, pairs each with its download name, and path-safely streams the
 * bytes back. One-way export only (§12): we hand the file OUT; we never re-import.
 *
 * Pure where it can be (the filename derivation + the collection projection) so it
 * is unit-testable with no real CLI and no real conversion.
 */
import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { activeDeck, projectDir, type OutputFormat, type ProjectRecord } from './projects.ts';

/** The on-disk working names the generate turn writes (server.ts DECK_ENTRY +
 *  pptx.pptxOutputPath) in Slice 6. The Export Collector (Slice 7) renames these
 *  to a Brief-derived name. */
export const DECK_HTML_ENTRY = 'deck.html';
export const DECK_PPTX_ENTRY = 'deck.pptx';

/** Content types for the two export formats (used by the download route). */
const EXPORT_CONTENT_TYPES: Record<OutputFormat, string> = {
  html: 'text/html; charset=utf-8',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

/** One downloadable output the Export panel lists. */
export interface ExportItem {
  /** The output format this file is. */
  format: OutputFormat;
  /** The project-relative on-disk entry (e.g. `deck.pptx`) the download reads. */
  entry: string;
  /** The Brief-derived download filename (e.g. `q3-yield-ops-review.pptx`). */
  filename: string;
  /** File size in bytes (so the panel can show it). */
  bytes: number;
}

/**
 * Slugify a Brief title / topic into a safe download stem (no extension). Lower,
 * hyphenated, ASCII-only, bounded — the same shape projects.ts uses for ids, so a
 * `q3-yield-ops-review` title becomes `q3-yield-ops-review`. Pure. Falls back to
 * `slide-deck` when the title is empty / produces nothing usable.
 */
export function slugifyTitle(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 64) || 'slide-deck'
  );
}

/**
 * Derive the download filename for one format from a Project's Brief. Prefers the
 * Recorded Discussion's goal (the most deck-descriptive line), then the project
 * title, then the raw brief — whichever is first non-empty — slugified, with the
 * format's extension. Pure (no I/O) so the naming is testable. Example:
 * goal "Q3 yield ops review" + pptx → `q3-yield-ops-review.pptx`.
 */
export function exportFilename(project: ProjectRecord, format: OutputFormat): string {
  const source =
    (project.recordedBrief?.goal && project.recordedBrief.goal.trim()) ||
    (project.title && project.title.trim()) ||
    (project.brief && project.brief.trim()) ||
    '';
  const ext = format === 'pptx' ? 'pptx' : 'html';
  return `${slugifyTitle(source)}.${ext}`;
}

/** Map an on-disk entry name to its export format (by extension). */
function formatForEntry(entry: string): OutputFormat | null {
  const ext = extname(entry).toLowerCase();
  if (ext === '.pptx') return 'pptx';
  if (ext === '.html' || ext === '.htm') return 'html';
  return null;
}

/**
 * Collect the downloadable outputs that the Export Collector has FOUND and
 * VALIDATED for a Project (§12, issue #14: "finds and validates the generated
 * outputs and offers download"). For each chosen format we look for the on-disk
 * Deck entry and list it only when it passes validation:
 *  - it actually exists (a format the user selected but generation never produced
 *    is silently omitted — the panel shows what's downloadable, not what was
 *    promised), and
 *  - it is a real file with content (a **zero-byte stub** left behind by a failed
 *    or aborted conversion is rejected, so the panel never offers an empty Deck).
 * Each surviving item carries its Brief-derived download name + size.
 */
export async function collectExports(
  project: ProjectRecord,
  env: NodeJS.ProcessEnv = process.env,
): Promise<ExportItem[]> {
  const dir = projectDir(project.id, env);
  const items: ExportItem[] = [];
  const wanted: OutputFormat[] = project.formats?.length ? project.formats : ['html'];
  for (const format of wanted) {
    const active = activeDeck(project);
    const htmlEntry = active?.file ?? DECK_HTML_ENTRY; // legacy fallback
    const entry = format === 'pptx' ? htmlEntry.replace(/\.html$/i, '.pptx') : htmlEntry;
    const abs = join(dir, entry);
    if (!existsSync(abs)) continue;
    let info;
    try {
      info = await stat(abs);
    } catch {
      continue;
    }
    // Output validation: must be a regular file with real content. A zero-byte
    // stub (failed/aborted conversion) is not a downloadable Deck.
    if (!info.isFile() || info.size <= 0) continue;
    items.push({ format, entry, filename: exportFilename(project, format), bytes: info.size });
  }
  return items;
}

/**
 * Path-safely read one export's bytes for the download route. `entry` is the
 * project-relative on-disk name (validated against the collected set by the
 * caller, but we still gate it here): traversal / absolute paths are rejected so
 * the route can only ever serve files INSIDE the project dir. Returns the bytes +
 * content-type + the Brief-derived download filename, or null when the path
 * escapes, is the wrong type, or is missing.
 */
export async function readExportFile(
  project: ProjectRecord,
  entry: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<{ body: Buffer; contentType: string; filename: string } | null> {
  const format = formatForEntry(entry);
  if (!format) return null;
  const dir = projectDir(project.id, env);
  const normalized = entry.replace(/\\/g, '/');
  if (normalized.startsWith('/') || /^[A-Za-z]:/.test(normalized)) return null;
  const abs = join(dir, normalized);
  // Containment: the resolved path must stay under the project dir.
  const rel = relative(dir, abs);
  if (rel.startsWith('..') || rel.includes(`..${'/'}`) || rel === '') return null;
  if (!existsSync(abs)) return null;
  try {
    const body = await readFile(abs);
    // Output validation (mirror collectExports): never serve a zero-byte stub.
    if (body.length === 0) return null;
    return {
      body,
      contentType: EXPORT_CONTENT_TYPES[format],
      filename: exportFilename(project, format),
    };
  } catch {
    return null;
  }
}

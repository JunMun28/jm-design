/**
 * Artifact Manifest + watcher (plan §9.4, issue #8 / Slice 3).
 *
 * When a skill produces a reviewable artifact (a low-fi Wireframe, later a
 * themed Deck), it writes a small sidecar `<file>.manifest.json` next to the
 * entry file. The daemon reads it to know which **canvas surface** the web shell
 * should render — for Slice 3 that is the sandboxed-iframe **wireframe**
 * surface (`kind = 'wireframe'`).
 *
 * Decision contract (locked in issue #8):
 *
 *   { kind: "wireframe" | "deck", format: "html" | "pptx",
 *     entry, slides, theme }
 *
 * The manifest is **preferred**, but skills can't always be made to emit one, so
 * the daemon also **infers** `kind`/`format` (and a slide count) from the output
 * path / file naming. Everything here is pure + I/O-thin so the parse and the
 * inference fallback are unit-testable with no real CLI and no real watcher
 * (the Slice-3 artifact-manifest suite).
 */
import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { basename, extname, join, relative } from 'node:path';
import { projectDir } from './projects.ts';

/** A reviewable artifact's kind. Wireframe = low-fi review draft (this slice);
 *  Deck = the final themed output (a later slice). */
export type ArtifactKind = 'wireframe' | 'deck';

/** The renderable output format of an artifact. */
export type ArtifactFormat = 'html' | 'pptx';

/**
 * The Artifact Manifest the daemon hands the UI so it renders the right canvas
 * surface (plan §9.4). Mirrored thinly on the web side (core/types.ts).
 *
 * `entry` is the artifact-relative entry file (e.g. `wireframe.html`); the
 * daemon serves it from the project dir. `slides` is the slide count (for the
 * pager). `theme` is null for a theme-less Wireframe; a Deck names its theme.
 */
export interface ArtifactManifest {
  kind: ArtifactKind;
  format: ArtifactFormat;
  /** Artifact-relative entry file the iframe loads (e.g. "wireframe.html"). */
  entry: string;
  /** Slide count — drives the slide-by-slide pager. */
  slides: number;
  /** Output theme. null/absent for a theme-less Wireframe (plan §11). */
  theme: string | null;
  /** True when the manifest was inferred from path/naming (no sidecar JSON). */
  inferred?: boolean;
}

const KINDS = new Set<ArtifactKind>(['wireframe', 'deck']);
const FORMATS = new Set<ArtifactFormat>(['html', 'pptx']);

/** The sidecar suffix a skill writes next to its entry file. */
export const MANIFEST_SUFFIX = '.manifest.json';

/**
 * Infer the artifact **kind** from an output path / file name (plan §9.4
 * fallback). A path that names a `wireframe` (or the brainstorm `skeleton`) is a
 * Wireframe; one that names a `deck` / `slides` / `pitch` / `presentation` is a
 * Deck. Defaults to `wireframe` — Slice 3's review surface is the low-fi
 * Wireframe, and a low-fi draft is the safe assumption when naming is silent.
 */
export function inferKind(outputPath: string): ArtifactKind {
  const lower = basename(outputPath).toLowerCase();
  if (lower.includes('wireframe') || lower.includes('skeleton')) return 'wireframe';
  if (
    lower.includes('deck') ||
    lower.includes('slides') ||
    lower.includes('pitch') ||
    lower.includes('presentation')
  ) {
    return 'deck';
  }
  return 'wireframe';
}

/**
 * Infer the artifact **format** from a file extension (plan §9.4 fallback).
 * `.pptx` → pptx; everything HTML-ish (`.html` / `.htm`) → html. Defaults to
 * html (the Wireframe is always single-file HTML).
 */
export function inferFormat(outputPath: string): ArtifactFormat {
  const ext = extname(outputPath).toLowerCase();
  if (ext === '.pptx') return 'pptx';
  return 'html';
}

/**
 * Count the slides in a Wireframe/Deck HTML body so the pager knows how many
 * pages to offer when the manifest omits (or under-reports) `slides`. Counts the
 * brainstorm wireframe-skeleton markers first (`data-slide=…` /
 * `class="slide-panel"`), then falls back to common deck markers
 * (`class="slide"` / `<section …>`). Returns 0 when nothing matches.
 */
export function countSlides(html: string): number {
  const dataSlide = html.match(/\bdata-slide\b/gi)?.length ?? 0;
  if (dataSlide) return dataSlide;
  const panel = html.match(/class="[^"]*\bslide-panel\b[^"]*"/gi)?.length ?? 0;
  if (panel) return panel;
  const slide = html.match(/class="[^"]*\bslide\b[^"]*"/gi)?.length ?? 0;
  if (slide) return slide;
  const sections = html.match(/<section\b/gi)?.length ?? 0;
  return sections;
}

/**
 * Parse a sidecar Artifact Manifest (plan §9.4). Tolerates partial JSON: a valid
 * `kind` and `format` are taken when present and recognized, otherwise inferred
 * from `entry` (or `fallbackEntry`). Returns `null` only when the input is not
 * an object at all — every other shape resolves to a usable manifest, because a
 * malformed sidecar must still render *something* rather than dead-end the user.
 *
 * Pure (no I/O) so it is unit-testable. The on-disk read is {@link readManifest}.
 */
export function parseManifest(raw: string, fallbackEntry = 'index.html'): ArtifactManifest | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  const obj = parsed as Record<string, unknown>;

  const entry =
    typeof obj.entry === 'string' && obj.entry.trim() ? obj.entry.trim() : fallbackEntry;

  const kind: ArtifactKind = KINDS.has(obj.kind as ArtifactKind)
    ? (obj.kind as ArtifactKind)
    : inferKind(entry);

  const format: ArtifactFormat = FORMATS.has(obj.format as ArtifactFormat)
    ? (obj.format as ArtifactFormat)
    : inferFormat(entry);

  const slides =
    typeof obj.slides === 'number' && Number.isFinite(obj.slides) && obj.slides >= 0
      ? Math.floor(obj.slides)
      : 0;

  const theme = typeof obj.theme === 'string' && obj.theme.trim() ? obj.theme.trim() : null;

  return { kind, format, entry, slides, theme };
}

/**
 * Infer a whole manifest from an output path when there is no sidecar JSON
 * (plan §9.4 fallback). Pairs {@link inferKind} + {@link inferFormat}; an
 * optional HTML body lets us also infer the slide count. Theme is null because a
 * path can't be trusted to name one, and a Wireframe is theme-less anyway.
 */
export function inferManifest(outputPath: string, html?: string): ArtifactManifest {
  return {
    kind: inferKind(outputPath),
    format: inferFormat(outputPath),
    entry: basename(outputPath),
    slides: html ? countSlides(html) : 0,
    theme: null,
    inferred: true,
  };
}

/**
 * Resolve the canvas-surface manifest for one artifact entry file inside a
 * project (the surface-selection logic the watcher uses). Prefers the sidecar
 * `<entry>.manifest.json`; if absent or malformed, infers from path/naming and
 * (for HTML) reads the body to count slides. The returned manifest always has a
 * usable `kind`/`format`/`entry`, and `slides` is backfilled from the HTML body
 * when the manifest under-reports it (or omits it).
 *
 * `entryRelPath` is the artifact entry **relative to the project dir**.
 */
export async function resolveManifest(
  projectId: string,
  entryRelPath: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<ArtifactManifest> {
  const dir = projectDir(projectId, env);
  const entryAbs = join(dir, entryRelPath);
  const manifestAbs = `${entryAbs}${MANIFEST_SUFFIX}`;

  let manifest: ArtifactManifest | null = null;
  if (existsSync(manifestAbs)) {
    try {
      manifest = parseManifest(await readFile(manifestAbs, 'utf8'), basename(entryRelPath));
    } catch {
      manifest = null;
    }
  }
  if (!manifest) {
    // No (usable) sidecar — infer from path/naming. Read the HTML body for an
    // accurate slide count when the entry is HTML.
    let html: string | undefined;
    if (inferFormat(entryRelPath) === 'html' && existsSync(entryAbs)) {
      try {
        html = await readFile(entryAbs, 'utf8');
      } catch {
        html = undefined;
      }
    }
    // The web fetches the artifact by `entry` RELATIVE TO THE PROJECT DIR, so it
    // must carry the full relative path (incl. a subdir like `docs/brainstorms/`),
    // not just the basename — otherwise a nested wireframe 404s. inferManifest
    // basenames the path, so restore the real relative entry here.
    return { ...inferManifest(entryRelPath, html), entry: entryRelPath };
  }

  // Manifest present but slide count missing/under-reported: backfill from the
  // HTML body so the pager is always right (the body is the source of truth).
  if (manifest.format === 'html' && existsSync(entryAbs)) {
    try {
      const counted = countSlides(await readFile(entryAbs, 'utf8'));
      if (counted > manifest.slides) manifest = { ...manifest, slides: counted };
    } catch {
      /* keep the manifest's own count */
    }
  }
  // Same invariant for the sidecar path: the entry the web fetches is the project-
  // dir-relative path we were given, never a bare basename from the JSON.
  return { ...manifest, entry: entryRelPath };
}

/**
 * Is this changed path an artifact entry the watcher should surface? We react to
 * the sidecar manifest landing (`*.manifest.json`) and to the HTML/PPTX entry
 * itself (so a live-reload edit re-renders even without a fresh manifest).
 * Ignores the project's own bookkeeping files (project.json / *.jsonl).
 */
export function isArtifactPath(relPath: string): boolean {
  const lower = relPath.toLowerCase();
  if (lower.endsWith(MANIFEST_SUFFIX)) return true;
  if (lower === 'project.json' || lower.endsWith('.jsonl')) return false;
  const ext = extname(lower);
  return ext === '.html' || ext === '.htm' || ext === '.pptx';
}

/** Is this entry path one the canvas can actually RENDER? The wireframe/deck
 *  surfaces load entries into an iframe, which only renders HTML — a `.pptx` is a
 *  binary zip and must never reach the canvas (it would show as garbled text). */
export function isPreviewableEntry(relPath: string): boolean {
  const ext = extname(relPath.toLowerCase());
  return ext === '.html' || ext === '.htm';
}

/**
 * Map a changed path to the artifact **entry** path (relative to the project
 * dir). A manifest sidecar maps back to its entry by stripping the suffix; an
 * entry file maps to itself. Returns null for a path that is not an artifact, or
 * for a non-previewable (`.pptx`) entry — the canvas preview only renders HTML;
 * the PowerPoint is a download-only export (Export panel), so surfacing it would
 * render the binary zip as garbled text in the iframe.
 */
export function entryForChange(relPath: string): string | null {
  if (!isArtifactPath(relPath)) return null;
  const lower = relPath.toLowerCase();
  const entry = lower.endsWith(MANIFEST_SUFFIX) ? relPath.slice(0, -MANIFEST_SUFFIX.length) : relPath;
  if (!isPreviewableEntry(entry)) return null;
  return entry;
}

/**
 * Find the most-recently-modified artifact **entry** in a project dir, so the
 * workspace can render the current Wireframe on load / resume (not just on a
 * live watcher event). Scans up to 2 levels deep, skipping bookkeeping files.
 * Returns the entry path relative to the project dir, or null when none exists.
 */
export async function findLatestArtifact(
  projectId: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<string | null> {
  const dir = projectDir(projectId, env);
  if (!existsSync(dir)) return null;

  type Found = { rel: string; mtimeMs: number };
  const found: Found[] = [];
  async function scan(absDir: string, depth: number): Promise<void> {
    let entries;
    try {
      entries = await readdir(absDir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const abs = join(absDir, e.name);
      if (e.isDirectory()) {
        if (depth > 0 && e.name !== 'node_modules' && !e.name.startsWith('.')) {
          await scan(abs, depth - 1);
        }
        continue;
      }
      const rel = relative(dir, abs).replace(/\\/g, '/');
      // Preview is HTML-only: a `.pptx` is a download export (Export panel), not a
      // renderable canvas surface — never pick it as the latest preview artifact
      // (it would render as garbled binary). Also skips the manifest sidecar.
      if (!isPreviewableEntry(rel)) continue;
      try {
        const s = await stat(abs);
        found.push({ rel, mtimeMs: s.mtimeMs });
      } catch {
        /* skip */
      }
    }
  }
  await scan(dir, 2);
  if (found.length === 0) return null;
  return found.reduce((a, b) => (b.mtimeMs > a.mtimeMs ? b : a)).rel;
}

/**
 * Safely resolve an artifact-relative entry path to an absolute path *inside*
 * the project dir, then read it. Rejects traversal / absolute paths (the iframe
 * loads arbitrary `entry` strings, so this is the path-safety gate). Returns the
 * file contents + content-type, or null when the path escapes or is missing.
 */
export async function readArtifactFile(
  projectId: string,
  entryRelPath: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<{ body: Buffer; contentType: string } | null> {
  const dir = projectDir(projectId, env);
  const normalized = entryRelPath.replace(/\\/g, '/');
  if (normalized.startsWith('/') || /^[A-Za-z]:/.test(normalized)) return null;
  const abs = join(dir, normalized);
  // Containment check: the resolved path must stay under the project dir.
  const rel = relative(dir, abs);
  if (rel.startsWith('..') || rel.includes(`..${'/'}`) || rel === '') return null;
  if (!existsSync(abs)) return null;
  try {
    const body = await readFile(abs);
    const ext = extname(abs).toLowerCase();
    const contentType =
      ext === '.html' || ext === '.htm'
        ? 'text/html; charset=utf-8'
        : ext === '.pptx'
          ? 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
          : 'application/octet-stream';
    return { body, contentType };
  } catch {
    return null;
  }
}

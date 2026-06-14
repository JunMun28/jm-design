/**
 * Theme catalogue (plan §11, issue #12 / Slice 5, Gate 3).
 *
 * The Theme picker (Gate 3) lists the existing **`html-slides` Micron themes**
 * — the slide-output styling surface — so the user picks one before the themed
 * Deck is generated. The list is read from the vendored
 * `skills/html-slides/themes/themes.json` (the live source of truth, §11), so a
 * new upstream theme appears in the picker without a code change.
 *
 * Two styling surfaces never cross (§11, risk 7): Atlas styles the app *shell*;
 * these themes style the *slides*. The Wireframe is theme-less — a theme applies
 * **only at Deck generation** (§7.4, §11).
 *
 * Everything here is pure + I/O-thin so the catalogue read, the picker projection,
 * and the thumbnail path-safety gate are unit-testable with no real CLI.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Resolve the vendored html-slides themes dir (skills/html-slides/themes). */
export function themesDir(): string {
  return join(__dirname, '..', '..', '..', 'skills', 'html-slides', 'themes');
}

/** Path to the live themes catalogue the picker reads. */
export function themesJsonPath(): string {
  return join(themesDir(), 'themes.json');
}

/** A theme's lifecycle status from themes.json. Only `stable` is offered by
 *  default; `deprecated` is flagged so the picker can warn or hide it. */
export type ThemeStatus = 'stable' | 'experimental' | 'deprecated' | string;

/** Representative colours the Theme picker uses to render a crafted preview card
 *  (no screenshot). All hex; `accent2` is optional. */
export interface ThemePalette {
  mode: 'light' | 'dark';
  bg: string;
  ink: string;
  accent: string;
  accent2?: string;
}

/**
 * One theme as the picker renders it (Gate 3). A thin projection of the rich
 * themes.json entry — just what the UI needs: the id to persist + pass to
 * generation, the human name + role + `when` guidance, the lifecycle status, and
 * a thumbnail path the daemon serves. The heavy `verify`/`design`/`extras`
 * fields stay on the daemon (used by the verify gate + prompt, not the picker).
 */
export interface ThemeCard {
  id: string;
  name: string;
  status: ThemeStatus;
  /** A short role label (e.g. `dark-premium`, `editorial-data`). */
  role: string;
  /** One-line "use this when…" guidance shown under the thumbnail. */
  when: string;
  /** Themes-dir-relative preview image path (e.g. `micron-dark/screenshots/…png`),
   *  or null when the theme ships no preview. Served via {@link readThumbnail}. */
  preview: string | null;
  /** Representative palette for the crafted preview card, or null when the theme
   *  ships none (the picker then falls back to a neutral monogram preview). */
  palette: ThemePalette | null;
  /** True when the theme is deprecated (the picker dims / warns). */
  deprecated: boolean;
}

/** The raw shape of one themes.json entry (only the fields we touch). */
interface RawTheme {
  id?: unknown;
  name?: unknown;
  status?: unknown;
  role?: unknown;
  when?: unknown;
  preview?: unknown;
  palette?: unknown;
  verify?: unknown;
}

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' && v.trim() ? v.trim() : fallback;
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
function asHex(v: unknown): string | null {
  return typeof v === 'string' && HEX_RE.test(v.trim()) ? v.trim().toLowerCase() : null;
}

/**
 * Validate a raw `palette` block into a {@link ThemePalette}, or null. Pure (no
 * I/O), tolerant: a missing/!hex bg/ink/accent yields null so the picker falls
 * back to a neutral preview rather than rendering a broken card.
 */
export function normalizePalette(raw: unknown): ThemePalette | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const bg = asHex(r.bg);
  const ink = asHex(r.ink);
  const accent = asHex(r.accent);
  if (!bg || !ink || !accent) return null;
  const palette: ThemePalette = { mode: r.mode === 'dark' ? 'dark' : 'light', bg, ink, accent };
  const accent2 = asHex(r.accent2);
  if (accent2) palette.accent2 = accent2;
  return palette;
}

/**
 * Normalize the `preview` path from themes.json to a themes-dir-relative path the
 * daemon can serve. The catalogue stores it skill-root-relative
 * (`themes/<id>/screenshots/…png`); strip the leading `themes/` so it is relative
 * to {@link themesDir}. Returns null when absent. Pure (no I/O) so it is testable.
 */
export function normalizePreview(raw: unknown): string | null {
  const p = asString(raw);
  if (!p) return null;
  // Stored relative to the skill root (`themes/<id>/…`); we serve relative to the
  // themes dir, so drop the leading `themes/` segment.
  return p.replace(/^themes[\\/]/, '');
}

/**
 * Project one raw themes.json entry into a picker {@link ThemeCard}, or null when
 * it has no usable id (a malformed entry must never crash the picker). Pure.
 */
export function toThemeCard(raw: RawTheme): ThemeCard | null {
  const id = asString(raw.id);
  if (!id) return null;
  const status = asString(raw.status, 'stable');
  return {
    id,
    name: asString(raw.name, id),
    status,
    role: asString(raw.role),
    when: asString(raw.when),
    preview: normalizePreview(raw.preview),
    palette: normalizePalette(raw.palette),
    deprecated: status === 'deprecated',
  };
}

/**
 * Parse a themes.json body into picker {@link ThemeCard}s (Gate 3). Tolerant: a
 * missing/!array `themes` field yields `[]`, and any entry without an id is
 * dropped — a malformed catalogue must still render *something* rather than
 * dead-end the user at the theme step. Pure (no I/O); {@link listThemes} reads
 * the file.
 */
export function parseThemes(raw: string): ThemeCard[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!parsed || typeof parsed !== 'object') return [];
  const themes = (parsed as { themes?: unknown }).themes;
  if (!Array.isArray(themes)) return [];
  const cards: ThemeCard[] = [];
  for (const entry of themes) {
    if (!entry || typeof entry !== 'object') continue;
    const card = toThemeCard(entry as RawTheme);
    if (card) cards.push(card);
  }
  return cards;
}

/**
 * Read the live theme catalogue from the vendored themes.json (§11). Returns the
 * picker cards. Returns `[]` (never throws) when the catalogue is missing or
 * unreadable, so the theme step degrades gracefully.
 */
export function listThemes(): ThemeCard[] {
  const file = themesJsonPath();
  if (!existsSync(file)) return [];
  try {
    return parseThemes(readFileSync(file, 'utf8'));
  } catch {
    return [];
  }
}

/** Is `id` a real, offerable theme in the catalogue? Gate 3 validates the
 *  selection against this before it is persisted (no junk theme id reaches
 *  generation or the verify gate). */
export function isKnownTheme(id: string): boolean {
  return listThemes().some((t) => t.id === id);
}

/** Look up one theme card by id, or null. */
export function getTheme(id: string): ThemeCard | null {
  return listThemes().find((t) => t.id === id) ?? null;
}

const THUMB_CONTENT_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

/**
 * Safely read a theme's preview thumbnail for the picker. `previewRelPath` is the
 * themes-dir-relative path from a {@link ThemeCard} (never user-supplied free
 * text, but we still gate it): traversal / absolute paths are rejected so the
 * route can only ever serve files **inside** the themes dir. Returns the bytes +
 * content-type, or null when the path escapes or the file is missing.
 */
export function readThumbnail(
  previewRelPath: string,
): { body: Buffer; contentType: string } | null {
  if (!previewRelPath) return null;
  const normalized = previewRelPath.replace(/\\/g, '/');
  if (normalized.startsWith('/') || /^[A-Za-z]:/.test(normalized)) return null;
  const dir = themesDir();
  const abs = join(dir, normalized);
  // Containment: the resolved path must stay under the themes dir.
  const rel = relative(dir, abs);
  if (rel.startsWith('..') || rel.includes(`..${'/'}`) || rel === '') return null;
  if (!existsSync(abs)) return null;
  const contentType = THUMB_CONTENT_TYPES[extname(abs).toLowerCase()];
  if (!contentType) return null;
  try {
    return { body: readFileSync(abs), contentType };
  } catch {
    return null;
  }
}

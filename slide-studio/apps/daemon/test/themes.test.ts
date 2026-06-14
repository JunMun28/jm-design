/**
 * Theme catalogue suite (Slice 5 / issue #12, AC1): the Theme picker (Gate 3)
 * lists the existing `html-slides` Micron themes WITH thumbnails, read live from
 * the vendored themes.json (§11). This suite covers the parse/projection (pure),
 * the path-safety of the thumbnail serve, and that the real vendored catalogue
 * actually yields offerable themes with on-disk previews.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  getTheme,
  isKnownTheme,
  listThemes,
  normalizePreview,
  parseThemes,
  readThumbnail,
  themesDir,
  themesJsonPath,
  toThemeCard,
} from '../src/themes.ts';

// --- parse / projection (pure) -------------------------------------------

test('parseThemes projects each entry into a picker card', () => {
  const raw = JSON.stringify({
    themes: [
      {
        id: 'micron-dark',
        name: 'Micron dark',
        status: 'stable',
        role: 'dark-premium',
        when: 'Premium dark Micron style.',
        preview: 'themes/micron-dark/screenshots/example-overview-1280x720.png',
        verify: { palette_lock: true },
      },
    ],
  });
  const cards = parseThemes(raw);
  assert.equal(cards.length, 1);
  assert.deepEqual(cards[0], {
    id: 'micron-dark',
    name: 'Micron dark',
    status: 'stable',
    role: 'dark-premium',
    when: 'Premium dark Micron style.',
    // The skill-root-relative `themes/` prefix is stripped to a themes-dir path.
    preview: 'micron-dark/screenshots/example-overview-1280x720.png',
    palette: null,
    deprecated: false,
  });
});

test('toThemeCard surfaces a valid palette and ignores a malformed one', () => {
  const ok = toThemeCard({
    id: 't',
    palette: { mode: 'dark', bg: '#0B0B11', ink: '#FFFFFF', accent: '#bd03f7', accent2: '#244dff' },
  });
  assert.deepEqual(ok?.palette, { mode: 'dark', bg: '#0b0b11', ink: '#ffffff', accent: '#bd03f7', accent2: '#244dff' });

  // Missing a required colour → null (picker falls back to a monogram preview).
  assert.equal(toThemeCard({ id: 't2', palette: { mode: 'light', bg: '#fff' } })?.palette, null);
  // Defaults mode to light; drops a bad accent2.
  assert.deepEqual(
    toThemeCard({ id: 't3', palette: { bg: '#ffffff', ink: '#000000', accent: '#bd03f7', accent2: 'nope' } })?.palette,
    { mode: 'light', bg: '#ffffff', ink: '#000000', accent: '#bd03f7' },
  );
});

test('normalizePreview strips the leading themes/ segment (and tolerates null)', () => {
  assert.equal(normalizePreview('themes/x/y.png'), 'x/y.png');
  assert.equal(normalizePreview('x/y.png'), 'x/y.png');
  assert.equal(normalizePreview(''), null);
  assert.equal(normalizePreview(undefined), null);
});

test('toThemeCard drops an entry with no id', () => {
  assert.equal(toThemeCard({ name: 'nameless' }), null);
  assert.ok(toThemeCard({ id: 'ok' }));
});

test('toThemeCard flags a deprecated theme', () => {
  const card = toThemeCard({ id: 't', status: 'deprecated' });
  assert.equal(card?.deprecated, true);
});

test('parseThemes tolerates a malformed catalogue (returns [])', () => {
  assert.deepEqual(parseThemes('not json'), []);
  assert.deepEqual(parseThemes('{}'), []);
  assert.deepEqual(parseThemes(JSON.stringify({ themes: 'nope' })), []);
});

// --- the real vendored catalogue -----------------------------------------

test('listThemes reads the real vendored html-slides catalogue', () => {
  const themes = listThemes();
  assert.ok(themes.length >= 1, 'at least one theme is offered');
  // The locked Micron themes are present (plan §11).
  const ids = themes.map((t) => t.id);
  assert.ok(ids.includes('micron-dark'), 'micron-dark is offered');
  assert.ok(ids.includes('micron-light'), 'micron-light is offered');
  // Every offered theme has a name (the picker renders it).
  for (const t of themes) assert.ok(t.name.length > 0, `${t.id} has a name`);
});

test('every offered theme has a real on-disk preview thumbnail (AC1)', () => {
  for (const t of listThemes()) {
    assert.ok(t.preview, `${t.id} declares a preview`);
    const abs = join(themesDir(), t.preview!);
    assert.ok(existsSync(abs), `${t.id} preview exists on disk: ${abs}`);
    // And the daemon can serve its bytes with an image content-type.
    const thumb = readThumbnail(t.preview!);
    assert.ok(thumb, `${t.id} thumbnail is servable`);
    assert.match(thumb!.contentType, /^image\//);
    assert.ok(thumb!.body.length > 0);
  }
});

test('isKnownTheme validates against the live catalogue', () => {
  assert.equal(isKnownTheme('micron-dark'), true);
  assert.equal(isKnownTheme('definitely-not-a-theme'), false);
  assert.ok(getTheme('micron-dark'));
  assert.equal(getTheme('definitely-not-a-theme'), null);
});

test('themesJsonPath points at the vendored catalogue that exists', () => {
  assert.ok(existsSync(themesJsonPath()));
  // Sanity: it parses and has a themes array.
  const parsed = JSON.parse(readFileSync(themesJsonPath(), 'utf8'));
  assert.ok(Array.isArray(parsed.themes));
});

// --- thumbnail path safety ------------------------------------------------

test('readThumbnail rejects traversal and absolute paths', () => {
  assert.equal(readThumbnail('../../../../etc/passwd'), null);
  assert.equal(readThumbnail('/etc/passwd'), null);
  assert.equal(readThumbnail('C:/Windows/win.ini'), null);
  assert.equal(readThumbnail(''), null);
  // A non-image extension inside the dir is also rejected.
  assert.equal(readThumbnail('themes.json'), null);
});

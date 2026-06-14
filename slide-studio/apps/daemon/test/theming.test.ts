/**
 * Theming + reduced-motion suite (Slice 13 / issue #7, AC3): the app renders in
 * light and dark and honors `prefers-reduced-motion`. The live visual is proven
 * with screenshots; this suite locks the structural contracts so a refactor
 * can't silently drop a theme or the reduced-motion guard.
 *
 *   - light is the canonical (:root) theme
 *   - dark is a complete override under [data-theme="dark"]
 *   - a `prefers-reduced-motion: reduce` media query disables transitions/animations
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const stylesPath = join(here, '..', '..', 'web', 'src', 'styles.css');
const css = readFileSync(stylesPath, 'utf8');

test('light mode is canonical (:root defines the semantic roles)', () => {
  assert.match(css, /:root\s*\{[\s\S]*--mic-bg:/);
  assert.match(css, /--mic-ink:/);
  assert.match(css, /--mic-accent:/);
});

test('dark mode is a complete [data-theme="dark"] override', () => {
  const darkBlock = css.match(/\[data-theme=["']dark["']\]\s*\{([\s\S]*?)\}/);
  assert.ok(darkBlock, 'a [data-theme="dark"] block must exist');
  const body = darkBlock![1];
  // The core surface + ink + accent roles are all re-pointed in dark.
  for (const role of ['--mic-bg', '--mic-surface', '--mic-ink', '--mic-border', '--mic-accent']) {
    assert.match(body, new RegExp(`${role}\\s*:`), `dark must override ${role}`);
  }
});

test('prefers-reduced-motion disables transitions and animations', () => {
  const mq = css.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\}\s*\}/);
  assert.ok(mq, 'a prefers-reduced-motion media query must exist');
  const body = mq![1];
  assert.match(body, /transition:\s*none\s*!important/);
  assert.match(body, /animation:\s*none\s*!important/);
});

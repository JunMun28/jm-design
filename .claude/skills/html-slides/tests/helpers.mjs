import { execFileSync } from 'node:child_process';
import { mkdtempSync, copyFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const SKILL_ROOT = path.resolve(HERE, '..');

// Copy the marked fixture to a temp file and inline the CURRENT shell into it.
export function buildFixtureDeck() {
  const dir = mkdtempSync(path.join(tmpdir(), 'living-deck-'));
  const out = path.join(dir, 'sample-deck.html');
  copyFileSync(path.join(HERE, 'fixtures', 'sample-deck.src.html'), out);
  execFileSync('python3', [path.join(SKILL_ROOT, 'scripts', 'build-deck.py'), 'reshell', out], {
    stdio: 'pipe',
  });
  return { dir, out, url: pathToFileURL(out).href, read: () => readFileSync(out, 'utf8') };
}

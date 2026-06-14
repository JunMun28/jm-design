#!/usr/bin/env node
/**
 * One-way sync of the slide skills from the jm-design upstream source of truth
 * into slide-studio/skills/ (plan §9.1). jm-design stays canonical; this folder
 * is a vendored copy for the self-contained distributable. Never edit vendored
 * copies — fix upstream and re-run this.
 *
 * Usage: node scripts/sync-skills.mjs [--from <jm-design/.claude/skills>]
 */
import { cp, mkdir, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dest = resolve(here, '..', 'skills');

const SKILLS = [
  'slide-brainstorm',
  'slide-consultant',
  'slide-quick',
  'html-slides',
  'html-to-pptx',
  'theme-factory',
  'micron-icons',
  'pptx',
];

function parseFrom() {
  const i = process.argv.indexOf('--from');
  if (i !== -1 && process.argv[i + 1]) return resolve(process.argv[i + 1]);
  // Default: walk up to the jm-design repo root and use .claude/skills.
  return resolve(here, '..', '..', '.claude', 'skills');
}

const from = parseFrom();
if (!existsSync(from)) {
  console.error(`Upstream skills dir not found: ${from}\nPass --from <path to jm-design/.claude/skills>.`);
  process.exit(1);
}

await mkdir(dest, { recursive: true });
let copied = 0;
for (const skill of SKILLS) {
  const src = join(from, skill);
  if (!existsSync(src)) {
    console.warn(`skip (missing upstream): ${skill}`);
    continue;
  }
  if (!(await stat(src)).isDirectory()) continue;
  await cp(src, join(dest, skill), { recursive: true });
  copied += 1;
  console.log(`synced: ${skill}`);
}
console.log(`Done. ${copied}/${SKILLS.length} skills vendored into ${dest}`);
// Show what landed.
const landed = (await readdir(dest, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
console.log(`Vendored skills: ${landed.join(', ') || '(none)'}`);

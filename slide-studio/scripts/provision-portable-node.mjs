#!/usr/bin/env node
/**
 * Provision the BUNDLED portable Node runtime (plan §13, Slice 10 / issue #10
 * AC2: "the app runs on bundled portable Node with no system Node install or
 * admin rights").
 *
 * The distributable ships its OWN Node so an end user needs neither a system
 * Node install nor admin rights. This script drops a real portable Node binary
 * at the EXACT layout `apps/daemon/src/portable-node.ts#bundledNodePath`
 * resolves:
 *
 *   runtime/node/win32/node.exe
 *   runtime/node/darwin/bin/node
 *   runtime/node/linux/bin/node
 *
 * The packaging step runs this once per target OS (the runtime/ tree is
 * git-ignored — a large per-OS binary is never committed). Two modes:
 *
 *   --download   fetch the official Node distribution archive for the target,
 *                verify its SHASUMS, extract, and place `node` at the layout.
 *                The real, no-system-Node path used for a real distributable.
 *   --link       (dev/CI convenience) hard-link/copy the CURRENT interpreter
 *                into the layout so AC2 can be proven on this machine without a
 *                network fetch. The launcher then boots on a real on-disk
 *                bundled binary that is NOT the one on PATH.
 *
 * Usage:
 *   node scripts/provision-portable-node.mjs --link [--platform darwin]
 *   node scripts/provision-portable-node.mjs --download [--version v22.14.0] [--platform linux] [--arch x64]
 */
import { createHash } from 'node:crypto';
import { chmodSync, copyFileSync, existsSync, linkSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = join(here, '..');

function arg(name, fallback = undefined) {
  const i = process.argv.indexOf(`--${name}`);
  if (i !== -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--')) return process.argv[i + 1];
  return fallback;
}
function flag(name) {
  return process.argv.includes(`--${name}`);
}

const platform = arg('platform', process.platform);
const arch = arg('arch', process.arch);

/** The bundled-binary path for a platform — MUST match portable-node.ts. */
function bundledNodePath(plat) {
  if (plat === 'win32') return join(appRoot, 'runtime', 'node', 'win32', 'node.exe');
  if (plat === 'darwin') return join(appRoot, 'runtime', 'node', 'darwin', 'bin', 'node');
  return join(appRoot, 'runtime', 'node', 'linux', 'bin', 'node');
}

/** Dev/CI: place the CURRENT interpreter at the bundled layout (a real on-disk
 *  binary distinct from the PATH one — enough to prove AC2 resolves + boots). */
function linkCurrentInterpreter(plat) {
  const dest = bundledNodePath(plat);
  mkdirSync(dirname(dest), { recursive: true });
  if (existsSync(dest)) rmSync(dest);
  const src = process.execPath;
  try {
    linkSync(src, dest); // hard link — no copy, no extra disk
  } catch {
    copyFileSync(src, dest); // cross-device fallback
  }
  if (plat !== 'win32') chmodSync(dest, 0o755);
  return dest;
}

/** Real distributable path: fetch + verify + extract the official Node archive. */
async function downloadDistribution(plat, cpuArch) {
  const version = arg('version', process.version); // e.g. v22.14.0
  const ext = plat === 'win32' ? 'zip' : 'tar.gz';
  const nodePlat = plat === 'win32' ? 'win' : plat; // darwin|linux|win
  const nodeArch = cpuArch === 'arm64' ? 'arm64' : 'x64';
  const folder = `node-${version}-${nodePlat}-${nodeArch}`;
  const file = `${folder}.${ext}`;
  const base = `https://nodejs.org/dist/${version}`;
  const url = `${base}/${file}`;

  const work = join(appRoot, 'runtime', '.work');
  mkdirSync(work, { recursive: true });
  const archive = join(work, file);

  console.log(`Fetching ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed: ${res.status} ${res.statusText} for ${url}`);
  const bytes = Buffer.from(await res.arrayBuffer());

  // Verify against SHASUMS256.txt (no admin, integrity-checked).
  const sumsRes = await fetch(`${base}/SHASUMS256.txt`);
  if (!sumsRes.ok) throw new Error(`SHASUMS fetch failed: ${sumsRes.status}`);
  const sums = await sumsRes.text();
  const want = sums.split('\n').map((l) => l.trim()).find((l) => l.endsWith(`  ${file}`));
  if (!want) throw new Error(`no checksum line for ${file}`);
  const expected = want.split(/\s+/)[0];
  const actual = createHash('sha256').update(bytes).digest('hex');
  if (actual !== expected) throw new Error(`checksum mismatch for ${file}\n expected ${expected}\n actual   ${actual}`);
  console.log(`Checksum OK (${expected.slice(0, 12)}…)`);

  const { writeFileSync } = await import('node:fs');
  writeFileSync(archive, bytes);

  // Extract just the node binary into the target layout.
  const osDir = join(appRoot, 'runtime', 'node', plat);
  mkdirSync(osDir, { recursive: true });
  if (ext === 'tar.gz') {
    // tar is present on macOS/Linux by default.
    execFileSync('tar', ['-xzf', archive, '-C', work], { stdio: 'inherit' });
    const srcBin = join(work, folder, 'bin', 'node');
    const destBin = bundledNodePath(plat);
    mkdirSync(dirname(destBin), { recursive: true });
    copyFileSync(srcBin, destBin);
    chmodSync(destBin, 0o755);
  } else {
    // win32 zip — needs `unzip` or PowerShell Expand-Archive on the host.
    execFileSync('unzip', ['-o', archive, '-d', work], { stdio: 'inherit' });
    const srcBin = join(work, folder, 'node.exe');
    const destBin = bundledNodePath(plat);
    mkdirSync(dirname(destBin), { recursive: true });
    copyFileSync(srcBin, destBin);
  }
  rmSync(work, { recursive: true, force: true });
  return bundledNodePath(plat);
}

const mode = flag('download') ? 'download' : 'link';
const dest = mode === 'download' ? await downloadDistribution(platform, arch) : linkCurrentInterpreter(platform);

// Prove the placed binary actually runs.
const out = execFileSync(dest, ['--version'], { encoding: 'utf8' }).trim();
console.log(`Bundled portable Node provisioned (${mode}): ${dest}`);
console.log(`  ${dest} --version → ${out}`);
console.log(`  (system PATH node is ${process.execPath} — distinct from the bundled one)`);

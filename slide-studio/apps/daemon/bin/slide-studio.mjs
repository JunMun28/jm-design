#!/usr/bin/env node
/**
 * Slide Studio launcher entry. The `.bat`/`.sh`/`.exe` wrapper calls this: it
 * starts the loopback daemon (on the BUNDLED portable Node when present) and
 * opens the browser at the workspace URL (plan §13).
 *
 * Slice 10 (issue #10, §13):
 *  - AC2 (portable Node): re-exec the inner server with the bundled portable Node
 *    runtime (`<appRoot>/runtime/node/...`) when it is present — no system Node
 *    install, no admin rights. Falls back to the current interpreter (the dev
 *    case) only when no bundle exists.
 *  - AC3 (orphan cleanup): forward exit signals to the daemon child and kill it
 *    if this launcher exits, so no daemon (and therefore no agent child) is left
 *    orphaned.
 *
 * The inner server is run with `--experimental-strip-types` so the .ts daemon
 * sources load directly with no build step.
 */
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolvePortableNode, appRootFrom } from '../src/portable-node.ts';

const here = dirname(fileURLToPath(import.meta.url));
const serverEntry = join(here, 'launch-server.mjs');

// Prefer the bundled portable Node (AC2); fall back to the running interpreter.
const appRoot = appRootFrom(import.meta.url, 3); // bin/ → daemon/ → apps/ → slide-studio
const { execPath, bundled } = resolvePortableNode({ appRoot });
if (bundled) {
  console.log('Slide Studio: using the bundled Node runtime (no system Node required).');
}

const child = spawn(execPath, ['--experimental-strip-types', serverEntry], {
  stdio: 'inherit',
  env: process.env,
});

// AC3: if the daemon exits, the launcher exits with its code.
child.on('exit', (code, signal) => {
  process.exit(signal ? 1 : (code ?? 0));
});

// AC3: forward exit signals to the daemon so its own shutdown handler runs (kill
// the agent child + close the server). If it doesn't exit promptly, force it.
let forwarding = false;
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(sig, () => {
    if (forwarding) return;
    forwarding = true;
    try {
      child.kill('SIGTERM');
    } catch {
      /* already gone */
    }
    setTimeout(() => {
      try {
        if (!child.killed) child.kill('SIGKILL');
      } catch {
        /* already gone */
      }
      process.exit(1);
    }, 4000);
  });
}

// Belt and braces: never leave the daemon running if the launcher itself dies.
process.on('exit', () => {
  try {
    if (!child.killed) child.kill('SIGTERM');
  } catch {
    /* already gone */
  }
});

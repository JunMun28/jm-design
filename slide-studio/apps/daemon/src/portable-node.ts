/**
 * Portable-Node resolution (plan §13, Slice 10 / issue #10 AC2: "the app runs on
 * bundled portable Node with no system Node install or admin rights").
 *
 * The distributable ships its OWN Node runtime inside the app folder
 * (`slide-studio/runtime/node/<platform>/…`) so an end user needs neither a
 * system Node install nor admin rights. This module resolves the path to that
 * bundled `node` binary, per platform, and falls back to whatever interpreter is
 * already running ONLY when no bundle is present (the developer case — running
 * straight from a system Node).
 *
 * Everything is INJECTABLE (the platform, the fs existence check, the app root,
 * the current execPath) so the resolution logic is unit-testable on any machine
 * without a real bundle — mirroring detection.ts's injected-probe approach.
 */
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** A function that reports whether a path exists (injected for tests). */
export type ExistsFn = (p: string) => boolean;

export type ResolvePortableNodeOptions = {
  /** App root that contains `runtime/node/...` (the slide-studio folder). */
  appRoot: string;
  /** Target platform. Defaults to process.platform. */
  platform?: NodeJS.Platform;
  /** Existence probe. Defaults to fs.existsSync. */
  exists?: ExistsFn;
  /** The interpreter to fall back to when no bundle exists. Defaults to
   *  process.execPath (the Node currently running). */
  fallbackExecPath?: string;
};

/** The result of resolving which Node to launch the daemon with. */
export type PortableNodeResolution = {
  /** Absolute path to the `node` binary to spawn. */
  execPath: string;
  /** True when this is the bundled portable runtime (no system Node needed). */
  bundled: boolean;
};

/**
 * The bundled-runtime sub-path under the app root, per platform. The layout
 * mirrors the official Node distribution archives:
 *   win32 : runtime/node/win32/node.exe
 *   darwin: runtime/node/darwin/bin/node
 *   linux : runtime/node/linux/bin/node
 */
export function bundledNodePath(appRoot: string, platform: NodeJS.Platform = process.platform): string {
  if (platform === 'win32') return join(appRoot, 'runtime', 'node', 'win32', 'node.exe');
  if (platform === 'darwin') return join(appRoot, 'runtime', 'node', 'darwin', 'bin', 'node');
  return join(appRoot, 'runtime', 'node', 'linux', 'bin', 'node');
}

/**
 * Resolve the Node interpreter to launch the daemon with. Prefers the bundled
 * portable runtime (so no system Node / admin is required); falls back to the
 * current interpreter when no bundle is present. Pure given the injected probes.
 */
export function resolvePortableNode(options: ResolvePortableNodeOptions): PortableNodeResolution {
  const { appRoot } = options;
  const platform = options.platform ?? process.platform;
  const exists = options.exists ?? existsSync;
  const fallback = options.fallbackExecPath ?? process.execPath;

  const candidate = bundledNodePath(appRoot, platform);
  if (exists(candidate)) {
    return { execPath: candidate, bundled: true };
  }
  return { execPath: fallback, bundled: false };
}

/**
 * Resolve the slide-studio app root from a module inside `apps/daemon/bin/` or
 * `apps/daemon/src/`. The bundled runtime lives at `<appRoot>/runtime/node/...`.
 * `levelsUp` counts directory hops from `fromDir` to the app root (bin/ → 3).
 */
export function appRootFrom(fromFileUrl: string, levelsUp = 3): string {
  let dir = dirname(fileURLToPath(fromFileUrl));
  for (let i = 0; i < levelsUp; i++) dir = dirname(dir);
  return dir;
}

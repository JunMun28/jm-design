/**
 * Per-project artifact watcher (plan §5 "Artifact watcher (chokidar) + manifest
 * reader", issue #8 / Slice 3).
 *
 * Watches a Project's directory for an artifact landing or changing — the
 * brainstorm Wireframe HTML and its sidecar `<entry>.manifest.json` — and emits
 * the resolved {@link ArtifactManifest} to a subscriber. The web shell uses the
 * manifest's `kind` to pick the canvas surface (`wireframe` → the sandboxed
 * iframe) and re-renders/live-reloads when the agent revises the artifact.
 *
 * All the surface-selection *decisions* (is this an artifact? which entry? parse
 * vs infer the manifest?) live in `artifacts.ts` and are unit-tested there with
 * no real watcher. This module is the thin chokidar wiring + a refcounted
 * registry so we never hold descriptors for projects no UI is looking at.
 */
import chokidar, { type FSWatcher } from 'chokidar';
import { projectDir } from './projects.ts';
import {
  type ArtifactManifest,
  entryForChange,
  resolveManifest,
} from './artifacts.ts';
import { relative } from 'node:path';

export type ArtifactEvent = { type: 'artifact'; manifest: ArtifactManifest };
type Subscriber = (evt: ArtifactEvent) => void;

interface Entry {
  dir: string;
  watcher: FSWatcher;
  subscribers: Set<Subscriber>;
}

const registry = new Map<string, Entry>();

/** Debounce per entry path so a manifest + entry landing together emit once. */
const lastEmit = new Map<string, number>();
const DEBOUNCE_MS = 120;

async function handleChange(
  projectId: string,
  absPath: string,
  env: NodeJS.ProcessEnv,
  emit: (evt: ArtifactEvent) => void,
): Promise<void> {
  const dir = projectDir(projectId, env);
  const rel = relative(dir, absPath).replace(/\\/g, '/');
  const entry = entryForChange(rel);
  if (!entry) return;

  const key = `${projectId}:${entry}`;
  const now = Date.now();
  const prev = lastEmit.get(key) ?? 0;
  if (now - prev < DEBOUNCE_MS) return;
  lastEmit.set(key, now);

  const manifest = await resolveManifest(projectId, entry, env);
  emit({ type: 'artifact', manifest });
}

/**
 * Subscribe to a Project's artifact events. The first subscribe lazily creates
 * the chokidar watcher; the last unsubscribe closes it. Returns an unsubscribe
 * fn. Watching only `add`/`change` (a wireframe appearing or being revised).
 */
export function watchArtifacts(
  projectId: string,
  onArtifact: Subscriber,
  env: NodeJS.ProcessEnv = process.env,
): () => void {
  let entry = registry.get(projectId);
  if (!entry) {
    const dir = projectDir(projectId, env);
    const watcher = chokidar.watch(dir, {
      // Don't replay an 'add' per existing file on watch start. On resume the
      // client already fetches the active-aware artifact over HTTP, and the
      // initial flood let a late wireframe frame clobber the resolved deck
      // (last-frame-wins → a deck project could flash the theme picker). Live
      // add/change after start still emit normally.
      ignoreInitial: true,
      persistent: true,
      followSymlinks: false,
      depth: 2,
      awaitWriteFinish: { stabilityThreshold: 150, pollInterval: 40 },
      // Tests can be flaky on native FS events; poll under NODE_ENV=test.
      usePolling: process.env.NODE_ENV === 'test',
    });
    const created: Entry = { dir, watcher, subscribers: new Set() };
    const fanout = (absPath: string) => {
      void handleChange(projectId, absPath, env, (evt) => {
        for (const sub of created.subscribers) sub(evt);
      });
    };
    watcher.on('add', fanout);
    watcher.on('change', fanout);
    registry.set(projectId, created);
    entry = created;
  }

  entry.subscribers.add(onArtifact);
  return () => {
    const e = registry.get(projectId);
    if (!e) return;
    e.subscribers.delete(onArtifact);
    if (e.subscribers.size === 0) {
      void e.watcher.close();
      registry.delete(projectId);
    }
  };
}

/** Close every watcher (graceful shutdown / tests). */
export async function closeAllArtifactWatchers(): Promise<void> {
  const all = [...registry.values()];
  registry.clear();
  await Promise.all(all.map((e) => e.watcher.close()));
}

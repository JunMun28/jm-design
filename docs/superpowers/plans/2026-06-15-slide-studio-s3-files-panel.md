# Slide Studio S3 — Files panel + variant switcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. (This plan may instead be executed by a Workflow that pipelines its tasks.)

**Goal:** A Claude-Design-style files panel in the workspace that lists the project's artifacts grouped (Wireframe / Decks / Exports); clicking a deck variant makes it active and loads it in the deck canvas (the variant switcher), clicking the wireframe shows the wireframe canvas, and exports are downloadable.

**Architecture:** Daemon gains a tested `setActiveDeck` helper + a tested `buildFilesResponse(project)` that classifies the project's artifacts (wireframe via `findArtifactByKind`, decks from `project.decks`, exports from `collectExports`), exposed behind thin routes `GET /api/projects/:id/files` and `POST /api/projects/:id/active-deck`; the artifact route becomes **active-aware** (serves the active deck variant on resume). Web adds `listFiles`/`setActiveDeck` API methods, an `ss-files-panel` component (house Atlas style), and workspace wiring: selecting a deck variant posts `active-deck` and sets the workspace `artifact` signal to that variant's manifest (the deck component's `effect` reloads on the new `manifest`); selecting the wireframe sets the wireframe manifest.

**Tech stack:** TS daemon via `node --experimental-strip-types` (`node:test`); Angular 22 web verified by `ng build` (no web unit runner); `pnpm`. Final in-app verification by a Playwright smoke.

**Scope:** S3 of `docs/superpowers/specs/2026-06-15-slide-studio-living-roundtrip-design.md`. The **add-a-style** action + **returnable-wireframe workflow** + `wireframeRev` bumping are S4. S3 surfaces existing variants and switches between them; it does not create new ones or bump `wireframeRev` (it only displays a `stale` flag computed from the existing `fromWireframeRev` vs `wireframeRev`).

**Paths:** repo root `/Users/wongjunmun/development/ai-development/jm-design`. `D=slide-studio/apps/daemon`, `W=slide-studio/apps/web`. Branch `main`. Daemon tests: `cd slide-studio && pnpm --filter @slide-studio/daemon test`. Web build: `pnpm --filter @slide-studio/web build`.

---

## Task 1: `setActiveDeck` helper (daemon)

**Files:** Modify `D/src/projects.ts`; Test `D/test/variants.test.ts`.

- [ ] **Step 1: Failing test** — append to `D/test/variants.test.ts` (it imports the helpers; add `setActiveDeck` to the import and add a temp-store case mirroring `register-deck.test.ts`'s `withTempStore` pattern — inline `withTempStore` if not already in this file):

```typescript
import { createProject, readProject, setTheme, setGate1, setGate2, registerGeneratedDeck, projectDir, setActiveDeck } from '../src/projects.ts';
// ... withTempStore (inline copy from projects.test.ts) ...

test('setActiveDeck switches the active variant; rejects unknown ids', async () => {
  await withTempStore(async (env) => {
    const p = await createProject({ brief: 'b' }, env);
    await setGate1(p.id, 'approve', env); await setGate2(p.id, 'approve', env);
    await setTheme(p.id, 'micron-dark', undefined, env);
    const { writeFile } = await import('node:fs/promises'); const { join } = await import('node:path');
    await writeFile(join(projectDir(p.id, env), 'deck.micron-dark.html'), '<html><body><section class="slide"></section></body></html>');
    await registerGeneratedDeck(p.id, 'micron-dark', env);
    await writeFile(join(projectDir(p.id, env), 'deck.playful.html'), '<html><body><section class="slide"></section></body></html>');
    await registerGeneratedDeck(p.id, 'playful', env); // active is now 'playful'

    const back = await setActiveDeck(p.id, 'micron-dark', env);
    assert.equal(back?.activeDeckId, 'micron-dark');
    const bad = await setActiveDeck(p.id, 'does-not-exist', env);
    assert.equal(bad, null); // unknown id → no change, null
    const reread = await readProject(p.id, env);
    assert.equal(reread?.activeDeckId, 'micron-dark');
  });
});
```

- [ ] **Step 2: Run — expect FAIL**
```bash
cd slide-studio && pnpm --filter @slide-studio/daemon test test/variants.test.ts 2>&1 | tail -8; cd -
```

- [ ] **Step 3: Implement** — add to `D/src/projects.ts` near `setTheme`:
```typescript
/** Make an existing deck variant active. Returns null if the id is unknown. */
export async function setActiveDeck(
  id: string,
  deckId: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<ProjectRecord | null> {
  const record = await readProject(id, env);
  if (!record) return null;
  if (!record.decks.some((d) => d.id === deckId)) return null;
  return patchProject(id, { activeDeckId: deckId }, env);
}
```

- [ ] **Step 4: Run — expect PASS**, then full suite green.
```bash
cd slide-studio && pnpm --filter @slide-studio/daemon test 2>&1 | grep -E "tests [0-9]|pass [0-9]|fail [0-9]"; cd -
```

- [ ] **Step 5: Commit** (SKIP if executing under the no-commit directive)
```bash
git add slide-studio/apps/daemon/src/projects.ts slide-studio/apps/daemon/test/variants.test.ts
git commit -m "feat(slide-studio): setActiveDeck helper (S3)"
```

---

## Task 2: `findArtifactByKind` + active-aware artifact route (daemon)

**Files:** Modify `D/src/artifacts.ts`, `D/src/server.ts`; Test `D/test/artifacts.test.ts`.

- [ ] **Step 1: Failing test** — append to `D/test/artifacts.test.ts` (mirrors its existing temp-dir helper):

```typescript
test('findArtifactByKind returns the newest previewable of a kind', async () => {
  await withTempStore(async (env) => {
    const id = 'proj-fk';
    const { mkdir, writeFile } = await import('node:fs/promises');
    const dir = projectDir(id, env); await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'wireframe.html'), '<html><body><section class="slide-panel"></section></body></html>');
    await writeFile(join(dir, 'deck.micron-dark.html'), '<html><body><section class="slide"></section></body></html>');
    await writeFile(join(dir, 'deck.micron-dark.html.manifest.json'), JSON.stringify({ kind: 'deck', format: 'html', entry: 'deck.micron-dark.html', theme: 'micron-dark' }));
    const wf = await findArtifactByKind(id, 'wireframe', env);
    assert.equal(wf, 'wireframe.html');
  });
});
```
(Adapt imports: `findArtifactByKind`, `projectDir`, `join`. Use the file's existing temp helper; if it uses `withDataDir`/inline, match it.)

- [ ] **Step 2: Run — expect FAIL.**
```bash
cd slide-studio && pnpm --filter @slide-studio/daemon test test/artifacts.test.ts 2>&1 | tail -8; cd -
```

- [ ] **Step 3: Implement `findArtifactByKind`** in `D/src/artifacts.ts` (reuse the scan in `findLatestArtifact`; resolve each candidate's manifest and keep the newest whose `kind` matches):
```typescript
/** Newest previewable artifact whose resolved manifest.kind matches, or null. */
export async function findArtifactByKind(
  projectId: string,
  kind: ArtifactKind,
  env: NodeJS.ProcessEnv = process.env,
): Promise<string | null> {
  const dir = projectDir(projectId, env);
  if (!existsSync(dir)) return null;
  const found: { rel: string; mtimeMs: number }[] = [];
  async function scan(absDir: string, depth: number): Promise<void> {
    let entries; try { entries = await readdir(absDir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const abs = join(absDir, e.name);
      if (e.isDirectory()) { if (depth > 0 && e.name !== 'node_modules' && !e.name.startsWith('.')) await scan(abs, depth - 1); continue; }
      const rel = relative(dir, abs).replace(/\\/g, '/');
      if (!isPreviewableEntry(rel)) continue;
      try { const s = await stat(abs); found.push({ rel, mtimeMs: s.mtimeMs }); } catch { /* skip */ }
    }
  }
  await scan(dir, 2);
  const sorted = found.sort((a, b) => b.mtimeMs - a.mtimeMs);
  for (const f of sorted) {
    const m = await resolveManifest(projectId, f.rel, env);
    if (m.kind === kind) return f.rel;
  }
  return null;
}
```
(If `findLatestArtifact` already factors a private `scan`, reuse it instead of duplicating; otherwise this self-contained copy is fine. Ensure `ArtifactKind`, `isPreviewableEntry`, `resolveManifest`, `projectDir`, `readdir`, `stat`, `relative`, `existsSync`, `join` are imported/available in the file — they are used by the existing `findLatestArtifact`.)

- [ ] **Step 4: Make the artifact route active-aware** in `D/src/server.ts`. Replace the `GET /api/projects/:id/artifact` handler body so that, on the deck stage with an active variant whose file exists, it resolves that variant; else falls back to the newest:
```typescript
  app.get('/api/projects/:id/artifact', async (req, res) => {
    const project = await readProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'not found' });
    let entry: string | null = null;
    const active = activeDeck(project);
    if (project.stage === 'deck' && active && fileExists(join(projectDir(project.id), active.file))) {
      entry = active.file;
    } else {
      entry = await findLatestArtifact(req.params.id);
    }
    if (!entry) return res.json({ manifest: null });
    const manifest = await resolveManifest(req.params.id, entry);
    return res.json({ manifest });
  });
```
(Add `activeDeck` to the `./projects.ts` import in server.ts; `fileExists`, `join`, `projectDir`, `resolveManifest`, `findLatestArtifact` are already imported/used.)

- [ ] **Step 5: Run — expect PASS**, then full suite green.
```bash
cd slide-studio && pnpm --filter @slide-studio/daemon test 2>&1 | grep -E "tests [0-9]|pass [0-9]|fail [0-9]"; cd -
```

- [ ] **Step 6: Commit** (SKIP under no-commit)
```bash
git add slide-studio/apps/daemon/src/artifacts.ts slide-studio/apps/daemon/src/server.ts slide-studio/apps/daemon/test/artifacts.test.ts
git commit -m "feat(slide-studio): findArtifactByKind + active-aware artifact route (S3)"
```

---

## Task 3: `buildFilesResponse` + files/active-deck endpoints (daemon)

**Files:** Create `D/src/files.ts`; Modify `D/src/server.ts`; Test `D/test/files.test.ts` (new).

- [ ] **Step 1: Failing test** — create `D/test/files.test.ts`:

```typescript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { createProject, readProject, setTheme, setGate1, setGate2, registerGeneratedDeck, projectDir } from '../src/projects.ts';
import { buildFilesResponse } from '../src/files.ts';
// withTempStore: inline from projects.test.ts

test('buildFilesResponse groups wireframe + deck variants (active/stale) + exports', async () => {
  await withTempStore(async (env) => {
    const p = await createProject({ brief: 'b' }, env);
    await setGate1(p.id, 'approve', env); await setGate2(p.id, 'approve', env);
    await setTheme(p.id, 'micron-dark', undefined, env);
    const dir = projectDir(p.id, env);
    await writeFile(join(dir, 'wireframe.html'), '<html><body><section class="slide-panel"></section></body></html>');
    await writeFile(join(dir, 'deck.micron-dark.html'), '<html><body><section class="slide"></section></body></html>');
    await registerGeneratedDeck(p.id, 'micron-dark', env);
    const r = await readProject(p.id, env);
    const files = await buildFilesResponse(r!, env);
    assert.ok(files.wireframe && files.wireframe.entry === 'wireframe.html');
    assert.equal(files.decks.length, 1);
    assert.equal(files.decks[0].theme, 'micron-dark');
    assert.equal(files.decks[0].active, true);
    assert.equal(files.decks[0].stale, false); // fromWireframeRev (0) === wireframeRev (0)
    assert.ok(Array.isArray(files.exports));
  });
});
```

- [ ] **Step 2: Run — expect FAIL** (no `files.ts`).
```bash
cd slide-studio && pnpm --filter @slide-studio/daemon test test/files.test.ts 2>&1 | tail -8; cd -
```

- [ ] **Step 3: Implement `D/src/files.ts`:**
```typescript
import type { ProjectRecord } from './projects.ts';
import { activeDeck } from './projects.ts';
import { findArtifactByKind, resolveManifest } from './artifacts.ts';
import { collectExports, type ExportItem } from './exports.ts';

export interface FilesResponse {
  wireframe: { entry: string; slides: number } | null;
  decks: { id: string; theme: string; file: string; active: boolean; stale: boolean; slides: number }[];
  exports: ExportItem[];
}

/** Group a project's artifacts for the files panel: the wireframe, every deck
 *  variant (active + stale flags), and the downloadable exports. */
export async function buildFilesResponse(
  project: ProjectRecord,
  env: NodeJS.ProcessEnv = process.env,
): Promise<FilesResponse> {
  const wfEntry = await findArtifactByKind(project.id, 'wireframe', env);
  const wfManifest = wfEntry ? await resolveManifest(project.id, wfEntry, env) : null;
  const decks = [];
  for (const v of project.decks) {
    let slides = 0;
    try { slides = (await resolveManifest(project.id, v.file, env)).slides; } catch { /* file may be missing */ }
    decks.push({
      id: v.id, theme: v.theme, file: v.file, slides,
      active: v.id === project.activeDeckId,
      stale: v.fromWireframeRev < project.wireframeRev,
    });
  }
  return {
    wireframe: wfManifest ? { entry: wfManifest.entry, slides: wfManifest.slides } : null,
    decks,
    exports: await collectExports(project, env),
  };
}
```

- [ ] **Step 4: Run — expect PASS.**
```bash
cd slide-studio && pnpm --filter @slide-studio/daemon test test/files.test.ts 2>&1 | tail -8; cd -
```

- [ ] **Step 5: Add the two routes** in `D/src/server.ts` (after the `/api/projects/:id/artifact/content` route, before the export routes). Import `buildFilesResponse` from `./files.ts` and `setActiveDeck` from `./projects.ts`:
```typescript
  app.get('/api/projects/:id/files', async (req, res) => {
    const project = await readProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'not found' });
    return res.json({ files: await buildFilesResponse(project) });
  });

  app.post('/api/projects/:id/active-deck', async (req, res) => {
    const deckId = String(req.body?.deckId ?? '').trim();
    if (!deckId) return res.status(400).json({ error: 'deckId is required' });
    const updated = await setActiveDeck(req.params.id, deckId);
    if (!updated) return res.status(404).json({ error: 'project or deck variant not found' });
    return res.json({ project: updated });
  });
```

- [ ] **Step 6: Full suite green.**
```bash
cd slide-studio && pnpm --filter @slide-studio/daemon test 2>&1 | grep -E "tests [0-9]|pass [0-9]|fail [0-9]"; cd -
```

- [ ] **Step 7: Commit** (SKIP under no-commit)
```bash
git add slide-studio/apps/daemon/src/files.ts slide-studio/apps/daemon/src/server.ts slide-studio/apps/daemon/test/files.test.ts
git commit -m "feat(slide-studio): files-list + active-deck endpoints (S3)"
```

---

## Task 4: Web API methods

**Files:** Modify `W/src/app/core/api.service.ts`, `W/src/app/core/types.ts`.

- [ ] **Step 1: Add types** to `W/src/app/core/types.ts`:
```typescript
export interface FilesResponse {
  wireframe: { entry: string; slides: number } | null;
  decks: { id: string; theme: string; file: string; active: boolean; stale: boolean; slides: number }[];
  exports: { format: string; entry: string; filename: string; bytes: number }[];
}
```

- [ ] **Step 2: Add API methods** to `W/src/app/core/api.service.ts` (mirror the `setGate1` fetch pattern):
```typescript
  async listFiles(id: string): Promise<FilesResponse | null> {
    const res = await fetch(`/api/projects/${encodeURIComponent(id)}/files`);
    if (!res.ok) return null;
    return (await res.json()).files;
  }

  async setActiveDeck(id: string, deckId: string): Promise<ProjectRecord | null> {
    const res = await fetch(`/api/projects/${encodeURIComponent(id)}/active-deck`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ deckId }),
    });
    if (!res.ok) return null;
    return (await res.json()).project;
  }
```
(Import `FilesResponse` + `ProjectRecord` from `./types`.)

- [ ] **Step 3: Build** — `cd slide-studio && pnpm --filter @slide-studio/web build 2>&1 | tail -2; cd -`. Expected: clean.

- [ ] **Step 4: Commit** (SKIP under no-commit)
```bash
git add slide-studio/apps/web/src/app/core/api.service.ts slide-studio/apps/web/src/app/core/types.ts
git commit -m "feat(slide-studio): web listFiles + setActiveDeck API (S3)"
```

---

## Task 5: `ss-files-panel` component

**Files:** Create `W/src/app/files/files-panel.component.ts`.

- [ ] **Step 1: Create the component** (house style: standalone, `OnPush`, signals, `@for`, Atlas `mic-*` classes; mirror `apps/attach/attach-control.component.ts`):

```typescript
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { FilesResponse } from '../core/types';

@Component({
  selector: 'ss-files-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="files" aria-label="Project files">
      <div class="files__group">
        <h3 class="files__label">Wireframe</h3>
        @if (files()?.wireframe; as wf) {
          <button class="files__item" [class.files__item--active]="activeKind() === 'wireframe'" (click)="openWireframe.emit()">
            <span class="files__name">Wireframe</span><span class="files__meta">{{ wf.slides }} slides</span>
          </button>
        } @else { <p class="files__empty">None yet</p> }
      </div>
      <div class="files__group">
        <h3 class="files__label">Decks</h3>
        @for (d of files()?.decks ?? []; track d.id) {
          <button class="files__item" [class.files__item--active]="d.active && activeKind() === 'deck'" (click)="openDeck.emit(d.id)">
            <span class="files__name">{{ d.theme }}</span>
            <span class="files__meta">{{ d.slides }} slides @if (d.stale) { · <span class="files__stale" title="The wireframe changed after this was generated">wireframe changed</span> }</span>
          </button>
        } @empty { <p class="files__empty">No decks yet</p> }
      </div>
      <div class="files__group">
        <h3 class="files__label">Exports</h3>
        @for (e of files()?.exports ?? []; track e.entry) {
          <a class="files__item" [href]="downloadHref()(e.entry)"><span class="files__name">{{ e.filename }}</span><span class="files__meta">{{ e.format }}</span></a>
        } @empty { <p class="files__empty">No exports yet</p> }
      </div>
    </nav>
  `,
  styles: [`
    .files { display: flex; flex-direction: column; gap: 16px; padding: 12px; overflow: auto; height: 100%; }
    .files__group { display: flex; flex-direction: column; gap: 4px; }
    .files__label { margin: 0 0 4px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--mic-faint); }
    .files__item { display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%; text-align: left;
      padding: 7px 9px; border: 1px solid var(--mic-border); border-radius: var(--mic-radius); background: var(--mic-surface);
      color: var(--mic-ink); cursor: pointer; text-decoration: none; font-size: 13px; }
    .files__item:hover { border-color: var(--mic-border-strong); }
    .files__item--active { border-color: var(--mic-accent); background: var(--mic-surface-2); }
    .files__name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .files__meta { flex: 0 0 auto; font-size: 11px; color: var(--mic-faint); }
    .files__stale { color: var(--mic-accent); }
    .files__empty { margin: 0; font-size: 12px; color: var(--mic-faint); }
  `],
})
export class FilesPanelComponent {
  readonly files = input.required<FilesResponse | null>();
  /** Which canvas is currently shown, so the matching item highlights. */
  readonly activeKind = input<'deck' | 'wireframe' | null>(null);
  /** Builds an export download href for an entry (workspace supplies it). */
  readonly downloadHref = input.required<(entry: string) => string>();
  readonly openDeck = output<string>();    // deck variant id
  readonly openWireframe = output<void>();
}
```

- [ ] **Step 2: Build** — `cd slide-studio && pnpm --filter @slide-studio/web build 2>&1 | tail -2; cd -`. Expected: clean (component compiles even before it's wired in).

- [ ] **Step 3: Commit** (SKIP under no-commit)
```bash
git add slide-studio/apps/web/src/app/files/files-panel.component.ts
git commit -m "feat(slide-studio): ss-files-panel component (S3)"
```

---

## Task 6: Workspace wiring

**Files:** Modify `W/src/app/workspace/workspace.component.ts`.

- [ ] **Step 1: Wire the panel into the workspace.** Import `FilesPanelComponent` (add to `imports`). Add a `files = signal<FilesResponse | null>(null)` and load it on init + on `artifact`/feedback changes: after the existing `this.artifact.set(...)` on init/socket, also `this.files.set(await this.api.listFiles(id))`. Add a small `refreshFiles()` method calling `listFiles` and use it after generate completes (the socket `artifact` event) and after selection.

- [ ] **Step 2: Place the panel + handlers.** In the template, add the panel as a left rail in `.ws__body` (change the grid to `grid-template-columns: 220px 1fr 420px` and insert `<ss-files-panel … />` as the first child):
```html
<ss-files-panel
  [files]="files()"
  [activeKind]="artifact()?.kind ?? null"
  [downloadHref]="exportHref"
  (openDeck)="onOpenDeck($event)"
  (openWireframe)="onOpenWireframe()" />
```
Add the handlers to the component class:
```typescript
  readonly files = signal<FilesResponse | null>(null);

  // bound function so the panel can build export hrefs via the existing API helper
  readonly exportHref = (entry: string): string => this.api.exportDownloadUrl(this.project()!.id, entry);

  private async refreshFiles(): Promise<void> {
    const id = this.project()?.id; if (!id) return;
    this.files.set(await this.api.listFiles(id));
  }

  async onOpenDeck(deckId: string): Promise<void> {
    const id = this.project()?.id; if (!id) return;
    await this.api.setActiveDeck(id, deckId);             // persist active (also drives generate/export)
    const m = await this.api.getArtifact(id);             // active-aware route → the chosen variant's manifest
    if (m) this.artifact.set(m);                          // deck canvas reloads (its effect tracks manifest)
    await this.refreshFiles();
  }

  async onOpenWireframe(): Promise<void> {
    const id = this.project()?.id; if (!id) return;
    const wf = this.files()?.wireframe;
    if (!wf) return;
    // Build a wireframe manifest from the files entry so the wireframe canvas shows.
    this.artifact.set({ kind: 'wireframe', format: 'html', entry: wf.entry, slides: wf.slides, theme: null });
  }
```
(Adjust to the real signal/method names in the file — `this.artifact`, `this.project`, `this.api` are confirmed to exist. `getArtifact` returns the manifest; if it returns `{manifest}` unwrap accordingly — match the existing init call `await this.api.getArtifact(project.id)`.)

- [ ] **Step 3: Call `refreshFiles()`** on workspace init (after the project + artifact load) and in the socket `artifact` handler, so the panel stays current after a generate.

- [ ] **Step 4: Build** — `cd slide-studio && pnpm --filter @slide-studio/web build 2>&1 | tail -3; cd -`. Expected: clean. Fix any type mismatches (e.g., `getArtifact` return shape) until green.

- [ ] **Step 5: Commit** (SKIP under no-commit)
```bash
git add slide-studio/apps/web/src/app/workspace/workspace.component.ts
git commit -m "feat(slide-studio): wire files panel + variant switching into the workspace (S3)"
```

---

## Task 7: In-app verification (Playwright smoke)

**Files:** Create `tmp/s3-files.mjs` (throwaway, gitignored).

- [ ] **Step 1: Full suite + build.**
```bash
cd slide-studio && pnpm --filter @slide-studio/daemon test 2>&1 | grep -E "tests [0-9]|pass [0-9]|fail [0-9]" && pnpm --filter @slide-studio/web build 2>&1 | tail -1; cd -
```
Expected: daemon green; web builds.

- [ ] **Step 2: Seed a 2-variant project + drive the panel.** Seed a project with two deck files (`deck.micron-dark.html`, `deck.playful.html` — copy reshelled examples) and two registered variants (write `project.json` with `decks` for both + `activeDeckId: 'micron-dark'`, or seed via the daemon helpers in a tiny node script). Boot the daemon (`SLIDE_STUDIO_NO_OPEN=1 node --experimental-strip-types bin/launch-server.mjs`), then with Playwright (write `tmp/s3-files.mjs`, run from repo root):
  - open `http://127.0.0.1:4317/workspace/<id>`;
  - assert the files panel lists Wireframe (if present) + 2 decks (micron-dark, playful) + any exports;
  - screenshot `tmp/s3-01-panel.png`;
  - click the `playful` deck item; wait; assert the deck iframe now renders the playful deck (its `window.presentation` total / first-slide text differs from micron-dark) and the panel marks playful active;
  - screenshot `tmp/s3-02-switched.png`;
  - tear down the daemon.

- [ ] **Step 3: Eyeball the screenshots** — the panel shows the three groups in Atlas style; switching variants changes the rendered deck. Record pass/fail.

- [ ] **Step 4: Commit** (SKIP under no-commit) — no source changes; verification only.

---

## Self-review (plan author)

**Spec coverage (S3):**
- Files panel grouped Wireframe / Decks / Exports → Task 3 (`buildFilesResponse`) + Task 5 (component). ✓
- Click a deck variant → make active + load it (variant switcher) → Tasks 1 (`setActiveDeck`), 2 (active-aware route), 6 (`onOpenDeck`). ✓
- Click the wireframe → wireframe canvas → Task 6 (`onOpenWireframe`). ✓
- Exports downloadable → Task 5 (export links via existing `exportDownloadUrl`). ✓
- Stale flag (fromWireframeRev < wireframeRev) shown → Task 3 + Task 5. ✓
- Active-aware resume (serve the active variant) → Task 2. ✓

**Placeholder scan:** none — concrete code/commands throughout. (Task 6 notes "adjust to real signal names" because the workspace file is large; the bound names `this.artifact`/`this.project`/`this.api`/`getArtifact` are confirmed by the exploration.)

**Type consistency:** `FilesResponse` shape identical in daemon `files.ts` and web `types.ts`; `decks[].id/theme/file/active/stale/slides` consistent across `buildFilesResponse`, the endpoint, the API method, and the component; `setActiveDeck(id, deckId)` consistent daemon↔web; variant id = `slugify(theme)` (from S2) is what `onOpenDeck` posts.

**Honest gaps:** web has no unit runner — Tasks 4–6 are `ng build`-verified + the Task 7 in-app smoke is the real proof (mirrors how S1 was verified). Endpoint routes (Task 2/3 server wrappers) are thin over tested functions (`setActiveDeck`, `buildFilesResponse`, `findArtifactByKind`); the in-app smoke exercises them for real.

**Next:** S4 — returnable wireframe + "add a style" (generate a new variant from the wireframe) + `wireframeRev` bump on wireframe re-approval (which lights up the `stale` flag this plan already displays).

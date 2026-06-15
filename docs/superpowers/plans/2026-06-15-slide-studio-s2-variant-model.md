# Slide Studio S2 — Variant data model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give a project a non-destructive set of styled deck variants — `decks: DeckVariant[]` keyed by theme, plus `wireframeRev` and `activeDeckId` — so generating a new theme adds a new `deck.<theme>.html` instead of overwriting, while existing single-deck projects migrate safely and the current app keeps working.

**Architecture:** Pure data + pure helpers in `projects.ts` (type, migration-on-read, `variantFileName`/`deckFileForTheme`/`upsertVariant`/`activeDeck`). The generate path computes the variant file from the theme (one variant per theme, reused on re-generate), verifies that file, and registers it via a tested `registerGeneratedDeck` helper. `collectExports` reads the active variant. The artifact route is **unchanged** — `findLatestArtifact` already serves the newest previewable HTML, so a fresh variant renders without selection UI (selection arrives in S3). The web `ProjectRecord` mirror gains the fields; web behaviour is otherwise unchanged.

**Tech stack:** TypeScript daemon run via `node --experimental-strip-types`; tests via `node --test` (daemon suites in `slide-studio/apps/daemon/test/`); Angular web verified by `ng build`. `pnpm` workspace.

**Scope:** S2 of the spec `docs/superpowers/specs/2026-06-15-slide-studio-living-roundtrip-design.md`. S3 (files panel / variant switcher) and S4 (returnable wireframe / add-a-style UI + `wireframeRev` bumping) are separate plans. S2 stores `wireframeRev` (default 0) and records `fromWireframeRev` on variants, but does **not** bump it (that's S4).

**Paths:** repo root `/Users/wongjunmun/development/ai-development/jm-design`. `D=slide-studio/apps/daemon`, `W=slide-studio/apps/web`. Branch `main`. Run daemon tests: `cd slide-studio && pnpm --filter @slide-studio/daemon test`. Build web: `pnpm --filter @slide-studio/web build`.

---

## Task 1: `DeckVariant` type, record fields, migration-on-read

**Files:**
- Modify: `slide-studio/apps/daemon/src/projects.ts`
- Test: `slide-studio/apps/daemon/test/projects.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `D/test/projects.test.ts` (it already imports `createProject`, `readProject`, `setTheme`, `setGate1`, `setGate2`, `withTempStore`, `projectDir`, `assert`, `test`):

```typescript
test('S2: a record with no decks[] migrates to empty variant fields (AC)', async () => {
  await withTempStore(async (env) => {
    const p = await createProject({ brief: 'deck' }, env);
    const r = await readProject(p.id, env);
    assert.deepEqual(r?.decks, []);
    assert.equal(r?.wireframeRev, 0);
    assert.equal(r?.activeDeckId, null);
  });
});

test('S2: a legacy themed deck-stage record migrates its deck.html into one variant', async () => {
  await withTempStore(async (env) => {
    const p = await createProject({ brief: 'deck' }, env);
    await setGate1(p.id, 'approve', env);
    await setGate2(p.id, 'approve', env);
    await setTheme(p.id, 'micron-dark', undefined, env);
    // Simulate an OLDER on-disk record that predates decks[] by stripping the field.
    const { readFile, writeFile } = await import('node:fs/promises');
    const { join } = await import('node:path');
    const file = join(projectDir(p.id, env), 'project.json');
    const raw = JSON.parse(await readFile(file, 'utf8'));
    delete raw.decks; delete raw.wireframeRev; delete raw.activeDeckId;
    await writeFile(file, JSON.stringify(raw));

    const r = await readProject(p.id, env);
    assert.equal(r?.decks.length, 1);
    assert.equal(r?.decks[0].theme, 'micron-dark');
    assert.equal(r?.decks[0].file, 'deck.html');
    assert.equal(r?.decks[0].fromWireframeRev, 0);
    assert.equal(r?.activeDeckId, r?.decks[0].id);
    assert.equal(r?.theme, 'micron-dark'); // kept (pending/selected theme)
  });
});
```

- [ ] **Step 2: Run them — expect FAIL**

```bash
cd slide-studio && pnpm --filter @slide-studio/daemon test 2>&1 | grep -E "S2:|fail"; cd -
```
Expected: the two S2 tests fail (`decks` undefined).

- [ ] **Step 3: Add the type + fields + migration**

In `D/src/projects.ts`, add the `DeckVariant` type just above `ProjectRecord`:

```typescript
/** One non-destructive styled rendering of the project's content (S2). One per
 *  theme: re-generating a theme refreshes its variant; a new theme adds another. */
export type DeckVariant = {
  id: string;            // stable per theme: slugify(theme)
  theme: string;         // theme id this variant was generated in
  file: string;          // project-relative deck file, e.g. deck.micron-dark.html (legacy: deck.html)
  fromWireframeRev: number; // the wireframeRev this variant was generated from
  createdAt: string;
};
```

Add three fields to `ProjectRecord` (after `theme: string | null;`):

```typescript
  decks: DeckVariant[];
  wireframeRev: number;
  activeDeckId: string | null;
```

In `readProject`, the function currently returns `{ <defaults>, ...parsed } as ProjectRecord`. Change it so it (a) defaults the new fields and (b) migrates a legacy themed record. Replace the `return { … ...parsed } as ProjectRecord;` block with:

```typescript
    const merged = {
      stage: 'brief',
      recordedBrief: {},
      questionnaire: null,
      questionnaireAnswered: false,
      gate1: 'pending',
      gate2: 'pending',
      gate3: 'pending',
      formats: ['html'],
      runtimeId: null,
      theme: null,
      decks: [],
      wireframeRev: 0,
      activeDeckId: null,
      ...parsed,
    } as ProjectRecord;
    // Migration: a legacy record (no decks[]) that already picked a theme had its
    // single deck written to deck.html — fold that into one variant.
    if (!Array.isArray(parsed.decks) && merged.theme) {
      const v: DeckVariant = {
        id: slugify(merged.theme),
        theme: merged.theme,
        file: 'deck.html',
        fromWireframeRev: 0,
        createdAt: merged.createdAt,
      };
      merged.decks = [v];
      merged.activeDeckId = v.id;
    }
    return merged;
```

(`slugify` already exists in this file — it's used for ids. Confirm it's in scope; if it's a local `function slugify`, it is.)

Also set the new fields in `createProject` so freshly-created records are explicit (find the object literal it writes and add `decks: [], wireframeRev: 0, activeDeckId: null,`).

- [ ] **Step 4: Run the tests — expect PASS**

```bash
cd slide-studio && pnpm --filter @slide-studio/daemon test 2>&1 | grep -E "S2:|tests|pass|fail"; cd -
```
Expected: both S2 tests pass; existing projects tests still pass.

- [ ] **Step 5: Commit**

```bash
git add slide-studio/apps/daemon/src/projects.ts slide-studio/apps/daemon/test/projects.test.ts
git commit -m "feat(slide-studio): DeckVariant type + decks[]/wireframeRev/activeDeckId + migration"
```

---

## Task 2: Pure variant helpers

**Files:**
- Modify: `slide-studio/apps/daemon/src/projects.ts`
- Test: `slide-studio/apps/daemon/test/variants.test.ts` (new)

- [ ] **Step 1: Write the failing test**

Create `D/test/variants.test.ts`:

```typescript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { variantFileName, deckFileForTheme, upsertVariant, activeDeck } from '../src/projects.ts';

const base = () => ({
  id: 'x', title: 'X', brief: 'b', runtimeId: null, theme: null,
  stage: 'deck' as const, recordedBrief: {}, questionnaire: null,
  questionnaireAnswered: false, gate1: 'approved' as const, gate2: 'approved' as const,
  gate3: 'approved' as const, formats: ['html' as const], createdAt: 't', updatedAt: 't',
  decks: [], wireframeRev: 0, activeDeckId: null,
});

test('variantFileName slugs the theme', () => {
  assert.equal(variantFileName('micron-dark'), 'deck.micron-dark.html');
  assert.equal(variantFileName('Seventies Sunset'), 'deck.seventies-sunset.html');
});

test('deckFileForTheme reuses an existing variant file, else derives a new one', () => {
  const r = base();
  assert.equal(deckFileForTheme(r, 'playful'), 'deck.playful.html');
  const legacy = { ...base(), decks: [{ id: 'micron-dark', theme: 'micron-dark', file: 'deck.html', fromWireframeRev: 0, createdAt: 't' }] };
  assert.equal(deckFileForTheme(legacy, 'micron-dark'), 'deck.html'); // reuse legacy file
  assert.equal(deckFileForTheme(legacy, 'playful'), 'deck.playful.html'); // new theme → new file
});

test('upsertVariant replaces same-theme, appends new, and sets it active', () => {
  let r = base();
  r = upsertVariant(r, { theme: 'micron-dark', file: 'deck.micron-dark.html', wireframeRev: 0, createdAt: 't1' });
  assert.equal(r.decks.length, 1);
  assert.equal(r.activeDeckId, 'micron-dark');
  r = upsertVariant(r, { theme: 'playful', file: 'deck.playful.html', wireframeRev: 0, createdAt: 't2' });
  assert.equal(r.decks.length, 2);
  assert.equal(r.activeDeckId, 'playful');
  // re-generate micron-dark → refresh in place, not a duplicate
  r = upsertVariant(r, { theme: 'micron-dark', file: 'deck.micron-dark.html', wireframeRev: 1, createdAt: 't3' });
  assert.equal(r.decks.length, 2);
  assert.equal(r.decks.find((d) => d.theme === 'micron-dark')?.fromWireframeRev, 1);
  assert.equal(r.activeDeckId, 'micron-dark');
});

test('activeDeck returns the active variant or null', () => {
  assert.equal(activeDeck(base()), null);
  const r = upsertVariant(base(), { theme: 'playful', file: 'deck.playful.html', wireframeRev: 0, createdAt: 't' });
  assert.equal(activeDeck(r)?.theme, 'playful');
});
```

- [ ] **Step 2: Run it — expect FAIL**

```bash
cd slide-studio && pnpm --filter @slide-studio/daemon test test/variants.test.ts 2>&1 | tail -8; cd -
```
Expected: import error — helpers not exported.

- [ ] **Step 3: Implement the helpers**

Add to `D/src/projects.ts` (near `setTheme`):

```typescript
/** Deck file name for a theme, e.g. "deck.micron-dark.html". */
export function variantFileName(theme: string): string {
  return `deck.${slugify(theme)}.html`;
}

/** The deck file to (re)generate for a theme: reuse the existing variant's file
 *  (so legacy "deck.html" stays put), else a fresh per-theme name. */
export function deckFileForTheme(record: ProjectRecord, theme: string): string {
  return record.decks.find((d) => d.theme === theme)?.file ?? variantFileName(theme);
}

/** Add or refresh the variant for a theme (keyed by slugify(theme)) and make it
 *  active. Pure — returns a new record. */
export function upsertVariant(
  record: ProjectRecord,
  v: { theme: string; file: string; wireframeRev: number; createdAt: string },
): ProjectRecord {
  const id = slugify(v.theme);
  const variant: DeckVariant = { id, theme: v.theme, file: v.file, fromWireframeRev: v.wireframeRev, createdAt: v.createdAt };
  const decks = record.decks.some((d) => d.id === id)
    ? record.decks.map((d) => (d.id === id ? variant : d))
    : [...record.decks, variant];
  return { ...record, decks, activeDeckId: id };
}

/** The currently active deck variant, or null. */
export function activeDeck(record: ProjectRecord): DeckVariant | null {
  return record.decks.find((d) => d.id === record.activeDeckId) ?? null;
}
```

- [ ] **Step 4: Run it — expect PASS**

```bash
cd slide-studio && pnpm --filter @slide-studio/daemon test test/variants.test.ts 2>&1 | tail -8; cd -
```
Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add slide-studio/apps/daemon/src/projects.ts slide-studio/apps/daemon/test/variants.test.ts
git commit -m "feat(slide-studio): pure deck-variant helpers (variantFileName/deckFileForTheme/upsertVariant/activeDeck)"
```

---

## Task 3: `registerGeneratedDeck` — persist the variant + write its manifest sidecar

**Files:**
- Modify: `slide-studio/apps/daemon/src/projects.ts`
- Test: `slide-studio/apps/daemon/test/register-deck.test.ts` (new)

- [ ] **Step 1: Write the failing test**

Create `D/test/register-deck.test.ts`:

```typescript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createProject, readProject, setTheme, setGate1, setGate2, registerGeneratedDeck, projectDir, deckFileForTheme } from '../src/projects.ts';
import { withTempStore } from './helpers.ts'; // if projects.test.ts defines withTempStore inline, replicate it here instead

test('registerGeneratedDeck records the variant + writes a deck manifest sidecar', async () => {
  await withTempStore(async (env) => {
    const p = await createProject({ brief: 'deck' }, env);
    await setGate1(p.id, 'approve', env);
    await setGate2(p.id, 'approve', env);
    await setTheme(p.id, 'micron-dark', undefined, env);
    const r0 = await readProject(p.id, env);
    const file = deckFileForTheme(r0!, 'micron-dark'); // deck.micron-dark.html
    // simulate the agent having written the deck file
    await writeFile(join(projectDir(p.id, env), file), '<!doctype html><body><section class="slide"><h1>x</h1></section></body>');

    const updated = await registerGeneratedDeck(p.id, 'micron-dark', env);
    assert.equal(updated?.decks.length, 1);
    assert.equal(updated?.decks[0].theme, 'micron-dark');
    assert.equal(updated?.decks[0].file, file);
    assert.equal(updated?.activeDeckId, updated?.decks[0].id);

    const sidecar = JSON.parse(await readFile(join(projectDir(p.id, env), file + '.manifest.json'), 'utf8'));
    assert.equal(sidecar.kind, 'deck');
    assert.equal(sidecar.theme, 'micron-dark');
    assert.equal(sidecar.entry, file);
  });
});
```

> If `test/helpers.ts` does not exist, copy the `withTempStore` helper from the top of `projects.test.ts` into this file instead of importing it.

- [ ] **Step 2: Run it — expect FAIL**

```bash
cd slide-studio && pnpm --filter @slide-studio/daemon test test/register-deck.test.ts 2>&1 | tail -8; cd -
```
Expected: `registerGeneratedDeck` not exported.

- [ ] **Step 3: Implement `registerGeneratedDeck`**

Add to `D/src/projects.ts` (it can use the existing `patchProject`, `projectDir`, and `node:fs/promises`):

```typescript
/** After the agent writes a deck for `theme`, record the variant (refresh in
 *  place, set active) and write a manifest sidecar so the artifact resolver
 *  reports the right kind+theme. Returns the updated record. */
export async function registerGeneratedDeck(
  id: string,
  theme: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<ProjectRecord | null> {
  const record = await readProject(id, env);
  if (!record) return null;
  const file = deckFileForTheme(record, theme);
  const next = upsertVariant(record, { theme, file, wireframeRev: record.wireframeRev, createdAt: record.updatedAt });
  // sidecar: kind/theme are not inferable from the file name alone (theme would be null)
  const { writeFile } = await import('node:fs/promises');
  const sidecar = { kind: 'deck', format: 'html', entry: file, theme };
  try {
    await writeFile(join(projectDir(id, env), `${file}.manifest.json`), JSON.stringify(sidecar, null, 2));
  } catch { /* sidecar is best-effort; the resolver infers kind from the name otherwise */ }
  return patchProject(id, { decks: next.decks, activeDeckId: next.activeDeckId }, env);
}
```

(Ensure `join` and `projectDir` are already imported/available in `projects.ts` — `projectDir` is defined there; `join` from `node:path` is likely already imported. If not, add `import { join } from 'node:path';`.)

- [ ] **Step 4: Run it — expect PASS**

```bash
cd slide-studio && pnpm --filter @slide-studio/daemon test test/register-deck.test.ts 2>&1 | tail -8; cd -
```
Expected: 1 test passes.

- [ ] **Step 5: Commit**

```bash
git add slide-studio/apps/daemon/src/projects.ts slide-studio/apps/daemon/test/register-deck.test.ts
git commit -m "feat(slide-studio): registerGeneratedDeck persists the variant + manifest sidecar"
```

---

## Task 4: Wire the generate path to the active variant file

**Files:**
- Modify: `slide-studio/apps/daemon/src/server.ts`

This task has no new unit test (the generate path spawns the agent CLI). It wires the tested helpers from Tasks 2–3; correctness is covered by those tests + the full daemon suite staying green + the S1 in-app render still working.

- [ ] **Step 1: Import the helpers**

In `D/src/server.ts`, add `deckFileForTheme` and `registerGeneratedDeck` to the existing import from `./projects.ts` (the one that already imports `readProject`, `setTheme`, `projectDir`, etc.).

- [ ] **Step 2: Compute the variant file once, near the top of the generate handler**

In the generate handler, right after the theme is validated (the block that reads `const theme = project.theme;` and rejects unknown themes), add:

```typescript
    const deckEntry = deckFileForTheme(project, theme); // deck.<theme>.html (or legacy deck.html)
    const deckAbs = join(projDir, deckEntry);
```

(`projDir` is computed a few lines later as `const projDir = projectDir(project.id);` — move that `projDir` line up to before this, or compute `projectDir(project.id)` inline here. Keep a single `projDir`/`deckAbs` definition; remove the later `const deckAbs = join(projDir, DECK_ENTRY);` line.)

- [ ] **Step 3: Use `deckEntry` everywhere `DECK_ENTRY` drove the deck file**

Replace the deck-file uses in the generate handler:
- `generatePersona(theme, DECK_ENTRY, formats)` → `generatePersona(theme, deckEntry, formats)`
- the deck-fix prompt `composeDeckFixPrompt(DECK_ENTRY, …)` → `composeDeckFixPrompt(deckEntry, …)`
- any agent-instruction text mentioning `DECK_ENTRY` → use `deckEntry`
- the verify input `runVerify({ htmlPath: deckAbs, theme, … })` already uses `deckAbs` (now the variant path) — keep it.
- PPTX: `pptxOutputPath(deckAbs)` already derives from `deckAbs` — keep it.

(Leave the `DECK_ENTRY` constant in place; `exports.ts` and any other module still reference their own copy. This handler just stops using it.)

- [ ] **Step 4: Register the variant after a successful verify**

In the generate handler, after the verify gate has run and `result.passed` is known (right before/with the `exports` collection near the end), add:

```typescript
    if (result.passed) {
      await registerGeneratedDeck(project.id, theme);
    }
```

(Place it before the `const exportProject = await readProject(project.id);` line so the exports read the updated record.)

- [ ] **Step 5: Typecheck the daemon (no emit) + run the full suite**

```bash
cd slide-studio
pnpm --filter @slide-studio/daemon test
cd -
```
Expected: all daemon suites pass (the generate path compiles via strip-types when tests import server pieces; the suite stays green).

- [ ] **Step 6: Commit**

```bash
git add slide-studio/apps/daemon/src/server.ts
git commit -m "feat(slide-studio): generate writes/verifies the per-theme variant + registers it"
```

---

## Task 5: Exports follow the active variant

**Files:**
- Modify: `slide-studio/apps/daemon/src/exports.ts`
- Test: `slide-studio/apps/daemon/test/exports.test.ts` (extend if present, else create)

- [ ] **Step 1: Write the failing test**

If `D/test/exports.test.ts` exists, append; else create it with the imports it needs (`collectExports`, `createProject`/temp store, `node:fs`). Add:

```typescript
test('S2: collectExports lists the ACTIVE variant html (deck.<theme>.html), not deck.html', async () => {
  await withTempStore(async (env) => {
    const p = await createProject({ brief: 'deck' }, env);
    await setGate1(p.id, 'approve', env);
    await setGate2(p.id, 'approve', env);
    await setTheme(p.id, 'playful', undefined, env);
    const { writeFile } = await import('node:fs/promises');
    const { join } = await import('node:path');
    await writeFile(join(projectDir(p.id, env), 'deck.playful.html'), '<html><body>deck</body></html>');
    await registerGeneratedDeck(p.id, 'playful', env);
    const r = await readProject(p.id, env);
    const items = await collectExports(r!, env);
    assert.ok(items.some((i) => i.entry === 'deck.playful.html' && i.format === 'html'));
  });
});
```

- [ ] **Step 2: Run it — expect FAIL**

```bash
cd slide-studio && pnpm --filter @slide-studio/daemon test test/exports.test.ts 2>&1 | tail -10; cd -
```
Expected: fail — `collectExports` looked for `deck.html`, which doesn't exist.

- [ ] **Step 3: Make `collectExports` use the active variant's file**

In `D/src/exports.ts` `collectExports`, replace the hardcoded entry line. Change:

```typescript
    const entry = format === 'pptx' ? DECK_PPTX_ENTRY : DECK_HTML_ENTRY;
```

to:

```typescript
    const active = activeDeck(project);
    const htmlEntry = active?.file ?? DECK_HTML_ENTRY; // legacy fallback
    const entry = format === 'pptx' ? htmlEntry.replace(/\.html$/i, '.pptx') : htmlEntry;
```

Add `activeDeck` to the import from `./projects.ts` at the top of `exports.ts`. (The pptx name is derived from the html name to match `pptx.pptxOutputPath`, which appends `.pptx` to the deck stem.)

- [ ] **Step 4: Run it — expect PASS**

```bash
cd slide-studio && pnpm --filter @slide-studio/daemon test test/exports.test.ts 2>&1 | tail -10; cd -
```
Expected: pass, and existing export tests still pass (legacy fallback keeps `deck.html` projects working).

- [ ] **Step 5: Commit**

```bash
git add slide-studio/apps/daemon/src/exports.ts slide-studio/apps/daemon/test/exports.test.ts
git commit -m "feat(slide-studio): exports follow the active deck variant"
```

---

## Task 6: Web `ProjectRecord` mirror + build

**Files:**
- Modify: `slide-studio/apps/web/src/app/core/types.ts`

- [ ] **Step 1: Mirror the new fields**

In `W/src/app/core/types.ts`, find the `ProjectRecord` interface/type (it has `theme: string | null`) and add:

```typescript
  decks: DeckVariant[];
  wireframeRev: number;
  activeDeckId: string | null;
```

Add the mirrored `DeckVariant` type next to it:

```typescript
export interface DeckVariant {
  id: string;
  theme: string;
  file: string;
  fromWireframeRev: number;
  createdAt: string;
}
```

(Web behaviour is unchanged this slice — the deck still loads via the manifest entry that `findLatestArtifact` resolves to the newest variant, and the theme picker still reads `project().theme`. The mirror just keeps types honest for S3.)

- [ ] **Step 2: Build the web app**

```bash
cd slide-studio && pnpm --filter @slide-studio/web build; cd -
```
Expected: build succeeds (no TS errors — any code reading `ProjectRecord` still compiles since the new fields are additive and required-but-present from the daemon).

> If the build errors because some web test/mock constructs a `ProjectRecord` literal without the new fields, add `decks: [], wireframeRev: 0, activeDeckId: null` to those literals.

- [ ] **Step 3: Commit**

```bash
git add slide-studio/apps/web/src/app/core/types.ts
git commit -m "feat(slide-studio): mirror deck-variant fields in the web ProjectRecord type"
```

---

## Task 7: Full regression + in-app sanity

**Files:** none (verification only)

- [ ] **Step 1: Full daemon suite + web build**

```bash
cd slide-studio
pnpm --filter @slide-studio/daemon test
pnpm --filter @slide-studio/web build
cd -
```
Expected: all daemon suites pass (incl. the new variants/register-deck/exports tests and the migrated projects tests); web builds.

- [ ] **Step 2: Confirm the S1 in-app render still works with the new model**

The S1 seeded project (`~/.slide-studio/projects/s1-smoke-c630eda0`) has a legacy `deck.html` + theme `micron-dark` → it must migrate to one variant and still render. Re-copy the fixed deck, boot the daemon, and load the workspace (reuse `tmp/s1-reverify.mjs` from S1):

```bash
cd /Users/wongjunmun/development/ai-development/jm-design
cp slide-studio/skills/html-slides/themes/micron-dark/example.html ~/.slide-studio/projects/s1-smoke-c630eda0/deck.html
( cd slide-studio/apps/daemon && SLIDE_STUDIO_NO_OPEN=1 node --experimental-strip-types bin/launch-server.mjs >/tmp/ss-daemon.log 2>&1 & echo $! > /tmp/ss-daemon.pid )
curl -sf --retry 40 --retry-all-errors --retry-delay 1 http://127.0.0.1:4317/api/health && node tmp/s1-reverify.mjs
kill "$(cat /tmp/ss-daemon.pid)" 2>/dev/null; pkill -f launch-server.mjs 2>/dev/null
```
Expected: `chromeHidden: true`, `navAdvanced: true`, `securityErrors: []` — the migrated legacy project still renders + navigates (artifact route serves its `deck.html` as before).

- [ ] **Step 3: Commit any test fixups (none expected)**

```bash
git add -A && git commit -m "test(slide-studio): S2 variant-model regression green"
```

---

## Self-review (plan author)

**Spec coverage (S2):**
- `decks: DeckVariant[]` + `wireframeRev` + `activeDeckId` → Task 1. ✓
- Migration of existing single-deck projects → Task 1 (legacy themed → one variant) + readProject defaults. ✓
- Non-destructive per-theme variant files (`deck.<theme>.html`, reuse legacy `deck.html`) → Tasks 2–4 (`deckFileForTheme`/`upsertVariant`/generate wiring). ✓
- Verify per variant → Task 4 (verify runs on the variant `deckAbs`). ✓
- `fromWireframeRev` recorded (bumping deferred to S4) → Tasks 2–3. ✓
- App keeps working (artifact route unchanged; newest variant served; exports follow active) → Tasks 4–5 + Task 7 in-app check. ✓

**Placeholder scan:** none — all steps carry real code/commands.

**Type/name consistency:** `DeckVariant` fields (`id/theme/file/fromWireframeRev/createdAt`) identical across projects.ts, the helpers, registerGeneratedDeck, exports, and the web mirror; helper names (`variantFileName`/`deckFileForTheme`/`upsertVariant`/`activeDeck`/`registerGeneratedDeck`) consistent across tasks; variant id = `slugify(theme)` everywhere (migration, upsert).

**Honest gaps:** the generate-path wiring (Task 4) has no isolated unit test (it spawns the agent) — it composes Task 2/3 helpers that ARE tested, and Task 7 confirms the assembled render. Sidecar writing is best-effort (the resolver infers kind from the name if it fails). `wireframeRev` never changes in S2 (S4 bumps it).

**Next:** S3 (files panel + variant switcher: surface `decks[]`, click-to-open sets `activeDeckId`, content route serves the chosen `entry`), then S4 (returnable wireframe + add-a-style + `wireframeRev` bump).

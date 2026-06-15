# Slide Studio S4 — Returnable wireframe + add-a-style Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax. (May instead be executed by a Workflow.)

**Goal:** Close the round-trip — let the user go back from a deck to refine the wireframe (which bumps `wireframeRev` and lights up the "wireframe changed" badge S3 already shows on older variants), and add a new style variant from the deck stage without overwriting existing ones.

**Architecture:** Daemon: `setGate2` increments `wireframeRev` when the wireframe is **re-approved** (gate2 was already `approved`) — the only new daemon logic; the stale flag (`fromWireframeRev < wireframeRev`) and its display already exist (S2/S3). Web: a "Refine wireframe" affordance posts `setGate2(request-changes)` to send the flow back to the wireframe stage (existing annotate→revise then re-approve); an "Add a style" affordance in the files panel re-opens the existing `ss-themes` picker (via an `addingStyle` override on `showThemePicker`), and picking a theme runs the existing `setTheme` + `chat.generate` path which (per S2) writes a new `deck.<theme>.html` variant non-destructively.

**Tech stack:** TS daemon via `node --experimental-strip-types` (`node:test`); Angular 22 web (`ng build`-only). Final in-app Playwright smoke.

**Scope:** S4 of `docs/superpowers/specs/2026-06-15-slide-studio-living-roundtrip-design.md` — the last slice. It reuses S2 generate (per-theme variants) + S3 files panel; it does not add new generation logic.

**Paths:** repo root `/Users/wongjunmun/development/ai-development/jm-design`. `D=slide-studio/apps/daemon`, `W=slide-studio/apps/web`. Branch `main`. Daemon tests: `cd slide-studio && pnpm --filter @slide-studio/daemon test`. Web build: `pnpm --filter @slide-studio/web build`.

**Current-state anchors (verified):**
- `setGate2` — `D/src/projects.ts:266-275` (approve → gate2 'approved' + stage 'theme'; request-changes → gate2 'pending' + stage 'wireframe').
- Stepper is display-only — `W/src/app/workspace/workspace.component.ts:25-30,57-66`; Gate 2 has `approveWireframe()` (~670) but no request-changes.
- Generate path: workspace `onThemePicked` (~694-710) → `api.setTheme` → `chat.generate(theme)` (chat.component.ts:561-572) → socket `{type:'generate'}`.
- Theme picker `ss-themes` shows when `showThemePicker()` (workspace ~430: `(stage==='theme'||'deck') && !deck() && !viewWireframe()`); its `confirm()` re-emits `themePicked` each pick.
- Stale flag computed in `D/src/files.ts:26` + shown in the files panel (S3).

---

## Task 1: `wireframeRev` bumps on wireframe re-approval (daemon)

**Files:** Modify `D/src/projects.ts`; Test `D/test/projects.test.ts`.

- [ ] **Step 1: Failing test** — append to `D/test/projects.test.ts` (uses the file's existing `withTempStore`, `createProject`, `setGate1`, `setGate2`, `readProject`):
```typescript
test('S4: re-approving the wireframe (gate2 already approved) bumps wireframeRev', async () => {
  await withTempStore(async (env) => {
    const p = await createProject({ brief: 'deck' }, env);
    await setGate1(p.id, 'approve', env);
    const first = await setGate2(p.id, 'approve', env);          // first approval
    assert.equal(first?.gate2, 'approved');
    assert.equal(first?.wireframeRev, 0);                        // no bump on first approve
    await setGate2(p.id, 'request-changes', env);                // go back to wireframe
    const second = await setGate2(p.id, 'approve', env);         // re-approve
    assert.equal(second?.wireframeRev, 1);                       // bumped
    assert.equal(second?.stage, 'theme');
    const third = await setGate2(p.id, 'approve', env);          // re-approve again (still approved)
    assert.equal(third?.wireframeRev, 2);
  });
});
```

- [ ] **Step 2: Run — expect FAIL** (`wireframeRev` stays 0).
```bash
cd slide-studio && pnpm --filter @slide-studio/daemon test test/projects.test.ts 2>&1 | grep -E "S4:|fail [0-9]"; cd -
```

- [ ] **Step 3: Implement** — replace `setGate2` in `D/src/projects.ts` with:
```typescript
export async function setGate2(
  id: string,
  action: 'approve' | 'request-changes',
  env: NodeJS.ProcessEnv = process.env,
): Promise<ProjectRecord | null> {
  if (action === 'approve') {
    const rec = await readProject(id, env);
    if (!rec) return null;
    const patch: Partial<ProjectRecord> = { gate2: 'approved', stage: 'theme' };
    // Re-approval (gate2 was already approved → the user went back and refined the
    // wireframe) bumps wireframeRev, which marks existing deck variants stale.
    if (rec.gate2 === 'approved') patch.wireframeRev = rec.wireframeRev + 1;
    return patchProject(id, patch, env);
  }
  return patchProject(id, { gate2: 'pending', stage: 'wireframe' }, env);
}
```

- [ ] **Step 4: Run — expect PASS**, then full suite green.
```bash
cd slide-studio && pnpm --filter @slide-studio/daemon test 2>&1 | grep -E "tests [0-9]|pass [0-9]|fail [0-9]"; cd -
```

- [ ] **Step 5: Commit** (SKIP under no-commit)
```bash
git add slide-studio/apps/daemon/src/projects.ts slide-studio/apps/daemon/test/projects.test.ts
git commit -m "feat(slide-studio): bump wireframeRev on wireframe re-approval (S4)"
```

---

## Task 2: "Refine wireframe" — return to the wireframe stage (web)

**Files:** Modify `W/src/app/workspace/workspace.component.ts`.

Read the file first. Find the Deck canvas section (where `@if (deck())` renders the deck bar + annotate affordances) and the Gate-2 `approveWireframe()` handler (~670). Add a backward affordance.

- [ ] **Step 1: Add the handler** (near `approveWireframe`):
```typescript
  /** S4: go back from the deck (or theme) to refine the wireframe. Loops the flow
   *  to the wireframe stage via Gate 2 request-changes; re-approving there bumps
   *  wireframeRev (marking current variants stale). */
  async refineWireframe(): Promise<void> {
    const id = this.project()?.id;
    if (!id) return;
    const updated = await this.api.setGate2(id, 'request-changes');
    if (updated) this.stage.set(updated.stage);
    this.viewWireframe.set(false);            // let the stage-driven wireframe canvas show
    await this.refreshFiles();
  }
```

- [ ] **Step 2: Add the button** in the Deck canvas header (near the deck bar / annotate row), and on the Theme stage too. In the template's deck branch (the `@if (deck())` section), add a control:
```html
<button class="mic-btn mic-btn--ghost" type="button" (click)="refineWireframe()">↩ Refine wireframe</button>
```
(Place it alongside the existing deck-bar controls; match the surrounding `mic-btn` style. If a ghost variant class doesn't exist, use the same class the existing secondary buttons use.)

- [ ] **Step 3: Build** — `cd slide-studio && pnpm --filter @slide-studio/web build 2>&1 | tail -2; cd -`. Expected: clean. (`api.setGate2` already exists; `this.stage`, `this.viewWireframe`, `this.refreshFiles` exist.)

- [ ] **Step 4: Commit** (SKIP under no-commit)
```bash
git add slide-studio/apps/web/src/app/workspace/workspace.component.ts
git commit -m "feat(slide-studio): refine-wireframe back-nav from the deck (S4)"
```

---

## Task 3: "Add a style" — new variant from the deck stage (web)

**Files:** Modify `W/src/app/files/files-panel.component.ts`, `W/src/app/workspace/workspace.component.ts`.

- [ ] **Step 1: Files panel — add the affordance.** In `files-panel.component.ts`, add an output and a button at the end of the Decks group:
```typescript
  readonly addStyle = output<void>();
```
In the template, after the `@for (d of files()?.decks …)` block inside the Decks group, add:
```html
<button class="files__item files__add" type="button" (click)="addStyle.emit()">
  <span class="files__name">+ Add a style</span>
</button>
```
Add a style rule: `.files__add { color: var(--mic-accent); justify-content: flex-start; }`

- [ ] **Step 2: Workspace — wire it.** Add an `addingStyle` signal and override `showThemePicker`, add the handler, and reset on pick.
```typescript
  /** S4: user asked to add a style — re-open the theme picker even though a deck
   *  exists, so picking a new theme generates a fresh non-destructive variant. */
  readonly addingStyle = signal(false);
```
Change `showThemePicker` to also be true while adding a style:
```typescript
  readonly showThemePicker = computed(
    () => this.addingStyle() ||
      ((this.stage() === 'theme' || this.stage() === 'deck') && !this.deck() && !this.viewWireframe()),
  );
```
Add the handler:
```typescript
  onAddStyle(): void {
    this.viewWireframe.set(false);
    this.addingStyle.set(true);   // showThemePicker now true → ss-themes renders over the deck
  }
```
In `onThemePicked` (the existing setTheme + generate handler), reset the flag at the start so the picker closes once a theme is chosen and generation begins:
```typescript
    this.addingStyle.set(false);
```
Wire the panel output in the template:
```html
<ss-files-panel … (addStyle)="onAddStyle()" />
```

- [ ] **Step 3: Build** — `cd slide-studio && pnpm --filter @slide-studio/web build 2>&1 | tail -2; cd -`. Expected: clean.

- [ ] **Step 4: Commit** (SKIP under no-commit)
```bash
git add slide-studio/apps/web/src/app/files/files-panel.component.ts slide-studio/apps/web/src/app/workspace/workspace.component.ts
git commit -m "feat(slide-studio): add-a-style affordance → new variant from the deck (S4)"
```

---

## Task 4: In-app verification (Playwright smoke)

**Files:** Create `tmp/s4-roundtrip.mjs` (throwaway, gitignored).

- [ ] **Step 1: Full suite + build.**
```bash
cd slide-studio && pnpm --filter @slide-studio/daemon test 2>&1 | grep -E "tests [0-9]|pass [0-9]|fail [0-9]" && pnpm --filter @slide-studio/web build 2>&1 | tail -1; cd -
```
Expected: daemon green; web builds.

- [ ] **Step 2: In-app smoke.** Reuse/seed the `s3-smoke` 2-variant project (or seed `s4-smoke` the same way: 2 deck variants micron-dark+playful, a wireframe.html, stage 'deck', gate1/2/3 approved, wireframeRev 0). Boot the daemon (`SLIDE_STUDIO_NO_OPEN=1 node --experimental-strip-types bin/launch-server.mjs`), then with Playwright (`tmp/s4-roundtrip.mjs`, run from repo root):
  - open the workspace; assert the files panel shows the variants with NO stale badge.
  - click **"+ Add a style"** in the panel → assert the theme picker (`.canvas--theme` / `ss-themes`) appears over the deck. Screenshot `tmp/s4-01-add-style.png`. (Do not complete generation — it needs the agent CLI; verifying the picker opens is the UI proof.)
  - click **"↩ Refine wireframe"** (first navigate back to the deck if needed) → assert the wireframe canvas (`.canvas--wf`) shows and `stage` is 'wireframe'. Screenshot `tmp/s4-02-refine.png`.
  - exercise the wireframeRev→stale path via the API directly (no agent): POST the gate2 approve twice through the running daemon (`curl -X POST …/gate2 {action:approve}` ×2, after a request-changes), then GET `…/files` and assert the existing variant now has `stale: true`. (Or drive it through the UI's approve button if reachable.)
  - tear down the daemon.

- [ ] **Step 3: Eyeball the screenshots** — the theme picker opens on "Add a style"; the wireframe canvas shows on "Refine wireframe"; the files panel marks variants stale after a re-approval. Record pass/fail.

- [ ] **Step 4: Commit** (SKIP under no-commit) — verification only.

---

## Self-review (plan author)

**Spec coverage (S4):**
- Returnable wireframe (go back from deck to refine) → Task 2 (`refineWireframe` → setGate2 request-changes → wireframe stage). ✓
- Add a style (new variant from the deck) → Task 3 (`addingStyle` override → `ss-themes` → existing setTheme+generate → S2 non-destructive variant). ✓
- `wireframeRev` bump on re-approval → Task 1; the stale badge already displays it (S3). ✓

**Placeholder scan:** none — concrete code. Task 2/3 template placements are described against verified anchors (deck branch, Gate-2 handler, `showThemePicker`, `onThemePicked`); the implementer matches the surrounding `mic-btn`/`ss-themes`/`ss-files-panel` markup.

**Type/name consistency:** `wireframeRev` / `fromWireframeRev` / `stale` consistent with S2/S3; `addingStyle`/`viewWireframe`/`showThemePicker`/`refreshFiles`/`api.setGate2`/`onThemePicked` are confirmed-existing or added here; the files-panel `addStyle` output ↔ workspace `onAddStyle` handler.

**Honest gaps:** web is `ng build`-verified + the Task 4 in-app smoke; the **actual** add-a-style generation needs the agent CLI, so the smoke verifies the picker opens (not the generated variant) — consistent with how S2's generate path is verified. The `wireframeRev→stale` path is verified via the API (no agent).

This is the final slice; with it the Slide Studio living round-trip (S1 shell parity → S2 variants → S3 files panel → S4 returnable wireframe + add-a-style) is complete.

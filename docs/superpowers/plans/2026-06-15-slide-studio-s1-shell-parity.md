# Slide Studio S1 — Shell parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Slide Studio render its decks with the new universal Slide Player shell, in an embedded "viewer" mode (chrome hidden), without breaking its existing slide navigation, annotation, or verify gate.

**Architecture:** Add an opt-in `data-embed` mode to the shell that hides all chrome (app bar, rail, notes, overlays) leaving just the stage — the shell JS still runs and exposes `window.presentation`. Sync the merged-to-main skills into Slide Studio's vendored `skills/`. In Slide Studio's deck component, mark the deck `data-embed` and **replace its hand-injected `display:none` pager with a tiny bridge** that drives the shell's `window.presentation` API — keeping the existing host↔iframe `postMessage` protocol (`ss-deck-pager` ready/total, `ss-deck-host` goto) unchanged, so the outside nav bar, slide count, and the Annotation SDK keep working.

**Tech stack:** Vanilla ES5 shell JS/CSS; Playwright (`node --test`, html-slides harness from S0); Angular 22 (web, verified by `ng build`); Node daemon (`node --test --experimental-strip-types`); `uv` for verify.py.

**Scope:** This is **S1 of 4** from the spec (`docs/superpowers/specs/2026-06-15-slide-studio-living-roundtrip-design.md`). S2 (variants), S3 (files panel), S4 (returnable wireframe) are planned separately after S1.

**Paths:** repo root `/Users/wongjunmun/development/ai-development/jm-design`. `HS=.claude/skills/html-slides`, `SS=slide-studio`. Branch: `main`.

---

## Task 1: Shell embed (viewer) mode

**Files:**
- Modify: `.claude/skills/html-slides/assets/shell.css`
- Test: `.claude/skills/html-slides/tests/embed.test.mjs` (new)

- [ ] **Step 1: Write the failing test**

Create `.claude/skills/html-slides/tests/embed.test.mjs`:

```javascript
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { buildFixtureDeck } from './helpers.mjs';

let browser, deck;
before(async () => { browser = await chromium.launch(); deck = buildFixtureDeck(); });
after(async () => { await browser.close(); });

test('data-embed hides all chrome but keeps the player + window.presentation', async () => {
  const page = await browser.newPage({ viewport: { width: 1024, height: 640 } });
  await page.goto(deck.url);
  await page.waitForFunction(() => window.presentation && window.presentation.total > 0);

  // chrome is visible by default
  assert.equal(await page.locator('.app-bar').isVisible(), true);
  assert.equal(await page.locator('.rail').isVisible(), true);

  // turn embed on
  await page.evaluate(() => document.body.setAttribute('data-embed', ''));
  assert.equal(await page.locator('.app-bar').isVisible(), false);
  assert.equal(await page.locator('.rail').isVisible(), false);
  assert.equal(await page.locator('.notes-panel').isVisible(), false);

  // the player still works via the public API
  assert.equal(await page.evaluate(() => window.presentation.total), 3);
  await page.evaluate(() => window.presentation.goTo(2));
  assert.equal(await page.evaluate(() => document.querySelectorAll('.stage > .slide.is-active').length), 1);
  const activeIsThird = await page.evaluate(() =>
    !!document.querySelector('.stage > .slide.is-active h2')?.textContent?.includes('three'));
  assert.equal(activeIsThird, true);
  await page.close();
});
```

- [ ] **Step 2: Run it — expect FAIL**

```bash
node --test .claude/skills/html-slides/tests/embed.test.mjs
```
Expected: FAIL — `.app-bar` still visible after setting `data-embed`.

- [ ] **Step 3: Add the embed CSS**

Append to `.claude/skills/html-slides/assets/shell.css`:

```css
/* ===================== EMBEDDED VIEWER MODE =====================
   Host apps (e.g. Slide Studio) set <body data-embed> to show only the slide
   stage — all chrome is hidden and navigation is driven via window.presentation.
   The shell JS still runs, so window.presentation (goTo/total/…) stays available. */
body[data-embed] .app-bar,
body[data-embed] .rail,
body[data-embed] .notes-panel,
body[data-embed] .progress-bar,
body[data-embed] .present-bar,
body[data-embed] .grid-overview,
body[data-embed] .help-overlay,
body[data-embed] .jump-input { display: none !important; }
body[data-embed] .stage-area { padding: 0; }
```

(The flex layout makes `.stage` fill once `.app-bar`/`.rail`/`.notes-panel` are `display:none`.)

- [ ] **Step 4: Run the test — expect PASS**

```bash
node --test .claude/skills/html-slides/tests/embed.test.mjs
```
Expected: `pass 1`. (`buildFixtureDeck` reshells the current shell, so the new CSS is inlined.)

- [ ] **Step 5: Reshell every theme example so the embed CSS ships in them**

```bash
cd .claude/skills/html-slides
for d in micron-dark micron-light guided-learning playful hand-drawn aurora-glass seventies-sunset; do
  python3 scripts/build-deck.py reshell "themes/$d/example.html" && echo "reshelled $d";
done
cd -
```
Expected: `reshelled <id>` for all 7.

- [ ] **Step 6: Confirm no regression in the existing shell tests**

```bash
node --test .claude/skills/html-slides/tests/*.test.mjs
```
Expected: all pass (smoke + editor + embed).

- [ ] **Step 7: Commit**

```bash
git add .claude/skills/html-slides/assets/shell.css .claude/skills/html-slides/tests/embed.test.mjs .claude/skills/html-slides/themes/*/example.html
git commit -m "feat(shell): data-embed viewer mode (hide chrome, keep window.presentation)"
```

---

## Task 2: Prove the host-bridge mechanism against the real shell

The bridge lets a host app drive the shell's `window.presentation` using the existing Slide Studio protocol. This task proves the mechanism end-to-end with Playwright (a parent page + a sandboxed iframe) **before** wiring it into the Angular component.

**Files:**
- Create: `.claude/skills/html-slides/tests/host-bridge.test.mjs`

- [ ] **Step 1: Write the failing test (it also defines the canonical bridge snippet)**

Create `.claude/skills/html-slides/tests/host-bridge.test.mjs`:

```javascript
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildFixtureDeck } from './helpers.mjs';

// CANONICAL host bridge — keep in sync with
// slide-studio/apps/web/src/app/deck/deck-bridge.snippet.ts (Task 4).
export const DECK_BRIDGE = `<script>(function(){
  function emitReady(){
    var p = window.presentation;
    if(!p){ setTimeout(emitReady, 40); return; }
    try { parent.postMessage({ source:'ss-deck-pager', type:'ready', total: p.total }, '*'); } catch(e){}
  }
  window.addEventListener('message', function(ev){
    var d = ev.data || {};
    if(d.source !== 'ss-deck-host') return;
    if(d.type === 'goto' && window.presentation){ window.presentation.goTo(d.index|0); }
  });
  if(document.readyState !== 'loading') emitReady();
  else document.addEventListener('DOMContentLoaded', emitReady);
})();</script>`;

let browser, deck;
before(async () => { browser = await chromium.launch(); deck = buildFixtureDeck(); });
after(async () => { await browser.close(); });

test('bridge reports total to the host and navigates on goto', async () => {
  // Build the embedded deck (data-embed + bridge) the way Slide Studio will.
  const embedded = deck.read()
    .replace(/<body/i, '<body data-embed')
    .replace(/<\/body>/i, `${DECK_BRIDGE}</body>`);
  const deckFile = path.join(deck.dir, 'embedded-deck.html');
  writeFileSync(deckFile, embedded);

  // A parent page that embeds it in a sandboxed iframe and speaks the protocol.
  const parentFile = path.join(deck.dir, 'host.html');
  writeFileSync(parentFile, `<!doctype html><meta charset="utf-8"><body>
    <iframe id="f" sandbox="allow-scripts" src="${pathToFileURL(deckFile).href}"></iframe>
    <script>
      window.__total = null;
      addEventListener('message', function(e){
        var d = e.data || {};
        if (d.source === 'ss-deck-pager' && d.type === 'ready') window.__total = d.total;
      });
      window.gotoSlide = function(i){
        document.getElementById('f').contentWindow.postMessage({ source:'ss-deck-host', type:'goto', index:i }, '*');
      };
    </script></body>`);

  const page = await browser.newPage();
  await page.goto(pathToFileURL(parentFile).href);
  await page.waitForFunction(() => window.__total !== null, { timeout: 8000 });
  assert.equal(await page.evaluate(() => window.__total), 3);

  await page.evaluate(() => window.gotoSlide(2));
  const frame = page.frames().find((f) => f !== page.mainFrame());
  await frame.waitForFunction(() => document.querySelectorAll('.stage > .slide.is-active').length === 1);
  const text = await frame.evaluate(() =>
    document.querySelector('.stage > .slide.is-active h2')?.textContent || '');
  assert.ok(text.includes('three'), 'goto(2) activates the third slide');
  await page.close();
});
```

- [ ] **Step 2: Run it — expect PASS**

```bash
node --test .claude/skills/html-slides/tests/host-bridge.test.mjs
```
Expected: `pass 1`. The bridge already works because Task 1 shipped `data-embed` and the shell already exposes `window.presentation`. (If the iframe's `window.presentation` is slow to appear, the bridge's `setTimeout` poll covers it.)

> If `pass`, the mechanism is proven. If `fail` on a timing flake, raise the `waitForFunction` timeout — do not change the protocol.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/html-slides/tests/host-bridge.test.mjs
git commit -m "test(shell): prove host bridge to window.presentation (embed mode)"
```

---

## Task 3: Sync the merged-to-main skills into Slide Studio

**Files:**
- Modify (regenerated, not hand-edited): `slide-studio/skills/**`

- [ ] **Step 1: Remove the stale vendored skills (the recursive copy won't delete removed-upstream files like `assets/runtime.js`)**

```bash
cd /Users/wongjunmun/development/ai-development/jm-design/slide-studio
rm -rf skills/slide-brainstorm skills/slide-consultant skills/slide-quick skills/html-slides skills/html-to-pptx skills/theme-factory skills/micron-icons skills/pptx
cd -
```

- [ ] **Step 2: Run the one-way sync**

```bash
cd /Users/wongjunmun/development/ai-development/jm-design/slide-studio
node scripts/sync-skills.mjs
cd -
```
Expected: `synced: <skill>` lines + `Done. 8/8 skills vendored …`.

- [ ] **Step 3: Verify the new shell + tooling landed in the vendored copy**

```bash
cd /Users/wongjunmun/development/ai-development/jm-design/slide-studio
test -f skills/html-slides/assets/shell.js && echo "shell.js OK"
test -f skills/html-slides/assets/shell.css && echo "shell.css OK"
grep -c "EMBEDDED VIEWER MODE" skills/html-slides/assets/shell.css
test -f skills/html-slides/scripts/deck_meta.py && echo "deck_meta OK"
! test -f skills/html-slides/assets/runtime.js && echo "stale runtime.js gone"
cd -
```
Expected: `shell.js OK`, `shell.css OK`, a count `1`, `deck_meta OK`, `stale runtime.js gone`.

- [ ] **Step 4: Commit**

```bash
git add slide-studio/skills
git commit -m "chore(slide-studio): sync skills — universal shell + editor + deck_meta"
```

---

## Task 4: Slide Studio deck component — embed + bridge (replace the injected pager)

**Files:**
- Create: `slide-studio/apps/web/src/app/deck/deck-bridge.snippet.ts`
- Modify: `slide-studio/apps/web/src/app/deck/deck.component.ts`

- [ ] **Step 1: Add the canonical bridge snippet (single source for the app)**

Create `slide-studio/apps/web/src/app/deck/deck-bridge.snippet.ts`:

```typescript
/**
 * Host bridge injected into the Deck iframe. The new universal Slide Player shell
 * (vendored skills/html-slides/assets/shell.js) renders the deck and exposes
 * `window.presentation` ({ goTo, next, prev, current, total }). This bridge keeps
 * Slide Studio's existing host protocol intact: it reports the slide count to the
 * host as `ss-deck-pager`/`ready` and navigates on `ss-deck-host`/`goto`.
 *
 * Keep in sync with the DECK_BRIDGE copy in
 * .claude/skills/html-slides/tests/host-bridge.test.mjs.
 */
export const DECK_BRIDGE = `<script>(function(){
  function emitReady(){
    var p = window.presentation;
    if(!p){ setTimeout(emitReady, 40); return; }
    try { parent.postMessage({ source:'ss-deck-pager', type:'ready', total: p.total }, '*'); } catch(e){}
  }
  window.addEventListener('message', function(ev){
    var d = ev.data || {};
    if(d.source !== 'ss-deck-host') return;
    if(d.type === 'goto' && window.presentation){ window.presentation.goTo(d.index|0); }
  });
  if(document.readyState !== 'loading') emitReady();
  else document.addEventListener('DOMContentLoaded', emitReady);
})();</script>`;
```

- [ ] **Step 2: Replace the pager with the bridge + mark the deck embedded**

In `slide-studio/apps/web/src/app/deck/deck.component.ts`:

(a) Add the import near the top (after the existing imports):

```typescript
import { DECK_BRIDGE } from './deck-bridge.snippet';
```

(b) In `load()`, replace the pager line. Change:

```typescript
    const withPager = this.injectPager(html);
    const withSdk = sdk ? this.injectSdk(withPager, sdk) : withPager;
```

to:

```typescript
    const embedded = this.markEmbed(html);
    const withBridge = this.injectBridge(embedded);
    const withSdk = sdk ? this.injectSdk(withBridge, sdk) : withBridge;
```

(c) Replace the entire `injectPager(html: string): string { … }` method (the one containing the `ss-deck-pager`/`ss-deck-host` pager script) with these two methods:

```typescript
  /** Mark the deck for the shell's embedded viewer mode (hides app bar, rail,
   *  notes, overlays — leaving just the stage). The shell still runs and exposes
   *  window.presentation, which the bridge drives. */
  private markEmbed(html: string): string {
    if (/<body[^>]*\sdata-embed/i.test(html)) return html;
    if (/<body/i.test(html)) return html.replace(/<body/i, '<body data-embed');
    return `<body data-embed>${html}`;
  }

  /** Inject the host bridge before </body>: it reports the slide count to the host
   *  (ss-deck-pager/ready) and navigates the shell's window.presentation on
   *  ss-deck-host/goto — the same protocol the old pager used, so the nav bar,
   *  slide count, and Annotation SDK surface logic are unchanged. */
  private injectBridge(html: string): string {
    if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `${DECK_BRIDGE}</body>`);
    return html + DECK_BRIDGE;
  }
```

(d) Update the class doc comment (lines ~27–29) that says "a tiny pager script is injected" to describe the bridge instead:

```typescript
 * The Deck is loaded via `srcdoc` (fetched from the daemon). It is marked
 * `data-embed` so the shell hides its chrome, and a small host **bridge** is
 * injected before `</body>` that drives the shell's `window.presentation` API
 * using the host `postMessage` protocol (`ss-deck-pager`/`ss-deck-host`).
```

(No change to `injectSdk`, `onMessage`, `show`, `prev`, `next`, the template, or the outside nav bar — the protocol is identical.)

- [ ] **Step 3: Build the web app (typecheck + bundle) — the web verification gate**

```bash
cd /Users/wongjunmun/development/ai-development/jm-design/slide-studio
pnpm --filter @slide-studio/web build
cd -
```
Expected: build succeeds (no TS errors; `injectPager` fully removed so no dead-code/unused references).

- [ ] **Step 4: Confirm the daemon suites still pass (verify + annotation unaffected)**

```bash
cd /Users/wongjunmun/development/ai-development/jm-design/slide-studio
pnpm --filter @slide-studio/daemon test
cd -
```
Expected: all daemon suites pass. (S1 changes no daemon code; `verify.ts` runs the synced `verify.py` against the clean on-disk `deck.html`, which has no embed/bridge/edit-state — those are injected only at render time.)

- [ ] **Step 5: Commit**

```bash
git add slide-studio/apps/web/src/app/deck/deck-bridge.snippet.ts slide-studio/apps/web/src/app/deck/deck.component.ts
git commit -m "feat(slide-studio): render decks via the new shell in embed mode (bridge replaces pager)"
```

---

## Task 5: S1 integration confirmation

**Files:** none (verification only)

- [ ] **Step 1: Full automated sweep**

```bash
cd /Users/wongjunmun/development/ai-development/jm-design
node --test .claude/skills/html-slides/tests/*.test.mjs
cd slide-studio && pnpm --filter @slide-studio/daemon test && pnpm --filter @slide-studio/web build; cd -
```
Expected: all html-slides Playwright tests pass (smoke, editor, embed, host-bridge); daemon suites pass; web build succeeds.

- [ ] **Step 2: Manual smoke in the running app (annotation + nav against a real new-shell deck)**

Because deck generation needs the agent CLI, confirm rendering with a hand-placed new-shell deck:

```bash
cd /Users/wongjunmun/development/ai-development/jm-design/slide-studio
pnpm --filter @slide-studio/web build
pnpm --filter @slide-studio/daemon start &   # serves http://127.0.0.1:4317
```
Then: open a project whose `deck.html` is a new-shell deck (copy `skills/html-slides/themes/micron-dark/example.html` to a project's `deck.html`). Confirm in the deck preview:
- the slide stage shows with **no inner app bar / rail** (embed mode);
- the **outside nav bar** prev/next + count work (count = total slides);
- clicking an element / selecting text queues a **deck annotation** pill (Annotation SDK still finds slides);
- "Regenerate deck" still wires up (no agent run needed to confirm the affordance).

Record the result (pass/fail with what you saw). Stop the daemon when done.

- [ ] **Step 3: Commit any notes (none expected)** — S1 is complete when Step 1 is green and Step 2 confirms embedded rendering + working nav + annotation.

---

## Self-review (plan author)

**Spec coverage (S1 portion):**
- "Sync the new skills" → Task 3. ✓
- "Embedded viewer mode (hide Edit/Save/Present + chrome)" → Task 1 (`data-embed` hides the whole app bar incl. those buttons, plus rail/notes/overlays). ✓
- "Drop Slide Studio's injected pager; shell's player drives" → Task 4 (pager replaced by bridge to `window.presentation`). ✓
- "Annotation SDK keeps working (slides stay in DOM)" → confirmed in Task 5 Step 2; the shell keeps all `.slide`s in the DOM (opacity toggling), and the SDK selector `.slide` matches. ✓
- "Verify keeps working" → Task 4 Step 4 + reasoning (on-disk deck is clean). ✓

**Placeholder scan:** none — every code/step is concrete.

**Type/name consistency:** `DECK_BRIDGE` snippet is identical in `deck-bridge.snippet.ts` (Task 4) and the test copy (Task 2), with cross-references noted in both; `markEmbed`/`injectBridge`/`injectSdk` names are consistent; the host protocol strings (`ss-deck-pager`/`ready`/`total`, `ss-deck-host`/`goto`/`index`) match the unchanged `deck.component` `onMessage`/`show`.

**Known honest gaps:** the web has no unit-test runner, so the `deck.component` edit is verified by `ng build` + the Task 5 manual smoke; the *mechanism* it relies on (embed + bridge + protocol against the real shell) is unit-tested in Task 2. The `DECK_BRIDGE` snippet is duplicated between the app and the test — kept tiny with a sync comment in both.

**Next:** S2 (variant data model), S3 (files panel), S4 (returnable wireframe) — separate plans.

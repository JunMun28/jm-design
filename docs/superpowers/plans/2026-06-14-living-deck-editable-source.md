# Living deck — editable source + restyle round-trip — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make each built HTML deck a living, in-browser-editable source (edit text, reorder/duplicate/delete slides, save back to the same file) while keeping the theme-free wireframe as a returnable content source you can regenerate any number of styled deck variants from.

**Architecture:** The editor lives **inside the universal shell** (`assets/shell.js` + `assets/shell.css`), inert until the user clicks `Edit`. Because the shell builds all chrome at runtime and moves slides into `.stage`, saving captures a **pristine authored snapshot** taken at init and re-emits only the (edited, reordered) `.slide` sections into it — never the runtime-expanded DOM. A small `deck-meta.py` helper handles non-destructive `<topic>.<theme>.html` variant naming and a `<!-- SOURCE: … -->` stamp linking each deck to its wireframe. `verify.py` gains a live-DOM edit-state safety check.

**Tech stack:** Vanilla ES5 browser JS (zero deps, matches existing shell), Python 3 stdlib (`unittest`), Playwright (`playwright@^1.60.0`, already a dep) via `node --test`, `uv` for running `verify.py`.

**Source of truth files (read before starting):**
- Spec: `docs/superpowers/specs/2026-06-14-living-deck-editable-source-design.md`
- Shell: `.claude/skills/html-slides/assets/shell.js`, `.claude/skills/html-slides/assets/shell.css`
- Build/verify: `.claude/skills/html-slides/scripts/build-deck.py`, `scripts/shell.py`, `scripts/verify.py`
- Existing (to be replaced) editor doc: `.claude/skills/html-slides/references/patterns/inline-editing.md`

All paths below are relative to the repo root `/Users/wongjunmun/development/ai-development/jm-design` unless noted. `SK=.claude/skills/html-slides`.

---

## Task 1: Test harness + fixture deck

**Files:**
- Create: `.claude/skills/html-slides/tests/fixtures/sample-deck.src.html`
- Create: `.claude/skills/html-slides/tests/helpers.mjs`
- Create: `.claude/skills/html-slides/tests/smoke.test.mjs`

- [ ] **Step 1: Write the fixture deck (a marked, theme-free 3-slide deck)**

Create `.claude/skills/html-slides/tests/fixtures/sample-deck.src.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sample Deck</title>
<!-- SHELL:CSS --><!-- /SHELL:CSS -->
<style>:root{--accent:#3b6cff;}</style>
</head>
<body>
<div class="deck" data-deck-title="Sample Deck">
  <section class="slide title-slide" data-slide-kind="cover">
    <p class="eyebrow reveal">Demo</p>
    <h1 class="reveal">Slide one title</h1>
  </section>
  <section class="slide">
    <h2 class="reveal">Slide two heading</h2>
    <p class="reveal">Body two.</p>
    <aside class="speaker-notes">Note two.</aside>
  </section>
  <section class="slide">
    <h2 class="reveal">Slide three heading</h2>
    <p class="reveal">Body three.</p>
    <aside class="speaker-notes">Note three.</aside>
  </section>
</div>
<!-- SHELL:JS --><!-- /SHELL:JS -->
</body>
</html>
```

- [ ] **Step 2: Write the test helper (builds a fresh inlined deck in a temp dir, launches chromium)**

Create `.claude/skills/html-slides/tests/helpers.mjs`:

```javascript
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
```

- [ ] **Step 3: Write a smoke test proving the harness + shell load**

Create `.claude/skills/html-slides/tests/smoke.test.mjs`:

```javascript
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { buildFixtureDeck } from './helpers.mjs';

let browser, deck;
before(async () => { browser = await chromium.launch(); deck = buildFixtureDeck(); });
after(async () => { await browser.close(); });

test('shell builds chrome and shows 3 slides', async () => {
  const page = await browser.newPage();
  await page.goto(deck.url);
  await page.waitForFunction(() => window.presentation && window.presentation.total > 0);
  assert.equal(await page.evaluate(() => window.presentation.total), 3);
  assert.equal(await page.locator('.rail-thumb').count(), 3);
  await page.close();
});
```

- [ ] **Step 4: Run the smoke test — expect PASS**

Run from repo root:
```bash
node --test .claude/skills/html-slides/tests/smoke.test.mjs
```
Expected: `pass 1`. (If `playwright` browsers are missing: `npx playwright install chromium` then re-run.)

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/html-slides/tests
git commit -m "test(html-slides): add Playwright fixture harness for the living editor"
```

---

## Task 2: Refactor shell internals (no new feature) — pristine snapshot, `buildRail()`, keyboard guard

This task makes the shell ready for the editor with **zero behavior change**. The smoke test must still pass after each step.

**Files:**
- Modify: `.claude/skills/html-slides/assets/shell.js`

- [ ] **Step 1: Capture the pristine authored snapshot at init**

In `shell.js`, immediately after the `if (!slides.length) return;` line (currently line 46), add:

```javascript
    // Authored snapshot taken BEFORE any chrome is built or slides are moved.
    // Used by the editor's save to reconstruct the authored file (ADR: living-deck).
    var PRISTINE_HTML = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
```

- [ ] **Step 2: Add `Edit` and `Save` buttons to the app bar**

In the app-bar build block, after the `var presentBtn = …` line, add:

```javascript
    var editBtn = el('button', 'shell-btn', 'Edit'); editBtn.setAttribute('aria-label', 'Toggle edit mode');
    var saveBtn = el('button', 'shell-btn', 'Save'); saveBtn.setAttribute('aria-label', 'Save edits to file'); saveBtn.style.display = 'none';
```

Then change the app-bar append line that ends `…appBar.appendChild(gridBtn);` so the order is:

```javascript
    appBar.appendChild(menuBtn); appBar.appendChild(titleEl); appBar.appendChild(counter);
    appBar.appendChild(spacer); appBar.appendChild(editBtn); appBar.appendChild(saveBtn);
    appBar.appendChild(gridBtn); appBar.appendChild(helpBtn); appBar.appendChild(presentBtn);
```

- [ ] **Step 3: Extract the rail loop into a reusable `buildRail()`**

Replace the existing thumbnail block (the `var railThumbs = []; slides.forEach(function (slide, i) { … });` loop, currently lines 139–151) with:

```javascript
    var railThumbs = [];
    function buildRail() {
      rail.innerHTML = '';
      railThumbs = [];
      slides.forEach(function (slide, i) {
        var btn = el('button', 'rail-thumb');
        btn.setAttribute('aria-label', 'Slide ' + (i + 1));
        var num = el('span', 'num'); num.textContent = (i + 1);
        var frame = el('span', 'frame');
        var mini = makeMini(slide);
        frame.appendChild(mini);
        btn.appendChild(num); btn.appendChild(frame);
        btn.addEventListener('click', function () { go(i); closeRail(); });
        rail.appendChild(btn);
        railThumbs.push({ btn: btn, frame: frame, mini: mini });
      });
    }
    buildRail();
```

(The `function rescaleThumbs() { … }` line directly below it stays unchanged.)

- [ ] **Step 4: Guard the keyboard handler against typing inside editable fields**

At the very top of the `document.addEventListener('keydown', function (e) {` body, after the existing `if (e.metaKey || e.ctrlKey || e.altKey) return;` line, add:

```javascript
      var kt = e.target;
      if (kt && (kt.isContentEditable || kt.tagName === 'INPUT' || kt.tagName === 'TEXTAREA')) {
        if (e.key === 'Escape') kt.blur();
        return;
      }
```

Then add an `e` toggle case inside the `switch (e.key) { … }` block, right after the `case 'g': case 'G': toggleGrid(); break;` line:

```javascript
        case 'e': case 'E': toggleEditMode(); break;
```

(`toggleEditMode` is a hoisted function declaration added in Task 3; referencing it here is safe.)

- [ ] **Step 5: Re-run the smoke test — expect PASS (no behavior change)**

```bash
node --test .claude/skills/html-slides/tests/smoke.test.mjs
```
Expected: `pass 1`.

- [ ] **Step 6: Commit**

```bash
git add .claude/skills/html-slides/assets/shell.js
git commit -m "refactor(shell): pristine snapshot, buildRail(), keyboard guard for editor"
```

---

## Task 3: Edit mode — toggle + inline contenteditable

**Files:**
- Modify: `.claude/skills/html-slides/assets/shell.js`
- Modify: `.claude/skills/html-slides/assets/shell.css`
- Test: `.claude/skills/html-slides/tests/editor.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `.claude/skills/html-slides/tests/editor.test.mjs`:

```javascript
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { buildFixtureDeck } from './helpers.mjs';

let browser, deck;
before(async () => { browser = await chromium.launch(); deck = buildFixtureDeck(); });
after(async () => { await browser.close(); });

async function open() {
  const page = await browser.newPage();
  await page.goto(deck.url);
  await page.waitForFunction(() => window.presentation && window.presentation.editor);
  return page;
}

test('edit mode adds contenteditable and edit-active; exit removes them', async () => {
  const page = await open();
  assert.equal(await page.evaluate(() => document.querySelectorAll('[contenteditable]').length), 0);
  await page.evaluate(() => window.presentation.editor.toggle(true));
  assert.equal(await page.evaluate(() => document.body.classList.contains('edit-active')), true);
  assert.ok(await page.evaluate(() => document.querySelectorAll('[contenteditable="true"]').length) >= 3);
  await page.evaluate(() => window.presentation.editor.toggle(false));
  assert.equal(await page.evaluate(() => document.body.classList.contains('edit-active')), false);
  assert.equal(await page.evaluate(() => document.querySelectorAll('[contenteditable]').length), 0);
  await page.close();
});
```

- [ ] **Step 2: Run it — expect FAIL**

```bash
node --test .claude/skills/html-slides/tests/editor.test.mjs
```
Expected: FAIL — `window.presentation.editor` is undefined (timeout in `waitForFunction`).

- [ ] **Step 3: Add the editor toggle + contenteditable logic**

In `shell.js`, insert this block immediately **before** the `window.presentation = {` assignment (currently line 331):

```javascript
    /* ====================== LIVING EDITOR (ADR: living-deck) ======================
       Inert until the user enters edit mode. Edits slide CONTENT and ORDER only.
       Save reconstructs the AUTHORED form from PRISTINE_HTML + the current slides,
       never the runtime-expanded DOM. */
    var EDIT_SEL = 'h1,h2,h3,h4,h5,h6,p,li,td,th,blockquote,figcaption,.eyebrow';
    var editActive = false;

    function setEditable(on) {
      slides.forEach(function (s) {
        [].forEach.call(s.querySelectorAll(EDIT_SEL), function (n) {
          if (on) n.setAttribute('contenteditable', 'true');
          else n.removeAttribute('contenteditable');
        });
      });
    }
    function toggleEditMode(force) {
      editActive = (force !== undefined) ? force : !editActive;
      document.body.classList.toggle('edit-active', editActive);
      editBtn.classList.toggle('active', editActive);
      saveBtn.style.display = editActive ? '' : 'none';
      setEditable(editActive);
      railEditUI(editActive);
      if (editActive) deck.classList.add('rail-open');
    }
    editBtn.addEventListener('click', function () { toggleEditMode(); });
```

> Note: `railEditUI` is added in Task 4. To keep this task self-contained and runnable, also add this temporary stub right after `var editActive = false;` — it is **replaced** (not duplicated) by the real implementation in Task 4:
> ```javascript
>     function railEditUI(on) {}
> ```

- [ ] **Step 4: Expose the editor on `window.presentation`**

Change the `window.presentation = { … };` object to include an `editor` member (add this property before the closing `};`):

```javascript
      editor: {
        toggle: function (f) { toggleEditMode(f); },
        get isActive() { return editActive; }
      }
```

- [ ] **Step 5: Add editor CSS**

Append to `.claude/skills/html-slides/assets/shell.css`:

```css
/* ===================== LIVING EDITOR ===================== */
.app-bar .shell-btn.active { border-color: var(--ink); color: var(--ink); }
body.edit-active [contenteditable="true"] { outline: 1px dashed var(--accent); outline-offset: 3px; border-radius: 3px; cursor: text; }
body.edit-active [contenteditable="true"]:focus { outline: 2px solid var(--accent); }
body.edit-active .reveal { transition: none !important; }
body.edit-active .rail-thumb { cursor: grab; }
.rail-thumb .thumb-tools { display: none; }
body.edit-active .rail-thumb .thumb-tools { display: flex; gap: 4px; flex: 0 0 auto; margin-left: 2px; }
.rail-thumb .thumb-tools button {
  width: 18px; height: 18px; line-height: 1; padding: 0;
  border: 1px solid var(--line); border-radius: 4px; background: var(--bg);
  color: var(--muted); font-size: 12px; cursor: pointer;
}
.rail-thumb .thumb-tools button:hover { border-color: var(--line-strong); color: var(--ink); }
@media print { body.edit-active [contenteditable] { outline: none !important; } }
```

- [ ] **Step 6: Rebuild the fixture (it re-inlines the shell automatically) and run the test — expect PASS**

```bash
node --test .claude/skills/html-slides/tests/editor.test.mjs
```
Expected: `pass 1`. (`buildFixtureDeck()` runs `reshell`, so the new shell is inlined on each run.)

- [ ] **Step 7: Commit**

```bash
git add .claude/skills/html-slides/assets/shell.js .claude/skills/html-slides/assets/shell.css .claude/skills/html-slides/tests/editor.test.mjs
git commit -m "feat(shell): edit mode toggle + inline contenteditable"
```

---

## Task 4: Structural ops — move / duplicate / delete + rail drag and buttons

**Files:**
- Modify: `.claude/skills/html-slides/assets/shell.js`
- Test: `.claude/skills/html-slides/tests/editor.test.mjs`

- [ ] **Step 1: Add the failing tests**

Append to `.claude/skills/html-slides/tests/editor.test.mjs`:

```javascript
test('move/duplicate/delete change order and count, rail stays in sync', async () => {
  const page = await open();
  const titles = () => page.evaluate(() =>
    [...document.querySelectorAll('.stage > .slide')].map(s => (s.querySelector('h1,h2') || {}).textContent || ''));

  // move slide 0 to index 2
  await page.evaluate(() => window.presentation.editor.move(0, 2));
  assert.deepEqual(await titles(), ['Slide two heading', 'Slide three heading', 'Slide one title']);
  assert.equal(await page.locator('.rail-thumb').count(), 3);

  // duplicate slide 0
  await page.evaluate(() => window.presentation.editor.duplicate(0));
  assert.equal(await page.evaluate(() => window.presentation.total), 4);
  assert.equal(await page.locator('.rail-thumb').count(), 4);

  // delete slide 0
  await page.evaluate(() => window.presentation.editor.remove(0));
  assert.equal(await page.evaluate(() => window.presentation.total), 3);

  // cannot delete below 1 slide
  await page.evaluate(() => { window.presentation.editor.remove(0); window.presentation.editor.remove(0); window.presentation.editor.remove(0); });
  assert.ok(await page.evaluate(() => window.presentation.total) >= 1);
  await page.close();
});
```

- [ ] **Step 2: Run it — expect FAIL**

```bash
node --test .claude/skills/html-slides/tests/editor.test.mjs
```
Expected: FAIL — `window.presentation.editor.move is not a function`.

- [ ] **Step 3: Replace the `railEditUI` stub with the real implementation + add structural ops + `rebuildNav`**

In `shell.js`, replace the temporary `function railEditUI(on) {}` stub with:

```javascript
    function railEditUI(on) {
      railThumbs.forEach(function (t, i) {
        t.btn.setAttribute('draggable', on ? 'true' : 'false');
        var tools = t.btn.querySelector('.thumb-tools');
        if (on && !tools) {
          tools = el('span', 'thumb-tools');
          var dup = el('button', 'thumb-dup', '+'); dup.title = 'Duplicate slide'; dup.setAttribute('aria-label', 'Duplicate slide ' + (i + 1));
          var del = el('button', 'thumb-del', '×'); del.title = 'Delete slide'; del.setAttribute('aria-label', 'Delete slide ' + (i + 1));
          dup.addEventListener('click', function (e) { e.stopPropagation(); duplicateSlide(i); });
          del.addEventListener('click', function (e) { e.stopPropagation(); deleteSlide(i); });
          tools.appendChild(dup); tools.appendChild(del);
          t.btn.appendChild(tools);
        } else if (!on && tools) {
          tools.remove();
        }
      });
    }

    function rebuildNav() {
      slides = [].slice.call(stage.querySelectorAll('.slide'));
      total = slides.length;
      buildRail();
      railEditUI(editActive);
      setEditable(editActive);
      gridThumbs = []; gridOv.innerHTML = ''; gridOv.classList.remove('open'); gridOv.setAttribute('aria-hidden', 'true');
      idx = Math.max(0, Math.min(total - 1, idx));
      go(idx, { immediate: true });
      requestAnimationFrame(rescaleThumbs);
    }

    function moveSlide(from, to) {
      if (from === to || from < 0 || to < 0 || from >= total || to >= total) return;
      var node = slides[from], ref = slides[to];
      if (from < to) stage.insertBefore(node, ref.nextSibling);
      else stage.insertBefore(node, ref);
      idx = to;
      rebuildNav();
    }
    function duplicateSlide(i) {
      if (i < 0 || i >= total) return;
      var clone = slides[i].cloneNode(true);
      clone.classList.remove('is-active', 'is-prev', 'visible');
      clone.removeAttribute('id');
      stage.insertBefore(clone, slides[i].nextSibling);
      idx = i + 1;
      rebuildNav();
    }
    function deleteSlide(i) {
      if (total <= 1 || i < 0 || i >= total) return;
      stage.removeChild(slides[i]);
      idx = Math.max(0, i - 1);
      rebuildNav();
    }

    var dragFrom = -1;
    rail.addEventListener('dragstart', function (e) {
      var btn = e.target.closest && e.target.closest('.rail-thumb');
      if (!btn || !editActive) return;
      dragFrom = railThumbs.map(function (t) { return t.btn; }).indexOf(btn);
      if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
    });
    rail.addEventListener('dragover', function (e) { if (editActive && dragFrom > -1) e.preventDefault(); });
    rail.addEventListener('drop', function (e) {
      if (!editActive || dragFrom < 0) return;
      e.preventDefault();
      var btn = e.target.closest && e.target.closest('.rail-thumb');
      if (!btn) { dragFrom = -1; return; }
      var to = railThumbs.map(function (t) { return t.btn; }).indexOf(btn);
      if (to > -1 && to !== dragFrom) moveSlide(dragFrom, to);
      dragFrom = -1;
    });
```

- [ ] **Step 4: Add the ops to the exposed `editor` object**

Extend the `editor:` member in `window.presentation` so it reads:

```javascript
      editor: {
        toggle: function (f) { toggleEditMode(f); },
        get isActive() { return editActive; },
        move: moveSlide,
        duplicate: duplicateSlide,
        remove: deleteSlide
      }
```

- [ ] **Step 5: Run the test — expect PASS**

```bash
node --test .claude/skills/html-slides/tests/editor.test.mjs
```
Expected: `pass 2`.

- [ ] **Step 6: Commit**

```bash
git add .claude/skills/html-slides/assets/shell.js .claude/skills/html-slides/tests/editor.test.mjs
git commit -m "feat(shell): slide reorder/duplicate/delete via rail + editor API"
```

---

## Task 5: Save the authored file — `serializeAuthored()` + `saveToFile()`

**Files:**
- Modify: `.claude/skills/html-slides/assets/shell.js`
- Test: `.claude/skills/html-slides/tests/editor.test.mjs`

- [ ] **Step 1: Add the failing test**

Append to `.claude/skills/html-slides/tests/editor.test.mjs`:

```javascript
test('serialize emits authored form: edits applied, no runtime junk, no chrome', async () => {
  const page = await open();
  await page.evaluate(() => {
    window.presentation.editor.toggle(true);
    const h1 = document.querySelector('.stage > .slide h1');
    h1.textContent = 'EDITED ONE';
  });
  const html = await page.evaluate(() => window.presentation.editor.serialize());

  assert.ok(html.includes('EDITED ONE'), 'edit is present');
  assert.ok(!/contenteditable/.test(html), 'no contenteditable attr');
  assert.ok(!/class="[^"]*\bis-active\b/.test(html), 'no runtime is-active class');
  assert.ok(!html.includes('app-bar'), 'no runtime app bar baked in');
  assert.ok(!html.includes('class="rail"'), 'no runtime rail baked in');
  assert.ok(html.includes('<!-- SHELL:JS -->'), 'shell markers preserved');

  // count authored slides = 3 (deck children)
  const slideCount = (html.match(/<section[^>]*class="[^"]*\bslide\b/g) || []).length;
  assert.equal(slideCount, 3);
  await page.close();
});
```

- [ ] **Step 2: Run it — expect FAIL**

```bash
node --test .claude/skills/html-slides/tests/editor.test.mjs
```
Expected: FAIL — `window.presentation.editor.serialize is not a function`.

- [ ] **Step 3: Add serialize + save logic**

In `shell.js`, add this block right after the `deleteSlide` function (before the `var dragFrom = -1;` line):

```javascript
    var fileHandle = null;
    function cleanInto(doc, slide) {
      var c = doc.importNode(slide, true);
      c.classList.remove('is-active', 'is-prev', 'visible');
      c.removeAttribute('contenteditable');
      [].forEach.call(c.querySelectorAll('[contenteditable]'), function (n) { n.removeAttribute('contenteditable'); });
      [].forEach.call(c.querySelectorAll('.reveal'), function (n) {
        n.classList.remove('visible'); n.style.transitionDelay = '';
        if (!n.getAttribute('style')) n.removeAttribute('style');
      });
      if (!c.getAttribute('style')) c.removeAttribute('style');
      if (!c.getAttribute('class')) c.removeAttribute('class');
      return c;
    }
    function serializeAuthored() {
      var doc = new DOMParser().parseFromString(PRISTINE_HTML, 'text/html');
      var pdeck = doc.querySelector('.deck');
      pdeck.innerHTML = '';
      slides.forEach(function (s) { pdeck.appendChild(cleanInto(doc, s)); });
      return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
    }
    function fileBase() { return (document.title || 'deck').replace(/\s+/g, '-').toLowerCase(); }
    function downloadHtml(html) {
      var blob = new Blob([html], { type: 'text/html' });
      var a = el('a'); a.href = URL.createObjectURL(blob); a.download = fileBase() + '.html';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    }
    function flashSave(msg) { saveBtn.textContent = msg; setTimeout(function () { saveBtn.textContent = 'Save'; }, 1400); }
    function saveToFile() {
      var html = serializeAuthored();
      if (window.showSaveFilePicker) {
        (function () {
          (async function () {
            try {
              if (!fileHandle) {
                fileHandle = await window.showSaveFilePicker({
                  suggestedName: fileBase() + '.html',
                  types: [{ description: 'HTML', accept: { 'text/html': ['.html'] } }]
                });
              }
              var w = await fileHandle.createWritable();
              await w.write(html); await w.close();
              flashSave('Saved');
            } catch (err) {
              if (err && err.name === 'AbortError') return;
              downloadHtml(html); flashSave('Downloaded');
            }
          })();
        })();
      } else {
        downloadHtml(html); flashSave('Downloaded');
      }
    }
    saveBtn.addEventListener('click', saveToFile);
```

- [ ] **Step 4: Add serialize + save to the exposed `editor` object**

Extend the `editor:` member so it reads:

```javascript
      editor: {
        toggle: function (f) { toggleEditMode(f); },
        get isActive() { return editActive; },
        move: moveSlide,
        duplicate: duplicateSlide,
        remove: deleteSlide,
        serialize: serializeAuthored,
        save: saveToFile
      }
```

- [ ] **Step 5: Run the test — expect PASS**

```bash
node --test .claude/skills/html-slides/tests/editor.test.mjs
```
Expected: `pass 3`.

- [ ] **Step 6: Round-trip check — a saved deck reopens cleanly (no double chrome)**

Add this test, then run:

```javascript
test('a serialized deck reopens with exactly one app bar and same slide count', async () => {
  const page = await open();
  const html = await page.evaluate(() => window.presentation.editor.serialize());
  await page.setContent(html, { waitUntil: 'load' });
  await page.addScriptTag({ content: '' }); // ensure scripts ran
  await page.waitForFunction(() => window.presentation && window.presentation.total > 0);
  assert.equal(await page.locator('.app-bar').count(), 1);
  assert.equal(await page.evaluate(() => window.presentation.total), 3);
  await page.close();
});
```
```bash
node --test .claude/skills/html-slides/tests/editor.test.mjs
```
Expected: `pass 4`.

> If the reopen test cannot run the inlined `<script>` via `setContent` in your Playwright version, replace it with: write `html` to a temp file and `page.goto(pathToFileURL(tmp))`. The assertion (one `.app-bar`, total 3) is the point.

- [ ] **Step 7: Commit**

```bash
git add .claude/skills/html-slides/assets/shell.js .claude/skills/html-slides/tests/editor.test.mjs
git commit -m "feat(shell): save edits back to the authored file (FS Access API + fallback)"
```

---

## Task 6: `verify.py` — live-DOM edit-state safety check + source-stamp NOTE

The edit-state check MUST run against the live DOM (Playwright eval), not source text — the editor's own JS contains the strings `contenteditable` and `edit-active`, so a text grep would false-positive.

**Files:**
- Modify: `.claude/skills/html-slides/scripts/verify.py`
- Test: `.claude/skills/html-slides/tests/test_verify_editor.py` (new)

- [ ] **Step 1: Add the live-DOM edit-state check inside the page-evaluate block**

In `verify.py`, inside the JavaScript passed to the page `evaluate(...)` block (the one that builds the `out` array of issues, ~lines 476–1117), add near the start of its checks:

```javascript
if (document.querySelectorAll('[contenteditable]').length) {
  out.push('edit-state residue: contenteditable present in delivered deck (Save must strip it)');
}
if (document.body.classList.contains('edit-active')) {
  out.push('edit-state residue: body.edit-active present in delivered deck');
}
```

(Match the existing push style — if issues are pushed as objects with a severity, follow that shape; these are hard failures, not `NOTE:`.)

- [ ] **Step 2: Add a source-stamp advisory NOTE in `check_shell_and_notes`**

In `verify.py`, inside `check_shell_and_notes(deck_src, require_shell)`, before `return errors, notes`, add:

```python
    if "<!-- SOURCE:" not in deck_src:
        notes.append("No source-link stamp (<!-- SOURCE: …-brainstorm.html · THEME: … -->); "
                     "decks generated from a wireframe should carry one (recommended, not required).")
```

- [ ] **Step 3: Write a Python test for the source-stamp NOTE (pure-text, fast)**

Create `.claude/skills/html-slides/tests/test_verify_editor.py`:

```python
import sys
import unittest
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))
import importlib
verify = importlib.import_module("verify")


class StampNoteTests(unittest.TestCase):
    def test_missing_stamp_adds_note(self):
        src = '<div class="deck"><section class="slide title-slide"><h1>x</h1></section></div>'
        errors, notes = verify.check_shell_and_notes(src, require_shell=False)
        self.assertTrue(any("source-link stamp" in n for n in notes))

    def test_present_stamp_no_note(self):
        src = ('<!-- SOURCE: docs/brainstorms/x-brainstorm.html · THEME: micron-dark -->'
               '<div class="deck"><section class="slide title-slide"><h1>x</h1></section></div>')
        errors, notes = verify.check_shell_and_notes(src, require_shell=False)
        self.assertFalse(any("source-link stamp" in n for n in notes))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 4: Run the Python test — expect PASS**

```bash
cd .claude/skills/html-slides/tests && python3 -m unittest test_verify_editor -v && cd -
```
Expected: 2 tests pass.

- [ ] **Step 5: Verify the live-DOM check end-to-end against the fixture**

```bash
cd .claude/skills/html-slides
uv run scripts/verify.py "$(node -e "import('./tests/helpers.mjs').then(m=>{const d=m.buildFixtureDeck();process.stdout.write(d.out)})")" --skip-brand --require-shell || true
cd -
```
Expected: PASS / no edit-state residue reported on a freshly built (un-edited) deck. (The fixture deck is never in edit mode at load, so the check is satisfied.)

- [ ] **Step 6: Commit**

```bash
git add .claude/skills/html-slides/scripts/verify.py .claude/skills/html-slides/tests/test_verify_editor.py
git commit -m "feat(verify): live-DOM edit-state check + source-stamp advisory"
```

---

## Task 7: `deck-meta.py` — variant naming + source stamp helper

**Files:**
- Create: `.claude/skills/html-slides/scripts/deck-meta.py`
- Test: `.claude/skills/html-slides/tests/test_deck_meta.py`

- [ ] **Step 1: Write the failing tests**

Create `.claude/skills/html-slides/tests/test_deck_meta.py`:

```python
import sys
import unittest
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))
import importlib
dm = importlib.import_module("deck-meta".replace("-", "_")) if False else importlib.import_module("deck_meta")


class DeckMetaTests(unittest.TestCase):
    def test_variant_name(self):
        self.assertEqual(dm.variant_name("AI Agents", "micron-dark"), "ai-agents.micron-dark.html")
        self.assertEqual(dm.variant_name("Q3  Review!", "playful"), "q3-review.playful.html")

    def test_stamp_inserts_after_head(self):
        html = "<!DOCTYPE html>\n<html><head><meta charset='utf-8'></head><body></body></html>"
        out = dm.stamp(html, "docs/brainstorms/x-brainstorm.html", "micron-dark", "2026-06-14")
        self.assertIn("<!-- SOURCE: docs/brainstorms/x-brainstorm.html", out)
        self.assertIn("THEME: micron-dark", out)
        self.assertEqual(out.count("<!-- SOURCE:"), 1)

    def test_stamp_is_idempotent(self):
        html = "<!DOCTYPE html>\n<html><head></head><body></body></html>"
        once = dm.stamp(html, "a.html", "playful", "2026-06-14")
        twice = dm.stamp(once, "b.html", "micron-light", "2026-06-15")
        self.assertEqual(twice.count("<!-- SOURCE:"), 1)
        self.assertIn("b.html", twice)
        self.assertIn("THEME: micron-light", twice)

    def test_read_stamp(self):
        html = dm.stamp("<html><head></head><body></body></html>", "a.html", "playful", "2026-06-14")
        meta = dm.read_stamp(html)
        self.assertEqual(meta["source"], "a.html")
        self.assertEqual(meta["theme"], "playful")

    def test_read_stamp_absent(self):
        self.assertIsNone(dm.read_stamp("<html></html>"))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run it — expect FAIL**

```bash
cd .claude/skills/html-slides/tests && python3 -m unittest test_deck_meta -v; cd -
```
Expected: FAIL — `No module named 'deck_meta'`.

> The module file is named `deck-meta.py` per repo convention, but Python imports need underscores. Create it as `deck_meta.py` and add a thin `deck-meta.py` CLI wrapper (Step 3) so both the import and the documented CLI name exist.

- [ ] **Step 3: Implement the helper**

Create `.claude/skills/html-slides/scripts/deck_meta.py`:

```python
"""Deck metadata helpers: variant filenames and the source-link stamp.

A styled deck generated from a wireframe is named <topic>.<theme>.html and
carries a single HTML comment linking it back to its wireframe:
    <!-- SOURCE: docs/brainstorms/<file>.html · THEME: <id> · GENERATED: <date> -->
"""
from __future__ import annotations

import re

_STAMP_RE = re.compile(r"<!--\s*SOURCE:.*?-->", re.DOTALL)


def slugify(text: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return s or "deck"


def variant_name(topic: str, theme: str) -> str:
    return f"{slugify(topic)}.{slugify(theme)}.html"


def stamp(html: str, source: str, theme: str, date: str) -> str:
    comment = f"<!-- SOURCE: {source} · THEME: {theme} · GENERATED: {date} -->"
    html = _STAMP_RE.sub("", html, count=1) if _STAMP_RE.search(html) else html
    if re.search(r"<head[^>]*>", html, re.IGNORECASE):
        return re.sub(r"(<head[^>]*>)", r"\1\n" + comment, html, count=1, flags=re.IGNORECASE)
    return comment + "\n" + html


def read_stamp(html: str):
    m = _STAMP_RE.search(html)
    if not m:
        return None
    text = m.group(0)
    src = re.search(r"SOURCE:\s*(.*?)\s*·", text)
    thm = re.search(r"THEME:\s*(.*?)\s*(?:·|-->)", text)
    return {"source": src.group(1) if src else "", "theme": thm.group(1) if thm else ""}


def _main(argv):
    import argparse
    p = argparse.ArgumentParser(description="Deck metadata helper.")
    sub = p.add_subparsers(dest="cmd", required=True)
    n = sub.add_parser("name"); n.add_argument("topic"); n.add_argument("theme")
    s = sub.add_parser("stamp"); s.add_argument("file"); s.add_argument("source"); s.add_argument("theme"); s.add_argument("date")
    args = p.parse_args(argv)
    if args.cmd == "name":
        print(variant_name(args.topic, args.theme))
    elif args.cmd == "stamp":
        from pathlib import Path
        path = Path(args.file)
        path.write_text(stamp(path.read_text(), args.source, args.theme, args.date))
        print(f"stamped {path}")


if __name__ == "__main__":
    import sys
    _main(sys.argv[1:])
```

Create the documented CLI alias `.claude/skills/html-slides/scripts/deck-meta.py`:

```python
import runpy, pathlib
runpy.run_path(str(pathlib.Path(__file__).with_name("deck_meta.py")), run_name="__main__")
```

- [ ] **Step 4: Run the tests — expect PASS**

```bash
cd .claude/skills/html-slides/tests && python3 -m unittest test_deck_meta -v; cd -
```
Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/html-slides/scripts/deck_meta.py .claude/skills/html-slides/scripts/deck-meta.py .claude/skills/html-slides/tests/test_deck_meta.py
git commit -m "feat(html-slides): deck-meta helper for variant names + source stamp"
```

---

## Task 8: Stamp on generation — wire `deck-meta` into `build-deck.py new`

**Files:**
- Modify: `.claude/skills/html-slides/scripts/build-deck.py`
- Test: `.claude/skills/html-slides/tests/test_build_deck_stamp.py`

- [ ] **Step 1: Write the failing test**

Create `.claude/skills/html-slides/tests/test_build_deck_stamp.py`:

```python
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SK = Path(__file__).resolve().parents[1]
BUILD = SK / "scripts" / "build-deck.py"


class BuildStampTests(unittest.TestCase):
    def test_new_with_source_and_theme_writes_stamp(self):
        with tempfile.TemporaryDirectory() as d:
            out = Path(d) / "demo.micron-dark.html"
            subprocess.run(
                [sys.executable, str(BUILD), "new", "--title", "Demo",
                 "--output", str(out), "--source", "docs/brainstorms/demo-brainstorm.html",
                 "--theme", "micron-dark"],
                check=True, cwd=str(SK), capture_output=True, text=True,
            )
            html = out.read_text()
            self.assertIn("<!-- SOURCE: docs/brainstorms/demo-brainstorm.html", html)
            self.assertIn("THEME: micron-dark", html)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run it — expect FAIL**

```bash
cd .claude/skills/html-slides/tests && python3 -m unittest test_build_deck_stamp -v; cd -
```
Expected: FAIL — `--source`/`--theme` unrecognized, or no stamp in output.

- [ ] **Step 3: Add `--source`/`--theme` to `build-deck.py new` and stamp the output**

In `build-deck.py`, in the argparse setup for the `new` subcommand, add:

```python
    new_p.add_argument("--source", default=None, help="Path to the source wireframe; recorded in a <!-- SOURCE: --> stamp.")
    new_p.add_argument("--theme", default=None, help="Theme id; recorded in the source stamp and used for the variant filename hint.")
    new_p.add_argument("--date", default=None, help="Generation date (YYYY-MM-DD) for the stamp; defaults to today.")
```

In the `new` handler, after the deck HTML is produced and before it is written to disk, add (adapt variable names to the existing code — `html` is the deck string, `args` the parsed args):

```python
    if args.source or args.theme:
        import datetime
        import importlib.util
        _spec = importlib.util.spec_from_file_location("deck_meta", str(Path(__file__).with_name("deck_meta.py")))
        _dm = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(_dm)
        _date = args.date or datetime.date.today().isoformat()
        html = _dm.stamp(html, args.source or "(unspecified)", args.theme or "(unspecified)", _date)
```

- [ ] **Step 4: Run the test — expect PASS**

```bash
cd .claude/skills/html-slides/tests && python3 -m unittest test_build_deck_stamp -v; cd -
```
Expected: 1 test passes.

- [ ] **Step 5: Confirm existing build behavior is unchanged (no flags = no stamp)**

```bash
cd .claude/skills/html-slides
python3 scripts/build-deck.py new --title "Plain" --output /tmp/plain.html && grep -c "SHELL:JS" /tmp/plain.html && ! grep -q "SOURCE:" /tmp/plain.html && echo "OK: no stamp when not requested"
cd -
```
Expected: prints a positive count and `OK: no stamp when not requested`.

- [ ] **Step 6: Commit**

```bash
git add .claude/skills/html-slides/scripts/build-deck.py .claude/skills/html-slides/tests/test_build_deck_stamp.py
git commit -m "feat(build-deck): stamp source+theme on generation (opt-in flags)"
```

---

## Task 9: Re-inline the new shell into all theme examples + full theme audit

The editor is shell-owned, so every theme example must be re-inlined and must still pass the matrix audit.

**Files:**
- Modify: `.claude/skills/html-slides/themes/*/example.html` (via `reshell`, not by hand)

- [ ] **Step 1: Reshell every stable theme example**

```bash
cd .claude/skills/html-slides
for d in micron-dark micron-light guided-learning playful hand-drawn aurora-glass seventies-sunset; do
  python3 scripts/build-deck.py reshell "themes/$d/example.html" && echo "reshelled $d";
done
cd -
```
Expected: `reshelled <id>` for all 7.

- [ ] **Step 2: Confirm shell freshness on each**

```bash
cd .claude/skills/html-slides
for d in micron-dark micron-light guided-learning playful hand-drawn aurora-glass seventies-sunset; do
  python3 scripts/build-deck.py check "themes/$d/example.html";
done
cd -
```
Expected: fresh/OK for all 7 (exit 0).

- [ ] **Step 3: Run the full theme matrix audit**

```bash
cd .claude/skills/html-slides
python3 scripts/audit-theme-matrix.py --output tmp/html-slides-audit --viewports 1280x720,375x667,1127x1084
cd -
```
Expected: all themes pass (no failures). If a theme regresses because of the new app-bar buttons (`Edit`/`Save`), the buttons are styled by existing `.shell-btn` rules and hidden `Save` — investigate that theme's app-bar overrides before proceeding; do not weaken the audit.

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/html-slides/themes
git commit -m "chore(themes): reshell all examples with the living editor in the shell"
```

---

## Task 10: Docs — replace the editor pattern, update template + SKILL.md + CONTEXT.md

**Files:**
- Replace: `.claude/skills/html-slides/references/patterns/inline-editing.md`
- Modify: `.claude/skills/html-slides/references/runtime/html-template.md`
- Modify: `.claude/skills/html-slides/SKILL.md`
- Modify: `CONTEXT.md`

- [ ] **Step 1: Replace `inline-editing.md` with the standard-editor doc**

Overwrite `.claude/skills/html-slides/references/patterns/inline-editing.md` with:

```markdown
# Living editor (standard, shell-owned)

The in-browser editor is part of the universal shell (`assets/shell.js` +
`assets/shell.css`) and ships in **every** deck. It is **inert until the user
clicks `Edit`** in the app bar (or presses `E`). Do not hand-author editor
markup in a deck — it comes from the shell via `scripts/build-deck.py`.

## What it does

- **Edit text** — in edit mode, headings, paragraphs, list items, table cells,
  blockquotes, figcaptions, and `.eyebrow` become `contenteditable`. Click and retype.
- **Reorder slides** — drag thumbnails on the Slide Rail.
- **Duplicate / delete** — `+` / `×` buttons on each rail thumbnail (edit mode only).
- **Save back to the same file** — the `Save` button writes the deck to disk via the
  File System Access API (first save asks once for the file; later saves are silent).
  Non-Chromium browsers fall back to a download you overwrite manually.

## Why save reconstructs the authored file

The shell builds all chrome (app bar, rail, stage, overlays) at runtime and moves
slides into `.stage`. Saving the live `outerHTML` would bake that chrome in and
double it on reopen. Instead, `serializeAuthored()` re-emits the edited `.slide`
sections into a **pristine snapshot** captured at load (`PRISTINE_HTML`), so the
saved file keeps the inlined shell + `<!-- SHELL:* -->` markers and stays
re-inlinable with `build-deck.py reshell`.

## API (for tests / automation)

`window.presentation.editor`: `toggle(force?)`, `isActive` (getter),
`move(from,to)`, `duplicate(i)`, `remove(i)`, `serialize()`, `save()`.

## Scope

The editor changes slide **content and order** only. Adding a brand-new slide,
restyling, or changing the deck title is a chat job (the agent edits the file).
Editing the wireframe is separate — see `slide-brainstorm`.
```

- [ ] **Step 2: Note the editor in the DOM-contract doc**

In `.claude/skills/html-slides/references/runtime/html-template.md`, add a short paragraph after the shell-markers section:

```markdown
The universal shell also ships a **living editor** (edit text, reorder/duplicate/delete,
save back to the same file), inert until the user clicks `Edit`. It is shell-owned —
authors never write editor markup. A delivered deck must contain no `contenteditable`
attribute and no `edit-active` body class; `Save` strips them, and `verify.py` fails a
deck that has the residue.
```

- [ ] **Step 3: Update `html-slides/SKILL.md` — variant naming, source stamp, layered PPTX default, editor default**

In `SKILL.md`, change the naming guidance (the line documenting kebab-case output names) to add the variant convention. Add this paragraph next to it:

```markdown
- For a deck generated from a wireframe, name the file `<topic>.<theme>.html`
  (e.g. `ai-agents.micron-dark.html`) so multiple styles of the same content
  coexist. Generating another style is non-destructive: it writes a NEW
  variant file and never overwrites an existing one — if the target exists,
  confirm with the user first. Use `scripts/deck-meta.py name "<topic>" <theme>`
  to derive the filename, and stamp the deck with its origin via
  `scripts/build-deck.py new … --source <wireframe.html> --theme <id>` (or
  `scripts/deck-meta.py stamp <deck.html> <wireframe.html> <theme> <YYYY-MM-DD>`).
  The stamp `<!-- SOURCE: …-brainstorm.html · THEME: … -->` lets you (and the
  tooling) jump back to the wireframe to refine and regenerate styles.
```

Add to the PPTX guidance (the bullet about `html-to-pptx`):

```markdown
- For this living-deck workflow, export PPTX with `--mode layered` so the handout
  `.pptx` keeps editable text boxes; name it `<topic>.<theme>.pptx`. The HTML deck
  and the PPTX are edited independently — there is no sync between them.
```

Add a short bullet under Defaults:

```markdown
- Every built deck is **directly editable in the browser** (the shell's living
  editor: `Edit` in the app bar / `E`). Edit text, reorder/duplicate/delete slides,
  and `Save` back to the same file. Content/structure changes that should apply to
  ALL styles belong in the wireframe; per-style polish is done on the deck.
```

- [ ] **Step 4: Add the new domain terms to `CONTEXT.md`**

In `CONTEXT.md`, under `## Language`, add three entries (place them near `Deck Shell` / `Slide Player`):

```markdown
**Living Deck**:
A built HTML deck treated as a durable, directly-editable source — not a frozen
output. The shell's living editor edits text and slide order in the browser and
saves back to the same file; chat handles bigger changes. Each deck stays
editable for its whole life.
_Avoid_: one-shot export, frozen deck, edit-only-by-rebuild

**Styled Deck Variant**:
One rendering of a wireframe in a specific theme, named `<topic>.<theme>.html`.
Generating another style writes a new variant file (non-destructive); variants
of the same content coexist. Each variant carries a source stamp back to its
wireframe.
_Avoid_: overwriting on restyle, single canonical deck per topic

**Source Stamp**:
The `<!-- SOURCE: …-brainstorm.html · THEME: … -->` comment a generated deck
carries, linking it to the wireframe it came from so you can go back and refine.
_Avoid_: untraceable deck, lost wireframe link
```

Add to `## Relationships`:

```markdown
- A **Living Deck** is the editable form of a built deck; the shell's editor saves
  the authored file, never the runtime DOM, so the deck stays re-inlinable.
- A **Styled Deck Variant** is generated from a wireframe + theme; the wireframe
  stays the content source you return to, and restyle is non-destructive.
- The **Source Stamp** links a **Styled Deck Variant** back to its wireframe.
```

- [ ] **Step 5: Sanity check — references resolve and verify still passes on the fixture**

```bash
cd .claude/skills/html-slides
grep -n "Living editor (standard" references/patterns/inline-editing.md
grep -n "Living Deck" ../../../CONTEXT.md
cd -
```
Expected: both grep hits found.

- [ ] **Step 6: Commit**

```bash
git add .claude/skills/html-slides/references CONTEXT.md .claude/skills/html-slides/SKILL.md
git commit -m "docs(html-slides): living editor, variant naming, source stamp, layered PPTX default"
```

---

## Task 11: `slide-brainstorm` — keep the wireframe a returnable, restyle-able source

The current wording already supports returning to the wireframe; this makes the restyle round-trip explicit and removes any "one-shot handoff" reading.

**Files:**
- Modify: `.claude/skills/slide-brainstorm/SKILL.md`

- [ ] **Step 1: Add a "wireframe is a returnable source" note to Phase 5**

In `slide-brainstorm/SKILL.md`, in the `## Phase 5 - Handoff to html-slides` section, after the paragraph beginning "There is no separate 'deck spec' to produce…", add:

```markdown
The wireframe is a **durable, returnable content source**, not a one-shot handoff.
You can come back to it any time to refine content/structure, then regenerate
styled decks from it — in the same theme or a different one. Each regeneration is
non-destructive: `html-slides` writes a new `<topic>.<theme>.html` variant and
stamps it with a `<!-- SOURCE: … -->` link back to this wireframe. Because the
wireframe is theme-free, one wireframe can drive many design styles. Content
changes that should apply to every style belong here in the wireframe; per-style
polish is done later on the styled deck (which is itself editable in the browser).
```

- [ ] **Step 2: Add a checklist line**

In the `## Final checklist before html-slides` list, add:

```markdown
- [ ] Phase 5: the wireframe is kept as the returnable content source; restyling
      regenerates a new variant (never overwrites) and stamps the source link
```

- [ ] **Step 3: Verify the edit reads cleanly**

```bash
grep -n "returnable content source" .claude/skills/slide-brainstorm/SKILL.md
```
Expected: 1–2 hits.

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/slide-brainstorm/SKILL.md
git commit -m "docs(slide-brainstorm): wireframe is a returnable, restyle-able source"
```

---

## Task 12: `html-to-pptx` — document layered default + variant output naming

**Files:**
- Modify: `.claude/skills/html-to-pptx/SKILL.md`

- [ ] **Step 1: Confirm the actual script path in this checkout**

`.agents/` was removed; the canonical copy should be under `.claude/skills/html-to-pptx/`. Confirm:

```bash
ls .claude/skills/html-to-pptx/scripts/html_to_pptx.mjs
```
Expected: the file exists. Use this path in the doc edit (not a `.agents/...` path).

- [ ] **Step 2: Add a living-deck note to `html-to-pptx/SKILL.md`**

Add near the mode documentation:

```markdown
## Living-deck workflow

When converting a deck from the living-deck pipeline, default to `--mode layered`
so the `.pptx` keeps editable text boxes, and name the output to match the deck
variant — `<topic>.<theme>.pptx` beside `<topic>.<theme>.html`:

```sh
node .claude/skills/html-to-pptx/scripts/html_to_pptx.mjs \
  ai-agents.micron-dark.html \
  --out ai-agents.micron-dark.pptx \
  --mode layered --validate
```

The HTML deck and the exported PPTX are edited **independently** — there is no
sync between them. Re-export from the HTML whenever you want a fresh PPTX.
```

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/html-to-pptx/SKILL.md
git commit -m "docs(html-to-pptx): layered default + variant naming for living-deck workflow"
```

---

## Task 13: Full regression sweep

**Files:** none (verification only)

- [ ] **Step 1: Run every automated test**

```bash
# Browser/editor tests
node --test .claude/skills/html-slides/tests/*.test.mjs
# Python tests
cd .claude/skills/html-slides/tests && python3 -m unittest discover -p "test_*.py" -v; cd -
```
Expected: all pass.

- [ ] **Step 2: Re-run the theme matrix audit**

```bash
cd .claude/skills/html-slides && python3 scripts/audit-theme-matrix.py --output tmp/html-slides-audit; cd -
```
Expected: all 7 stable themes pass.

- [ ] **Step 3: Manual browser confirmation (one theme, both modes)**

Open a reshelled example over HTTP (so the rail thumbnails load), enter edit mode, edit a heading, reorder two slides, delete one, and Save:

```bash
cd .claude/skills/html-slides && python3 -m http.server 8788 --bind 127.0.0.1 &
echo "Open http://127.0.0.1:8788/themes/micron-dark/example.html — click Edit, edit text, drag a thumbnail, Save."
```
Confirm: edits apply, Save writes a file, reopening that saved file shows the edits with exactly one app bar (no double chrome) and the slides in the new order.

- [ ] **Step 4: Manual PPTX confirmation (optional but recommended)**

Export the edited deck and confirm text boxes are editable in PowerPoint/LibreOffice:

```bash
node .claude/skills/html-to-pptx/scripts/html_to_pptx.mjs <edited-deck>.html --out /tmp/edited.pptx --mode layered --validate
```

- [ ] **Step 5: Final commit (if any audit artifacts or fixups remain)**

```bash
git add -A
git commit -m "test: full regression sweep for living-deck editor"
```

---

## Self-review (completed by plan author)

**Spec coverage:**
- Wireframe stays returnable content source → Task 11. ✓
- Non-destructive `<topic>.<theme>.html` variants → Tasks 7, 8, 10 (convention + helper + flags). ✓
- Source-link stamp → Tasks 7, 8, 10; advisory in verify → Task 6. ✓
- Living inline editor (text, reorder, duplicate/delete, save-to-file, strip-on-save) → Tasks 3, 4, 5. ✓
- Editor shell-owned + reshell upgrades + freshness gate → Tasks 2, 9. ✓
- Layered PPTX default → Tasks 10, 12. ✓
- No-sync discipline (content→wireframe, polish→deck) → docs in Tasks 10, 11. ✓
- verify.py edit-state check (live-DOM, not text grep) → Task 6. ✓
- Testing list (clean save, reorder, two-theme variants, stamp, layered, verify) → Tasks 1–9, 13. ✓
- Non-goals respected: no two-way sync, no version UI, add-new-slide is chat-only. ✓

**Edge cases encoded:** save unsupported → download fallback (Task 5); delete guarded to ≥1 slide (Task 4); edit-state never serialized (Task 5 + Task 6 safety net); reorder renumbers via `rebuildNav` (Task 4); variant non-overwrite documented (Task 10).

**Type/name consistency:** editor API names (`toggle`, `isActive`, `move`, `duplicate`, `remove`, `serialize`, `save`) are identical across Tasks 3–5 and the docs; `serializeAuthored`/`rebuildNav`/`railEditUI`/`PRISTINE_HTML` referenced consistently; the `railEditUI` stub in Task 3 is explicitly replaced (not duplicated) in Task 4; Python module imported as `deck_meta` with a `deck-meta.py` CLI alias.

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
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

test('serialize emits authored form: edits applied, no runtime junk, no chrome', async () => {
  const page = await open();
  await page.evaluate(() => {
    window.presentation.editor.toggle(true);
    const h1 = document.querySelector('.stage > .slide h1');
    h1.textContent = 'EDITED ONE';
  });
  const html = await page.evaluate(() => window.presentation.editor.serialize());

  assert.ok(html.includes('EDITED ONE'), 'edit is present');
  assert.ok(!/(?<!\[)contenteditable=/.test(html), 'no contenteditable attr');
  assert.ok(!/class="[^"]*\bis-active\b/.test(html), 'no runtime is-active class');
  assert.ok(!/<header[^>]*class="[^"]*app-bar/.test(html), 'no runtime app bar baked in');
  assert.ok(!/<nav[^>]*class="[^"]*rail/.test(html), 'no runtime rail baked in');
  assert.ok(html.includes('<!-- SHELL:JS -->'), 'shell markers preserved');

  const slideCount = (html.match(/<section[^>]*class="[^"]*\bslide\b/g) || []).length;
  assert.equal(slideCount, 3);
  await page.close();
});

test('a serialized deck reopens with exactly one app bar and same slide count', async () => {
  const page = await open();
  const html = await page.evaluate(() => window.presentation.editor.serialize());
  // Write to temp file and navigate there so the inlined script executes properly
  const tmp = join(tmpdir(), 'living-deck-reopen-' + Date.now() + '.html');
  writeFileSync(tmp, html, 'utf8');
  await page.goto(pathToFileURL(tmp).href, { waitUntil: 'load' });
  await page.waitForFunction(() => window.presentation && window.presentation.total > 0);
  assert.equal(await page.locator('.app-bar').count(), 1);
  assert.equal(await page.evaluate(() => window.presentation.total), 3);
  await page.close();
});

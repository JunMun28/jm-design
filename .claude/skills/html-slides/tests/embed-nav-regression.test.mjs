import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildFixtureDeck } from './helpers.mjs';

// Mirrors DeckComponent.markEmbed in
// slide-studio/apps/web/src/app/deck/deck.component.ts — keep in sync.
function markEmbed(html) {
  return html.replace(/<body\b([^>]*)>/i, (m, attrs) =>
    /\bdata-embed\b/.test(attrs) ? m : `<body${attrs} data-embed>`);
}

let browser, deck;
before(async () => { browser = await chromium.launch(); deck = buildFixtureDeck(); });
after(async () => { await browser.close(); });

// Regression for smoke defect 1: the embed-mode CSS comment used to contain a
// literal "<body data-embed>", so a body-matcher false-positived on prose and the
// real <body> never got the attribute. A reshelled deck must have exactly one
// real <body> tag and no <body literal hiding in shell comments/CSS.
test('a reshelled deck has exactly one <body literal (the real tag)', () => {
  const html = deck.read();
  const matches = html.match(/<body\b/gi) || [];
  assert.equal(matches.length, 1, `expected exactly one <body tag, found ${matches.length}`);
});

test('markEmbed adds data-embed to the real body of a real deck → chrome hidden', async () => {
  const f = path.join(deck.dir, 'markembed-deck.html');
  writeFileSync(f, markEmbed(deck.read()));
  const page = await browser.newPage();
  await page.goto(pathToFileURL(f).href);
  await page.waitForFunction(() => window.presentation);
  assert.equal(await page.evaluate(() => document.body.hasAttribute('data-embed')), true);
  assert.equal(await page.locator('.app-bar').isVisible(), false);
  assert.equal(await page.locator('.rail').isVisible(), false);
  await page.close();
});

// Regression for smoke defect 2: the shell's go() called history.replaceState
// unguarded, which throws SecurityError under an opaque/null origin (sandboxed
// iframe / about:srcdoc / data: URL), breaking navigation in the embedded app.
test('goTo navigates under an opaque origin without a SecurityError', async () => {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('data:text/html;charset=utf-8,' + encodeURIComponent(deck.read()));
  await page.waitForFunction(() => window.presentation && window.presentation.total > 0, { timeout: 8000 });
  assert.equal(await page.evaluate(() => location.origin), 'null'); // opaque origin
  await page.evaluate(() => window.presentation.goTo(2));
  await page.evaluate(() => window.presentation.goTo(1));
  assert.equal(await page.evaluate(() => document.querySelectorAll('.stage > .slide.is-active').length), 1);
  const active = await page.evaluate(() => {
    const s = document.querySelector('.stage > .slide.is-active');
    return s ? (s.querySelector('h1,h2')?.textContent || '') : '';
  });
  assert.ok(active.includes('two'), `goTo(1) should show slide 2, got "${active}"`);
  assert.deepEqual(errors.filter((e) => /SecurityError/.test(e)), [], `unexpected SecurityError(s): ${errors.join(' | ')}`);
  await page.close();
});

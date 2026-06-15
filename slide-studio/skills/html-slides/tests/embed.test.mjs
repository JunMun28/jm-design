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

  assert.equal(await page.locator('.app-bar').isVisible(), true);
  assert.equal(await page.locator('.rail').isVisible(), true);

  await page.evaluate(() => document.body.setAttribute('data-embed', ''));
  assert.equal(await page.locator('.app-bar').isVisible(), false);
  assert.equal(await page.locator('.rail').isVisible(), false);
  assert.equal(await page.locator('.notes-panel').isVisible(), false);

  assert.equal(await page.evaluate(() => window.presentation.total), 3);
  await page.evaluate(() => window.presentation.goTo(2));
  assert.equal(await page.evaluate(() => document.querySelectorAll('.stage > .slide.is-active').length), 1);
  const activeIsThird = await page.evaluate(() =>
    !!document.querySelector('.stage > .slide.is-active h2')?.textContent?.includes('three'));
  assert.equal(activeIsThird, true);
  await page.close();
});

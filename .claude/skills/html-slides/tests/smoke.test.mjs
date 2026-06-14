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

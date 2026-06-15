import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildFixtureDeck } from './helpers.mjs';

// CANONICAL host bridge — keep in sync with
// slide-studio/apps/web/src/app/deck/deck-bridge.snippet.ts (a later task).
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
  const embedded = deck.read()
    .replace(/<body/i, '<body data-embed')
    .replace(/<\/body>/i, `${DECK_BRIDGE}</body>`);
  const deckFile = path.join(deck.dir, 'embedded-deck.html');
  writeFileSync(deckFile, embedded);

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

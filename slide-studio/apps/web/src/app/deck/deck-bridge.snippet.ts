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

/**
 * The injected Annotation SDK (plan §10, Slice 4 / issue #11) — a self-contained
 * vanilla-JS overlay the daemon injects before `</body>` of the **sandboxed**
 * Wireframe iframe (`sandbox="allow-scripts"`, no `allow-same-origin`). It lets
 * the user:
 *   - **click an element** → annotate that element,
 *   - **select text** → annotate that text range,
 *   - **comment on the whole slide** (the toolbar "Comment on this slide" button),
 * then posts each queued Annotation to the host (`postMessage` — the only channel
 * a cross-origin sandboxed frame has). The host queues it as a composer pill.
 *
 * Because the frame runs in an opaque origin it cannot `import` the daemon's
 * `annotation.ts`, so the capture logic (selector path, node path, text-range
 * boundaries) is **inlined here and kept identical** to that module — the
 * host-side relocator reads exactly the anchors this SDK produces. Kept as an
 * exported source string (not a built asset) so it injects with zero bundling and
 * the artifact stays portable (it renders fine opened standalone; the SDK simply
 * does nothing without a host).
 *
 * The SDK works with the existing Slice-3 pager: it cooperates with the
 * `ss-wireframe-pager` / `ss-deck-pager` slide model and reports the active slide
 * index with each annotation. Messages use the `ss-annotation` channel (distinct
 * from the pager).
 *
 * Slice 12 (issue #15): the SAME SDK is injected into the **Deck** iframe so the
 * user annotates the final Deck with the identical capture logic. It listens for
 * `goto` from EITHER host channel (`ss-wireframe-host` or `ss-deck-host`) and tags
 * each queued annotation with the `surface` the host declared ('wireframe' default,
 * 'deck' when the Deck host says so) — so the daemon serializes a deck annotation
 * into a **regenerate**-scoped block instead of an in-place wireframe edit.
 */

/** The vanilla-JS SDK source, injected verbatim into the iframe. */
export const ANNOTATION_SDK_SOURCE = String.raw`(function () {
  'use strict';
  var HOSTS = ['ss-wireframe-host', 'ss-deck-host'];
  var SELF = 'ss-annotation';
  var enabled = true;
  var hovered = null;
  var activeSlide = 0;
  var surface = 'wireframe';
  var seq = 0;

  // --- capture (kept identical to apps/daemon/src/annotation.ts) ------------
  function cssEscape(v) {
    if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(v);
    return String(v).replace(/[^a-zA-Z0-9_-]/g, function (ch) { return '\\' + ch; });
  }
  function selectorFor(el) {
    if (!el || !el.tagName) return '';
    var parts = [], node = el;
    while (node && node.nodeType === 1 && parts.length < 5) {
      var part = node.tagName.toLowerCase();
      if (node.id) { part += '#' + cssEscape(node.id); parts.unshift(part); break; }
      var parent = node.parentElement;
      if (parent) {
        var tag = node.tagName;
        var same = [].slice.call(parent.children).filter(function (x) { return x.tagName === tag; });
        if (same.length > 1) part += ':nth-of-type(' + (same.indexOf(node) + 1) + ')';
      }
      parts.unshift(part);
      node = parent;
    }
    return parts.join(' > ');
  }
  function closestElement(node) {
    if (!node) return document.body;
    if (node.nodeType === 1) return node;
    return node.parentElement || document.body;
  }
  function elementText(el, max) {
    var raw = (el.textContent || '');
    return raw.trim().replace(/\s+/g, ' ').slice(0, max || 240);
  }
  function nodePath(node, root) {
    var path = [], current = node;
    while (current && current !== root) {
      var parent = current.parentNode;
      if (!parent) break;
      path.unshift([].indexOf.call(parent.childNodes, current));
      current = parent;
    }
    return path;
  }
  function boundary(node, offset) {
    var el = closestElement(node);
    return { selector: selectorFor(el), path: nodePath(node, el), offset: Number(offset) || 0 };
  }
  function commonAncestorElement(a, b) {
    var seen = {}, list = [], n;
    for (n = a; n; n = n.parentNode) { seen[list.length] = n; list.push(n); }
    for (n = b; n; n = n.parentNode) { for (var i = 0; i < list.length; i++) if (list[i] === n) return closestElement(n); }
    return document.body;
  }

  // --- slide model (cooperate with the Slice-3 pager) -----------------------
  function slides() {
    var sel = ['[data-slide]', '.slide-panel', '.slide', 'body > section'];
    for (var i = 0; i < sel.length; i++) { var nodes = document.querySelectorAll(sel[i]); if (nodes.length) return [].slice.call(nodes); }
    return [];
  }
  function slideIndexOf(el) {
    var list = slides();
    for (var i = 0; i < list.length; i++) { if (list[i] === el || list[i].contains(el)) return i; }
    return activeSlide;
  }

  // --- emit one queued annotation to the host -------------------------------
  function emit(comment, anchor, slideIndex) {
    parent.postMessage({
      source: SELF,
      type: 'queue',
      annotation: {
        id: 'a' + (++seq) + '-' + Date.now().toString(36),
        comment: String(comment || '').trim(),
        slideIndex: typeof slideIndex === 'number' ? slideIndex : activeSlide,
        anchor: anchor || null,
        surface: surface
      }
    }, '*');
  }

  // --- annotation card (Shadow DOM so artifact CSS can't restyle it) --------
  var hostEl = null, root = null;
  function ensureRoot() {
    if (root) return root;
    hostEl = document.createElement('div');
    hostEl.setAttribute('data-ss-annotation', 'ui');
    document.documentElement.appendChild(hostEl);
    root = hostEl.attachShadow ? hostEl.attachShadow({ mode: 'open' }) : hostEl;
    var style = document.createElement('style');
    style.textContent = ':host{all:initial;position:fixed;z-index:2147483647;left:0;top:0}' +
      '.card{position:fixed;width:300px;max-width:calc(100vw - 24px);padding:12px;border-radius:12px;' +
      'background:#1b1f27;color:#f3f3f0;border:1px solid #6aa0ff;box-shadow:0 18px 60px rgba(0,0,0,.4);' +
      'font:14px/1.4 system-ui,-apple-system,Segoe UI,sans-serif}' +
      '.card h4{margin:0 0 6px;font-size:13px}.card textarea{width:100%;min-height:72px;resize:vertical;' +
      'border-radius:8px;border:1px solid #3a4150;background:#11141a;color:#f3f3f0;padding:8px;font:inherit}' +
      '.row{display:flex;gap:8px;justify-content:flex-end;margin-top:8px}.card button{border:0;border-radius:8px;' +
      'padding:7px 12px;font:inherit;font-weight:600;cursor:pointer}.queue{background:#6aa0ff;color:#0b0f17}' +
      '.cancel{background:#2a2f3a;color:#f3f3f0}' +
      '.bar{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:2147483647;display:flex;gap:8px;' +
      'padding:6px;border-radius:999px;background:#1b1f27;border:1px solid #3a4150;box-shadow:0 10px 30px rgba(0,0,0,.35)}' +
      '.bar button{border:0;border-radius:999px;padding:6px 12px;font:13px/1 system-ui;cursor:pointer;background:#2a2f3a;color:#f3f3f0}' +
      '.bar button.on{background:#6aa0ff;color:#0b0f17}';
    root.appendChild(style);
    return root;
  }
  function clearCard() { if (root) [].slice.call(root.querySelectorAll('.card')).forEach(function (c) { c.remove(); }); clearHi(); }
  function showCard(rect, heading, onSubmit) {
    var r = ensureRoot(); clearCard();
    var card = document.createElement('div'); card.className = 'card';
    card.innerHTML = '<h4></h4><textarea placeholder="Tell the agent what to change..."></textarea>' +
      '<div class="row"><button class="cancel" type="button">Cancel</button><button class="queue" type="button">Queue</button></div>';
    card.querySelector('h4').textContent = heading;
    r.appendChild(card);
    var left = Math.min(Math.max(12, rect.left), window.innerWidth - 312);
    var top = Math.min(Math.max(12, rect.bottom + 8), window.innerHeight - 180);
    card.style.left = left + 'px'; card.style.top = top + 'px';
    var ta = card.querySelector('textarea');
    card.querySelector('.cancel').onclick = clearCard;
    card.querySelector('.queue').onclick = function () { var v = ta.value.trim(); if (v) onSubmit(v); clearCard(); };
    ta.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); card.querySelector('.queue').click(); }
      if (e.key === 'Escape') clearCard();
    });
    setTimeout(function () { ta.focus(); }, 0);
  }

  // --- highlight ------------------------------------------------------------
  function hi(el) { if (el && el.style) { el.style.outline = '2px solid #6aa0ff'; el.style.outlineOffset = '2px'; } }
  function clearHi() { if (hovered && hovered.style) hovered.style.outline = ''; hovered = null; }
  function isUi(el) { return !!(el && el.closest && el.closest('[data-ss-annotation]')); }

  // --- toolbar (mode toggle + per-slide comment) ----------------------------
  function buildBar() {
    var r = ensureRoot();
    var bar = document.createElement('div'); bar.className = 'bar'; bar.setAttribute('data-ss-annotation', 'bar');
    var toggle = document.createElement('button'); toggle.textContent = 'Annotate'; toggle.className = 'on';
    var slide = document.createElement('button'); slide.textContent = 'Comment on this slide';
    toggle.onclick = function () { setEnabled(!enabled); toggle.className = enabled ? 'on' : ''; };
    slide.onclick = function () {
      var rect = { left: window.innerWidth / 2 - 150, bottom: window.innerHeight - 60 };
      showCard(rect, 'Comment on slide ' + (activeSlide + 1), function (v) { emit(v, null, activeSlide); });
    };
    bar.appendChild(toggle); bar.appendChild(slide); r.appendChild(bar);
  }
  function setEnabled(on) { enabled = !!on; if (!enabled) { clearCard(); document.body.style.cursor = ''; } else { document.body.style.cursor = 'crosshair'; } }

  // --- events ---------------------------------------------------------------
  document.addEventListener('mouseover', function (e) {
    if (!enabled || isUi(e.target)) return;
    clearHi(); hovered = e.target; hi(hovered);
  }, true);
  document.addEventListener('mouseout', function () { clearHi(); }, true);

  var skipClick = false;
  document.addEventListener('mouseup', function (e) {
    if (!enabled || isUi(e.target)) return;
    var sel = document.getSelection && document.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    var range = sel.getRangeAt(0);
    var text = sel.toString().trim().replace(/\s+/g, ' ');
    if (!text) return;
    skipClick = true;
    var anchor = {
      kind: 'text-range',
      commonAncestorSelector: selectorFor(commonAncestorElement(range.startContainer, range.endContainer)),
      start: boundary(range.startContainer, range.startOffset),
      end: boundary(range.endContainer, range.endOffset),
      text: text
    };
    var rect = range.getBoundingClientRect();
    showCard(rect, 'Annotate text', function (v) { emit(v, anchor, slideIndexOf(closestElement(range.commonAncestorContainer))); });
  }, true);

  document.addEventListener('click', function (e) {
    if (!enabled || isUi(e.target)) return;
    e.preventDefault(); e.stopPropagation();
    if (skipClick) { skipClick = false; return; }
    var el = e.target;
    var anchor = { kind: 'element', selector: selectorFor(el), tag: (el.tagName || '').toLowerCase(), text: elementText(el) };
    showCard(el.getBoundingClientRect(), 'Annotate <' + anchor.tag + '>', function (v) { emit(v, anchor, slideIndexOf(el)); });
  }, true);

  // The host tells us which slide is showing (so a click reports the right index)
  // and, on the Deck, which surface this is (so the queued annotation drives a
  // regenerate). Accept either host channel (wireframe or deck).
  window.addEventListener('message', function (e) {
    var d = e.data || {};
    if (HOSTS.indexOf(d.source) === -1) return;
    if (d.source === 'ss-deck-host') surface = 'deck';
    if (typeof d.surface === 'string') surface = d.surface;
    if (d.type === 'goto' && typeof d.index === 'number') activeSlide = d.index | 0;
    if (d.type === 'annotation-mode') setEnabled(!!d.enabled);
  });

  buildBar();
  setEnabled(true);
  try { parent.postMessage({ source: SELF, type: 'ready' }, '*'); } catch (e) {}
})();`;

/** Inject the Annotation SDK before `</body>` (after the pager, if any). Kept as a
 *  small pure helper so both the daemon and the Angular host inject identically. */
export function injectAnnotationSdk(html: string): string {
  const tag = `<script>${ANNOTATION_SDK_SOURCE}</script>`;
  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `${tag}</body>`);
  return html + tag;
}

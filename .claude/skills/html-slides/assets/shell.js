/* html-slides :: shell.js — universal Slide Player runtime (theme-independent)
 *
 * INLINED into every deck between the <!-- SHELL:JS --> markers by
 * scripts/build-deck.py. Never hand-edit an inlined copy — edit this file and
 * re-inline (ADR 0005). Zero dependencies.
 *
 * The deck author writes only `.deck > .slide` sections (+ optional
 * <aside class="speaker-notes"> per slide). This runtime builds the player
 * chrome (app bar, left rail, stage, notes panel, grid overview, help, jump,
 * present bar, progress) and drives navigation. See ADR 0006.
 *
 * Keys: ← → / space / PgUp PgDn / Home End  navigate
 *       P present (fullscreen)   G grid overview   ? help   N toggle notes
 *       digits + Enter  jump to slide   Esc closes overlay / exits present
 * URL hash #/N deep-links to slide N (1-based).
 */
(function () {
  'use strict';

  var DESIGN_W = 1280, DESIGN_H = 720;

  var IC = {
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6l-6 6 6 6"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>'
  };

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  ready(function () {
    var deck = document.querySelector('.deck');
    if (!deck) return;
    var slides = [].slice.call(deck.querySelectorAll('.slide'));
    if (!slides.length) return;

    var total = slides.length;
    var idx = 0;
    var deckTitle = deck.getAttribute('data-deck-title') || document.title || 'Slides';

    var fixedStage = deck.getAttribute('data-stage') === 'fixed';
    var dcs = getComputedStyle(deck);
    if (fixedStage) {
      DESIGN_W = parseInt(dcs.getPropertyValue('--stage-w'), 10) || 1280;
      DESIGN_H = parseInt(dcs.getPropertyValue('--stage-h'), 10) || 720;
    }

    /* ---------- build chrome ---------- */
    var appBar = el('header', 'app-bar');
    var menuBtn = el('button', 'shell-btn icon menu-btn', IC.menu);
    menuBtn.setAttribute('aria-label', 'Toggle slide rail');
    var titleEl = el('span', 'deck-title'); titleEl.textContent = deckTitle;
    var counter = el('span', 'counter');
    var spacer = el('span', 'spacer');
    var gridBtn = el('button', 'shell-btn icon', IC.grid); gridBtn.setAttribute('aria-label', 'Grid overview');
    var helpBtn = el('button', 'shell-btn icon', '?'); helpBtn.setAttribute('aria-label', 'Keyboard shortcuts');
    var presentBtn = el('button', 'shell-btn primary', IC.play + '<span>Present</span>');
    appBar.appendChild(menuBtn); appBar.appendChild(titleEl); appBar.appendChild(counter);
    appBar.appendChild(spacer); appBar.appendChild(gridBtn); appBar.appendChild(helpBtn); appBar.appendChild(presentBtn);

    var rail = el('nav', 'rail'); rail.setAttribute('aria-label', 'Slides');
    var stage = el('div', 'stage');
    var stageArea = el('div', 'stage-area'); stageArea.appendChild(stage);
    var notesPanel = el('aside', 'notes-panel collapsed',
      '<div class="notes-label">Speaker notes<span class="hint">hidden when presenting</span></div><div class="notes-body"></div>');
    var notesBody = notesPanel.querySelector('.notes-body');
    var stageWrap = el('div', 'stage-wrap'); stageWrap.appendChild(stageArea); stageWrap.appendChild(notesPanel);
    var appBody = el('div', 'app-body'); appBody.appendChild(rail); appBody.appendChild(stageWrap);

    /* move slides into the stage */
    slides.forEach(function (s) { stage.appendChild(s); });
    deck.appendChild(appBar);
    deck.appendChild(appBody);

    var progress = el('div', 'progress-bar', '<span></span>');
    var progressFill = progress.querySelector('span');
    var presentBar = el('div', 'present-bar');
    var exitBtn = el('button', '', IC.x + 'Exit'); exitBtn.setAttribute('aria-label', 'Exit present mode');
    var pPrev = el('button', 'nav', IC.prev); pPrev.setAttribute('aria-label', 'Previous slide');
    var pCount = el('span', 'pcount');
    var pNext = el('button', 'nav', IC.next); pNext.setAttribute('aria-label', 'Next slide');
    var pSpacer = el('span', 'spacer');
    presentBar.appendChild(exitBtn); presentBar.appendChild(pSpacer);
    presentBar.appendChild(pPrev); presentBar.appendChild(pCount); presentBar.appendChild(pNext);

    var gridOv = el('div', 'grid-overview'); gridOv.setAttribute('aria-hidden', 'true');
    var helpOv = el('div', 'help-overlay');
    helpOv.innerHTML = '<div class="help-card"><h2>Keyboard shortcuts</h2>' +
      '<div class="help-row"><span>Next / previous</span><span><kbd>→</kbd> <kbd>←</kbd> <kbd>Space</kbd></span></div>' +
      '<div class="help-row"><span>First / last</span><span><kbd>Home</kbd> <kbd>End</kbd></span></div>' +
      '<div class="help-row"><span>Jump to slide</span><span><kbd>1</kbd>…<kbd>9</kbd> <kbd>Enter</kbd></span></div>' +
      '<div class="help-row"><span>Present (fullscreen)</span><span><kbd>P</kbd></span></div>' +
      '<div class="help-row"><span>Grid overview</span><span><kbd>G</kbd></span></div>' +
      '<div class="help-row"><span>Toggle notes</span><span><kbd>N</kbd></span></div>' +
      '<div class="help-row"><span>Help / close</span><span><kbd>?</kbd> <kbd>Esc</kbd></span></div></div>';
    var jump = el('div', 'jump-input', '<span class="lbl">Go to</span><input type="text" inputmode="numeric" aria-label="Jump to slide number">');
    var jumpField = jump.querySelector('input');

    document.body.appendChild(progress);
    document.body.appendChild(presentBar);
    document.body.appendChild(gridOv);
    document.body.appendChild(helpOv);
    document.body.appendChild(jump);

    /* ---------- thumbnails ---------- */
    function makeMini(slide) {
      var mini = el('div', 'mini');
      mini.setAttribute('aria-hidden', 'true');
      mini.style.width = DESIGN_W + 'px';
      mini.style.height = DESIGN_H + 'px';
      var clone = slide.cloneNode(true);
      clone.removeAttribute('id');
      clone.classList.add('is-active');
      clone.style.opacity = '1';
      clone.style.transform = 'none';
      clone.style.transition = 'none';
      [].forEach.call(clone.querySelectorAll('.reveal,[data-anim]'), function (n) {
        n.style.opacity = '1'; n.style.transform = 'none'; n.classList.add('visible');
      });
      mini.appendChild(clone);
      return mini;
    }
    function scaleMini(frame, mini) {
      var w = frame.clientWidth;
      if (w) mini.style.transform = 'scale(' + (w / DESIGN_W) + ')';
    }

    var railThumbs = [];
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
    function rescaleThumbs() { railThumbs.forEach(function (t) { scaleMini(t.frame, t.mini); }); }

    /* fixed-canvas stage: scale the design-size stage to fit the area/viewport */
    function fitStage() {
      if (!fixedStage) return;
      var aw = stageArea.clientWidth, ah = stageArea.clientHeight;
      var sw = stage.offsetWidth || DESIGN_W, sh = stage.offsetHeight || DESIGN_H;
      if (aw && ah && sw && sh) stage.style.setProperty('--stage-scale', Math.min(aw / sw, ah / sh));
    }

    /* ---------- grid overview ---------- */
    var gridThumbs = [];
    function buildGrid() {
      gridOv.innerHTML = '';
      gridThumbs = [];
      slides.forEach(function (slide, i) {
        var cell = el('button', 'gthumb');
        cell.setAttribute('aria-label', 'Slide ' + (i + 1));
        var mini = makeMini(slide);
        var badge = el('span', 'badge'); badge.textContent = (i + 1);
        cell.appendChild(mini); cell.appendChild(badge);
        cell.addEventListener('click', function () { go(i); toggleGrid(false); });
        gridOv.appendChild(cell);
        gridThumbs.push({ frame: cell, mini: mini });
      });
    }
    function rescaleGrid() { gridThumbs.forEach(function (t) { scaleMini(t.frame, t.mini); }); }

    /* ---------- navigation ---------- */
    function go(n, opts) {
      opts = opts || {};
      n = Math.max(0, Math.min(total - 1, n));
      slides.forEach(function (s, i) {
        if (opts.immediate) s.style.transition = 'none';
        s.classList.toggle('is-active', i === n);
        s.classList.toggle('is-prev', i < n);
        // also toggle `visible` on the active slide so themes using the
        // `.slide.visible .reveal` contract (June-12 micron themes) animate too.
        s.classList.toggle('visible', i === n);
        if (opts.immediate) { void s.offsetWidth; s.style.transition = ''; }
      });
      idx = n;
      counter.textContent = (n + 1) + ' / ' + total;
      pCount.textContent = (n + 1) + ' / ' + total;
      progressFill.style.width = ((n + 1) / total * 100) + '%';
      railThumbs.forEach(function (t, i) {
        t.btn.classList.toggle('is-active', i === n);
        if (i === n) t.btn.scrollIntoView({ block: 'nearest' });
      });
      if (gridThumbs.length) gridThumbs.forEach(function (t, i) { t.frame.classList.toggle('is-active', i === n); });
      var note = slides[n].querySelector('.speaker-notes, aside.notes, .notes');
      notesBody.innerHTML = note ? note.innerHTML : '';
      revealIn(slides[n]);
      var hash = '#/' + (n + 1);
      if (location.hash !== hash) history.replaceState(null, '', hash);
    }
    function revealIn(slide) {
      [].forEach.call(slide.querySelectorAll('.reveal'), function (n, i) {
        n.classList.remove('visible'); void n.offsetWidth;
        n.style.transitionDelay = (i * 60) + 'ms';
        n.classList.add('visible');
      });
    }

    /* ---------- present mode ---------- */
    var barTimer = null;
    function showBar() {
      deck.classList.add('bar-show');
      if (barTimer) clearTimeout(barTimer);
      barTimer = setTimeout(function () { deck.classList.remove('bar-show'); }, 2200);
    }
    function enterPresent() {
      deck.classList.add('presenting');
      showBar();
      var elx = document.documentElement;
      if (elx.requestFullscreen) elx.requestFullscreen().catch(function () {});
      requestAnimationFrame(function () { fitStage(); go(idx, { immediate: true }); });
    }
    function exitPresent() {
      deck.classList.remove('presenting', 'bar-show');
      if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(function () {});
      requestAnimationFrame(fitStage);
    }
    function togglePresent() { deck.classList.contains('presenting') ? exitPresent() : enterPresent(); }
    document.addEventListener('fullscreenchange', function () {
      if (!document.fullscreenElement) deck.classList.remove('presenting', 'bar-show');
    });

    /* ---------- overlays ---------- */
    function toggleGrid(force) {
      var open = force !== undefined ? force : !gridOv.classList.contains('open');
      if (open && !gridThumbs.length) buildGrid();
      gridOv.classList.toggle('open', open);
      gridOv.setAttribute('aria-hidden', open ? 'false' : 'true');
      if (open) requestAnimationFrame(rescaleGrid);
    }
    function toggleHelp(force) {
      helpOv.classList.toggle('open', force !== undefined ? force : !helpOv.classList.contains('open'));
    }
    function toggleNotes(force) {
      notesPanel.classList.toggle('collapsed', force !== undefined ? !force : !notesPanel.classList.contains('collapsed'));
    }
    function closeRail() { deck.classList.remove('rail-open'); }
    function anyOverlayOpen() { return gridOv.classList.contains('open') || helpOv.classList.contains('open') || jump.classList.contains('open'); }

    /* ---------- jump to slide ---------- */
    var jumpBuf = '';
    function openJump(first) {
      jumpBuf = first || '';
      jumpField.value = jumpBuf;
      jump.classList.add('open');
      jumpField.focus();
    }
    function closeJump() { jump.classList.remove('open'); jumpBuf = ''; }
    jumpField.addEventListener('keydown', function (e) {
      e.stopPropagation();
      if (e.key === 'Enter') { var n = parseInt(jumpField.value, 10); if (n >= 1) go(n - 1); closeJump(); }
      else if (e.key === 'Escape') closeJump();
    });

    /* ---------- buttons ---------- */
    presentBtn.addEventListener('click', enterPresent);
    exitBtn.addEventListener('click', exitPresent);
    pPrev.addEventListener('click', function () { go(idx - 1); showBar(); });
    pNext.addEventListener('click', function () { go(idx + 1); showBar(); });
    gridBtn.addEventListener('click', function () { toggleGrid(); });
    helpBtn.addEventListener('click', function () { toggleHelp(); });
    menuBtn.addEventListener('click', function () { deck.classList.toggle('rail-open'); });

    /* ---------- keyboard ---------- */
    document.addEventListener('keydown', function (e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (jump.classList.contains('open')) return;
      if (/^[0-9]$/.test(e.key)) { openJump(e.key); return; }
      switch (e.key) {
        case 'ArrowRight': case 'ArrowDown': case ' ': case 'PageDown': go(idx + 1); showBar(); e.preventDefault(); break;
        case 'ArrowLeft': case 'ArrowUp': case 'PageUp': go(idx - 1); showBar(); e.preventDefault(); break;
        case 'Home': go(0); break;
        case 'End': go(total - 1); break;
        case 'p': case 'P': togglePresent(); break;
        case 'g': case 'G': toggleGrid(); break;
        case 'n': case 'N': toggleNotes(); break;
        case '?': toggleHelp(); break;
        case 'Escape':
          if (jump.classList.contains('open')) closeJump();
          else if (helpOv.classList.contains('open')) toggleHelp(false);
          else if (gridOv.classList.contains('open')) toggleGrid(false);
          else if (deck.classList.contains('presenting')) exitPresent();
          break;
      }
    });

    /* ---------- pointer: present-bar wake + touch swipe ---------- */
    document.addEventListener('mousemove', function () { if (deck.classList.contains('presenting')) showBar(); });
    var tx = 0, ty = 0;
    stage.addEventListener('touchstart', function (e) { tx = e.changedTouches[0].clientX; ty = e.changedTouches[0].clientY; }, { passive: true });
    stage.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(idx + (dx < 0 ? 1 : -1));
    }, { passive: true });

    /* ---------- hash deep-link ---------- */
    function fromHash() {
      var m = /^#\/(\d+)/.exec(location.hash || '');
      if (m) { var n = parseInt(m[1], 10) - 1; if (n >= 0 && n < total) idx = n; }
    }
    window.addEventListener('hashchange', function () { fromHash(); go(idx); });

    /* ---------- resize ---------- */
    var rzTimer = null;
    window.addEventListener('resize', function () {
      if (rzTimer) clearTimeout(rzTimer);
      rzTimer = setTimeout(function () { fitStage(); rescaleThumbs(); if (gridOv.classList.contains('open')) rescaleGrid(); }, 120);
    });

    /* ---------- init ---------- */
    fromHash();
    requestAnimationFrame(function () { fitStage(); rescaleThumbs(); go(idx, { immediate: true }); });

    window.presentation = {
      goTo: function (n, opts) { go(n, opts); },
      next: function () { go(idx + 1); },
      prev: function () { go(idx - 1); },
      present: enterPresent,
      get current() { return idx; },
      get total() { return total; }
    };
  });
})();

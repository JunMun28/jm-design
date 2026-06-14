/**
 * Deck Annotation SDK suite (Slice 12 / issue #15). The SAME injected SDK serves
 * BOTH the Wireframe and the Deck iframes. This suite proves the SDK:
 *
 *   1. Source contract — listens on EITHER host channel (`ss-wireframe-host` /
 *      `ss-deck-host`), tags each queued annotation with a `surface`, and the
 *      injection helper places it before `</body>`.
 *   2. Behavior under jsdom — when the **deck** host drives it, a captured element
 *      click emits `surface: 'deck'` (→ a regenerate); when the **wireframe** host
 *      drives it, the same click emits `surface: 'wireframe'` (→ an in-place edit).
 *      The captured anchor (selector + text) is identical either way.
 *
 * Exercised under jsdom — load the SDK into the window, drive a host message +
 * click, and read the `postMessage` the SDK fires to its parent. No browser.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { ANNOTATION_SDK_SOURCE, injectAnnotationSdk } from '../src/annotation-sdk.ts';

// --- 1. Source contract ----------------------------------------------------

test('the SDK listens on BOTH host channels and tags a surface', () => {
  assert.match(ANNOTATION_SDK_SOURCE, /ss-wireframe-host/);
  assert.match(ANNOTATION_SDK_SOURCE, /ss-deck-host/);
  // The queued annotation carries a `surface` field.
  assert.match(ANNOTATION_SDK_SOURCE, /surface: surface/);
  // The deck host flips the surface to 'deck'.
  assert.match(ANNOTATION_SDK_SOURCE, /surface = 'deck'/);
});

test('injectAnnotationSdk places the SDK before </body>', () => {
  const out = injectAnnotationSdk('<html><body><h1>Hi</h1></body></html>');
  assert.match(out, /<script>[\s\S]*<\/script><\/body>/);
  assert.ok(out.indexOf('<script>') < out.indexOf('</body>'));
});

// --- 2. Behavior under jsdom ----------------------------------------------

/**
 * Load the SDK into a fresh jsdom window with the given slide markup, drive one
 * host message (declaring the surface) then a click on the target, and resolve
 * the queued-annotation message the SDK posts to its parent.
 */
function captureClickAnnotation(opts: {
  hostSource: 'ss-wireframe-host' | 'ss-deck-host';
  surface?: string;
  targetSelector: string;
}): Promise<{ surface?: string; anchor: { kind: string; selector: string; text: string } }> {
  return new Promise((resolve, reject) => {
    const dom = new JSDOM(
      `<!doctype html><html><body>
         <section data-slide><h1 id="cover">Q3 yield review</h1></section>
       </body></html>`,
      { runScripts: 'outside-only', pretendToBeVisual: true },
    );
    const { window } = dom;
    const timeout = setTimeout(() => reject(new Error('the SDK did not queue an annotation')), 1000);
    // The SDK posts to `parent`; in jsdom parent === window. postMessage is async,
    // so resolve from the listener when the `queue` frame arrives (not synchronously
    // after the click). Skip the initial `ready` + the echoed host `goto`.
    window.addEventListener('message', (ev: MessageEvent) => {
      const d = ev.data as
        | { source?: string; type?: string; annotation?: { surface?: string; anchor: { kind: string; selector: string; text: string } } }
        | null;
      if (d && d.source === 'ss-annotation' && d.type === 'queue' && d.annotation) {
        clearTimeout(timeout);
        resolve(d.annotation);
      }
    });

    // Run the SDK source inside the window.
    window.eval(ANNOTATION_SDK_SOURCE);

    // The SDK opens a comment card on click and emits on Queue. Drive it:
    //  1. host declares the active slide + surface,
    //  2. click the target → the card appears in the SDK's shadow root,
    //  3. type into the textarea + click Queue → the SDK posts the annotation.
    window.postMessage({ source: opts.hostSource, type: 'goto', index: 0, surface: opts.surface }, '*');

    setTimeout(() => {
      try {
        const target = window.document.querySelector(opts.targetSelector) as HTMLElement;
        target.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));

        // The card lives in the SDK host element's shadow root.
        const hostEl = window.document.querySelector('[data-ss-annotation="ui"]') as HTMLElement & {
          shadowRoot?: ShadowRoot;
        };
        const root = hostEl?.shadowRoot ?? (hostEl as unknown as ShadowRoot);
        const textarea = root.querySelector('textarea') as HTMLTextAreaElement;
        const queueBtn = root.querySelector('.queue') as HTMLButtonElement;
        assert.ok(textarea && queueBtn, 'the SDK must render a comment card on click');
        textarea.value = 'Tighten the cover headline';
        queueBtn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
        // The queued annotation arrives asynchronously at the message listener above.
      } catch (err) {
        clearTimeout(timeout);
        reject(err as Error);
      }
    }, 10);
  });
}

test('a DECK-host click emits an annotation tagged surface: "deck"', async () => {
  const ann = await captureClickAnnotation({
    hostSource: 'ss-deck-host',
    surface: 'deck',
    targetSelector: '#cover',
  });
  assert.equal(ann.surface, 'deck');
  assert.equal(ann.anchor.kind, 'element');
  assert.equal(ann.anchor.selector, 'h1#cover');
  assert.equal(ann.anchor.text, 'Q3 yield review');
});

test('a WIREFRAME-host click emits the same anchor tagged surface: "wireframe"', async () => {
  const ann = await captureClickAnnotation({
    hostSource: 'ss-wireframe-host',
    surface: 'wireframe',
    targetSelector: '#cover',
  });
  assert.equal(ann.surface, 'wireframe');
  // Identical capture — only the surface tag differs.
  assert.equal(ann.anchor.selector, 'h1#cover');
  assert.equal(ann.anchor.text, 'Q3 yield review');
});

test('the deck host alone (no explicit surface field) still tags "deck"', async () => {
  // The host channel itself signals the surface — the Deck pager posts on
  // ss-deck-host, so even without an explicit `surface` field the SDK tags 'deck'.
  const ann = await captureClickAnnotation({
    hostSource: 'ss-deck-host',
    targetSelector: '#cover',
  });
  assert.equal(ann.surface, 'deck');
});

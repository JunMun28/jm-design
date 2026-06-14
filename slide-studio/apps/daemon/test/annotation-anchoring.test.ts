/**
 * Annotation Anchoring suite (Slice 4 / issue #11, AC4). The hardest-to-rebuild
 * asset (plan AD-6): an Annotation pinned to an element or a text range must
 * **survive a small edit elsewhere** on the slide and still **relocate** to the
 * right node. Exercised under jsdom — capture an anchor, mutate the DOM, relocate.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import {
  captureElementAnchor,
  captureTextRange,
  relocateElement,
  relocateTextRange,
  selectorFor,
  nodePath,
  nodeFromPath,
} from '../src/annotation.ts';

function dom(html: string): Document {
  return new JSDOM(`<!doctype html><html><body>${html}</body></html>`).window.document;
}

// --- selector path --------------------------------------------------------

test('selectorFor prefers an id and short-circuits the path', () => {
  const doc = dom('<div><section id="hero"><h1>Title</h1></section></div>');
  const h1 = doc.querySelector('h1')!;
  // id on the ancestor short-circuits: nothing above #hero is needed.
  assert.equal(selectorFor(doc.querySelector('#hero')!), 'section#hero');
  assert.equal(selectorFor(h1), 'section#hero > h1');
});

test('selectorFor disambiguates same-tag siblings with :nth-of-type', () => {
  const doc = dom('<ul><li>a</li><li>b</li><li>c</li></ul>');
  const items = doc.querySelectorAll('li');
  assert.equal(selectorFor(items[1]), 'html > body > ul > li:nth-of-type(2)');
  assert.equal(selectorFor(items[2]), 'html > body > ul > li:nth-of-type(3)');
});

test('selectorFor caps the path at 5 levels', () => {
  const doc = dom('<div><div><div><div><div><div><span>deep</span></div></div></div></div></div></div>');
  const span = doc.querySelector('span')!;
  const sel = selectorFor(span);
  assert.equal(sel.split(' > ').length, 5);
  assert.ok(sel.endsWith('span'));
});

// --- element anchor: capture → mutate → relocate --------------------------

test('element anchor relocates by selector after an UNRELATED edit', () => {
  const doc = dom('<main><h1 id="t">Quarterly results</h1><p>Body copy.</p></main>');
  const h1 = doc.querySelector('#t')!;
  const anchor = captureElementAnchor(h1);
  assert.equal(anchor.kind, 'element');
  assert.equal(anchor.selector, 'h1#t');
  assert.equal(anchor.text, 'Quarterly results');

  // Mutate elsewhere: rewrite the paragraph (unrelated to the anchored heading).
  doc.querySelector('p')!.textContent = 'Completely different body copy now.';

  const found = relocateElement(anchor, doc);
  assert.ok(found, 'anchor must relocate');
  assert.equal(found, h1);
  assert.equal((found as HTMLElement).textContent, 'Quarterly results');
});

test('element anchor relocates by TEXT when the selector drifts (sibling inserted)', () => {
  const doc = dom('<section><p>First</p><p>Target paragraph</p></section>');
  const target = doc.querySelectorAll('p')[1]!;
  const anchor = captureElementAnchor(target);
  // The captured selector pins the 2nd <p> (full path from the document root).
  assert.equal(anchor.selector, 'html > body > section > p:nth-of-type(2)');

  // Insert a <p> at the FRONT — now the selector ':nth-of-type(2)' points at the
  // wrong node, but the text-content fallback still finds the original target.
  const inserted = doc.createElement('p');
  inserted.textContent = 'Brand-new intro';
  doc.querySelector('section')!.insertBefore(inserted, doc.querySelector('p'));

  // Sanity: the selector now resolves to a DIFFERENT node than the target.
  assert.notEqual(doc.querySelector(anchor.selector), target);

  const found = relocateElement(anchor, doc);
  assert.equal(found, target, 'text fallback must recover the original target');
});

test('element anchor returns null when the target is truly gone', () => {
  const doc = dom('<div><span>Removable</span></div>');
  const span = doc.querySelector('span')!;
  const anchor = captureElementAnchor(span);
  span.remove();
  assert.equal(relocateElement(anchor, doc), null);
});

// --- text-range anchor: capture → mutate → relocate -----------------------

test('nodePath / nodeFromPath round-trip to a text node', () => {
  const doc = dom('<article><p>alpha</p><p>beta <b>gamma</b></p></article>');
  const b = doc.querySelector('b')!;
  const textNode = b.firstChild!; // "gamma"
  const article = doc.querySelector('article')!;
  const path = nodePath(textNode, article);
  assert.deepEqual(nodeFromPath(article, path), textNode);
});

test('text-range anchor captures common ancestor + boundaries and relocates', () => {
  const doc = dom('<div id="slide"><p>The yield was <em>92 percent</em> last quarter.</p></div>');
  const em = doc.querySelector('em')!;
  const textNode = em.firstChild!; // "92 percent"

  // Capture a selection over "92 percent" (offsets within the <em> text node).
  const anchor = captureTextRange(
    { node: textNode, offset: 0 },
    { node: textNode, offset: 10 },
    '92 percent',
    doc,
  )!;
  assert.ok(anchor, 'text-range capture must succeed');
  assert.equal(anchor.kind, 'text-range');
  assert.equal(anchor.text, '92 percent');
  // Common ancestor of the two boundaries is the <em>; its selector short-circuits
  // at the id'd slide ancestor (div#slide).
  assert.equal(anchor.commonAncestorSelector, 'div#slide > p > em');

  // Mutate elsewhere on the slide: change the surrounding sentence words.
  const p = doc.querySelector('p')!;
  p.insertBefore(doc.createTextNode('Note: '), p.firstChild);

  const located = relocateTextRange(anchor, doc);
  assert.ok(located, 'text-range must relocate after the edit');
  assert.equal((located!.startNode.textContent ?? '').slice(located!.startOffset, located!.endOffset), '92 percent');
});

test('text-range anchor clamps offsets when the anchored text was shortened', () => {
  const doc = dom('<p><span>Hello wonderful world</span></p>');
  const span = doc.querySelector('span')!;
  const textNode = span.firstChild!;
  const anchor = captureTextRange(
    { node: textNode, offset: 6 },
    { node: textNode, offset: 21 },
    'wonderful world',
    doc,
  )!;

  // The agent shortened the text — the old end offset (21) now exceeds length.
  span.textContent = 'Hello world';
  const located = relocateTextRange(anchor, doc);
  assert.ok(located, 'relocate must not throw on a shortened node');
  // Offsets are clamped into range (no crash, a valid — if shifted — range).
  const len = (located!.endNode.textContent ?? '').length;
  assert.ok(located!.endOffset <= len);
  assert.ok(located!.startOffset <= located!.endOffset);
});

test('captureTextRange rejects an empty selection', () => {
  const doc = dom('<p>text</p>');
  const tn = doc.querySelector('p')!.firstChild!;
  assert.equal(captureTextRange({ node: tn, offset: 0 }, { node: tn, offset: 0 }, '   ', doc), null);
});

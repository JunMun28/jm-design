/**
 * Annotation Serializer suite (Slice 4 / issue #11, AC4). Queued annotations
 * serialize into the structured `<attached-preview-comments>` block the agent
 * reads — anchors, slide index, screenshot ref, and the **scoped "change ONLY
 * these elements" instruction** that keeps the revise surgical (plan §10).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  serializeAnnotations,
  toAnnotation,
  type Annotation,
  type ElementAnchor,
  type TextRangeAnchor,
} from '../src/annotation.ts';
import { serializeFeedbackForTurn, type FeedbackItem } from '../src/feedback-queue.ts';

const elementAnchor: ElementAnchor = {
  kind: 'element',
  selector: 'section#hero > h1',
  tag: 'h1',
  text: 'Quarterly results',
};

const textAnchor: TextRangeAnchor = {
  kind: 'text-range',
  commonAncestorSelector: 'p:nth-of-type(2)',
  start: { selector: 'em', path: [0], offset: 0 },
  end: { selector: 'em', path: [0], offset: 10 },
  text: '92 percent',
};

test('empty queue serializes to an empty string', () => {
  assert.equal(serializeAnnotations([]), '');
});

test('block is wrapped in <attached-preview-comments> with the scoped instruction', () => {
  const block = serializeAnnotations([
    toAnnotation('a1', { comment: 'Make this shorter', slideIndex: 0, anchor: elementAnchor }),
  ]);
  assert.ok(block.startsWith('<attached-preview-comments>'));
  assert.ok(block.trimEnd().endsWith('</attached-preview-comments>'));
  // The scoped instruction — the whole point of the block.
  assert.match(block, /Change ONLY the elements/);
  assert.match(block, /leave every other element/i);
});

test('an ELEMENT annotation carries selector, current text, and the slide', () => {
  const block = serializeAnnotations([
    toAnnotation('a1', { comment: 'Tighten the headline', slideIndex: 2, anchor: elementAnchor }),
  ]);
  assert.match(block, /On slide 3/); // slideIndex 2 → human "slide 3"
  assert.match(block, /element `section#hero > h1`/);
  assert.match(block, /selector: `section#hero > h1`/);
  assert.match(block, /current text: "Quarterly results"/);
  assert.match(block, /Tighten the headline/);
});

test('a TEXT-RANGE annotation carries the common ancestor + selected text', () => {
  const block = serializeAnnotations([
    toAnnotation('a2', { comment: 'This figure is wrong, it should be 89%', slideIndex: 1, anchor: textAnchor }),
  ]);
  assert.match(block, /On slide 2/);
  assert.match(block, /text "92 percent"/);
  assert.match(block, /within: `p:nth-of-type\(2\)`/);
  assert.match(block, /selected text: "92 percent"/);
});

test('a WHOLE-SLIDE annotation (no anchor) names the slide and the comment', () => {
  const block = serializeAnnotations([
    toAnnotation('a3', { comment: 'This slide feels too dense overall', slideIndex: 4, anchor: null }),
  ]);
  assert.match(block, /On slide 5, the whole slide: This slide feels too dense overall/);
});

test('the screenshot ref is included when present', () => {
  const block = serializeAnnotations([
    toAnnotation('a4', {
      comment: 'Move this box left',
      slideIndex: 0,
      anchor: elementAnchor,
      screenshot: 'annotations/a4.png',
    }),
  ]);
  assert.match(block, /screenshot: annotations\/a4\.png/);
});

test('multiple annotations are numbered in order', () => {
  const annotations: Annotation[] = [
    toAnnotation('a1', { comment: 'First change', slideIndex: 0, anchor: elementAnchor }),
    toAnnotation('a2', { comment: 'Second change', slideIndex: 1, anchor: textAnchor }),
    toAnnotation('a3', { comment: 'Third change', slideIndex: 2, anchor: null }),
  ];
  const block = serializeAnnotations(annotations);
  assert.match(block, /1\. On slide 1.*First change/);
  assert.match(block, /2\. On slide 2.*Second change/);
  assert.match(block, /3\. On slide 3.*Third change/);
});

// --- the queue → turn integration (serializeFeedbackForTurn) --------------

function fb(partial: Partial<FeedbackItem>): FeedbackItem {
  return { id: 'x', kind: 'comment', text: '', at: '2026-06-14T00:00:00.000Z', ...partial };
}

test('serializeFeedbackForTurn routes annotations through the rich block', () => {
  const out = serializeFeedbackForTurn([
    fb({ id: 'a1', kind: 'annotation', text: 'Fix this stat', slideIndex: 1, anchor: textAnchor }),
  ]);
  assert.match(out, /<attached-preview-comments>/);
  assert.match(out, /Change ONLY the elements/);
  assert.match(out, /selected text: "92 percent"/);
});

test('serializeFeedbackForTurn reconstructs an anchor from flat selector/anchorText', () => {
  // An older queue row stored only the flat summary fields (no structured anchor).
  const out = serializeFeedbackForTurn([
    fb({ id: 'a1', kind: 'annotation', text: 'Shorten it', slideIndex: 0, selector: '#kpi', anchorText: '42%' }),
  ]);
  assert.match(out, /element `#kpi`/);
  assert.match(out, /current text: "42%"/);
});

test('serializeFeedbackForTurn keeps free-text comments in the thin block', () => {
  const out = serializeFeedbackForTurn([fb({ id: 'c1', kind: 'comment', text: 'Make the deck punchier' })]);
  assert.match(out, /<attached-preview-comments>/);
  assert.match(out, /Make the deck punchier/);
  // No anchor lines for a free-text comment.
  assert.doesNotMatch(out, /selector:/);
});

test('annotations and comments both present → both blocks emitted', () => {
  const out = serializeFeedbackForTurn([
    fb({ id: 'a1', kind: 'annotation', text: 'Tighten headline', slideIndex: 0, anchor: elementAnchor }),
    fb({ id: 'c1', kind: 'comment', text: 'Overall, more confident tone' }),
  ]);
  assert.match(out, /Tighten headline/);
  assert.match(out, /Overall, more confident tone/);
  // Two distinct blocks.
  assert.equal(out.match(/<attached-preview-comments>/g)?.length, 2);
});

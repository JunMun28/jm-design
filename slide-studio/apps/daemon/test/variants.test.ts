import { test } from 'node:test';
import assert from 'node:assert/strict';
import { variantFileName, deckFileForTheme, upsertVariant, activeDeck } from '../src/projects.ts';

const base = () => ({
  id: 'x', title: 'X', brief: 'b', runtimeId: null, theme: null,
  stage: 'deck' as const, recordedBrief: {}, questionnaire: null,
  questionnaireAnswered: false, gate1: 'approved' as const, gate2: 'approved' as const,
  gate3: 'approved' as const, formats: ['html' as const], createdAt: 't', updatedAt: 't',
  decks: [], wireframeRev: 0, activeDeckId: null,
});

test('variantFileName slugs the theme', () => {
  assert.equal(variantFileName('micron-dark'), 'deck.micron-dark.html');
  assert.equal(variantFileName('Seventies Sunset'), 'deck.seventies-sunset.html');
});

test('deckFileForTheme reuses an existing variant file, else derives a new one', () => {
  const r = base();
  assert.equal(deckFileForTheme(r, 'playful'), 'deck.playful.html');
  const legacy = { ...base(), decks: [{ id: 'micron-dark', theme: 'micron-dark', file: 'deck.html', fromWireframeRev: 0, createdAt: 't' }] };
  assert.equal(deckFileForTheme(legacy, 'micron-dark'), 'deck.html');
  assert.equal(deckFileForTheme(legacy, 'playful'), 'deck.playful.html');
});

test('upsertVariant replaces same-theme, appends new, and sets it active', () => {
  let r = base();
  r = upsertVariant(r, { theme: 'micron-dark', file: 'deck.micron-dark.html', wireframeRev: 0, createdAt: 't1' });
  assert.equal(r.decks.length, 1);
  assert.equal(r.activeDeckId, 'micron-dark');
  r = upsertVariant(r, { theme: 'playful', file: 'deck.playful.html', wireframeRev: 0, createdAt: 't2' });
  assert.equal(r.decks.length, 2);
  assert.equal(r.activeDeckId, 'playful');
  r = upsertVariant(r, { theme: 'micron-dark', file: 'deck.micron-dark.html', wireframeRev: 1, createdAt: 't3' });
  assert.equal(r.decks.length, 2);
  assert.equal(r.decks.find((d) => d.theme === 'micron-dark')?.fromWireframeRev, 1);
  assert.equal(r.activeDeckId, 'micron-dark');
});

test('activeDeck returns the active variant or null', () => {
  assert.equal(activeDeck(base()), null);
  const r = upsertVariant(base(), { theme: 'playful', file: 'deck.playful.html', wireframeRev: 0, createdAt: 't' });
  assert.equal(activeDeck(r)?.theme, 'playful');
});

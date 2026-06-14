/* Unit tests for the slide-quick builder's layout-rail and script-safe-italic
   invariants (issue #2 AC1 + AC3). Run: node --test */
const test = require("node:test");
const assert = require("node:assert/strict");
const {
  createCursor,
  heroLayout,
  hasNoItalicScript,
  safeItalic,
  CONTENT_MAX_Y,
  CONTENT_TOP,
  SH,
} = require("../templates/builder.js");

test("Cursor advances down the slide and returns block tops", () => {
  const c = createCursor();
  const top1 = c.take(1.0, 0.12, "title");
  const top2 = c.take(0.8, 0.12, "lead");
  assert.equal(top1, CONTENT_TOP);
  assert.ok(top2 > top1, "second block sits below the first");
  assert.ok(c.remaining() < CONTENT_MAX_Y - CONTENT_TOP);
});

test("Cursor raises a build error when a block crosses CONTENT_MAX_Y", () => {
  const c = createCursor();
  // A block taller than the whole content band must overflow the rail.
  assert.throws(
    () => c.take(CONTENT_MAX_Y, 0.12, "oversized"),
    /Cursor overflow.*CONTENT_MAX_Y/s,
  );
});

test("Cursor does NOT throw when content fits exactly within the rail", () => {
  const c = createCursor();
  const band = CONTENT_MAX_Y - CONTENT_TOP;
  assert.doesNotThrow(() => c.take(band, 0, "exact-fit"));
});

test("Cursor overflow error names the offending block and its history", () => {
  const c = createCursor();
  c.take(2.0, 0.12, "kicker");
  try {
    c.take(5.0, 0.12, "giant-table");
    assert.fail("expected overflow");
  } catch (err) {
    assert.match(err.message, /giant-table/);
    assert.match(err.message, /kicker/); // history is included
  }
});

test("heroLayout budget-centers the block stack on the canvas", () => {
  const blocks = [
    [0.18, 0.3], // kicker
    [1.5, 0.2], // hero title
    [0.7, 0.0], // lead
  ];
  const c = heroLayout(blocks);
  const totalH = blocks.reduce((s, [h, g]) => s + h + g, 0);
  const expectedStart = (SH - totalH) / 2;
  const firstTop = c.take(blocks[0][0], blocks[0][1], "kicker");
  assert.ok(
    Math.abs(firstTop - expectedStart) < 1e-9,
    `hero stack should start at ${expectedStart}, got ${firstTop}`,
  );
});

test("heroLayout still catches overflow past the footer rail", () => {
  // A stack taller than the canvas must overflow even when "centered".
  const c = heroLayout([[8.0, 0.0]]);
  assert.throws(() => c.take(8.0, 0.0, "too-tall"), /Cursor overflow/);
});

test("hasNoItalicScript detects non-italic scripts", () => {
  assert.equal(hasNoItalicScript("hello world"), false);
  assert.equal(hasNoItalicScript("Привет"), false); // Cyrillic italic is fine
  assert.equal(hasNoItalicScript("企業向け"), true); // CJK
  assert.equal(hasNoItalicScript("مرحبا"), true); // Arabic
  assert.equal(hasNoItalicScript("שלום"), true); // Hebrew
  assert.equal(hasNoItalicScript("สวัสดี"), true); // Thai
  assert.equal(hasNoItalicScript("नमस्ते"), true); // Devanagari
  assert.equal(hasNoItalicScript("In 2026 開始"), true); // mixed Latin+CJK
});

test("safeItalic suppresses italic on non-italic scripts only", () => {
  assert.equal(safeItalic(true, "Emphasис"), true); // Latin+Cyrillic -> keep
  assert.equal(safeItalic(true, "重点"), false); // CJK -> drop
  assert.equal(safeItalic(false, "plain"), false); // never forces it on
  // Accepts a pptxgenjs rich-text run array.
  assert.equal(safeItalic(true, [{ text: "見積もり" }]), false);
  assert.equal(safeItalic(true, [{ text: "estimate" }]), true);
});
